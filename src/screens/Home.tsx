import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { Screen } from '../router/screen.js';
import { getPlaylistIdFromUrl, getPlaylistVideos } from '../yt/playlist.js';
import { usePlayerStore } from '../store/playerStore.js';

interface HomeProps {
	setScreen: (screen: Screen) => void;
	setSearchQuery: (query: string) => void;
	setVideoId: (videoId: string) => void;
}

const Home = ({ setScreen, setSearchQuery, setVideoId }: HomeProps) => {
	const [query, setQuery] = useState('');
	const { setQueue } = usePlayerStore();

	const handleSubmit = async () => {
		if (query.trim() === '') {
			return;
		}

		if (query.startsWith('https://')) {
			const playlistId = getPlaylistIdFromUrl(query);
			if (playlistId) {
				const videos = await getPlaylistVideos(playlistId);
				if (videos.length > 0) {
					setQueue(videos, 0); // Load entire playlist
					setVideoId(videos[0].videoId); // Start playing the first video
					setScreen(Screen.Player);
				} else {
					// Handle empty playlist or error
					console.log('Could not load playlist or playlist is empty.');
				}
			} else {
				// Single video URL
				const url = new URL(query);
				const videoId = url.searchParams.get('v');
				if (videoId) {
					// For a single video URL, create a queue with just that video
					setQueue([{ videoId, title: 'Loading...', author: '', duration: '' }], 0);
					setVideoId(videoId);
					setScreen(Screen.Player);
				}
			}
		} else {
			setSearchQuery(query);
			setScreen(Screen.Results);
		}
	};

	return (
		<Box flexDirection="column" alignItems="center" justifyContent="center">
			<Text>
				████████████████████████████
				████   Y O U T U B E   ████
				████████████████████████████
			</Text>
			<Box>
				<Text>🔍 Search YouTube: </Text>
				<TextInput value={query} onChange={setQuery} onSubmit={handleSubmit} />
			</Box>
		</Box>
	);
};

export default Home;
