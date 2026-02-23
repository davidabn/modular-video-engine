import os
import sys
import json
import subprocess
import shutil
import time as pytime

REMOTION_DIR = "editor-master"
FPS = 60

def fast_render(video_filename, output_path="out/final_video.mp4"):
    start_total = pytime.time()
    print(f"\n🚀 Iniciando Fast Render (Modo B-Roll / Opaco)...")
    
    os.makedirs("out", exist_ok=True)
    os.makedirs(os.path.join(REMOTION_DIR, "out"), exist_ok=True)

    input_json_path = os.path.join(REMOTION_DIR, "remotion_input.json")
    with open(input_json_path, 'r') as f:
        data = json.load(f)
    
    motion_graphics = data.get('motion_graphics', [])
    duration_total = data.get('duration', 30)
    base_video_path = os.path.join(REMOTION_DIR, "public", video_filename)
    
    # --- PASSO 1: Renderizar Legendas (Fundo Preto para Screen Blend) ---
    print(f"\n🔹 Renderizando Legendas (Alta Qualidade)...")
    subtitles_file = "out/subtitles.mp4"
    remotion_sub_cmd = (
        f"npx remotion render MyComp {subtitles_file} "
        f"--props='{{\"layerFilter\": \"subtitles\", \"renderMode\": \"overlay\", \"backgroundColor\": \"#000000\"}}' "
        f"--codec=h264 --pixel-format=yuv420p"
    )
    subprocess.run(f"cd {REMOTION_DIR} && {remotion_sub_cmd}", shell=True, check=True)

    # --- PASSO 2: Renderizar Animações (CURTAS e OPACO) ---
    mg_files = []
    for mg in motion_graphics:
        mg_id = mg['id']
        start_time = mg['start_time']
        duration_mg = mg['duration']
        
        out_file = f"out/mg_{mg_id}.mp4"
        print(f"\n🔹 Renderizando Animação Sliced: {mg_id} (Opaco)...")
        
        # Garantimos transparent: false para a animação ter seu próprio fundo
        remotion_anim_cmd = (
            f"npx remotion render AnimOnly {out_file} "
            f"--props='{{\"selectedMgId\": \"{mg_id}\", \"layerFilter\": \"animations\", \"transparent\": false, \"renderMode\": \"overlay\"}}' "
            f"--codec=h264 --pixel-format=yuv420p"
        )
        
        subprocess.run(f"cd {REMOTION_DIR} && {remotion_anim_cmd}", shell=True, check=True)
        mg_files.append({
            "id": mg_id,
            "file": os.path.join(REMOTION_DIR, out_file),
            "start": start_time,
            "end": start_time + duration_mg
        })

    # --- PASSO 3: Composição Final FFmpeg (Sem Transparência nas Animações) ---
    print("\n🔹 Composição Final FFmpeg...")
    
    cmd = ["ffmpeg", "-i", f"\"{base_video_path}\""]
    cmd += ["-i", f"\"{REMOTION_DIR}/{subtitles_file}\""]
    for mg in mg_files:
        cmd += ["-i", f"\"{mg['file']}\""]
    
    # Filtro: 
    # 1. Aplicamos as legendas sobre o v\u00eddeo base (Luma Masking para transpar\u00eancia perfeita)
    filter_parts = [
        "[1:v]format=yuva420p,split[v_sub1][v_sub2];"
        "[v_sub1]format=gray[v_mask];"
        "[v_sub2][v_mask]alphamerge[v_sub_alpha];"
        "[0:v][v_sub_alpha]overlay=shortest=1[v_base]"
    ]
    last_v = "v_base"
    
    # 2. Aplicamos as animações OPACO por cima de tudo nos tempos certos
    for i, mg in enumerate(mg_files):
        idx = i + 2 
        # Sem colorkey aqui. A animação cobre o vídeo original totalmente.
        filter_parts.append(
            f"[{idx}:v]setpts=PTS-STARTPTS+{mg['start']}/TB[ov{i}];"
            f"[{last_v}][ov{i}]overlay=enable='between(t,{mg['start']},{mg['end']})'[v_out{i}]"
        )
        last_v = f"v_out{i}"

    final_v = last_v
    
    cmd += [
        "-filter_complex", f"\"{';'.join(filter_parts)}\"",
        "-map \"[" + final_v + "]\"", "-map 0:a",
        "-c:v libx264 -crf 18 -preset fast",
        "-t", str(duration_total),
        "-c:a copy", "-y", f"\"{output_path}\""
    ]
    
    full_cmd = " ".join(cmd)
    subprocess.run(full_cmd, shell=True, check=True)
    
    print(f"\n✅ Concluído em {int(pytime.time() - start_total)}s!")
    print(f"✅ Vídeo Final (Animações Opacas): {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2: 
        print("Uso: python fast_render.py <video_filename>")
        sys.exit(1)
    fast_render(sys.argv[1])
