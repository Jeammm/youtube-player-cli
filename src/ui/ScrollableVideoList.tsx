import { Box, Text, useInput } from "ink";
import Image from "ink-picture";
import { Video } from "../types/video.js";
import { usePlayerStore } from "../store/playerStore.js";

const THUMBNAIL_WIDTH = 30;
const THUMBNAIL_HEIGHT = 10;

const isITerm = process.env.TERM_PROGRAM === "iTerm.app";

const ScrollableVideoList = ({
  availableHeight,
  videoList,
  selectedIndex,
  setSelectedIndex,
  hideThumbnail = false,
  highlightPlaying = false,
}: {
  availableHeight: number;
  videoList: Video[];
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  hideThumbnail?: boolean;
  highlightPlaying?: boolean;
}) => {
  const { queue, currentIndex } = usePlayerStore();

  const itemHeight = hideThumbnail ? 2 : THUMBNAIL_HEIGHT + (isITerm ? 1 : 0);

  const itemsPerPage = Math.max(1, Math.floor(availableHeight / itemHeight));

  const startIndex = Math.min(
    Math.max(0, selectedIndex - Math.floor(itemsPerPage / 2)),
    Math.max(0, videoList.length - itemsPerPage)
  );

  const visibleResults = videoList.slice(startIndex, startIndex + itemsPerPage);

  const leftoverHeight = availableHeight - itemsPerPage * itemHeight;
  const haveMoreItems = videoList.length > startIndex + itemsPerPage;

  const playingVideoId = queue[currentIndex]?.videoId;

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }

    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(videoList.length - 1, i + 1));
    }
  });

  return (
    <Box flexDirection="column" height={availableHeight}>
      {visibleResults.map((video, index) => {
        const realIndex = startIndex + index;
        const selected = realIndex === selectedIndex;
        const isPlaying =
          video.videoId === playingVideoId && realIndex === currentIndex;

        return (
          <Box key={video.videoId} flexDirection="row" height={itemHeight}>
            {/* Thumbnail */}

            {hideThumbnail ? null : video.thumbnail ? (
              <Box
                width={THUMBNAIL_WIDTH}
                height={THUMBNAIL_HEIGHT}
                paddingTop={isITerm ? 1 : 0}
                flexShrink={0}
              >
                <Image src={video.thumbnail} />
              </Box>
            ) : (
              <Box
                width={THUMBNAIL_WIDTH}
                height={THUMBNAIL_HEIGHT}
                flexShrink={0}
                borderStyle="round"
              >
                <Text dimColor>[ loading ]</Text>
              </Box>
            )}

            {/* Metadata */}
            <Box flexDirection="column" marginLeft={1} flexShrink={0}>
              <Text
                color={
                  selected
                    ? "cyan"
                    : highlightPlaying && isPlaying
                    ? "green"
                    : undefined
                }
              >
                {selected ? "▶ " : "  "}
                {video.title} {highlightPlaying && isPlaying && "(Playing)"}
              </Text>
              <Text dimColor>
                {"  "}
                {video.author} • {video.duration}
              </Text>
            </Box>
          </Box>
        );
      })}

      {leftoverHeight > 0 && haveMoreItems && (
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text>↓ Scroll down for more ↓</Text>
        </Box>
      )}
    </Box>
  );
};

export default ScrollableVideoList;
