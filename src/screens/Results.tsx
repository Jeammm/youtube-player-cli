import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Screen } from '../router/screen.js';
import { searchYouTube } from '../yt/search.js';

interface ResultsProps {
	searchQuery: string;
	setScreen: (screen: Screen) => void;
	setVideoId: (videoId: string) => void;
}

interface VideoResult {
	videoId: string;
	title: string;
	author: string;
	duration: string;
}

const Results = ({ searchQuery, setScreen, setVideoId }: ResultsProps) => {
	const [results, setResults] = useState<VideoResult[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchResults = async () => {
			setLoading(true);
			setError(null);
			try {
				const fetchedResults = await searchYouTube(searchQuery);
				setResults(fetchedResults);
			} catch (err) {
				setError('Failed to fetch results.');
				console.error(err);
			} finally {
				setLoading(false);
			}
		};
		fetchResults();
	}, [searchQuery]);

	useInput((input, key) => {
		if (key.upArrow) {
			setSelectedIndex(prev => Math.max(0, prev - 1));
		} else if (key.downArrow) {
			setSelectedIndex(prev => Math.min(results.length - 1, prev + 1));
		} else if (key.return) {
			if (results.length > 0) {
				setVideoId(results[selectedIndex].videoId);
				setScreen(Screen.Player);
			}
		} else if (key.escape) {
			setScreen(Screen.Home);
		}
	});

	if (loading) {
		return <Text>Loading results for "{searchQuery}"...</Text>;
	}

	if (error) {
		return <Text color="red">Error: {error}</Text>;
	}

	if (results.length === 0) {
		return (
			<Box flexDirection="column">
				<Text>No results found for "{searchQuery}".</Text>
				<Text color="gray">Press Esc to go back.</Text>
			</Box>
		);
	}

	return (
		<Box flexDirection="column">
			<Text>Search Results for: "{searchQuery}"</Text>
			<Text>---</Text>
			{results.map((video, index) => (
				<Box key={video.videoId} flexDirection="column">
					<Text color={index === selectedIndex ? 'cyan' : undefined}>
						{index === selectedIndex ? '> ' : '  '}
						{video.title}
					</Text>
					<Text color="gray">{video.author} ({video.duration})</Text>
				</Box>
			))}
			<Text color="gray">
				Use ↑↓ to navigate, Enter to select, Esc to go back.
			</Text>
		</Box>
	);
};

export default Results;
