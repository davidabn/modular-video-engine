import { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig } from 'remotion';
import { Subtitle } from './components/Subtitle';
import { MotionGraphic } from './components/MotionGraphic';

export const Composition = ({ videoPath, subtitles, motionGraphics }) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	return (
		<AbsoluteFill style={{ backgroundColor: 'black' }}>
			<OffthreadVideo src={videoPath} />
            
            {/* Render Subtitles */}
            {subtitles.map((sub, index) => {
                const startFrame = sub.start * fps;
                const endFrame = sub.end * fps;
                if (frame >= startFrame && frame <= endFrame) {
                    return <Subtitle key={index} text={sub.text} position={sub.position} />;
                }
                return null;
            })}

            {/* Render Motion Graphics */}
            {motionGraphics.map((gfx) => {
                 const startFrame = gfx.start_time * fps;
                 const durationFrames = gfx.duration * fps;
                 const endFrame = startFrame + durationFrames;

                 if (frame >= startFrame && frame <= endFrame) {
                     return (
                         <MotionGraphic
                             key={gfx.id}
                             type={gfx.type}
                             content={gfx.content}
                             animationStyle={gfx.animation_style}
                             startFrame={startFrame} 
                         />
                     );
                 }
                 return null;
            })}
		</AbsoluteFill>
	);
};
