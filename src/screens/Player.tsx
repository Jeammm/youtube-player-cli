import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { Screen } from "../router/screen.js";
import { usePlayerStore } from "../store/playerStore.js";
import ProgressBar from "../ui/ProgressBar.js";
import Image from "ink-picture";
import { useStdoutDimensions } from "../utils/useStdoutDimensions.js";

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
  } = usePlayerStore();

  const [width, height] = useStdoutDimensions();
  const thumbnailHeight = height - 6;

  useEffect(() => {
    initPlayer();
  }, [initPlayer]);

  useEffect(() => {
    if (isInitialized && currentVideo?.videoId) {
      loadVideo();
    }
  }, [isInitialized, currentVideo, loadVideo]);

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
      {/* ───── Top Row ───── */}
      <Box flexDirection="row">
        {/* Thumbnail */}
        <Box
          width={Math.min(50, Math.floor(width * 0.45))}
          marginRight={2}
          flexShrink={0}
        >
          {currentVideo.thumbnail ? (
            <Box
              width="100%"
              height={Math.floor(
                Math.min((Math.min(50, width * 0.45) * 9) / 16, thumbnailHeight)
              )}
            >
              <Image src={currentVideo.thumbnail} />
            </Box>
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

          <Box marginTop={1}>
            <Text dimColor>Space Play / Pause</Text>
            <Text dimColor>N Next P Prev</Text>
            <Text dimColor>A Autoplay [{autoplay ? "ON" : "OFF"}]</Text>
          </Box>

          {/* Push Loop to bottom aligned with thumbnail bottom */}
          <Box flexGrow={1} />
          <Text dimColor>L Loop [{loop ? "ON" : "OFF"}]</Text>
        </Box>
      </Box>

      {/* ───── Progress Bar (under thumbnail) ───── */}
      <Box
        marginTop={1}
        flexDirection="row"
        alignItems="center"
        marginLeft={Math.min(50, Math.floor(width * 0.45)) + 2}
      >
        <Text>{isPlaying ? "▶" : "⏸"}</Text>
        <Box marginX={1}>
          <ProgressBar
            progress={progress}
            duration={duration}
            width={Math.min(40, width - 30)}
          />
        </Box>
        <Text dimColor>
          {formatTime(progress)} / {formatTime(duration)}
        </Text>
      </Box>
    </Box>
  );
};

export default Player;
