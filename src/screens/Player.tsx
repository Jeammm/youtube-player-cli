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
import { TAB_BAR_HEIGHT } from "../types/size.js";

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

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [width, height] = useStdoutDimensions();
  const availableQueueBoxHeight =
    height - TAB_BAR_HEIGHT - THUMBNAIL_HEIGHT - 7;
  const availableDescriptionBoxWidth = width - THUMBNAIL_WIDTH - 6;

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
    return (
      <Text>
        Loading Video...{currentIndex} {queue.length}
      </Text>
    );
  }

  return (
    <Box flexDirection="column" width={width}>
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

          <Box flexGrow={1} />

          <Box marginTop={1} flexDirection="column">
            <Box>
              <Box borderStyle="round" paddingX={1}>
                <Text>Space {isPlaying ? "Pause ⏸" : "Play ▶"}</Text>
              </Box>
              <Box borderStyle="round" paddingX={1}>
                <Text bold>←</Text>
              </Box>
              <Box borderStyle="round" paddingX={1}>
                <Text bold>→</Text>
              </Box>

              <Box flexGrow={1} />

              <Box borderStyle="round" paddingX={1}>
                <Text>A Autoplay [{autoplay ? "ON" : "OFF"}]</Text>
              </Box>

              <Box borderStyle="round" paddingX={1}>
                <Text>L Loop [{loopMode.toUpperCase()}]</Text>
              </Box>
            </Box>

            <Box flexDirection="row" alignItems="center">
              <Text>{isPlaying ? "⏸" : "▶"}</Text>
              <Box marginX={1}>
                <ProgressBar
                  progress={progress}
                  duration={duration}
                  width={availableDescriptionBoxWidth - 15}
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
          </Box>
        </Box>
      </Box>

      {/* ───── Queue List ───── */}
      {queue.length > 1 && (
        <Box
          marginTop={1}
          flexDirection="column"
          flexGrow={1}
          gap={1}
          borderStyle="doubleSingle"
          borderBottom={false}
          borderLeft={false}
          borderRight={false}
        >
          <Box justifyContent="space-between">
            <Box>
              <Text>
                {queue.length - currentIndex - 1} Up Next{" "}
                {availableQueueBoxHeight}
              </Text>
            </Box>

            <Box gap={2}>
              <Text>
                <Text bold>P</Text> Previous Video
              </Text>

              <Text>
                <Text bold>N</Text> Next Video
              </Text>
            </Box>
          </Box>

          <ScrollableVideoList
            availableHeight={availableQueueBoxHeight}
            videoList={queue}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            hideThumbnail
            highlightPlaying
          />
        </Box>
      )}
    </Box>
  );
};

export default Player;
