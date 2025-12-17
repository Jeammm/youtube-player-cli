import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { Screen } from "../router/screen.js";
import { usePlayerStore } from "../store/playerStore.js";
import ProgressBar from "../ui/ProgressBar.js";
import Image from "ink-picture";
import { useStdoutDimensions } from "../utils/useStdoutDimensions.js";
import ScrollableVideoList from "../ui/ScrollableVideoList.js";

const THUMBNAIL_WIDTH = 46;
const THUMBNAIL_HEIGHT = 13;

interface PlayerProps {
  videoId: string;
  setScreen: (screen: Screen) => void;
  handleBack: () => void;
}

const Player = ({ setScreen, handleBack }: PlayerProps) => {
  const {
    isInitialized,
    isPlaying,
    progress,
    duration,
    autoplay,
    loop,
    currentVideo,
    status,
    error,
    initPlayer,
    loadVideo,
    togglePlayPause,
    next,
    previous,
    toggleAutoplay,
    toggleLoop,
    play,
    loadedVideoId,
    queue,
    seek,
  } = usePlayerStore();

  const [width] = useStdoutDimensions();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    initPlayer();
  }, [initPlayer]);

  useEffect(() => {
    if (isInitialized && currentVideo?.videoId !== loadedVideoId) {
      loadVideo();
      play();
    }
  }, [isInitialized, currentVideo, loadVideo, loadedVideoId]);

  useInput((input, key) => {
    if (key.escape) {
      handleBack(); // Go back to results
    } else if (input === " ") {
      togglePlayPause();
    } else if (input === "n" || input === "N") {
      next();
    } else if (input === "p" || input === "P") {
      previous();
    } else if (input === "a" || input === "A") {
      toggleAutoplay();
    } else if (input === "l" || input === "L") {
      toggleLoop();
    } else if (key.leftArrow) {
      seek(-5);
    } else if (key.rightArrow) {
      seek(5);
    }
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  if (status === "error") {
    return <Text color="red">Player Error: {error}</Text>;
  }

  if (!isInitialized || status === "initializing") {
    return <Text>Initializing player...</Text>;
  }

  if (!currentVideo) {
    return <Text>Loading video information...</Text>;
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
            <Text dimColor>L Loop [{loop ? "ON" : "OFF"}]</Text>
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
      <ScrollableVideoList
        videoList={queue}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        hideThumbnail
      />
    </Box>
  );
};

export default Player;
