# 🚨 CRITICAL PROJECT RULES 🚨

This project uses a **HYBRID MODULAR RENDERING PIPELINE** (Python/FFmpeg + Remotion).
Follow this workflow for maximum speed and correctness.

## 🎨 CREATIVE MOTION GRAPHICS PROTOCOL
1. **Context First:** Before applying animations, READ the transcript.
2. **Unique Metaphors:** Create specific visual metaphors for THAT video. Do not use generic "Globe" or "Brain" unless the text explicitly demands it.
3. **Fresh Code:** You must generate NEW React components in `MotionGraphics.tsx` for every new project/video. Do not rely on legacy components.
4. **Dan Koe Style:** Always refer to `.gemini/skills/dan_koe_style/SKILL.md` for visual guidelines (Black & White, Glow, Jitter, Kinetic Typography).

## ✅ THE "MODULAR ORCHESTRATOR" PROTOCOL
1. **Separation of Concerns:** `--cut` is ONLY for silence removal. `--subtitles` is ONLY for transcription (AssemblyAI).
2. **Shift Engine:** Subtitles are mathematically adjusted after `--trim` or `--cut` to avoid redundant API calls.
3. **Control:** Use `--min-silence <ms>` to control cut aggressiveness and `--trim-start/end <frame>` for manual cuts.

## ✅ THE "FAST RENDER" PROTOCOL

### 1. Modular Sliced Rendering
- **NEVER** render the full timeline for a single animation.
- **ALWAYS** use the `AnimOnly` composition in `Root.tsx` to render ONLY the duration of the animation.
- **SPEED:** This reduces render time from minutes to seconds per asset.

### 2. Luma Masking Protocol (H264 + AlphaMerge)
- **LEGENDS:** Render as H264 over PURE BLACK (#000000). Use FFmpeg `alphamerge` to transform brightness into transparency. 
- **QUALITY:** This preserves soft edges, shadows, and 100% of the original video colors (no color distortion).
- **ANIMATIONS:** Default to **OPAQUE (B-Roll)** mode. They should cover the base video entirely unless explicitly requested otherwise.

### 3. Frame Rate & Duration
- **FPS:** Always match the source video (usually 60fps).
- **DURATION:** Force the final output duration with FFmpeg `-t <duration>` to match the base video exactly.

## 📂 File Structure
- `editor-master/fast_render.py`: The Optimized Compositor (H264 + Sliced).
- `editor-master/src/Root.tsx`: Contains `MyComp` (Full) and `AnimOnly` (Modular).
- `editor-master/remotion_input.json`: Single source of truth.

## 🚀 Execution
```bash
python3 editor-master/fast_render.py <PROCESSED_VIDEO_NAME>
```
*Wait for explicit user confirmation ("pode renderizar") before running.*
