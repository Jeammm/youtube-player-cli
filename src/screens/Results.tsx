import { useEffect, useState } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { Screen } from "../router/screen.js";
import { searchYouTube } from "../yt/search.js";
import { usePlayerStore } from "../store/playerStore.js";
import ScrollableVideoList from "../ui/ScrollableVideoList.js";

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

  const {
    setCurrentVideo,
    searchResults,
    setSearchResults,
    searchQuery: storedQuery,
    setSearchQuery,
    queue,
    addVideoToQueue,
    loadedVideoId,
  } = usePlayerStore();

  const canAddToQueue = !!loadedVideoId || queue.length > 0;

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
    if (canAddToQueue && input == "q" && searchResults[selectedIndex]) {
      addVideoToQueue(searchResults[selectedIndex]);
      return;
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
        <Box justifyContent="space-between">
          <Text dimColor>Showing {searchResults.length} results</Text>
          {canAddToQueue && <Text dimColor>Q Add to Queue</Text>}
        </Box>
      </Box>

      {/* ───── Scrollable List ───── */}
      <ScrollableVideoList
        videoList={searchResults}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
      />
    </Box>
  );
};

export default Results;
