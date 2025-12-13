import React, { useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Screen } from '../router/screen.js';
import { usePlayerStore } from '../store/playerStore.js';
import ProgressBar from '../ui/ProgressBar.js';

interface PlayerProps {
	videoId: string;
	setScreen: (screen: Screen) => void;
}

const Player = ({ videoId, setScreen }: PlayerProps) => {
	const {
		isInitialized,
		isPlaying,
		progress,
		duration,
		autoplay,
		loop,
		currentVideo,
		status,
		error,
		initPlayer,
		loadVideo,
		togglePlayPause,
		next,
		previous,
		toggleAutoplay,
		toggleLoop,
	} = usePlayerStore();

	useEffect(() => {
		initPlayer();
	}, [initPlayer]);

	useEffect(() => {
		if (isInitialized && videoId && (!currentVideo || currentVideo.videoId !== videoId)) {
			loadVideo({ videoId, title: 'Loading...', author: '', duration: '' });
		}
	}, [isInitialized, videoId, currentVideo, loadVideo]);


	useInput((input, key) => {
		if (key.escape) {
			setScreen(Screen.Results); // Go back to results
		} else if (input === ' ') {
			togglePlayPause();
		} else if (input === 'n' || input === 'N') {
			next();
		} else if (input === 'p' || input === 'P') {
			previous();
		} else if (input === 'a' || input === 'A') {
			toggleAutoplay();
		} else if (input === 'l' || input === 'L') {
			toggleLoop();
		}
	});

	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
	};

	if (status === 'error') {
		return <Text color="red">Player Error: {error}</Text>;
	}

	if (!isInitialized || status === 'initializing') {
		return <Text>Initializing player...</Text>;
	}

	if (!currentVideo) {
		return <Text>Loading video information...</Text>;
	}

	return (
		<Box flexDirection="column" alignItems="center">
			<Text bold>{currentVideo.title}</Text>
			<Text color="gray">{currentVideo.author}</Text>

			<Box flexDirection="row" alignItems="center" marginTop={1}>
				<Text>{isPlaying ? '▶' : '⏸'}</Text>
				<ProgressBar progress={progress} duration={duration} width={30} />
				<Text>
					{formatTime(progress)} / {formatTime(duration)}
				</Text>
			</Box>

			<Box marginTop={1} flexDirection="column" alignItems="flex-start">
				<Text>[ Space ] Play / Pause</Text>
				<Text>[ N ] Next    [ P ] Prev</Text>
				<Text>[ A ] Autoplay: {autoplay ? 'ON' : 'OFF'}</Text>
				<Text>[ L ] Loop: {loop ? 'ON' : 'OFF'}</Text>
				<Text>[ Esc ] Back</Text>
			</Box>
		</Box>
	);
};

export default Player;
