---
name: video-editor-pro
description: Automates the video editing pipeline: silence removal (Silero VAD), AssemblyAI transcription, and creative motion graphics (Remotion) with a fast hybrid rendering engine.
---

# Video Editor Pro (Modular Engine)

This skill transforms raw videos into polished content using a **Hybrid Modular Pipeline**. It separates heavy video processing (Python/FFmpeg) from creative overlays (Remotion/React) for maximum speed and quality.

## 🚀 Quick Start for the Agent

1.  **Setup Environment**: If the user just joined, check if `editor-master/node_modules` and the Python `venv` exist. If not, suggest running `./setup.sh`.
2.  **Core Toolset**:
    -   **Orchestrator**: `video-editor-pro/scripts/orchestrator.py` (The main brain).
    -   **Compositor**: `editor-master/fast_render.py` (The fast renderer).
    -   **Data Source**: `editor-master/remotion_input.json` (Single source of truth).

## 🛠 Workflow

### 1. Processing (Modular Logic)
Always use `video-editor-pro/scripts/orchestrator.py` for video manipulation.

-   **Cut Silences**: `python3 video-editor-pro/scripts/orchestrator.py --cut` (Uses Silero VAD).
-   **Transcribe**: `python3 video-editor-pro/scripts/orchestrator.py --subtitles` (Uses **AssemblyAI**).
-   **Trim**: `python3 video-editor-pro/scripts/orchestrator.py --trim-start <frame> --trim-end <frame>`.
-   **Side Captions**: `python3 video-editor-pro/scripts/orchestrator.py --side-captions` (Horizontal video optimization).

### 2. Creative Motion Graphics
Analyze the transcript in `projects/<project_name>/<name>_transcript.json` to plan visual metaphors.
-   **Style**: Dan Koe (Black & White, Glow, Jitter, Kinetic Typography).
-   **Implementation**: Edit `editor-master/src/components/MotionGraphics.tsx` and update `remotion_input.json`.

### 3. Preview & Render
-   **Preview**: `cd editor-master && npm run dev`.
-   **Fast Render**: `python3 editor-master/fast_render.py <PROCESSED_VIDEO_NAME>`.
    *   **CRITICAL**: WAIT for explicit user confirmation ("pode renderizar") before final rendering.
    *   **Luma Masking**: Subtitles MUST be rendered over PURE BLACK (#000000).

## 📂 Project Architecture
- `video-editor-pro/scripts/`: Python orchestrator and VAD logic.
- `editor-master/`: Remotion project for subtitles and motion graphics.
- `projects/`: Where processed videos and transcripts are stored.
- `remotion_input.json`: Shared data between Python and Remotion.

## ⚠️ Safety & Standards
- Never use `remotion render` for the full video.
- Always use the **Shift Engine** (Python) to maintain subtitle sync after cuts.
- Adhere to the styling rules in `.gemini/skills/dan_koe_style/SKILL.md`.
