#!/bin/bash

# 1. Configurações
INPUT_VIDEO="public/IMG_1758_no_silence.mp4"
OVERLAY_VIDEO="out/overlay_transparent.mov"
FINAL_OUTPUT="out/final_video_high_perf.mp4"

echo "🚀 Iniciando renderização ultra-rápida..."

# 2. Renderiza apenas as legendas e motions com fundo transparente
# Adicionamos backslashes para comando multi-linha correto
# Adicionamos --concurrency e --quiet para performance
npx remotion render MyComp "$OVERLAY_VIDEO" \
  --props="{\"transparent\": true}" \
  --codec=prores \
  --pixel-format=yuva444p10le \
  --concurrency=$(sysctl -n hw.ncpu) \
  --quiet

if [ $? -eq 0 ]; then
    echo "✅ Overlay renderizado com sucesso!"
else
    echo "❌ Erro na renderização do Remotion."
    exit 1
fi

# 3. Usa FFmpeg para compor o overlay sobre o vídeo original
echo "🎬 Compondo vídeo final com FFmpeg..."
ffmpeg -i "$INPUT_VIDEO" -i "$OVERLAY_VIDEO" \
  -filter_complex "[0:v][1:v]overlay=shortest=1" \
  -c:a copy -c:v libx264 -crf 18 -pix_fmt yuv420p \
  "$FINAL_OUTPUT" -y

if [ $? -eq 0 ]; then
    echo "🏁 Concluído! Vídeo final em: $FINAL_OUTPUT"
else
    echo "❌ Erro na composição do FFmpeg."
    exit 1
fi
