import os
import sys
import json
import argparse
import subprocess
import shutil
import platform

# Add local bin folder to PATH for portable FFmpeg
local_bin = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "bin"))
os.environ["PATH"] = local_bin + os.pathsep + os.environ["PATH"]

REMOTION_PROJECT_DIR = "editor-master"

# Cross-platform venv path
if platform.system() == "Windows":
    VENV_PYTHON = os.path.abspath("./venv/Scripts/python.exe")
else:
    VENV_PYTHON = os.path.abspath("./venv/bin/python3")

PROCESSOR_SCRIPT = "video-editor-pro/scripts/processor.py"
STATE_FILE = os.path.join(REMOTION_PROJECT_DIR, "project_state.json")

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, 'r') as f:
            return json.load(f)
    return {
        "input_video": None,
        "processed_video": None,
        "transcript_path": None,
        "project_dir": None,
        "features": {"silence_removal": False, "zoom": False, "subtitles": False, "animations": False, "side_captions": False}
    }

def save_state(state):
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def get_project_dir(input_video):
    base_name = os.path.splitext(os.path.basename(input_video))[0]
    project_dir = os.path.join("projects", base_name)
    os.makedirs(project_dir, exist_ok=True)
    return project_dir

def get_video_dimensions(video_path):
    """Retorna (width, height, fps) do v\u00eddeo usando ffprobe, considerando rota\u00e7\u00e3o."""
    cmd = f"ffprobe -v error -select_streams v:0 -show_entries stream=width,height,avg_frame_rate:side_data=rotation -of json \"{video_path}\""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        data = json.loads(result.stdout)
        stream = data['streams'][0]
        width = int(stream.get('width', 1080))
        height = int(stream.get('height', 1920))
        
        # Calcular FPS
        fps_str = stream.get('avg_frame_rate', "60/1")
        if '/' in fps_str:
            num, den = map(int, fps_str.split('/'))
            fps = num / den if den > 0 else 60
        else:
            fps = float(fps_str)
        
        # Verificar rota\u00e7\u00e3o
        rotation = 0
        side_data = stream.get('side_data_list', [])
        for item in side_data:
            if item.get('rotation'):
                rotation = abs(int(item['rotation']))
                break
        
        if rotation == 90 or rotation == 270:
            return height, width, fps
        return width, height, fps
    return 1080, 1920, 60 # Fallback

def run_processor(input_video, project_dir, min_silence_ms=500, only_cut=False, only_transcribe=False):
    print(f"\nRunning processor (cut={only_cut}, transcribe={only_transcribe}, min_silence={min_silence_ms}ms)...")
    cmd = f"{VENV_PYTHON} {PROCESSOR_SCRIPT} \"{os.path.abspath(input_video)}\" \"{os.path.abspath(project_dir)}\" {min_silence_ms}"
    if only_cut: cmd += " --only-cut"
    if only_transcribe: cmd += " --only-transcribe"
    
    result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
    lines = result.stdout.strip().split('\n')
    json_line = next((line for line in reversed(lines) if line.strip().startswith('{')), None)
    return json.loads(json_line) if json_line else None

def apply_trim(video_path, project_dir, start_frame=None, end_frame=None):
    """Corta o v\u00eddeo baseado em frames."""
    print(f"\nTrimming video (frames {start_frame} to {end_frame})...")
    fps = 60 # Default for this project
    
    start_time = (start_frame / fps) if start_frame is not None else 0
    
    base_name = os.path.splitext(os.path.basename(video_path))[0]
    output_trimmed = os.path.join(project_dir, f"{base_name}_trimmed.mp4")
    
    # Construir comando FFmpeg
    # Usamos -ss para o início e -to ou -t para a duração/fim
    cmd = f"ffmpeg -i \"{video_path}\" -ss {start_time}"
    if end_frame is not None:
        end_time = end_frame / fps
        cmd += f" -to {end_time}"
    
    cmd += f" -c:v libx264 -crf 18 -preset fast -y \"{output_trimmed}\""
    print(f"FFmpeg command: {cmd}")
    subprocess.run(cmd, shell=True, check=True)
    return output_trimmed

def apply_zoom_ffmpeg(video_path, transcript_path, project_dir, zoom_factor=1.3):
    """Aplica Zoom In/Out alternado criando um mapa de frames."""
    print(f"\nApplying dynamic zoom...")
    with open(transcript_path, 'r') as f:
        transcript = json.load(f)
    
    fps = 60
    # Criamos a máscara de seleção
    select_parts = []
    for i, seg in enumerate(transcript['segments']):
        if i % 2 != 0: # Segmentos ímpares com zoom
            start = seg['start']
            end = seg['end']
            select_parts.append(f"between(t,{start},{end})")
    
    base_name = os.path.splitext(os.path.basename(video_path))[0]
    output_zoomed = os.path.join(project_dir, f"{base_name}_zoomed.mp4")
    
    if select_parts:
        cond = "+".join(select_parts)
        # Abordagem: Criamos duas versões do mesmo vídeo no filter_complex e escolhemos qual mostrar
        # v0 = original, v1 = zoomado
        filter_complex = (
            f"[0:v]split[v0][v1];"
            f"[v1]crop=iw/{zoom_factor}:ih/{zoom_factor}:(iw-out_w)/2:(ih-out_h)/2,scale=1080:1920[v1_z];"
            f"[v0][v1_z]overlay=enable='{cond}'[v_final]"
        )
        
        cmd = f"ffmpeg -i \"{video_path}\" -filter_complex \"{filter_complex}\" -map \"[v_final]\" -map 0:a -c:v libx264 -crf 18 -preset fast -y \"{output_zoomed}\""
        print(f"FFmpeg command: {cmd}")
        subprocess.run(cmd, shell=True, check=True)
        return output_zoomed
    return video_path

def adjust_subtitles(transcript_path, offset_start=0, kept_segments=None):
    """Ajusta matematicamente os timestamps do transcript.json."""
    if not os.path.exists(transcript_path):
        return

    print(f"\nAdjusting timestamps in {transcript_path}...")
    with open(transcript_path, 'r') as f:
        data = json.load(f)

    # 1. Aplicar offset inicial (trim start)
    if offset_start > 0:
        for seg in data.get('segments', []):
            seg['start'] = max(0, seg['start'] - offset_start)
            seg['end'] = max(0, seg['end'] - offset_start)
        if 'words' in data:
            for w in data['words']:
                w['start'] = max(0, w['start'] - offset_start)
                w['end'] = max(0, w['end'] - offset_start)

    # 2. Aplicar cortes de sil\u00eancio
    if kept_segments:
        # kept_segments s\u00e3o os trechos MANTIDOS (em segundos do v\u00eddeo original)
        # T' = sum(dura\u00e7\u00e3o dos segmentos mantidos ANTES do tempo T)
        def get_new_time(old_time):
            new_time = 0
            for seg in kept_segments:
                if old_time >= seg['end']:
                    new_time += (seg['end'] - seg['start'])
                elif old_time >= seg['start']:
                    new_time += (old_time - seg['start'])
                    return new_time
                else:
                    return new_time # Estava no sil\u00eancio
            return new_time

        for seg in data.get('segments', []):
            seg['start'] = get_new_time(seg['start'])
            seg['end'] = get_new_time(seg['end'])
        
        if 'words' in data:
            for w in data['words']:
                w['start'] = get_new_time(w['start'])
                w['end'] = get_new_time(w['end'])
    
    with open(transcript_path, 'w') as f:
        json.dump(data, f, indent=2)

def update_remotion_config(state):
    print("\nUpdating remotion_input.json...")
    if not state["transcript_path"] or not os.path.exists(state["transcript_path"]):
        print("Error: Transcript not found.")
        return

    with open(state["transcript_path"], 'r') as f:
        transcript = json.load(f)

    video_to_use = state["processed_video"]
    width, height, fps = get_video_dimensions(video_to_use)

    subtitles = []
    duration = 0
    person_box = transcript.get("person_box", {"x": 0.5, "width": 0.3})
    
    if state["features"]["subtitles"] or state["features"]["side_captions"]:
        for seg in transcript['segments']:
            # Encontrar as palavras que pertencem a este segmento para precis\u00e3o total
            seg_words = [
                w for w in transcript.get('words', [])
                if w['start'] >= seg['start'] - 0.1 and w['end'] <= seg['end'] + 0.1
            ]
            subtitles.append({
                'start': seg['start'], 
                'end': seg['end'], 
                'text': seg['text'].strip(),
                'words': seg_words
            })
        if subtitles:
            duration = subtitles[-1]['end']

    layout = {
        "style": "side" if state["features"]["side_captions"] else "center",
        "person_box": person_box
    }

    motion_graphics = []
    if state["features"]["animations"] and subtitles:
        motion_graphics.append({
            'id': 'intro-mg', 'type': 'MiracleSpark', 'content': 'START',
            'start_time': subtitles[0]['start'], 'duration': 3, 'words': []
        })

    video_to_use = state["processed_video"]
    remotion_input = {
        "video_path": os.path.basename(video_to_use),
        "width": width,
        "height": height,
        "fps": fps,
        "duration": duration,
        "subtitles": subtitles,
        "layout": layout,
        "motion_graphics": motion_graphics,
        "renderMode": "preview"
    }
    
    output_path = os.path.join(REMOTION_PROJECT_DIR, "remotion_input.json")
    with open(output_path, "w") as f:
        json.dump(remotion_input, f, indent=2)
    
    public_video = os.path.join(REMOTION_PROJECT_DIR, "public", os.path.basename(video_to_use))
    shutil.copy2(video_to_use, public_video)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", "-i")
    parser.add_argument("--edit", action="store_true", help="Shorthand for --cut --zoom")
    parser.add_argument("--cut", action="store_true", help="Remove silences and transcribe")
    parser.add_argument("--min-silence", type=int, default=500, help="Minimum silence duration in ms")
    parser.add_argument("--trim-start", type=int, help="Start frame for trimming")
    parser.add_argument("--trim-end", type=int, help="End frame for trimming")
    parser.add_argument("--zoom", action="store_true", help="Apply Jump Zoom")
    parser.add_argument("--subtitles", action="store_true", help="Enable subtitles")
    parser.add_argument("--side-captions", action="store_true", help="Enable side-by-side captions")
    parser.add_argument("--animations", action="store_true", help="Enable animations")
    parser.add_argument("--render", action="store_true")
    parser.add_argument("--studio", action="store_true")
    
    args = parser.parse_args()
    state = load_state()
    
    if args.input: 
        state["input_video"] = args.input
        state["project_dir"] = get_project_dir(args.input)
        state["processed_video"] = args.input # Reset processed video to input if a new input is given
        state["transcript_path"] = None # Reset transcript for new input
        # Reset features for a new input
        state["features"] = {"silence_removal": False, "zoom": False, "subtitles": False, "animations": False, "side_captions": False}

    if not state["input_video"]:
        print("⚠️ Erro: Nenhum vídeo de entrada especificado.")
        return

    if not state["project_dir"]:
        state["project_dir"] = get_project_dir(state["input_video"])

    # Feature selection
    do_cut = args.cut or args.edit
    do_zoom = args.zoom or (args.edit and not state["features"]["zoom"])

    # 1. Trim (if requested)
    if args.trim_start is not None or args.trim_end is not None:
        trimmed_video = apply_trim(state["processed_video"], state["project_dir"], args.trim_start, args.trim_end)
        state["processed_video"] = trimmed_video
        
        # Ajustar legendas se existirem para evitar re-transcri\u00e7\u00e3o
        if state["transcript_path"] and os.path.exists(state["transcript_path"]):
            fps = 60
            offset = (args.trim_start / fps) if args.trim_start else 0
            adjust_subtitles(state["transcript_path"], offset_start=offset)
        
        update_remotion_config(state)

    # 2. Cut (Silence Removal)
    if args.cut:
        print(f"Removing silence from {state['processed_video']}...")
        # Apenas corta o v\u00eddeo sem re-transcrever (Modular)
        data = run_processor(state["processed_video"], state["project_dir"], args.min_silence, only_cut=True)
        state["processed_video"] = data["video_path"]
        
        # Ajustar legendas se existirem para evitar re-transcri\u00e7\u00e3o
        if state["transcript_path"] and os.path.exists(state["transcript_path"]):
            adjust_subtitles(state["transcript_path"], kept_segments=data.get("cut_segments"))
            
        state["features"]["silence_removal"] = True
        update_remotion_config(state)

    # 3. Transcribe / Subtitles
    if args.subtitles:
        print(f"Transcribing {state['processed_video']}...")
        # Se j\u00e1 temos transcri\u00e7\u00e3o e o v\u00eddeo n\u00e3o mudou, poder\u00edamos pular. 
        # Mas por enquanto, se o usu\u00e1rio pediu --subtitles, vamos garantir que ele tenha.
        data = run_processor(state["processed_video"], state["project_dir"], only_transcribe=True)
        state["transcript_path"] = data["transcript_path"]
        state["features"]["subtitles"] = True
        update_remotion_config(state)

    if do_zoom:
        if not state["transcript_path"]:
            print("⚠️ Erro: Preciso da transcrição para aplicar zoom. Rode com --cut primeiro.")
            return
        
        # Use the latest processed video
        video_to_zoom = state["processed_video"]
        zoomed_video = apply_zoom_ffmpeg(video_to_zoom, state["transcript_path"], state["project_dir"])
        state["processed_video"] = zoomed_video
        state["features"]["zoom"] = True
        update_remotion_config(state)

    if args.side_captions:
        if not state["transcript_path"]:
            print(f"Transcribing {state['processed_video']} for side captions...")
            data = run_processor(state["processed_video"], state["project_dir"], only_transcribe=True)
            state["transcript_path"] = data.get("transcript_path")
        state["features"]["side_captions"] = True
        update_remotion_config(state)

    if args.animations:
        state["features"]["animations"] = True
        update_remotion_config(state)

    save_state(state)
    if args.render:
        subprocess.run(f"python3 fast_render.py {os.path.basename(state['processed_video'])}", shell=True)
    if args.studio:
        subprocess.run(f"cd {REMOTION_PROJECT_DIR} && npm run dev", shell=True)

if __name__ == "__main__":
    main()
