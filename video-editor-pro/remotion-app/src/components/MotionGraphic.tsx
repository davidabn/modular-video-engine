import React from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const MotionGraphic = ({ type, content, animationStyle, startFrame }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    // Simple enter animation based on time passed since start
    const timeSinceStart = frame - startFrame;
    const progress = spring({
        frame: timeSinceStart,
        fps,
        config: { damping: 200 }
    });

    let style = {};
    if (animationStyle === 'pop') {
        style = { transform: `scale(${progress})` };
    } else if (animationStyle === 'slide') {
        style = { transform: `translateX(${(1 - progress) * -100}%)` };
    } else if (animationStyle === 'scale') {
        style = { transform: `scale(${progress})` };
    }

    const baseStyle = {
        position: 'absolute',
        top: 200,
        left: 100,
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        fontSize: 40,
        fontWeight: 'bold',
        color: '#333',
        boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
        ...style
    };

    if (type === 'lower_third') {
        baseStyle.top = undefined;
        baseStyle.bottom = 300;
        baseStyle.left = 50;
        baseStyle.backgroundColor = '#6e56cf'; // Purple
        baseStyle.color = 'white';
    }

    return (
        <div style={baseStyle as any}>
            {content}
        </div>
    );
};
