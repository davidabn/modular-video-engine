import os
import sys
import json
import argparse
import subprocess
import time

# Configs
REMOTION_PROJECT_DIR = "editor-master"
VENV_PYTHON = "./venv/bin/python3"

def run_command(command, description):
    print(f"
🚀 {description}...")
    try:
        subprocess.run(command, shell=True, check=True)
        print("✅ Success!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

def run_processor(input_video, min_silence=200):
    """Executes the silence removal and transcription processor."""
    cmd = f"{VENV_PYTHON} video-editor-pro/scripts/processor.py "{input_video}""
    run_command(cmd, "Processing Video (Silence Removal + Transcription)")
    
    # After processor runs, we expect output paths in JSON format from stdout, 
    # but for now we assume standard naming conventions:
    base_name = os.path.splitext(os.path.basename(input_video))[0]
    return {
        "video_path": os.path.abspath(f"{base_name}_no_silence.mp4"),
        "transcript_path": os.path.abspath(f"{base_name}_transcript.json")
    }

def generate_remotion_config(processed_data):
    """Generates the remotion_input.json based on the transcript."""
    # Using the existing logic inside generate_input.py but adapting it here or calling it
    # Ideally, we call a script that takes arguments, but let's reuse generate_input.py logic
    # by just running it.
    # First, we need to make sure generate_input.py uses the correct paths.
    
    # We will modify generate_input.py to accept arguments later, for now we assume
    # it reads 'video-david_transcript.json'. This is a bit brittle, so let's
    # update the generate_input.py logic to be dynamic or rewrite it here.
    
    # REWRITE generate_input logic here for better control:
    transcript_path = processed_data['transcript_path']
    video_path = processed_data['video_path']
    
    if not os.path.exists(transcript_path):
        print(f"❌ Transcript not found: {transcript_path}")
        return

    with open(transcript_path, 'r') as f:
        transcript = json.load(f)

    subtitles = []
    for seg in transcript['segments']:
        subtitles.append({
            'start': seg['start'],
            'end': seg['end'],
            'text': seg['text'].strip()
        })

    # Simple Motion Graphics Logic (can be enhanced)
    # Adding a sample MG for demo
    motion_graphics = []
    if len(transcript['segments']) > 5:
        motion_graphics.append({
            'id': 'mg-1',
            'type': 'MiracleSpark',
            'content': 'HELLO WORLD',
            'start_time': transcript['segments'][0]['start'],
            'duration': 3,
            'words': [] 
        })

    remotion_input = {
        "video_path": os.path.basename(video_path), # Relative for Remotion public folder
        "subtitles": subtitles,
        "motion_graphics": motion_graphics,
        "renderMode": "preview" # Default for Studio
    }
    
    output_path = os.path.join(REMOTION_PROJECT_DIR, "remotion_input.json")
    with open(output_path, "w") as f:
        json.dump(remotion_input, f, indent=2)
    
    # Move video to public folder if not there
    public_video_path = os.path.join(REMOTION_PROJECT_DIR, "public", os.path.basename(video_path))
    if os.path.abspath(video_path) != os.path.abspath(public_video_path):
        run_command(f"cp "{video_path}" "{public_video_path}"", "Moving video to Remotion public folder")

    print(f"✅ Generated {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Video Orchestrator Agent")
    parser.add_argument("--input", "-i", required=True, help="Input raw video file")
    parser.add_argument("--skip-process", action="store_true", help="Skip silence removal if already done")
    parser.add_argument("--studio", action="store_true", help="Launch Remotion Studio after setup")
    
    args = parser.parse_args()

    input_video = args.input
    
    if not args.skip_process:
        processed_data = run_processor(input_video)
    else:
        # Assume files exist
        base_name = os.path.splitext(os.path.basename(input_video))[0]
        processed_data = {
            "video_path": os.path.abspath(f"editor-master/public/{base_name}_no_silence.mp4"),
            "transcript_path": os.path.abspath(f"{base_name}_transcript.json")
        }

    generate_remotion_config(processed_data)

    if args.studio:
        print("
🎨 Opening Remotion Studio...")
        print("   Use 'Fast Render' command separately when ready.")
        subprocess.run(f"cd {REMOTION_PROJECT_DIR} && npm run dev", shell=True)

if __name__ == "__main__":
    main()
