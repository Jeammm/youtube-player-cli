import { useEffect, useState } from "react";
import { Box, Text, useInput, useStdout } from "ink";
import { Screen } from "../router/screen.js";
import { searchYouTube } from "../yt/search.js";
import { usePlayerStore } from "../store/playerStore.js";
import ScrollableVideoList from "../ui/ScrollableVideoList.js";
import { useRouterStore } from "../store/routerStore.js";
import { useStdoutDimensions } from "../utils/useStdoutDimensions.js";
import { TAB_BAR_HEIGHT } from "../types/size.js";

interface ResultsProps {
  searchQuery: string;
}

const Results = ({ searchQuery }: ResultsProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [_, height] = useStdoutDimensions();
  const availableHeight = height - TAB_BAR_HEIGHT;

  const {
    searchResults,
    setSearchResults,
    searchQuery: storedQuery,
    setSearchQuery,
    addVideoToQueueAndPlay,
    isPlaying,
  } = usePlayerStore();

  const { setFocusedScreen, closeScreens, openScreens } = useRouterStore();

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
    if (input == "q" && searchResults[selectedIndex]) {
      addVideoToQueueAndPlay(searchResults[selectedIndex]);
      openScreens([Screen.Player]);
    }

    if (input == "Q" && searchResults[selectedIndex]) {
      addVideoToQueueAndPlay(searchResults[selectedIndex], { priority: true });
      openScreens([Screen.Player]);
    }

    if (key.return && searchResults[selectedIndex]) {
      addVideoToQueueAndPlay(searchResults[selectedIndex], {
        playNow: true,
        priority: true,
      });
      setFocusedScreen(Screen.Player);
    }

    if (key.escape) {
      setFocusedScreen(Screen.Home);
      closeScreens([Screen.Results, Screen.Player]);
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
    <Box flexDirection="column" height={availableHeight}>
      {/* ───── Sticky Header ───── */}
      <Box flexDirection="column" borderStyle="round" paddingX={1}>
        <Box justifyContent="space-between">
          <Text bold>
            Results for “{searchQuery}”{" "}
            {isPlaying ? "(Playing)" : "(not Playing)"}
          </Text>
          <Text dimColor>↑↓ navigate • Enter play now • Esc back</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text dimColor>Showing {searchResults.length} results</Text>
          <Text dimColor>q add to Queue • Q play next</Text>
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
