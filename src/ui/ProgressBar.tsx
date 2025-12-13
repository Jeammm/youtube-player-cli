// Placeholder for ProgressBar component
import React from 'react';
import { Box, Text } from 'ink';

interface ProgressBarProps {
  progress: number; // Current progress in seconds
  duration: number; // Total duration in seconds
  width?: number;
  indicator?: string;
  empty?: string;
}

const ProgressBar = ({ progress, duration, width = 40, indicator = '⚪', empty = '─' }: ProgressBarProps) => {
  if (duration === 0) {
    return <Text>{empty.repeat(width)}</Text>;
  }

  const filledWidth = Math.min(width, Math.max(0, Math.floor((progress / duration) * width)));
  const emptyWidth = width - filledWidth - (filledWidth < width ? indicator.length : 0);

  const progressBar = empty.repeat(filledWidth) + indicator + empty.repeat(emptyWidth);

  return (
    <Box>
      <Text>{progressBar}</Text>
    </Box>
  );
};

export default ProgressBar;