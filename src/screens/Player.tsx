import { useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import { Screen } from "../router/screen.js";
import { usePlayerStore } from "../store/playerStore.js";
import ProgressBar from "../ui/ProgressBar.js";
import Image from "ink-picture";
import { useStdoutDimensions } from "../utils/useStdoutDimensions.js";
import ScrollableVideoList from "../ui/ScrollableVideoList.js";
import { useRouterStore } from "../store/routerStore.js";
import { formatTime } from "../utils/formatter.js";

const THUMBNAIL_WIDTH = 46;
const THUMBNAIL_HEIGHT = 13;

const Player = () => {
  const {
    isInitialized,
    isPlaying,
    progress,
    duration,
    autoplay,
    loopMode,
    status,
    error,
    togglePlayPause,
    clearQueue,
    next,
    previous,
    toggleAutoplay,
    cycleLoopMode,
    queue,
    seek,
    currentIndex,
  } = usePlayerStore();

  const { screens, setFocusedScreen, closeScreens } = useRouterStore();

  const [width] = useStdoutDimensions();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentVideo = useMemo(() => {
    return queue[currentIndex] || null;
  }, [currentIndex, queue]);

  useInput((input, key) => {
    if (key.escape) {
      if (screens[Screen.Results]) {
        closeScreens([Screen.Player]);
        setFocusedScreen(Screen.Results);
      } else {
        closeScreens([Screen.Player]);
        setFocusedScreen(Screen.Home);
      }
      clearQueue();
    } else if (input === " ") {
      togglePlayPause();
    } else if (input === "n" || input === "N") {
      next();
    } else if (input === "p" || input === "P") {
      previous();
    } else if (input === "a" || input === "A") {
      toggleAutoplay();
    } else if (input === "l" || input === "L") {
      cycleLoopMode();
    } else if (key.leftArrow) {
      seek(-5);
    } else if (key.rightArrow) {
      seek(5);
    }
  });

  if (status === "error") {
    return <Text color="red">Player Error: {error}</Text>;
  }

  if (!isInitialized || status === "initializing") {
    return <Text>Initializing player...</Text>;
  }

  if (!currentVideo) {
    return <Text>Loading Video...</Text>;
  }

  return (
    <Box flexDirection="column" width={width} paddingX={2}>
      <Box borderStyle="round" borderColor="red" paddingX={1}>
        <Text color="red">YouTube : </Text>
        <Text> https://www.youtube.com/watch?v={currentVideo.videoId}</Text>
      </Box>

      {/* ───── Top Row ───── */}
      <Box flexDirection="row">
        {/* Thumbnail */}
        <Box
          width={THUMBNAIL_WIDTH}
          height={THUMBNAIL_HEIGHT}
          marginRight={2}
          flexShrink={0}
          justifyContent="center"
        >
          {currentVideo.thumbnail ? (
            <Image
              src={currentVideo.thumbnail}
              width={THUMBNAIL_WIDTH}
              height={THUMBNAIL_HEIGHT}
            />
          ) : (
            <Text dimColor>[ loading thumbnail ]</Text>
          )}
        </Box>

        {/* Right info stack */}
        <Box flexDirection="column" flexGrow={1}>
          <Text bold wrap="truncate-end">
            {currentVideo.title}
          </Text>
          <Text dimColor>{currentVideo.author}</Text>

          <Box flexGrow={1}></Box>

          <Box marginTop={1} flexDirection="column" gap={1}>
            <Text dimColor>Space Play ▶ / Pause ⏸</Text>
            <Text dimColor>N Next P Prev</Text>
            <Text dimColor>A Autoplay [{autoplay ? "ON" : "OFF"}]</Text>
            <Text dimColor>L Loop [{loopMode.toUpperCase()}]</Text>
            <Text dimColor>ESC Stop</Text>
            <Text dimColor>
              <Text bold>←</Text> / <Text bold>→</Text> Seek 5s
            </Text>
          </Box>
        </Box>
      </Box>

      {/* ───── Progress Bar (under thumbnail) ───── */}
      <Box marginTop={1} flexDirection="row" alignItems="center">
        <Text>{isPlaying ? "⏸" : "▶"}</Text>
        <Box marginX={1}>
          <ProgressBar
            progress={progress}
            duration={duration}
            width={width - 25}
          />
        </Box>
        {!duration ? (
          <Text dimColor>Loading...</Text>
        ) : (
          <Text dimColor>
            {formatTime(progress)} / {formatTime(duration)}
          </Text>
        )}
      </Box>

      {/* ───── Queue List ───── */}
      {queue.length > 1 && (
        <Box marginTop={1} flexDirection="column" flexGrow={1} gap={1}>
          <Text>Up Next</Text>
          <ScrollableVideoList
            videoList={queue}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            hideThumbnail
          />
        </Box>
      )}
    </Box>
  );
};

export default Player;
