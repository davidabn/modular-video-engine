import os
import sys
import json
import argparse
import torch
import ffmpeg
import numpy as np
import cv2
import assemblyai as aai
from dotenv import load_dotenv

# Carregar variáveis de ambiente (.env)
load_dotenv()

# Configurar AssemblyAI
ASSEMBLY_API_KEY = os.getenv("ASSEMBLY_API_KEY")
if not ASSEMBLY_API_KEY:
    print("ERRO: ASSEMBLY_API_KEY não encontrada no arquivo .env.")
    sys.exit(1)
    
aai.settings.api_key = ASSEMBLY_API_KEY

def detect_person_box(video_path, sample_rate=30):
    """
    Detecta a posição da pessoa usando OpenCV Haar Cascades (Face + Upper Body).
    Retorna o centro X e a largura média da pessoa (0.0 a 1.0).
    """
    print("Detecting person position using OpenCV Cascades...")
    
    # Carregar classificadores
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    body_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_upperbody.xml')
    
    cap = cv2.VideoCapture(video_path)
    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    
    centers = []
    widths = []
    
    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        if frame_idx % sample_rate == 0:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Tentar detectar rosto primeiro (mais preciso para centralizar)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)
            
            if len(faces) > 0:
                # Pegar o maior rosto detectado
                (x, y, w, h) = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)[0]
                # Expandir a largura do rosto para estimar o corpo (aprox 3.5x a largura do rosto)
                centers.append((x + w/2) / width)
                widths.append((w * 3.5) / width)
            else:
                # Tentar corpo se não achar rosto
                bodies = body_cascade.detectMultiScale(gray, 1.1, 3)
                if len(bodies) > 0:
                    (x, y, w, h) = sorted(bodies, key=lambda b: b[2]*b[3], reverse=True)[0]
                    centers.append((x + w/2) / width)
                    widths.append(w / width)
        
        frame_idx += 1
        
    cap.release()
    
    if not centers:
        print("No person detected. Using default center.")
        return {"x": 0.5, "width": 0.35}
        
    final_x = float(np.mean(centers))
    final_width = float(np.mean(widths))
    
    # Limitar valores
    final_width = max(0.2, min(0.6, final_width))
    
    print(f"Detected person at x={final_x:.2f}, width={final_width:.2f}")
    return {
        "x": final_x,
        "width": final_width
    }

def get_speech_timestamps(audio_path, model, utils, min_silence_duration_ms=200):
    (get_speech_ts, _, read_audio, _, _) = utils
    wav = read_audio(audio_path)
    speech_timestamps = get_speech_ts(wav, model, sampling_rate=16000, min_silence_duration_ms=min_silence_duration_ms)
    return speech_timestamps

def cut_video(video_path, output_path, timestamps):
    input_stream = ffmpeg.input(video_path)
    
    video_parts = []
    audio_parts = []
    
    for i, ts in enumerate(timestamps):
        start = ts['start'] / 16000 # Silero uses samples (16k)
        end = ts['end'] / 16000
        
        v = input_stream.video.trim(start=start, end=end).setpts('PTS-STARTPTS')
        video_parts.append(v)
        
        a = input_stream.audio.filter_('atrim', start=start, end=end).filter_('asetpts', 'PTS-STARTPTS')
        audio_parts.append(a)
    
    joined = ffmpeg.concat(*[s for pair in zip(video_parts, audio_parts) for s in pair], v=1, a=1).node
    v = joined[0]
    a = joined[1]
    
    out = ffmpeg.output(v, a, output_path)
    out.run(overwrite_output=True, quiet=True)
    print(f"Cut video saved to {output_path}")

def main(video_path, output_dir=None, min_silence_ms=500):
    print(f"Processing: {video_path} (min_silence={min_silence_ms}ms)")
    base_name = os.path.splitext(os.path.basename(video_path))[0]
    
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
    
    # 1. Extract Audio for VAD
    audio_path = os.path.join(output_dir if output_dir else "", f"temp_{base_name}.wav")
    ffmpeg.input(video_path).output(audio_path, ac=1, ar=16000).run(overwrite_output=True, quiet=True)
    
    # 2. VAD - Detect Silence
    print("Detecting silence...")
    model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad',
                                  model='silero_vad',
                                  force_reload=False,
                                  onnx=False)
    
    timestamps = get_speech_timestamps(audio_path, model, utils, min_silence_duration_ms=min_silence_ms)
    
    # 3. Cut Video
    cut_video_path = os.path.join(output_dir if output_dir else "", f"{base_name}_no_silence.mp4")
    if not timestamps:
        print("No speech detected. Copying original.")
        import shutil
        shutil.copy2(video_path, cut_video_path)
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

    # 4. Transcribe (AssemblyAI)
    print("Transcribing with AssemblyAI...")
    
    # Configurar transcrição para português (pt) e timestamps de palavras
    config = aai.TranscriptionConfig(language_code="pt")
    
    # O SDK do aai.Transcriber() faz o upload automaticamente se passarmos o path local
    transcriber = aai.Transcriber()
    transcript = transcriber.transcribe(cut_video_path, config)
    
    if transcript.status == aai.TranscriptStatus.error:
        print(f"Erro na transcrição: {transcript.error}")
        sys.exit(1)
        
    # Converter formato do AssemblyAI para o formato esperado pelo Remotion
    # O Whisper retorna um dict com "segments", vamos emular isso
    result = {
        "text": transcript.text,
        "segments": []
    }
    
    # Agrupar palavras em segmentos (sentenças) para manter compatibilidade com o Remotion
    for sentence in transcript.get_sentences():
        result["segments"].append({
            "start": sentence.start / 1000.0, # ms para segundos
            "end": sentence.end / 1000.0,
            "text": sentence.text
        })
    
    # Adicionar dados extras (opcional, mas bom para debug/estilos futuros)
    result["words"] = [
        {"text": w.text, "start": w.start / 1000.0, "end": w.end / 1000.0}
        for w in transcript.words
    ]
    
    # 5. Save Transcript for Remotion
    transcript_path = os.path.join(output_dir if output_dir else "", f"{base_name}_transcript.json")
    
    # Optional: Detect person for side captions
    person_box = detect_person_box(cut_video_path)
    result["person_box"] = person_box

    with open(transcript_path, "w") as f:
        json.dump(result, f, indent=2)
        
    print(f"Done! Created {cut_video_path} and {transcript_path}")
    print(json.dumps({
        "video_path": os.path.abspath(cut_video_path),
        "transcript_path": os.path.abspath(transcript_path),
        "person_box": person_box
    }))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("video_path")
    parser.add_argument("output_dir", nargs='?', default=None)
    parser.add_argument("min_silence_ms", type=int, nargs='?', default=500)
    parser.add_argument("--only-cut", action="store_true")
    parser.add_argument("--only-transcribe", action="store_true")
    
    args = parser.parse_args()
    
    if args.only_cut:
        # Implement only cut logic
        print(f"Cutting only: {args.video_path}")
        base_name = os.path.splitext(os.path.basename(args.video_path))[0]
        if args.output_dir: os.makedirs(args.output_dir, exist_ok=True)
        
        audio_path = os.path.join(args.output_dir if args.output_dir else "", f"temp_{base_name}.wav")
        ffmpeg.input(args.video_path).output(audio_path, ac=1, ar=16000).run(overwrite_output=True, quiet=True)
        
        model, utils = torch.hub.load(repo_or_dir='snakers4/silero-vad', model='silero_vad', force_reload=False, onnx=False)
        timestamps = get_speech_timestamps(audio_path, model, utils, min_silence_duration_ms=args.min_silence_ms)
        
        cut_video_path = os.path.join(args.output_dir if args.output_dir else "", f"{base_name}_no_silence.mp4")
        if not timestamps:
            import shutil
            shutil.copy2(args.video_path, cut_video_path)
        else:
            cut_video(args.video_path, cut_video_path, timestamps)
        
        if os.path.exists(audio_path): os.remove(audio_path)
        
        # Output JSON for orchestrator to consume
        print(json.dumps({
            "video_path": os.path.abspath(cut_video_path),
            "cut_segments": [{"start": ts['start']/16000, "end": ts['end']/16000} for ts in timestamps]
        }))
        
    elif args.only_transcribe:
        # Implement only transcribe logic
        print(f"Transcribing only: {args.video_path}")
        base_name = os.path.splitext(os.path.basename(args.video_path))[0]
        if args.output_dir: os.makedirs(args.output_dir, exist_ok=True)
        
        config = aai.TranscriptionConfig(language_code="pt")
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(args.video_path, config)
        
        if transcript.status == aai.TranscriptStatus.error:
            print(f"Error: {transcript.error}")
            sys.exit(1)
            
        result = {"text": transcript.text, "segments": []}
        for sentence in transcript.get_sentences():
            result["segments"].append({"start": sentence.start / 1000.0, "end": sentence.end / 1000.0, "text": sentence.text})
        result["words"] = [{"text": w.text, "start": w.start / 1000.0, "end": w.end / 1000.0} for w in transcript.words]
        
        transcript_path = os.path.join(args.output_dir if args.output_dir else "", f"{base_name}_transcript.json")
        person_box = detect_person_box(args.video_path)
        result["person_box"] = person_box
        
        with open(transcript_path, "w") as f:
            json.dump(result, f, indent=2)
            
        print(json.dumps({
            "transcript_path": os.path.abspath(transcript_path),
            "person_box": person_box
        }))
    else:
        # Default behavior (both)
        main(args.video_path, args.output_dir, args.min_silence_ms)
