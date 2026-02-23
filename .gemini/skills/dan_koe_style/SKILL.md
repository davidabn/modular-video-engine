# Dan Koe Style Motion Graphics (Dark Luxury)

This skill enables the generation of high-end, minimalist motion graphics inspired by the Dan Koe aesthetic. It focuses on semantic storytelling, evolutionary visuals, and ultra-smooth kinetics in a stark Black & White environment.

## 🚨 CRITICAL: THE "ZERO-REUSE" RULE 🚨
**NEVER reuse semantic animations from previous videos.**
Each video is a unique story. You must act as a **Creative Director** for every single request.
1.  **Analyze:** Read the specific transcript of the CURRENT video.
2.  **Invent:** Create NEW visual metaphors that specifically illustrate the unique points of THIS video.
3.  **Code:** Generate FRESH components in `MotionGraphics.tsx` tailored to these new metaphors.

---

## 🎨 Visual Philosophy (The "Essence")

1.  **Dark Luxury:** Pure Black (`#000000`) background. Pure White (`#FFFFFF`) strokes.
2.  **Atmosphere:** Soft, ethereal glows (`box-shadow`, `drop-shadow`) to create depth without color.
3.  **Organic Precision:** Lines have a subtle "Hand Drawn Jitter" to feel alive, but typography is strictly stable and sharp.
4.  **Semantic Metaphor:** Never use generic abstract shapes. Every animation must be a **visual metaphor** for the spoken concept (e.g., "Growth" -> A fractal tree, not just a rising bar).
5.  **Evolutionary Narrative:** Scenes are not static loops. They must evolve through 3-4 stages:
    *   *Stage 1:* The Raw Material (Chaos/Input).
    *   *Stage 2:* The Process (Transformation/Action).
    *   *Stage 3:* The Result (Order/Climax).

## ⚙️ Technical Constraints & Golden Standards

### 1. Physics & Motion (Ultra Smooth)
-   **Springs:** Use heavy damping for a "weighted" feel.
    ```typescript
    const SMOOTH_SPRING = { damping: 20, stiffness: 60, mass: 1.5 };
    ```
-   **Easing:** Use custom Bezier for drawing lines.
    ```typescript
    const drawEase = Easing.bezier(0.33, 1, 0.68, 1);
    ```
-   **Jitter:** Apply to SVGs/Shapes, NEVER to Text layout.
    ```typescript
    const useHandDrawnJitter = (amplitude = 1.5) => {
        // ... (see Code Template)
    };
    ```

### 2. Typography (Kinetic & Stable)
-   **Entrance:** "Masked Slide Up" + "Blur Reveal".
-   **Stability:** Layout must be calculated upfront. Use `visibility: hidden` instead of `null` for words not yet entered to prevent layout shifts.
-   **Font:** Heavy sans-serif (Inter/System-UI), Uppercase, Wide Spacing.

### 3. SVG Construction
-   Use `strokeDasharray` and `strokeDashoffset` for drawing lines.
-   Use `opacity` cross-fades to morph between stages (e.g., Circle -> Sun).

## 📝 Workflow for Generating Animations

1.  **Analyze the Script:** Identify the core abstract concept (e.g., "Confusion", "Strategy", "Victory").
2.  **Brainstorm Metaphor:** Create a visual story.
    *   *Bad:* "Strategy" = A chess piece appearing.
    *   *Dan Koe Style:* "Strategy" = A maze appearing (Stage 1), a line cutting straight through it (Stage 2), the walls dissolving into light (Stage 3).
3.  **Code Implementation:**
    *   Copy the **Golden Templates** below.
    *   Replace the SVG paths with the new metaphor.
    *   Sync `interpolate` ranges with the word timing.

## 💾 Code Templates (Golden Standard)

### Helper Functions & Config
```typescript
import { spring, interpolate, useCurrentFrame, useVideoConfig, random, Easing } from "remotion";

const LUXURY_FONT = "system-ui, -apple-system, 'Inter', sans-serif";
const getDanKoeGlow = (intensity = 0.6) => `0 0 15px rgba(255, 255, 255, ${intensity})`;
const SMOOTH_SPRING = { damping: 20, stiffness: 60, mass: 1.2 };

const useHandDrawnJitter = (amplitude = 1.5) => {
    const frame = useCurrentFrame();
    const t = frame / 4;
    return {
        x: (Math.sin(t * 0.7) + Math.cos(t * 1.3)) * amplitude,
        y: (Math.cos(t * 0.9) + Math.sin(t * 1.1)) * amplitude,
        rotate: Math.sin(t * 0.5) * (amplitude * 0.3)
    };
};
```

### Stable Kinetic Text Component
```typescript
const KineticWord: React.FC<{ text: string; startFrame: number }> = ({ text, startFrame }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const relativeFrame = Math.max(0, frame - startFrame);
    const s = spring({ fps, frame: relativeFrame, config: SMOOTH_SPRING });
    
    const translateY = interpolate(s, [0, 1], [60, 0]);
    const blur = interpolate(s, [0, 0.8, 1], [20, 5, 0]);
    const opacity = interpolate(s, [0, 0.2, 1], [0, 1, 1]);

    return (
        <div style={{ 
            display: 'inline-block', overflow: 'hidden', padding: '10px 15px',
            visibility: frame >= startFrame ? 'visible' : 'hidden'
        }}>
            <span style={{
                color: 'white', fontSize: '5.5rem', fontFamily: LUXURY_FONT, fontWeight: 900,
                opacity: opacity, filter: `blur(${blur}px)`, transform: `translateY(${translateY}px)`,
                display: 'inline-block', textTransform: "uppercase", letterSpacing: '4px', 
                textShadow: getDanKoeGlow(s * 0.8)
            }}>{text}</span>
        </div>
    );
};
```

### Evolutionary Scene Template
```typescript
const MyNewMetaphor: React.FC<{ words: Word[], sceneStart: number }> = ({ words, sceneStart }) => {
    const frame = useCurrentFrame();
    const jitter = useHandDrawnJitter(2);
    const ease = Easing.bezier(0.33, 1, 0.68, 1);
    
    // Define Stages (0-1 range for each)
    const s1 = interpolate(frame, [0, 50], [0, 1], { easing: ease, extrapolateRight: 'clamp' });
    const s2 = interpolate(frame, [55, 100], [0, 1], { easing: ease, extrapolateRight: 'clamp' });
    
    return (
        <AbsoluteFill style={{ background: 'black' }}>
            <div style={{ position: 'absolute', left: '50%', top: '40%', transform: `translate(-50%, -50%) translate(${jitter.x}px, ${jitter.y}px)`, width: 600, height: 600 }}>
                <svg viewBox="0 0 600 600" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Stage 1 Elements */}
                    <path d="..." strokeDasharray="..." strokeDashoffset="..." opacity={1-s2} />
                    
                    {/* Stage 2 Elements */}
                    <g opacity={s2}>...</g>
                </svg>
            </div>
            {/* Stable Text Container */}
            <DanKoeWordByWord words={words} sceneStart={sceneStart} sfx={SFX.TECH_POP} />
        </AbsoluteFill>
    );
};
```
