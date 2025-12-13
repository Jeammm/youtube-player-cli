import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { Screen } from "../router/screen.js";
import { getPlaylistIdFromUrl, getPlaylistVideos } from "../yt/playlist.js";
import { usePlayerStore } from "../store/playerStore.js";
import {
  fetchSuggestions,
  useDebouncedValue,
} from "../utils/useSearchSuggestion.js";

interface HomeProps {
  setScreen: (screen: Screen) => void;
  setSearchQuery: (query: string) => void;
  setVideoId: (videoId: string) => void;
}

const Home = ({ setScreen, setSearchQuery, setVideoId }: HomeProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(false);

  const { setQueue } = usePlayerStore();

  const debouncedQuery = useDebouncedValue(query, 400);

  // Fetch suggestions
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.startsWith("http")) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    setLoading(true);
    fetchSuggestions(debouncedQuery)
      .then((res) => {
        setSuggestions(res);
        setSelectedIndex(-1);
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  const handleSubmit = async () => {
    if (query.trim() === "") return;

    if (query.startsWith("https://")) {
      const playlistId = getPlaylistIdFromUrl(query);

      if (playlistId) {
        const videos = await getPlaylistVideos(playlistId);
        if (videos.length > 0) {
          setQueue(videos, 0);
          setVideoId(videos[0].videoId);
          setScreen(Screen.Player);
        }
      } else {
        const url = new URL(query);
        const videoId = url.searchParams.get("v");
        if (videoId) {
          setQueue(
            [{ videoId, title: "Loading...", author: "", duration: "" }],
            0
          );
          setVideoId(videoId);
          setScreen(Screen.Player);
        }
      }
    } else {
      setSearchQuery(query);
      setScreen(Screen.Results);
    }
  };

  useInput((input, key) => {
    if (key.downArrow && suggestions.length > 0) {
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    }

    if (key.upArrow && suggestions.length > 0) {
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }

    if (key.tab && selectedIndex >= 0) {
      setQuery(suggestions[selectedIndex]);
      setSuggestions([]);
    }

    if (key.escape) {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  });

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center">
      <Text>Y O U T U B E</Text>

      <Box flexDirection="column" width={40}>
        <Box>
          <Text>🔍 Search YouTube: </Text>
          <TextInput
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
          />
        </Box>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            {suggestions.map((s, i) => (
              <Text
                key={s}
                inverse={i === selectedIndex}
                dimColor={i !== selectedIndex}
              >
                {i === selectedIndex ? "› " : "  "}
                {s}
              </Text>
            ))}
            {loading && <Text dimColor>loading…</Text>}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Home;
