import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill, Audio, staticFile, Sequence } from "remotion";

// --- Configurações Premium ---
const LUXURY_FONT = "system-ui, -apple-system, 'Inter', sans-serif";
const UI_FONT = "'Courier New', monospace";

const SFX = {
    POP: staticFile("soundfx/pop-up/pop-up-1.mp3"),
    TECH_POP: staticFile("soundfx/pop-up/tech-pop.mp3"),
    CLICK: staticFile("soundfx/click/1-tecla-teclado.mp3"),
    CLICK_ALT: staticFile("soundfx/click/sound-effect-3082.mp3"),
    TYPING: staticFile("soundfx/digitando/typewriting-sequence.mp3")
};

const getGlow = (isDark: boolean) => isDark 
    ? "0 0 25px rgba(255, 255, 255, 0.8), 0 0 50px rgba(255, 255, 255, 0.3)" 
    : "0 0 15px rgba(0, 0, 0, 0.1)";

const useProfessionalSpring = (delayInFrames = 0, mass = 1) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ fps, frame: frame - delayInFrames, config: { damping: 14, stiffness: 120, mass } });
};

// --- MOTOR DE JITTER (Vibração Ultra Sutil e Lenta) ---
const useJitter = (amplitude = 0.8, frequency = 6) => {
    const frame = useCurrentFrame();
    const seed = Math.floor(frame / frequency);
    
    const random = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
    };

    const x = (random(seed) - 0.5) * 2 * amplitude;
    const y = (random(seed + 1) - 0.5) * 2 * amplitude;
    const rotate = (random(seed + 2) - 0.5) * 2 * (amplitude * 0.2);

    return { x, y, rotate };
};

// --- COMPONENTES DE TEXTO ---

const WordChar: React.FC<any> = ({ char, index, startFrame, degreePerChar, radius, totalChars, color, glow, jitter }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const s = spring({ fps, frame: frame - startFrame, config: { damping: 15, stiffness: 150 } });
    const angle = index * degreePerChar - (totalChars * degreePerChar) / 2;
    
    const jX = jitter ? jitter.x : 0;
    const jY = jitter ? jitter.y : 0;
    const jR = jitter ? jitter.rotate : 0;

    return (
        <span style={{
            position: "absolute", left: "50%", top: "50%",
            color, fontSize: "2.5rem", fontFamily: LUXURY_FONT, fontWeight: 900,
            textShadow: glow, opacity: frame >= startFrame ? s : 0,
            transform: `
                rotate(${angle + frame * 0.3 + jR}deg) 
                translateY(-${radius}px) 
                translateX(-50%) 
                scale(${0.8 + s * 0.2})
                translate(${jX}px, ${jY}px)
            `,
            display: "inline-block", textTransform: "uppercase"
        }}>{char}</span>
    );
};

const WordSpan: React.FC<any> = ({ text, startFrame, color, glow, jitter }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const s = spring({ fps, frame: frame - startFrame, config: { damping: 12, stiffness: 120 } });
    
    const jX = jitter ? jitter.x : 0;
    const jY = jitter ? jitter.y : 0;
    const jR = jitter ? jitter.rotate : 0;

    return (
        <span style={{
            color, fontSize: '4.2rem', fontFamily: LUXURY_FONT, fontWeight: 900,
            textShadow: glow, opacity: frame >= startFrame ? s : 0, 
            transform: `
                scale(${frame >= startFrame ? 0.8 + s * 0.2 : 0.8}) 
                translateY(${frame >= startFrame ? (1 - s) * 20 : 20}px)
                translate(${jX}px, ${jY}px)
                rotate(${jR}deg)
            `,
            display: 'inline-block', textTransform: "uppercase"
        }}>{text}</span>
    );
};

const WordByWord: React.FC<{ words: any[], sceneStart: number, isDark: boolean, curved?: boolean, sfx: string, useJitterEffect?: boolean }> = ({ words, sceneStart, isDark, curved = false, sfx, useJitterEffect = false }) => {
    const { fps } = useVideoConfig();
    const color = isDark ? "white" : "black";
    const glow = getGlow(isDark);
    const jitter = useJitter(0.8, 6);
    
    if (curved) {
        const radius = 320;
        const degreePerChar = 8;
        const fullText = words.map(w => w.text).join(" ");
        const chars = fullText.split("");
        
        return (
            <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ position: "relative", width: radius * 2, height: radius * 2 }}>
                    {chars.map((char, i) => {
                        let charIndex = 0;
                        const wordForChar = words.find(w => {
                            const start = charIndex;
                            charIndex += w.text.length + 1;
                            return i >= start && i < charIndex;
                        }) || words[0];

                        const relativeStartFrame = Math.round((wordForChar.start - sceneStart) * fps);
                        const isFirstCharOfWord = i === fullText.indexOf(wordForChar.text);

                        return (
                            <React.Fragment key={i}>
                                {isFirstCharOfWord && (
                                    <Sequence from={relativeStartFrame} name={`🔊 Click: ${wordForChar.text}`}>
                                        <Audio src={sfx} volume={0.4} />
                                    </Sequence>
                                )}
                                <WordChar char={char} index={i} startFrame={relativeStartFrame} degreePerChar={degreePerChar} radius={radius} totalChars={chars.length} color={color} glow={glow} jitter={useJitterEffect ? jitter : null} />
                            </React.Fragment>
                        );
                    })}
                </div>
            </AbsoluteFill>
        );
    }

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', maxWidth: '90%' }}>
            {words.map((w, i) => {
                const relativeStartFrame = Math.round((w.start - sceneStart) * fps);
                return (
                    <div key={i} style={{ display: 'inline-block' }}>
                        <Sequence from={relativeStartFrame} name={`🔊 Click: ${w.text}`}>
                            <Audio src={sfx} volume={0.4} />
                        </Sequence>
                        <WordSpan text={w.text} startFrame={relativeStartFrame} color={color} glow={glow} jitter={useJitterEffect ? jitter : null} />
                    </div>
                );
            })}
        </div>
    );
};

// --- COMPONENTES DE ARTE ---

const TextureBackground: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const frame = useCurrentFrame();
    return (
        <AbsoluteFill style={{
            background: isDark ? "radial-gradient(circle, #1a1a11 0%, #000000 100%)" : "radial-gradient(circle, #ffffff 0%, #f0f0f0 100%)",
            overflow: "hidden"
        }}>
            <AbsoluteFill style={{ opacity: 0.03, background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`, transform: `scale(1.5) translate(${Math.sin(frame)*10}px, ${Math.cos(frame)*10}px)` }} />
        </AbsoluteFill>
    );
};

const TechnicalHand: React.FC<{ progress: number, isDark: boolean }> = ({ progress, isDark }) => {
    const frame = useCurrentFrame();
    const color = isDark ? "white" : "black";
    const glow = getGlow(isDark);
    return (
        <div style={{ position: 'relative', width: 400, height: 150, transform: `scale(${progress}) translateY(${Math.sin(frame/15)*10}px)`, opacity: progress }}>
            <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '80%', height: '40px', border: `2px solid ${color}`, borderRadius: '10px 10px 40px 40px', boxShadow: glow, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
            {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ position: 'absolute', bottom: 35, left: `${25 + i * 20}%`, width: '15%', height: '60px', borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}`, borderRight: `2px solid ${color}`, borderRadius: '10px 10px 0 0', transform: `translateY(${Math.sin(frame/10 + i)*5}px)` }} />
            ))}
            <div style={{ position: 'absolute', bottom: 20, left: '5%', width: '15%', height: '40px', border: `2px solid ${color}`, borderRadius: '20px 0 0 20px', transform: 'rotate(-20deg)', boxShadow: glow }} />
        </div>
    );
};

// --- CENAS ---

const SceneCommodity: React.FC<{ words: any[], sceneStart: number }> = ({ words, sceneStart }) => {
    const frame = useCurrentFrame();
    const progress = useProfessionalSpring(0);
    const isDark = false;
    const glow = getGlow(isDark);
    const targets = [{ x: -250, y: -150 }, { x: 250, y: -150 }, { x: -300, y: 50 }, { x: 300, y: 50 }, { x: -150, y: 200 }, { x: 150, y: 200 }];
    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <TextureBackground isDark={isDark} />
            <div style={{ position: 'relative', width: '100%', height: '50%' }}>
                {targets.map((t, i) => {
                    const objStart = 10 + i * 3;
                    return (
                        <div key={i} style={{ position: 'absolute', left: `calc(50% + ${t.x}px)`, top: `calc(40% + ${t.y}px)`, transform: 'translate(-50%, -50%)', opacity: progress }}>
                            {frame === objStart && <Audio src={SFX.TECH_POP} volume={0.3} />}
                            <div style={{ width: 40, height: 40, border: '1px solid black', borderRadius: '50%', marginBottom: 5 }} />
                            <div style={{ width: 60, height: 2, backgroundColor: 'black', boxShadow: glow }} />
                            <div style={{ 
                                position: 'absolute', width: 45, height: 60, border: '2px solid black', 
                                backgroundColor: 'white', top: -70, left: 10, 
                                transform: `scale(${interpolate(frame, [objStart, objStart + 15], [0, 1], {extrapolateRight: 'clamp'})}) rotate(${frame*2}deg)`, 
                                boxShadow: glow, display: 'flex', flexDirection: 'column', gap: 5, padding: 5
                            }}>
                                <div style={{ width: '100%', height: 2, backgroundColor: 'rgba(0,0,0,0.2)' }} />
                                <div style={{ width: '80%', height: 2, backgroundColor: 'rgba(0,0,0,0.2)' }} />
                            </div>
                        </div>
                    );
                })}
            </div>
            <WordByWord words={words} sceneStart={sceneStart} isDark={isDark} sfx={SFX.CLICK_ALT} useJitterEffect={true} />
        </AbsoluteFill>
    );
};

const SceneWorld: React.FC<{ words: any[], sceneStart: number }> = ({ words, sceneStart }) => {
    const frame = useCurrentFrame();
    const entry = useProfessionalSpring(0, 1.2);
    const isDark = true;
    const glow = getGlow(isDark);
    const jitter = useJitter(0.8, 6);

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <TextureBackground isDark={isDark} />
            {frame === 5 && <Audio src={SFX.POP} volume={0.6} />}
            <WordByWord words={words} sceneStart={sceneStart} isDark={isDark} curved={true} sfx={SFX.CLICK} useJitterEffect={true} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, position: 'absolute', transform: `translate(${jitter.x}px, ${jitter.y}px) rotate(${jitter.rotate}deg)` }}>
                <div style={{ width: 280, height: 280, borderRadius: '50%', border: '1px dashed white', boxShadow: glow, transform: `rotate(${frame}deg) scale(${entry})`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: -20, zIndex: 2 }}>
                    <div style={{ position: 'absolute', inset: 10, border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', transform: `rotateX(70deg)` }} />
                    <div style={{ position: 'absolute', inset: 10, border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%', transform: `rotateY(70deg)` }} />
                    <div style={{ color: 'white', fontSize: 18, fontFamily: UI_FONT, fontWeight: 'bold' }}>WORLD_DATA</div>
                </div>
                <TechnicalHand progress={entry} isDark={isDark} />
            </div>
        </AbsoluteFill>
    );
};

const SceneChat: React.FC<{ words: any[], sceneStart: number }> = ({ words, sceneStart }) => {
    const frame = useCurrentFrame();
    const entry = useProfessionalSpring(0);
    const isDark = false;
    const question = "Como vender valor?";
    const qProgress = Math.floor(interpolate(frame, [5, 25], [0, question.length], { extrapolateRight: 'clamp' }));
    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
            <TextureBackground isDark={isDark} />
            {frame === 5 && <Audio src={SFX.TYPING} volume={0.4} />}
            <div style={{ width: '85%', height: 500, border: '2px solid black', borderRadius: 10, backgroundColor: 'white', boxShadow: "0 10px 30px rgba(0,0,0,0.1)", transform: `scale(${entry})`, opacity: entry, display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 35, borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', padding: '0 15px', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'black' }} />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1px solid black' }} />
                </div>
                <div style={{ padding: 30, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 30 }}>
                        <div style={{ backgroundColor: 'black', color: 'white', padding: '10px 20px', borderRadius: '15px 15px 0 15px', fontFamily: UI_FONT, fontSize: 20 }}>{question.substring(0, qProgress)}</div>
                    </div>
                    {frame > 30 && (
                        <div style={{ display: 'flex', gap: 15 }}>
                            <div style={{ width: 40, height: 40, backgroundColor: 'black', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>AI</div>
                            <div style={{ flex: 1 }}><WordByWord words={words} sceneStart={sceneStart} isDark={isDark} sfx={SFX.CLICK} useJitterEffect={false} /></div>
                        </div>
                    )}
                </div>
            </div>
        </AbsoluteFill>
    );
};

// --- Gerenciador Principal ---

const contentContains = (content: string, terms: string[]) => {
    const lower = content.toLowerCase();
    return terms.some(t => lower.includes(t));
};

export const Scene: React.FC<{ mg: any }> = ({ mg }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();
    const opacity = interpolate(frame, [0, 10, durationInFrames-10, durationInFrames], [0, 1, 1, 0]);

    let SceneComponent = SceneCommodity;
    if (contentContains(mg.content, ['palma', 'mão', 'mundo'])) SceneComponent = SceneWorld;
    else if (contentContains(mg.content, ['pergunta', 'gpt'])) SceneComponent = SceneChat;

    return (
        <AbsoluteFill style={{ opacity }}>
            <SceneComponent words={mg.words || []} sceneStart={mg.start_time} />
        </AbsoluteFill>
    );
};
