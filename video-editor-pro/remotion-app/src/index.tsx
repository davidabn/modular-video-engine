import { registerRoot, Composition } from 'remotion';
import { Composition as MainComposition } from './Composition';

// Read data from public/data.json (simulated or fetched)
// In a real scenario, we might import a JSON file directly if we configured the bundler,
// or fetch it. For simplicity in this manual setup, we'll assume we can import it if we had proper loaders,
// but let's use a simple approach: hardcoding or importing if possible.
// Actually, Remotion allows passing props via inputFile.
// For now, let's just register the composition.

import data from '../public/data.json';

registerRoot(() => {
	return (
        <>
            <Composition
                id="Main"
                component={MainComposition}
                durationInFrames={Math.ceil(data.subtitles[data.subtitles.length - 1].end * 60) + 60}
                fps={60}
                width={1920}
                height={1080}
                defaultProps={{
                    videoPath: data.video_path,
                    subtitles: data.subtitles,
                    motionGraphics: data.motion_graphics,
                }}
            />
        </>
	);
});
