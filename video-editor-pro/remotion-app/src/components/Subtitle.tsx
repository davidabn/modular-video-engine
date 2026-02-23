import React from 'react';
import { AbsoluteFill } from 'remotion';

export const Subtitle = ({ text, position = 'bottom' }) => {
	const containerStyle = position === 'lateral' 
		? {
			justifyContent: 'center',
			alignItems: 'flex-start',
			left: 20,
			top: 0,
			bottom: 0,
			width: 400,
		}
		: {
			justifyContent: 'center',
			alignItems: 'center',
			bottom: 150,
			height: 150,
		};

	return (
		<AbsoluteFill style={containerStyle}>
			<div
				style={{
					fontFamily: 'Arial, sans-serif',
					fontSize: 50,
					color: 'yellow',
                    fontWeight: 'bold',
					textAlign: position === 'lateral' ? 'left' : 'center',
                    textShadow: '2px 2px 4px #000000',
                    padding: '10px 20px',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    borderRadius: 10,
				}}
			>
				{text}
			</div>
		</AbsoluteFill>
	);
};
