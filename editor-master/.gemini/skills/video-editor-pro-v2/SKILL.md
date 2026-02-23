---
name: video-editor-pro-v2
description: Advanced video editing skill for creating high-quality, professional videos. MANDATORY: Generates 100% original, context-aware motion graphics for EVERY video. Reusing old animations is strictly FORBIDDEN. Use this skill for silence removal, subtitles, custom motion graphics with sound design, dynamic zoom, and professional grading.
---

# Video Editor Pro V2 - The "Creative Director" Standard

This skill transforms raw footage into a unique, professional production. It combines technical automation (FFmpeg/Remotion) with **high-level creative direction**.

## 🚨 CRITICAL DIRECTIVE: ZERO REUSE POLICY 🚨

*   **NO CLIP ART:** Do NOT reuse `SceneWorld`, `SceneChat`, or `SceneCommodity` from previous projects. Every video is a blank canvas.
*   **CONTEXT IS KING:** Analyze the transcript and invent **NEW** visual metaphors for *this specific video*.
*   **PACING & TEXT INTELLIGENCE:** 
    *   **Brevity:** Keep animations punchy (2-4s).
    *   **Text Chunking:** Groups of **4 to 5 words max**. Replace old chunks with new ones to keep the screen clean.
*   **DIVERSE TEXT ANIMATION (Be Creative):**
    *   **Beyond Word-by-Word:** Don't rely solely on word-by-word reveal. Mix it up with:
        *   **Blur Reveal:** Words fading in from a blur.
        *   **Mask Slide:** Text emerging from behind a shape.
        *   **Kinetic Pop:** Scale-up entry with overshoot.
        *   **Curved Layouts:** Orbiting text around central icons.
    *   **Aesthetic Sync:** The animation style of the text must match the "energy" of the speech.

## 🔊 SOUND DESIGN GUIDELINES

*   **NO TYPEWRITING SFX:** Do not use continuous typing sounds. 
*   **Selective Impact:** Use sounds only for **impact moments**.
    *   **Pop/Tech-Pop:** For objects or shapes appearing.
    *   **Click/Accent:** For new text chunks or key highlights.
*   **Layering:** Every visual change should have a corresponding audio cue to feel "premium".

## Workflow

### Phase 1: Ingestion & Deep Analysis

1.  **Process Video:** Run silence removal.
2.  **Transcribe:** Generate word-level JSON transcript.
3.  **Creative Brainstorming:** Map 3-5 unique visual metaphors. Choose a *different* text reveal style for each.

### Phase 2: Design & Asset Generation

1.  **Select Aesthetic:** Dark Luxury (B&W, Glow, Noise).
2.  **Code Unique Scenes:**
    *   Open `src/components/MotionGraphics.tsx`.
    *   **WRITE NEW** scenes from scratch.
    *   **Vary the Physics:** Use different `stiffness` and `damping` for each scene to vary the "mood".

### Phase 3: Sound & Pacing

1.  **Apply SFX:** Use `pop-up-1.mp3`, `tech-pop.mp3`, `1-tecla-teclado.mp3` or `sound-effect-3082.mp3` based on the visual weight.
2.  **Dynamic Camera:** Rhythmic Wide/Close cuts + subtle Ken Burns drift.

## Component Library (The "Skeleton")

*   `WordByWord` & `CurvedText`: Base utilities. **Modify them** for each project.
*   `SceneLayout`: Safe Area protection.
*   `TextureBackground`: Filmic noise and radial depth.
*   `useProfessionalSpring`: Custom easing for Slow In / Slow Out.

## Tips for High-End Motion

*   **Staging:** Use negative space. Don't center everything if a side-alignment looks more "editorial".
*   **Secondary Action:** Add subtle particles, vibrating lines (Jitter), or rotating HUDs.
*   **Subtle Jitter:** Use `useJitter(0.8, 6)` for a high-end organic texture.
