import os
import sys
import json
import subprocess
import shutil

REMOTION_DIR = "editor-master"
FPS = 60

def fast_render(video_filename, output_path="out/final_video.mp4"):
    print(f"\n🚀 Iniciando Fast Render ULTRA MODULAR (Aceleração ProRes + Modular Rendering)...")
    
    os.makedirs("out", exist_ok=True)
    os.makedirs(os.path.join(REMOTION_DIR, "out"), exist_ok=True)

    input_json_path = os.path.join(REMOTION_DIR, "remotion_input.json")
    with open(input_json_path, 'r') as f:
        data = json.load(f)
    
    motion_graphics = data.get('motion_graphics', [])
    base_video_path = os.path.join(REMOTION_DIR, "public", video_filename)
    
    # 1. Renderizar Legendas (Camada Única de 70s - Não vale a pena modularizar)
    print("🔹 Renderizando Legendas (70s totais)...")
    subtitles_file = "out/subtitles.mov"
    remotion_sub_cmd = (
        f"npx remotion render MyComp {subtitles_file} "
        f"--props='{{\"layerFilter\": \"subtitles\", \"renderMode\": \"overlay\", \"transparent\": true}}' "
        f"--codec=prores --pixel-format=yuva444p10le --image-format=png --transparent"
    )
    subprocess.run(f"cd {REMOTION_DIR} && {remotion_sub_cmd}", shell=True, check=True)

    # 2. Renderizar Animações (AGORA REALMENTE MODULAR)
    mg_files = []
    for mg in motion_graphics:
        mg_id = mg['id']
        is_transparent = mg.get('transparent', True)
        duration_mg = mg['duration']
        
        ext = "mov" if is_transparent else "mp4"
        out_file = f"out/mg_{mg_id}.{ext}"
        
        # O segredo: Passamos a duração exata da animação como prop.
        # O Remotion verá um vídeo de, por exemplo, 180 frames (3s) em vez de 4200.
        print(f"\n🔹 Renderizando Animação Modular: {mg_id} ({duration_mg}s)...")
        
        remotion_anim_cmd = (
            f"npx remotion render MyComp {out_file} "
            f"--props='{{\"layerFilter\": \"animations\", \"transparent\": {str(is_transparent).lower()}, \"renderMode\": \"overlay\", \"selectedMgId\": \"{mg_id}\", \"duration\": {duration_mg}}}' "
        )
        
        if is_transparent:
            remotion_anim_cmd += "--codec=prores --pixel-format=yuva444p10le --image-format=png --transparent"
        else:
            remotion_anim_cmd += "--codec=h264"

        subprocess.run(f"cd {REMOTION_DIR} && {remotion_anim_cmd}", shell=True, check=True)
        mg_files.append({
            "id": mg_id,
            "file": os.path.join(REMOTION_DIR, out_file),
            "start": mg['start_time'],
            "end": mg['start_time'] + duration_mg,
            "transparent": is_transparent
        })

    # 3. Composição Final FFmpeg (O FFmpeg coloca cada peça no seu lugar)
    print("\n🔹 Compondo tudo no FFmpeg (Stamp Process)...")
    
    cmd = ["ffmpeg", "-i", f"\"{base_video_path}\""]
    cmd += ["-i", f"\"{REMOTION_DIR}/{subtitles_file}\""]
    
    for mg in mg_files:
        cmd += ["-i", f"\"{mg['file']}\""]
    
    filter_parts = ["[0:v][1:v]overlay=shortest=1[v_sub]"]
    last_v = "v_sub"
    
    for i, mg in enumerate(mg_files):
        idx = i + 2
        start_delay = mg['start']
        # Usamos o tempo START do original para posicionar o vídeo que agora começa do frame 0.
        filter_parts.append(
            f"[{idx}:v]setpts=PTS-STARTPTS+{start_delay}/TB[ov{i}]"
        )
        filter_parts.append(
            f"[{last_v}][ov{i}]overlay=enable='between(t,{mg['start']},{mg['end']})'[v_out{i}]"
        )
        last_v = f"v_out{i}"

    final_v = last_v
    
    cmd += [
        "-filter_complex", f"\"{';'.join(filter_parts)}\"",
        "-map \"[" + final_v + "]\"", "-map 0:a",
        "-c:v libx264 -crf 18 -preset fast",
        "-c:a copy", "-y", f"\"{output_path}\""
    ]
    
    subprocess.run(" ".join(cmd), shell=True, check=True)
    
    project_dir = data.get('project_dir')
    if project_dir and os.path.exists(project_dir):
        shutil.copy2(output_path, os.path.join(project_dir, "final_rendered.mp4"))
        print(f"✅ Cópia salva em: {os.path.join(project_dir, 'final_rendered.mp4')}")

    print(f"\n✅ Render ULTRA MODULAR Completo!")

if __name__ == "__main__":
    if len(sys.argv) < 2: 
        print("Uso: python fast_render.py <video_filename>")
        sys.exit(1)
    fast_render(sys.argv[1])
