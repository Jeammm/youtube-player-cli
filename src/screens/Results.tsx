import React, { useEffect, useState } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { Screen } from "../router/screen.js";
import { searchYouTube, VideoResult } from "../yt/search.js";
import Image from "ink-picture";
import { usePlayerStore } from "../store/playerStore.js";

const HEADER_HEIGHT = 5; // title + spacing
const ITEM_HEIGHT = 9; // thumbnail(10) + margin(1)

const isITerm = process.env.TERM_PROGRAM === "iTerm.app";

interface ResultsProps {
  searchQuery: string;
  setScreen: (screen: Screen) => void;
  setVideoId: (videoId: string) => void;
  handleBack: () => void;
}

const Results = ({
  searchQuery,
  setScreen,
  setVideoId,
  handleBack,
}: ResultsProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { stdout } = useStdout();
  const terminalHeight = stdout.rows;
  const LIST_HEIGHT = terminalHeight - HEADER_HEIGHT;

  const {
    setCurrentVideo,
    searchResults,
    setSearchResults,
    searchQuery: storedQuery,
    setSearchQuery,
  } = usePlayerStore();

  /* ============================
   * Fetch search results
   * ============================ */
  useEffect(() => {
    let cancelled = false;

    // ✅ Guard: same query + already have results
    if (storedQuery === searchQuery && searchResults.length > 0) {
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      setSelectedIndex(0);

      try {
        const fetched = await searchYouTube(searchQuery);
        if (!cancelled) {
          setSearchResults(fetched);
          setSearchQuery(searchQuery);
        }
      } catch {
        if (!cancelled) setError("Failed to fetch results.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchResults();

    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  /* ============================
   * Keyboard input
   * ============================ */
  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }

    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(searchResults.length - 1, i + 1));
    }

    if (key.return && searchResults[selectedIndex]) {
      setVideoId(searchResults[selectedIndex].videoId);
      setCurrentVideo(searchResults[selectedIndex]);
      setScreen(Screen.Player);
    }

    if (key.escape) {
      handleBack();
    }
  });

  /* ============================
   * Render states
   * ============================ */
  if (loading) {
    return (
      <Box flexDirection="column">
        <Text>Searching YouTube…</Text>
        <Text dimColor>{searchQuery}</Text>
      </Box>
    );
  }

  if (error) {
    return <Text color="red">{error}</Text>;
  }

  if (searchResults.length === 0) {
    return (
      <Box flexDirection="column">
        <Text>No results found.</Text>
        <Text dimColor>Press Esc to go back</Text>
      </Box>
    );
  }

  const itemsPerPage = Math.max(1, Math.floor(LIST_HEIGHT / ITEM_HEIGHT));

  const startIndex = Math.min(
    Math.max(0, selectedIndex - Math.floor(itemsPerPage / 2)),
    Math.max(0, searchResults.length - itemsPerPage)
  );

  const visibleResults = searchResults.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  /* ============================
   * Main render
   * ============================ */
  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* ───── Sticky Header ───── */}
      <Box flexDirection="column" borderStyle="round" paddingX={1}>
        <Box justifyContent="space-between">
          <Text bold>Results for “{searchQuery}”</Text>
          <Text dimColor>↑↓ navigate • Enter play • Esc back</Text>
        </Box>
        <Text dimColor>Showing {searchResults.length} results</Text>
      </Box>

      {/* ───── Scrollable List ───── */}
      <Box
        flexDirection="column"
        flexGrow={1}
        overflow="hidden"
        paddingBottom={1}
      >
        {visibleResults.map((video, index) => {
          const realIndex = startIndex + index;
          const selected = realIndex === selectedIndex;

          return (
            <Box
              key={video.videoId}
              flexDirection="row"
              height={isITerm ? ITEM_HEIGHT - 1 : ITEM_HEIGHT}
            >
              {/* Thumbnail */}

              {video.thumbnail ? (
                <Box
                  width={30}
                  height={10}
                  paddingTop={isITerm ? 1 : 0}
                  flexShrink={0}
                >
                  <Image src={video.thumbnail} />
                </Box>
              ) : (
                <Box width={30} height={10} flexShrink={0} borderStyle="round">
                  <Text dimColor>[ loading ]</Text>
                </Box>
              )}

              {/* Metadata */}
              <Box flexDirection="column" marginLeft={1}>
                <Text color={selected ? "cyan" : undefined}>
                  {selected ? "▶ " : "  "}
                  {video.title}
                </Text>
                <Text dimColor>
                  {video.author} • {video.duration}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default Results;
