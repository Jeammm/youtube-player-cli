import React, { useState, useEffect } from 'react';
import { Box, useInput } from 'ink';
import { Screen } from './router/screen.js';
import Home from './screens/Home.js';
import Results from './screens/Results.js';
import Player from './screens/Player.js';
import mpvPlayer from './player/mpv.js'; // Import mpvPlayer

const App = () => {
	const [screen, setScreen] = useState<Screen>(Screen.Home);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [videoId, setVideoId] = useState<string>('');

	// Cleanup mpv process on unmount
	useEffect(() => {
		return () => {
			mpvPlayer.quit();
		};
	}, []);

	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			process.exit();
		}
	});

	switch (screen) {
		case Screen.Home:
			return (
				<Home
					setScreen={setScreen}
					setSearchQuery={setSearchQuery}
					setVideoId={setVideoId}
				/>
			);
		case Screen.Results:
			return (
				<Results
					searchQuery={searchQuery}
					setScreen={setScreen}
					setVideoId={setVideoId}
				/>
			);
		case Screen.Player:
			return <Player videoId={videoId} setScreen={setScreen} />;
		default:
			return <Box>Screen not found</Box>;
	}
};

export default App;
