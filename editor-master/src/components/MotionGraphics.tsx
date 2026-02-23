import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill, Audio, staticFile, Sequence, random, Easing } from "remotion";

// --- Luxury & Dan Koe Config ---
const LUXURY_FONT = "system-ui, -apple-system, 'Inter', sans-serif";

const SFX = {
    POP: staticFile("soundfx/pop-up/pop-up-1.mp3"),
    TECH_POP: staticFile("soundfx/pop-up/tech-pop.mp3"),
    CLICK: staticFile("soundfx/click/1-tecla-teclado.mp3"),
    CLICK_ALT: staticFile("soundfx/click/sound-effect-3082.mp3"),
    TYPING: staticFile("soundfx/digitando/typewriting-sequence.mp3")
};

const getDanKoeGlow = (intensity = 0.6) => `0 0 20px rgba(255, 255, 255, ${intensity})`;

const useHandDrawnJitter = (amplitude = 1.5) => {
    const frame = useCurrentFrame();
    const t = frame / 4;
    return {
        x: (Math.sin(t * 0.7) + Math.cos(t * 1.3)) * amplitude,
        y: (Math.cos(t * 0.9) + Math.sin(t * 1.1)) * amplitude,
        rotate: Math.sin(t * 0.5) * (amplitude * 0.3)
    };
};

const SMOOTH_SPRING = { damping: 20, stiffness: 60, mass: 1.2 };

interface Word {
    text: string;
    start: number;
    end: number;
}

// --- MULTIMODAL KINETIC TEXT COMPONENT ---

const KineticWord: React.FC<{ text: string; startFrame: number; styleType: 'slide' | 'flicker' | 'glitch' | 'standard' }> = ({ text, startFrame, styleType }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const relativeFrame = Math.max(0, frame - startFrame);
    
    const s = spring({ fps, frame: relativeFrame, config: SMOOTH_SPRING });
    
    // Configurações Padrão (Dan Koe)
    let opacity = interpolate(s, [0, 0.2, 1], [0, 1, 1]);
    let blur = interpolate(s, [0, 0.8, 1], [15, 5, 0]);
    let transform = `translateY(${interpolate(s, [0, 1], [40, 0])}px)`;
    let letterSpacing = '3px';
    let textShadow = getDanKoeGlow(s * 0.8);
    let webkitTextStroke = '0px transparent';
    let fontSize = '4.8rem';
    let textTransform: 'uppercase' | 'none' = 'uppercase';

    if (styleType === 'standard') {
        // Estilo "Legenda Limpa" - Sincronizada mas sem excessos
        opacity = interpolate(relativeFrame, [0, 3], [0, 1]);
        blur = 0;
        transform = `translateY(${interpolate(relativeFrame, [0, 5], [10, 0], {extrapolateRight: 'clamp'})}px)`;
        letterSpacing = '1px';
        textShadow = "0 4px 10px rgba(0,0,0,0.5)";
        webkitTextStroke = "2px black";
        fontSize = '4.5rem';
        textTransform = 'none'; // Mantém o original
    } else if (styleType === 'flicker') {
        const flicker = Math.floor(relativeFrame / 2) % 2 === 0 ? 1 : 0.3;
        opacity = relativeFrame < 10 ? flicker : 1;
        blur = relativeFrame < 10 ? 10 : 0;
        transform = 'scale(1)';
        letterSpacing = interpolate(s, [0, 1], [15, 3]) + 'px';
    } else if (styleType === 'glitch') {
        const glitchX = (random(`gx-${text}-${frame}`) - 0.5) * 10 * (1 - s);
        opacity = interpolate(s, [0, 0.1, 0.2, 0.3, 1], [0, 1, 0.2, 1, 1]);
        transform = `translateX(${glitchX}px)`;
        blur = 0;
    }

    return (
        <div style={{ 
            display: 'inline-block', 
            padding: styleType === 'standard' ? '2px 6px' : '5px 12px',
            visibility: frame >= startFrame ? 'visible' : 'hidden'
        }}>
            <span style={{
                color: 'white', 
                fontSize, 
                fontFamily: LUXURY_FONT, 
                fontWeight: 900,
                opacity, 
                filter: `blur(${blur}px)`,
                transform,
                display: 'inline-block', 
                textTransform, 
                letterSpacing, 
                textShadow,
                WebkitTextStroke: webkitTextStroke,
                paintOrder: "stroke fill"
            }}>
                {text}
            </span>
        </div>
    );
};

const DanKoeWordByWord: React.FC<{ words: Word[], sceneStart: number, sfx: string }> = ({ words, sceneStart, sfx }) => {
    const { fps } = useVideoConfig();
    const frame = useCurrentFrame();
    
    const chunks = useMemo(() => {
        const allWords = words.flatMap((segment) => {
            const textWords = segment.text.split(' ').filter(t => t.length > 0);
            const duration = segment.end - segment.start;
            const wordDuration = duration / textWords.length;
            
            return textWords.map((t, i) => ({
                text: t,
                start: segment.start + i * wordDuration,
                end: segment.start + (i + 1) * wordDuration,
            }));
        });

        const grouped = [];
        let i = 0;
        while (i < allWords.length) {
            // Decisão Semântica: Palavras com vírgula ou ponto final fecham o chunk
            const hasPunctuation = allWords[i].text.includes(',') || allWords[i].text.includes('.') || allWords[i].text.includes('?');
            const isLongWord = allWords[i].text.length > 9;
            
            // Alternância inteligente de estilo por chunk
            const isStandard = (grouped.length % 3 !== 0); // 1 animado, 2 normais
            const maxWords = isStandard ? 5 : 3;
            
            let currentGroup = [];
            for (let j = 0; j < maxWords && i < allWords.length; j++) {
                currentGroup.push(allWords[i]);
                if (allWords[i].text.includes('.') || allWords[i].text.includes('?')) {
                    i++;
                    break;
                }
                i++;
            }
            
            grouped.push({
                words: currentGroup,
                style: isStandard ? 'standard' : (grouped.length % 2 === 0 ? 'flicker' : 'glitch')
            });
        }
        return grouped;
    }, [words]);

    const currentTime = sceneStart + (frame / fps);
    const currentGroup = chunks.find(group => 
        currentTime >= group.words[0].start && currentTime < group.words[group.words.length - 1].end
    ) || chunks.find(group => currentTime < group.words[0].start) || chunks[chunks.length - 1];

    if (!currentGroup) return null;

    return (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', zIndex: 100, bottom: -650 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px', maxWidth: '90%', textAlign: 'center' }}>
                {currentGroup.words.map((w, i) => {
                    const relativeStartFrame = Math.round((w.start - sceneStart) * fps);
                    return (
                        <div key={`${w.text}-${i}`} style={{ display: 'inline-block' }}>
                            {/* Som apenas no modo animado */}
                            {currentGroup.style !== 'standard' && (
                                <Sequence from={relativeStartFrame} durationInFrames={30}>
                                    <Audio src={sfx} volume={0.12} />
                                </Sequence>
                            )}
                            <KineticWord 
                                text={w.text} 
                                startFrame={relativeStartFrame} 
                                styleType={currentGroup.style as any} 
                            />
                        </div>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};

// --- EVOLUTIONARY DAN KOE METAPHORS ---

const EntropyFilter: React.FC<{ words: Word[], sceneStart: number }> = ({ words, sceneStart }) => {
    const frame = useCurrentFrame();
    const jitter = useHandDrawnJitter(2);
    const ease = Easing.bezier(0.33, 1, 0.68, 1);
    const s1 = interpolate(frame, [0, 150], [0, 1], { easing: ease, extrapolateRight: 'clamp' });
    const s2 = interpolate(frame, [180, 350], [0, 1], { easing: ease, extrapolateRight: 'clamp' });
    const s3 = interpolate(frame, [400, 650], [0, 1], { easing: ease, extrapolateRight: 'clamp' });
    const s4 = interpolate(frame, [700, 850], [0, 1], { easing: ease, extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{ background: 'black' }}>
            <div style={{ position: 'absolute', left: '50%', top: '40%', transform: `translate(-50%, -50%) translate(${jitter.x}px, ${jitter.y}px)`, width: 800, height: 800 }}>
                <svg viewBox="0 0 800 800" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {[...Array(80)].map((_, i) => {
                        const seed = `p-${i}`;
                        const startX = (random(seed + 'x') - 0.5) * 1000 + 400;
                        const startY = (random(seed + 'y') - 0.5) * 1000 + 400;
                        const suckedX = interpolate(s2, [0, 1], [startX, 400 + (random(seed + 'sx') - 0.5) * 50]);
                        const suckedY = interpolate(s2, [0, 1], [startY, 450]);
                        return (
                            <circle key={i} cx={suckedX} cy={suckedY} r="2" fill="white" opacity={(1 - s3) * interpolate(s1, [0, 0.2], [0, 0.6])} />
                        );
                    })}
                    <path d="M300,300 L500,300 L400,500 Z" fill="none" stroke="white" strokeWidth="2" opacity={s2 * (1 - s4)} strokeDasharray="600" strokeDashoffset={600 * (1 - s2)} />
                    {s3 > 0 && [...Array(3)].map((_, i) => (
                        <line key={i} x1="400" y1="500" x2={300 + i * 100} y2={interpolate(s3, [0, 1], [500, 700])} stroke="white" strokeWidth="3" opacity={s3 * (1 - s4)} style={{ filter: getDanKoeGlow(0.5) }} />
                    ))}
                    {s4 > 0 && (
                        <g transform={`translate(400, 400) scale(${s4})`}>
                            <circle cx="0" cy="0" r="180" fill="none" stroke="white" strokeWidth="4" style={{ filter: getDanKoeGlow(1) }} />
                            <circle cx="0" cy="0" r="120" fill="none" stroke="white" strokeWidth="1" opacity="0.4" />
                            <circle cx="0" cy="0" r="60" fill="none" stroke="white" strokeWidth="1" opacity="0.2" />
                            {[...Array(12)].map((_, i) => (
                                <line key={i} x1="180" y1="0" x2="210" y2="0" stroke="white" strokeWidth="2" transform={`rotate(${i * 30})`} />
                            ))}
                        </g>
                    )}
                </svg>
            </div>
            <DanKoeWordByWord words={words} sceneStart={sceneStart} sfx={SFX.TECH_POP} />
        </AbsoluteFill>
    );
};

const SimplicityAlignment: React.FC<{ words: Word[], sceneStart: number }> = ({ words, sceneStart }) => {
    const frame = useCurrentFrame();
    const jitter = useHandDrawnJitter(2.5);
    const ease = Easing.bezier(0.33, 1, 0.68, 1);
    const s1 = interpolate(frame, [0, 60], [0, 1], { easing: ease, extrapolateRight: 'clamp' });
    const s2 = interpolate(frame, [70, 130], [0, 1], { easing: ease, extrapolateRight: 'clamp' });
    const s3 = interpolate(frame, [140, 250], [0, 1], { easing: ease, extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{ background: 'black' }}>
            <div style={{ position: 'absolute', left: '50%', top: '40%', transform: `translate(-50%, -50%) translate(${jitter.x}px, ${jitter.y}px)`, width: 800, height: 800 }}>
                <svg viewBox="0 0 800 800" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {[...Array(64)].map((_, i) => {
                        const row = Math.floor(i / 8);
                        const col = i % 8;
                        const startX = (random(`sim-x-${i}`) - 0.5) * 1200 + 400;
                        const startY = (random(`sim-y-${i}`) - 0.5) * 1200 + 400;
                        const targetX = 200 + col * 60;
                        const targetY = 200 + row * 60;
                        const curX = interpolate(s1, [0, 1], [startX, targetX]);
                        const curY = interpolate(s1, [0, 1], [startY, targetY]);
                        const isCenter = row === 3 && col === 3;
                        const radius = isCenter ? interpolate(s3, [0, 1], [3, 15]) : 3;
                        const glow = isCenter ? interpolate(s3, [0, 1], [0.4, 1.2]) : 0.4;
                        return (
                            <g key={i}>
                                <circle cx={curX} cy={curY} r={radius} fill="white" opacity={interpolate(s1, [0, 0.2], [0, 1])} style={{ filter: getDanKoeGlow(glow) }} />
                                {s2 > 0 && col < 7 && (
                                    <line x1={targetX} y1={targetY} x2={targetX + 60} y2={targetY} stroke="white" strokeWidth="1" opacity={s2 * 0.2 * (1 - s3 * 0.5)} strokeDasharray="60" strokeDashoffset={60 * (1 - s2)} />
                                )}
                                {s2 > 0 && row < 7 && (
                                    <line x1={targetX} y1={targetY} x2={targetX} y2={targetY + 60} stroke="white" strokeWidth="1" opacity={s2 * 0.2 * (1 - s3 * 0.5)} strokeDasharray="60" strokeDashoffset={60 * (1 - s2)} />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
            <DanKoeWordByWord words={words} sceneStart={sceneStart} sfx={SFX.TECH_POP} />
        </AbsoluteFill>
    );
};

const SystemStacking: React.FC<{ words: Word[], sceneStart: number }> = ({ words, sceneStart }) => {
    const frame = useCurrentFrame();
    const jitter = useHandDrawnJitter(1.5);
    const ease = Easing.bezier(0.33, 1, 0.68, 1);

    return (
        <AbsoluteFill style={{ background: 'black' }}>
            <div style={{ position: 'absolute', left: '50%', top: '40%', transform: `translate(-50%, -50%) translate(${jitter.x}px, ${jitter.y}px)`, width: 600, height: 600 }}>
                <svg viewBox="0 0 600 600" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {[...Array(6)].map((_, i) => {
                        const startFrame = i * 25;
                        const s = spring({ fps: 60, frame: frame - startFrame, config: SMOOTH_SPRING });
                        const y = interpolate(s, [0, 1], [600, 480 - i * 70]);
                        const opacity = interpolate(s, [0, 0.5], [0, 1]);
                        return (
                            <g key={i} opacity={opacity}>
                                <rect x={150} y={y} width={300} height={40} fill="none" stroke="white" strokeWidth="2.5" style={{ filter: getDanKoeGlow(s * 0.5) }} />
                                {i > 0 && s > 0.8 && (
                                    <line x1={300} y1={y + 40} x2={300} y2={y + 70} stroke="white" strokeWidth="1" strokeDasharray="4 4" opacity={s * 0.3} />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
            <DanKoeWordByWord words={words} sceneStart={sceneStart} sfx={SFX.CLICK_ALT} />
        </AbsoluteFill>
    );
};

const BillionGrowth: React.FC<{ words: Word[], sceneStart: number }> = ({ words, sceneStart }) => {
    const frame = useCurrentFrame();
    const jitter = useHandDrawnJitter(3);
    const { fps } = useVideoConfig();
    const ease = Easing.bezier(0.33, 1, 0.68, 1);
    
    // Animação de crescimento exponencial
    const growth = interpolate(frame, [0, 120], [0, 1], { easing: ease, extrapolateRight: 'clamp' });
    
    return (
        <AbsoluteFill style={{ background: 'black' }}>
            <div style={{ position: 'absolute', left: '50%', top: '40%', transform: `translate(-50%, -50%) translate(${jitter.x}px, ${jitter.y}px)`, width: 800, height: 800 }}>
                <svg viewBox="0 0 800 800" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Linha de base */}
                    <line x1="100" y1="600" x2="700" y2="600" stroke="white" strokeWidth="2" opacity="0.3" />
                    
                    {/* Curva de crescimento */}
                    <path 
                        d={`M 100 600 Q 400 600, 700 ${600 - growth * 400}`} 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="4" 
                        style={{ filter: getDanKoeGlow(1) }}
                        strokeDasharray="1000"
                        strokeDashoffset={1000 * (1 - growth)}
                    />
                    
                    {/* Partículas de "riqueza" subindo */}
                    {[...Array(20)].map((_, i) => {
                        const seed = `gold-${i}`;
                        const startX = 100 + (i * 30);
                        const delay = i * 5;
                        const pGrowth = interpolate(frame - delay, [0, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
                        const y = 600 - pGrowth * (200 + random(seed) * 300);
                        return (
                            <circle key={i} cx={startX} cy={y} r="3" fill="white" opacity={pGrowth * (1 - pGrowth)} />
                        );
                    })}
                    
                    {/* Círculo de impacto no topo */}
                    {growth > 0.8 && (
                        <circle 
                            cx="700" 
                            cy={600 - growth * 400} 
                            r={interpolate(frame, [100, 120], [0, 50])} 
                            fill="none" 
                            stroke="white" 
                            strokeWidth="2" 
                            opacity={interpolate(frame, [100, 120], [1, 0])} 
                        />
                    )}
                </svg>
            </div>
            <DanKoeWordByWord words={words} sceneStart={sceneStart} sfx={SFX.TECH_POP} />
        </AbsoluteFill>
    );
};

const FutureTimeline: React.FC<{ words: Word[], sceneStart: number }> = ({ words, sceneStart }) => {
    const frame = useCurrentFrame();
    const jitter = useHandDrawnJitter(2);
    const ease = Easing.bezier(0.25, 0.1, 0.25, 1);
    
    const progress = interpolate(frame, [0, 150], [0, 1], { easing: ease, extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{ background: 'black' }}>
            <div style={{ position: 'absolute', left: '50%', top: '40%', transform: `translate(-50%, -50%) translate(${jitter.x}px, ${jitter.y}px)`, width: 800, height: 800 }}>
                <svg viewBox="0 0 800 800" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* O Anel do Tempo */}
                    <circle 
                        cx="400" cy="400" r="250" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="1" 
                        opacity="0.2" 
                    />
                    <path 
                        d="M 400 150 A 250 250 0 1 1 399.9 150" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="3" 
                        strokeDasharray="1570"
                        strokeDashoffset={1570 * (1 - progress)}
                        style={{ filter: getDanKoeGlow(0.8) }}
                    />
                    
                    {/* Marcadores de anos */}
                    {[2024, 2025, 2026, 2027].map((year, i) => {
                        const angle = (i / 4) * 360 - 90;
                        const rad = angle * Math.PI / 180;
                        const x = 400 + Math.cos(rad) * 250;
                        const y = 400 + Math.sin(rad) * 250;
                        const opacity = progress > (i / 4) ? 1 : 0.1;
                        
                        return (
                            <g key={year} opacity={opacity}>
                                <circle cx={x} cy={y} r="5" fill="white" />
                                <text 
                                    x={x + Math.cos(rad) * 40} 
                                    y={y + Math.sin(rad) * 40} 
                                    fill="white" 
                                    fontSize="24" 
                                    fontFamily={LUXURY_FONT}
                                    fontWeight="bold"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                >
                                    {year}
                                </text>
                            </g>
                        );
                    })}
                    
                    {/* Ponteiro central */}
                    <line 
                        x1="400" y1="400" 
                        x2={400 + Math.cos(progress * Math.PI * 2 - Math.PI/2) * 200} 
                        y2={400 + Math.sin(progress * Math.PI * 2 - Math.PI/2) * 200} 
                        stroke="white" 
                        strokeWidth="2" 
                        opacity={progress}
                    />
                </svg>
            </div>
            <DanKoeWordByWord words={words} sceneStart={sceneStart} sfx={SFX.CLICK} />
        </AbsoluteFill>
    );
};

const StoppingClock: React.FC<{ words: Word[], sceneStart: number }> = ({ words, sceneStart }) => {
    const frame = useCurrentFrame();
    const jitter = useHandDrawnJitter(2);
    
    // Animação de rotação que desacelera (stop effect)
    const stopFrame = 90; 
    const rotationProgress = interpolate(frame, [0, stopFrame], [0, 1], {
        easing: Easing.out(Easing.quad),
        extrapolateRight: 'clamp'
    });
    
    const rotation = rotationProgress * 360 * 2; 

    return (
        <AbsoluteFill style={{ background: 'black' }}>
            <div style={{ 
                position: 'absolute', 
                left: '50%', 
                top: '40%', 
                transform: `translate(-50%, -50%) translate(${jitter.x}px, ${jitter.y}px)`, 
                width: 800, 
                height: 800 
            }}>
                <svg viewBox="0 0 800 800" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    <circle 
                        cx="400" cy="400" r="300" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="4" 
                        style={{ filter: getDanKoeGlow(0.6) }}
                    />
                    
                    {[...Array(12)].map((_, i) => (
                        <line 
                            key={i}
                            x1="400" y1="120" x2="400" y2="150"
                            stroke="white" 
                            strokeWidth="2"
                            transform={`rotate(${i * 30}, 400, 400)`}
                            opacity={0.5}
                        />
                    ))}
                    
                    <line 
                        x1="400" y1="400" x2="400" y2="150"
                        stroke="white" 
                        strokeWidth="6"
                        transform={`rotate(${rotation}, 400, 400)`}
                        style={{ filter: getDanKoeGlow(0.8) }}
                    />
                    
                    <line 
                        x1="400" y1="400" x2="400" y2="250"
                        stroke="white" 
                        strokeWidth="10"
                        transform={`rotate(${rotation / 12}, 400, 400)`}
                        style={{ filter: getDanKoeGlow(0.4) }}
                    />
                    
                    <circle cx="400" cy="400" r="12" fill="white" />
                    
                    {frame >= stopFrame && (
                        <circle 
                            cx="400" cy="400" r={300} 
                            fill="none" 
                            stroke="white" 
                            strokeWidth={interpolate(frame - stopFrame, [0, 20], [10, 0], {extrapolateRight: 'clamp'})}
                            opacity={interpolate(frame - stopFrame, [0, 20], [0.8, 0], {extrapolateRight: 'clamp'})}
                        />
                    )}
                </svg>
            </div>
            <DanKoeWordByWord words={words} sceneStart={sceneStart} sfx={SFX.CLICK} />
        </AbsoluteFill>
    );
};

const TestDrive: React.FC<{ words: Word[], sceneStart: number }> = ({ words, sceneStart }) => {
    const frame = useCurrentFrame();
    const jitter = useHandDrawnJitter(2);
    
    // Movimento do carro (da esquerda para a direita)
    const carProgress = interpolate(frame, [0, 90], [-400, 1200], {
        easing: Easing.bezier(0.45, 0, 0.55, 1),
        extrapolateRight: 'clamp'
    });

    // Linhas de velocidade
    const speedLines = useMemo(() => {
        return [...Array(12)].map((_, i) => ({
            y: 200 + i * 50,
            xStart: 1000 + random(`line-${i}`) * 800,
            speed: 20 + random(`speed-${i}`) * 15,
            width: 100 + random(`width-${i}`) * 200
        }));
    }, []);

    return (
        <AbsoluteFill style={{ background: 'black' }}>
            {/* Linhas de Velocidade em Background */}
            <div style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.2 }}>
                {speedLines.map((line, i) => {
                    const lineX = ((line.xStart - frame * line.speed) % 2000 + 2000) % 2000 - 400;
                    return (
                        <div key={i} style={{
                            position: 'absolute',
                            left: lineX,
                            top: line.y,
                            width: line.width,
                            height: 2,
                            background: 'white',
                            filter: getDanKoeGlow(0.4)
                        }} />
                    );
                })}
            </div>

            {/* O "Carro" (Estilizado Geometricamente - Dan Koe Style) */}
            <div style={{ 
                position: 'absolute', 
                left: carProgress, 
                top: '45%', 
                transform: `translateY(-50%) translate(${jitter.x}px, ${jitter.y}px)`,
                width: 400,
                height: 150
            }}>
                <svg viewBox="0 0 400 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                    {/* Corpo Aerodinâmico */}
                    <path 
                        d="M40,100 L360,100 L320,50 L120,50 Z" 
                        fill="none" 
                        stroke="white" 
                        strokeWidth="5" 
                        style={{ filter: getDanKoeGlow(1) }} 
                    />
                    {/* Rodas (Círculos com brilho central) */}
                    <g>
                        <circle cx="100" cy="110" r="30" fill="none" stroke="white" strokeWidth="4" />
                        <circle cx="100" cy="110" r="8" fill="white" style={{ filter: getDanKoeGlow(0.8) }} />
                        
                        <circle cx="300" cy="110" r="30" fill="none" stroke="white" strokeWidth="4" />
                        <circle cx="300" cy="110" r="8" fill="white" style={{ filter: getDanKoeGlow(0.8) }} />
                    </g>
                    {/* Rastro de Velocidade Cinético */}
                    {[...Array(3)].map((_, i) => (
                        <line 
                            key={i} 
                            x1={20 - i * 30} y1={75 + i * 20} 
                            x2={-80 - i * 50} y2={75 + i * 20} 
                            stroke="white" 
                            strokeWidth={2} 
                            opacity={0.5 - i * 0.1} 
                        />
                    ))}
                </svg>
            </div>

            <DanKoeWordByWord words={words} sceneStart={sceneStart} sfx={SFX.TECH_POP} />
        </AbsoluteFill>
    );
};

// --- MAIN MANAGER ---

export const Scene: React.FC<{ mg: { type: string; words?: Word[]; start_time: number; transparent?: boolean } }> = ({ mg }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();
    const opacity = interpolate(frame, [0, 15, durationInFrames-15, durationInFrames], [0, 1, 1, 0]);

    let SceneComponent: React.FC<{ words: Word[], sceneStart: number, transparent?: boolean }>;
    
    switch(mg.type) {
        case 'SimplicityAlignment': SceneComponent = SimplicityAlignment; break;
        case 'EntropyFilter': SceneComponent = EntropyFilter; break;
        case 'SystemStacking': SceneComponent = SystemStacking; break;
        case 'BillionGrowth': SceneComponent = BillionGrowth; break;
        case 'FutureTimeline': SceneComponent = FutureTimeline; break;
        case 'StoppingClock': SceneComponent = StoppingClock; break;
        case 'TestDrive': SceneComponent = TestDrive; break;
        default: SceneComponent = SimplicityAlignment;
    }

    return (
        <AbsoluteFill style={{ opacity }}>
            <SceneComponent words={mg.words || []} sceneStart={mg.start_time} transparent={mg.transparent} />
        </AbsoluteFill>
    );
};
