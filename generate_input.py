import json
import os

with open('video-david_transcript.json', 'r') as f:
    transcript = json.load(f)

subtitles = []
for seg in transcript['segments']:
    subtitles.append({
        'start': seg['start'],
        'end': seg['end'],
        'text': seg['text'].strip()
    })

# Define key moments for Motion Graphics
mg_plan = [
    {'type': 'MiracleSpark', 'start_index': 0, 'end_index': 1},
    {'type': 'ChaoticPrompt', 'start_index': 4, 'end_index': 4},
    {'type': 'ComplexityStack', 'start_index': 6, 'end_index': 7},
    {'type': 'ExecutionFlow', 'start_index': 10, 'end_index': 11},
    {'type': 'EvolutionaryBuild', 'start_index': 12, 'end_index': 13}
]

motion_graphics = []
for plan in mg_plan:
    start_seg = transcript['segments'][plan['start_index']]
    end_seg = transcript['segments'][plan['end_index']]
    
    # Extract words from segments in the range
    words = []
    for i in range(plan['start_index'], plan['end_index'] + 1):
        seg = transcript['segments'][i]
        # Since we don't have word-level timestamps, we estimate
        seg_words = seg['text'].strip().split()
        duration = seg['end'] - seg['start']
        word_duration = duration / max(1, len(seg_words))
        for j, w in enumerate(seg_words):
            words.append({
                'text': w.upper().replace(',', '').replace('.', ''),
                'start': seg['start'] + j * word_duration,
                'end': seg['start'] + (j + 1) * word_duration
            })

    motion_graphics.append({
        'id': f'mg-{len(motion_graphics)}',
        'type': plan['type'],
        'content': '',
        'start_time': start_seg['start'],
        'duration': end_seg['end'] - start_seg['start'],
        'words': words
    })

input_data = {
    'video_path': os.path.abspath('video-david_no_silence.mp4'),
    'subtitles': subtitles,
    'motion_graphics': motion_graphics
}

with open('remotion_input.json', 'w') as f:
    json.dump(input_data, f, indent=2)
