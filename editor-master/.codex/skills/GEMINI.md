# 🚨 CRITICAL PROJECT RULES 🚨

This project uses a **HYBRID RENDERING PIPELINE** (Python/FFmpeg + Remotion).
You MUST follow the specific workflow below. **DO NOT** assume standard Remotion behavior.

## 🚫 WHAT NOT TO DO
1. **NEVER** run the final rendering command (`fast_render.py` or `--render`) without explicit user confirmation (e.g., "pode renderizar").
2. **NEVER** use Remotion to render the full video directly (`remotion render`).
3. **NEVER** implement zoom/crop logic inside React/Remotion.
4. **NEVER** implement silence removal inside React/Remotion.
5. **NEVER** ignore the Python scripts in `video-editor-pro/scripts/`.

## ✅ CORRECT WORKFLOW (The "Modular Orchestrator" Pattern)

### 1. Editing & Processing (Python + FFmpeg)
All video manipulation MUST be done via the Python orchestrator. 
The system is now **FULLY MODULAR**. Only apply features explicitly requested.

**Key Commands:**
- **Remove Silences (VAD):**
  ```bash
  python3 video-editor-pro/scripts/orchestrator.py --cut [--min-silence <ms>]
  ```
- **Transcription & Subtitles (AssemblyAI):**
  ```bash
  python3 video-editor-pro/scripts/orchestrator.py --subtitles
  ```
- **Frame-Based Trimming:**
  ```bash
  python3 video-editor-pro/scripts/orchestrator.py --trim-start <frame> --trim-end <frame>
  ```
- **Add Side Captions (Horizontal):**
  ```bash
  python3 video-editor-pro/scripts/orchestrator.py --side-captions
  ```

*   **What it does:**
    *   `--cut`: Removes silence using Silero VAD. It DOES NOT transcribe automatically anymore.
    *   `--subtitles`: Generates transcription via **AssemblyAI** and updates `remotion_input.json`.
    *   `--trim-start/end`: Cuts the video at specific frames (assuming 60fps).
    *   **Shift Engine:** If you trim or cut a video that already has subtitles, the system will mathematically adjust the timestamps to maintain sync without needing a new transcription.
    *   `--zoom`: Applies "Jump Zoom" using FFmpeg (requires a transcript first).
    *   Generates a PROCESSED video file (e.g., `video_no_silence.mp4` or `video_zoomed.mp4`).
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
*   **⚠️ LUMA MASKING PROTOCOL:** Subtitles MUST be rendered over PURE BLACK (#000000). FFmpeg composition MUST use the `alphamerge` filter to convert brightness into transparency. This ensures professional quality without color distortion or green fringes.

## 📂 File Structure
- `video-editor-pro/scripts/orchestrator.py`: The Main Controller.
- `video-editor-pro/scripts/processor.py`: Whisper + FFmpeg Logic.
- `editor-master/fast_render.py`: The Compositor.
- `editor-master/remotion_input.json`: The Single Source of Truth for data.
