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
import Logo from "../ascii/Logo.js";
import { useStdoutDimensions } from "../utils/useStdoutDimensions.js";

interface HomeProps {
  setScreen: (screen: Screen) => void;
  setSearchQuery: (query: string) => void;
  setVideoId: (videoId: string) => void;
}

const Home = ({ setScreen, setSearchQuery, setVideoId }: HomeProps) => {
  const [queryValue, setQueryValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(false);
  const [width] = useStdoutDimensions();

  const { setQueue } = usePlayerStore();

  const debouncedQuery = useDebouncedValue(queryValue, 400);

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

  const handleSubmit = async (inputQuery?: string) => {
    const query = inputQuery ?? queryValue;
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
            [
              {
                videoId,
                title: "Loading...",
                author: "",
                duration: "",
              },
            ],
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

    if (key.return && selectedIndex === -1) {
      handleSubmit();
    }

    if (key.return && selectedIndex >= 0) {
      handleSubmit(suggestions[selectedIndex]);
    }

    if (key.escape) {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  });

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      width={"100%"}
      height={"100%"}
    >
      <Logo />

      <Box flexDirection="column" marginTop={1} width={Math.min(width, 108)}>
        <Box borderStyle="round" paddingX={2}>
          <TextInput
            value={queryValue}
            onChange={setQueryValue}
            placeholder="Search Youtube"
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
