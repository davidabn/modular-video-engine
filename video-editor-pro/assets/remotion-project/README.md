# Remotion Project Template

This directory should contain a valid Remotion project.
The `src/Root.tsx` should be configured to read from a generic input file (e.g., `public/data.json` or passed via props).

## Recommended Structure
- `src/Composition.tsx`: Main component that takes `video_path`, `subtitles`, and `motion_graphics` as props.
- `src/components/Subtitle.tsx`: Component to render subtitles.
- `src/components/MotionGraphic.tsx`: Component to handle the dynamic motion graphics based on the schema.

The Agent will generate a JSON file matching `input_schema.json` which this project should consume to render the final video.
