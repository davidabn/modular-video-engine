import { AbsoluteFill, Video, useCurrentFrame, useVideoConfig, staticFile, Sequence, interpolate } from "remotion";
import React from "react";
import { Scene } from "./components/MotionGraphics";
import { spring } from "remotion";

interface Subtitle {
  start: number;
  end: number;
  text: string;
  words?: { text: string; start: number; end: number }[];
}

// --- COMPONENTE DE LEGENDA CLÁSSICA (TikTok Minimalist) ---
const TikTokSubtitle: React.FC<{ words: { text: string; start: number; end: number }[]; time: number }> = ({ words, time }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  
  const springConfig = {
    damping: 12,
    stiffness: 100,
    mass: 0.5,
  };
  
  const pop = spring({
    fps,
    frame,
    config: springConfig,
  });

  return (
    <AbsoluteFill style={{ 
      justifyContent: "center", 
      alignItems: "center", 
      top: "55%", // Agora sim: um pouco abaixo do centro (50% + 5%)
      height: "fit-content",
      pointerEvents: "none",
      transform: `scale(${interpolate(pop, [0, 1], [0.9, 1])})`, // Escala mais sutil
      opacity: pop
    }}>
      <div style={{
        display: "flex",
        flexWrap: "nowrap",
        justifyContent: "center",
        gap: "12px",
        maxWidth: "95%",
        textAlign: "center"
      }}>
        {words.map((w, i) => {
          return (
            <span key={i} style={{
              color: "white", // Tudo branco, sem destaque amarelo
              fontSize: "4.2rem",
              fontFamily: "system-ui, -apple-system, sans-serif",
              fontWeight: 900,
              textShadow: "0 4px 10px rgba(0,0,0,0.8), -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000",
              WebkitTextStroke: "2px black",
              paintOrder: "stroke fill",
              whiteSpace: "nowrap"
            }}>
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

interface MotionGraphic {
  id: string;
  type: string;
  content: string;
  start_time: number;
  duration: number;
  words?: { text: string; start: number; end: number }[];
}

interface Zoom {
  start: number;
  end: number;
  scale: number;
}

interface MyCompositionProps {
  video_path: string;
  width?: number;
  height?: number;
  subtitles: Subtitle[];
  layout?: {
    style: "center" | "side";
    person_box: { x: number; width: number };
  };
  motion_graphics: MotionGraphic[];
  zooms?: Zoom[];
  transparent?: boolean;
  renderMode?: 'preview' | 'overlay';
  layerFilter?: 'all' | 'subtitles' | 'animations';
  selectedMgId?: string; // NOVO: Para renderizar apenas uma animação específica
  backgroundColor?: string; // NOVO: Para Chroma Key
}

const chunkSubtitles = (text: string, isSide: boolean = false) => {
  const words = text.split(" ");
  const chunks = [];
  let currentChunk: string[] = [];
  
  // Limite de caracteres: ~40 para side captions (20 por lado), ~25 para central
  const charLimit = isSide ? 40 : 25;

  words.forEach(word => {
    const tempChunk = [...currentChunk, word];
    if (tempChunk.join(" ").length > charLimit && currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
      currentChunk = [word];
    } else {
      currentChunk.push(word);
    }
  });
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }
  
  return chunks;
};

export const MyComposition: React.FC<MyCompositionProps> = ({
  video_path,
  width = 1080,
  height = 1920,
  subtitles,
  layout,
  motion_graphics,
  zooms = [],
  transparent = false,
  renderMode = 'preview', // 'preview' | 'overlay'
  layerFilter = 'all',
  selectedMgId,
  backgroundColor,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const time = frame / fps;

  const isOverlayMode = renderMode === 'overlay';
  const showVideo = layerFilter === 'all' && !isOverlayMode;
  const showAnimations = (layerFilter === 'all' || layerFilter === 'animations') && !selectedMgId;
  const showSubtitles = (layerFilter === 'all' || layerFilter === 'subtitles') && !selectedMgId;

  const isTransparentLayer = layerFilter === 'subtitles' || (transparent && layerFilter === 'all');
  
  const backgroundStyle = backgroundColor || ((isOverlayMode || transparent || isTransparentLayer) 
    ? "transparent" 
    : "black");

  // Encontrar o nível de zoom atual
  const activeZoom = zooms.find(z => time >= z.start && time <= z.end);
  const scale = activeZoom ? activeZoom.scale : 1;

  // Renderização Modular de uma Animação Específica
  const selectedMg = selectedMgId ? motion_graphics.find(m => m.id === selectedMgId) : null;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundStyle }}>
      
      {/* Modo Modular: Renderiza apenas a animação selecionada começando do zero */}
      {selectedMg && (
        <AbsoluteFill>
            <Scene mg={selectedMg} />
        </AbsoluteFill>
      )}

      {/* Camada 1: Vídeo Original (Apenas se não for modular) */}
      {showVideo && !selectedMgId && (
        <Sequence name="Vídeo Original" durationInFrames={durationInFrames}>
          <AbsoluteFill style={{ overflow: "hidden" }}>
            {video_path ? (
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center', width: '100%', height: '100%' }}>
                <Video src={staticFile(video_path)} />
              </div>
            ) : null}
          </AbsoluteFill>
        </Sequence>
      )}

      {/* Camada 2: Motion Graphics */}
      {showAnimations && motion_graphics.map((mg) => (
        <Sequence 
          key={mg.id} 
          from={Math.round(mg.start_time * fps)}
          durationInFrames={Math.round(mg.duration * fps)}
        >
          <Scene mg={mg} />
        </Sequence>
      ))}

      {/* Camada 3: Legendas Dinâmicas (Side-by-Side ou Clássica Dan Koe) */}
      {showSubtitles && (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
          {subtitles.map((s, i) => {
              if (!s.words) return null;
              
              const isSide = layout?.style === "side" && layout?.person_box;

              // --- MODO CLÁSSICO (Fallback / TikTok Minimalist Rítmico) ---
              if (!isSide) {
                  const classicChunks: {words: typeof s.words, start: number, end: number}[] = [];
                  let currentLine: typeof s.words = [];

                  s.words.forEach((w, idx) => {
                      const lastWord = currentLine[currentLine.length - 1];
                      
                      // Condições para fechar o bloco (RITMO):
                      const isTooLong = currentLine.length >= 5;
                      const hasPunctuation = lastWord && /[.?!]/.test(lastWord.text);
                      const isPause = lastWord && (w.start - lastWord.end > 0.4);

                      if (lastWord && (isTooLong || hasPunctuation || isPause)) {
                          classicChunks.push({
                              words: currentLine,
                              start: currentLine[0].start,
                              end: lastWord.end // Termina EXATAMENTE quando a última palavra do bloco acaba
                          });
                          currentLine = [w];
                      } else {
                          currentLine.push(w);
                      }
                  });
                  
                  if (currentLine.length > 0) {
                      classicChunks.push({
                          words: currentLine,
                          start: currentLine[0].start,
                          end: currentLine[currentLine.length - 1].end
                      });
                  }

                  return classicChunks.map((chunk, chunkIdx) => (
                    <Sequence 
                      key={`classic-sub-${i}-${chunkIdx}`} 
                      from={Math.round(chunk.start * fps)}
                      durationInFrames={Math.max(1, Math.round((chunk.end - chunk.start) * fps))}
                    >
                      <TikTokSubtitle 
                        words={chunk.words} 
                        time={time}
                      />
                    </Sequence>
                  ));
              }

              // --- MODO SIDE-BY-SIDE (Otimizado para Horizontal) ---
              const personX = layout.person_box.x * width;
              const personWidth = (layout.person_box.width * 0.5) * width;
              const leftEdge = personX - personWidth/2 - 30;
              const rightEdge = personX + personWidth/2 + 30;
              const edgeMargin = width * 0.05;
              const leftMaxWidth = Math.max(100, leftEdge - edgeMargin);
              const rightMaxWidth = Math.max(100, (width - rightEdge) - edgeMargin);
              const fontSize = width * 0.045;

              // Agrupar palavras em blocos (chunks) menores
              const wordChunks: {words: typeof s.words, start: number, end: number}[] = [];
              let currentChunk: typeof s.words = [];
              let currentCharCount = 0;

              s.words.forEach((w, idx) => {
                  if (currentCharCount + w.text.length > 25 && currentChunk.length > 0) {
                      wordChunks.push({
                          words: currentChunk,
                          start: currentChunk[0].start,
                          end: w.start
                      });
                      currentChunk = [w];
                      currentCharCount = w.text.length;
                  } else {
                      currentChunk.push(w);
                      currentCharCount += w.text.length + 1;
                  }
              });
              if (currentChunk.length > 0) {
                  wordChunks.push({
                      words: currentChunk,
                      start: currentChunk[0].start,
                      end: currentChunk[currentChunk.length - 1].end
                  });
              }

              return wordChunks.map((chunk, chunkIdx) => {
                  const midIdx = Math.ceil(chunk.words.length / 2);
                  const leftHalf = chunk.words.slice(0, midIdx);
                  const rightHalf = chunk.words.slice(midIdx);

                  const leftText = leftHalf.map(w => w.text).join(" ");
                  const rightText = rightHalf.map(w => w.text).join(" ");

                  const estimateWidth = (text: string, fSize: number) => text.length * (fSize * 0.55);
                  const leftScale = Math.min(1, leftMaxWidth / estimateWidth(leftText, fontSize));
                  const rightScale = Math.min(1, rightMaxWidth / estimateWidth(rightText, fontSize));

                  return (
                    <Sequence 
                      key={`${i}-${chunkIdx}`} 
                      from={Math.round(chunk.start * fps)} 
                      durationInFrames={Math.max(1, Math.round((chunk.end - chunk.start) * fps))}
                      layout="none"
                    >
                      <AbsoluteFill style={{ top: height * 0.4 }}>
                        {/* Lado Esquerdo */}
                        <div style={{
                            position: "absolute",
                            right: width - leftEdge,
                            width: leftMaxWidth,
                            textAlign: "right",
                            display: "flex",
                            justifyContent: "flex-end",
                            alignItems: "center",
                            transform: `scale(${leftScale})`,
                            transformOrigin: "right center"
                        }}>
                            <h1 style={{
                                color: "#FFFF00",
                                fontSize,
                                fontFamily: "system-ui, -apple-system, sans-serif",
                                fontWeight: 800,
                                margin: 0,
                                textShadow: "0 2px 10px rgba(0,0,0,0.8)",
                                lineHeight: 1.1,
                                whiteSpace: "nowrap"
                            }}>
                                {leftHalf.map((w, k) => (
                                    <span key={k} style={{ 
                                        opacity: time >= w.start ? 1 : 0,
                                        display: "inline-block",
                                        marginRight: "0.25em"
                                    }}>
                                        {w.text}
                                    </span>
                                ))}
                            </h1>
                        </div>

                        {/* Lado Direito */}
                        <div style={{
                            position: "absolute",
                            left: rightEdge,
                            width: rightMaxWidth,
                            textAlign: "left",
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            transform: `scale(${rightScale})`,
                            transformOrigin: "left center"
                        }}>
                            <h1 style={{
                                color: "#FFFF00",
                                fontSize,
                                fontFamily: "system-ui, -apple-system, sans-serif",
                                fontWeight: 800,
                                margin: 0,
                                textShadow: "0 2px 10px rgba(0,0,0,0.8)",
                                lineHeight: 1.1,
                                whiteSpace: "nowrap"
                            }}>
                                {rightHalf.map((w, k) => (
                                    <span key={k} style={{ 
                                        opacity: time >= w.start ? 1 : 0,
                                        display: "inline-block",
                                        marginRight: "0.25em"
                                    }}>
                                        {w.text}
                                    </span>
                                ))}
                            </h1>
                        </div>
                      </AbsoluteFill>
                    </Sequence>
                  );
              });
          })}
        </AbsoluteFill>
      )}

    </AbsoluteFill>
  );
};
