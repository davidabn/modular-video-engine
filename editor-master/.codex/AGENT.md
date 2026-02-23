# 🚨 CRITICAL PROJECT RULES 🚨

This project uses a **HYBRID RENDERING PIPELINE** (Python/FFmpeg + Remotion).
You MUST follow the specific workflow below. **DO NOT** assume standard Remotion behavior.

## 🚫 WHAT NOT TO DO
1. **NEVER** run the final rendering command (`fast_render.py` or `--render`) without explicit user confirmation (e.g., "pode renderizar").
2. **NEVER** use Remotion to render the full video directly (`remotion render`).
3. **NEVER** implement zoom/crop logic inside React/Remotion.
4. **NEVER** implement silence removal inside React/Remotion.
5. **NEVER** ignore the Python scripts in `video-editor-pro/scripts/`.

## ✅ CORRECT WORKFLOW (The "Orchestrator" Pattern)

### 1. Editing & Processing (Python + FFmpeg)
All video manipulation (cutting silence, applying zoom) MUST be done via the Python orchestrator.
**Command:**
```bash
python3 video-editor-pro/scripts/orchestrator.py --input <VIDEO_FILE> --edit --subtitles
```
*   **What it does:**
    *   Removes silence using Silero VAD.
    *   Applies "Jump Zoom" using FFmpeg complex filters.
    *   Generates a PROCESSED video file (e.g., `video_zoomed.mp4`).
    *   Updates `editor-master/remotion_input.json`.

### 2. Previewing (Remotion Studio)
Use Remotion ONLY for overlays (Subtitles, Motion Graphics). The base video is passed as a static file.
**Command:**
```bash
cd editor-master && npm run dev
```

### 3. Final Rendering (Fast Render)
We use a **Multi-Layer Composition** strategy. Remotion renders *only* the transparent layers (subtitles/animations), and FFmpeg composites them over the processed video.
**Command:**
```bash
python3 editor-master/fast_render.py <PROCESSED_VIDEO_NAME>
```
*   **Why?** This is 10x faster than Remotion rendering.

## 📂 File Structure
- `video-editor-pro/scripts/orchestrator.py`: The Main Controller.
- `video-editor-pro/scripts/processor.py`: Whisper + FFmpeg Logic.
- `editor-master/fast_render.py`: The Compositor.
- `editor-master/remotion_input.json`: The Single Source of Truth for data.
