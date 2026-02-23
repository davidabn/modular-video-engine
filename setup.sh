#!/bin/bash

# Video Editor Pro - Setup Script
# This script prepares the environment for the Hybrid Video Engine.

echo "🚀 Starting setup for Video Editor Pro..."

# 1. Check for FFmpeg
if ! command -v ffmpeg &> /dev/null
then
    echo "❌ Error: FFmpeg is not installed. Please install it first (e.g., 'brew install ffmpeg')."
    exit 1
fi
echo "✅ FFmpeg found."

# 2. Python Setup
echo "📦 Setting up Python environment..."
python3 -m venv venv
source venv/bin/bin/activate 2>/dev/null || source venv/bin/activate
pip install --upgrade pip
pip install -r video-editor-pro/scripts/requirements.txt
echo "✅ Python dependencies installed."

# 3. Node.js Setup
echo "📦 Setting up Remotion (Node.js) environment..."
if ! command -v npm &> /dev/null
then
    echo "❌ Error: Node.js/NPM is not installed. Please install it first."
    exit 1
fi

cd editor-master
npm install
cd ..
echo "✅ Node.js dependencies installed."

# 4. Success
echo ""
echo "🎉 Setup complete! You can now use the Gemini CLI or Antigravity to edit videos."
echo "👉 Try: 'Corta os silêncios do vídeo video.mp4'"
