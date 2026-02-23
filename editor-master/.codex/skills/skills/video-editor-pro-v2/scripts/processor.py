import os
import sys
import json
import torch
import ffmpeg
import whisper
import numpy as np

def format_timestamp(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def get_speech_timestamps(audio_path, model, utils):
    (get_speech_ts, _, read_audio, _, _) = utils
    wav = read_audio(audio_path)
    speech_timestamps = get_speech_ts(wav, model, sampling_rate=16000)
    return speech_timestamps

def cut_video(video_path, output_path, timestamps):
    # This function constructs a complex FFmpeg filter to trim and concat
    # Creating input node
    input_stream = ffmpeg.input(video_path)
    
    video_parts = []
    audio_parts = []
    
    for i, ts in enumerate(timestamps):
        start = ts['start'] / 16000 # Silero uses samples (16k), convert to seconds
        end = ts['end'] / 16000
        
        # Trim Video
        v = input_stream.video.trim(start=start, end=end).setpts('PTS-STARTPTS')
        video_parts.append(v)
        
        # Trim Audio
        a = input_stream.audio.filter_('atrim', start=start, end=end).filter_('asetpts', 'PTS-STARTPTS')
        audio_parts.append(a)
    
    # Concatenate
    joined = ffmpeg.concat(*[s for pair in zip(video_parts, audio_parts) for s in pair], v=1, a=1).node
    v = joined[0]
    a = joined[1]
    
    out = ffmpeg.output(v, a, output_path)
    out.run(overwrite_output=True)
    print(f"Cut video saved to {output_path}")

def main(video_path):
    print(f"Processing: {video_path}")
    base_name = os.path.splitext(os.path.basename(video_path))[0]
    
    # 1. Extract Audio for VAD
    audio_path = f"temp_{base_name}.wav"
    ffmpeg.input(video_path).output(audio_path, ac=1, ar=16000).run(overwrite_output=True, quiet=True)
    
    # 2. VAD - Detect Silence
    print("Detecting silence...")
    model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad',
                                  model='silero_vad',
                                  force_reload=False,
                                  onnx=False)
    
    timestamps = get_speech_timestamps(audio_path, model, utils)
    
    # 3. Cut Video
    cut_video_path = f"{base_name}_no_silence.mp4"
    if not timestamps:
        print("No speech detected. Copying original.")
        # Fallback copy
        os.system(f"cp '{video_path}' '{cut_video_path}'")
    else:
        print(f"Found {len(timestamps)} speech segments. Cutting video...")
        try:
            cut_video(video_path, cut_video_path, timestamps)
        except ffmpeg.Error as e:
            print("FFmpeg Error:", e.stderr.decode() if e.stderr else str(e))
            sys.exit(1)
            
    # Cleanup temp audio
    if os.path.exists(audio_path):
        os.remove(audio_path)

    # 4. Transcribe (Whisper)
    print("Transcribing...")
    whisper_model = whisper.load_model("base") # Using base for speed, can be upgraded
    result = whisper_model.transcribe(cut_video_path, word_timestamps=True)
    
    # 5. Save Transcript for Remotion
    transcript_path = f"{base_name}_transcript.json"
    with open(transcript_path, "w") as f:
        json.dump(result, f, indent=2)
        
    print(f"Done! Created {cut_video_path} and {transcript_path}")
    print(json.dumps({
        "video_path": os.path.abspath(cut_video_path),
        "transcript_path": os.path.abspath(transcript_path)
    }))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python processor.py <video_file>")
        sys.exit(1)
    main(sys.argv[1])
