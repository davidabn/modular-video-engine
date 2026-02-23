import "./index.css";
import { Composition, getInputProps } from "remotion";
import { MyComposition } from "./Composition";
import React from "react";
import inputData from "../remotion_input.json";
import { z } from "zod";

export const myCompositionSchema = z.object({
  video_path: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  fps: z.number().optional(),
  duration: z.number(),
  subtitles: z.array(
    z.object({
      start: z.number(),
      end: z.number(),
      text: z.string(),
      words: z.array(
        z.object({
          text: z.string(),
          start: z.number(),
          end: z.number(),
        })
      ).optional(),
    })
  ),
  layout: z.object({
    style: z.enum(["center", "side"]),
    person_box: z.object({
      x: z.number(),
      width: z.number(),
    }),
  }).optional(),
  motion_graphics: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      content: z.string().optional(),
      start_time: z.number(),
      duration: z.number(),
      words: z.array(
        z.object({
          text: z.string(),
          start: z.number(),
          end: z.number(),
        })
      ).optional(),
    })
  ).optional(),
  zooms: z.array(
    z.object({
      start: z.number(),
      end: z.number(),
      scale: z.number(),
    })
  ).optional(),
  renderMode: z.enum(["preview", "overlay"]).optional(),
  selectedMgId: z.string().optional(),
  backgroundColor: z.string().optional(),
});

type MyCompositionProps = z.infer<typeof myCompositionSchema>;

const props = {
  ...inputData,
  ...getInputProps(),
} as unknown as MyCompositionProps;

export const RemotionRoot: React.FC = () => {
  const fps = props.fps || 60;
  
  // Duração total para o preview/legendas
  const totalDurationFrames = Math.max(1, Math.round((props.duration || 30) * fps));

  // Cálculo de duração específica para o modo de animação isolada
  let animDurationFrames = totalDurationFrames;
  if (props.selectedMgId && props.motion_graphics) {
    const mg = props.motion_graphics.find(m => m.id === props.selectedMgId);
    if (mg) {
      animDurationFrames = Math.max(1, Math.round(mg.duration * fps));
    }
  }

  const width = props.width || 1080;
  const height = props.height || 1920;

  return (
    <>
      <Composition
        id="MyComp"
        component={MyComposition as React.FC<MyCompositionProps>}
        durationInFrames={totalDurationFrames}
        fps={fps}
        width={width}
        height={height}
        schema={myCompositionSchema}
        defaultProps={props}
      />
      
      {/* Composição específica para renderizar animações curtas de forma modular */}
      <Composition
        id="AnimOnly"
        component={MyComposition as React.FC<MyCompositionProps>}
        durationInFrames={animDurationFrames}
        fps={fps}
        width={width}
        height={height}
        schema={myCompositionSchema}
        defaultProps={{
            ...props,
            layerFilter: "animations",
            renderMode: "overlay"
        }}
      />
    </>
  );
};
