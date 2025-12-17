import { Box, Text, useInput, useStdout } from "ink";
import { Video } from "../store/playerStore.js";
import Image from "ink-picture";

const HEADER_HEIGHT = 5; // title + spacing
const THUMBNAIL_WIDTH = 30;
const THUMBNAIL_HEIGHT = 10;

const isITerm = process.env.TERM_PROGRAM === "iTerm.app";

const ScrollableVideoList = ({
  videoList,
  selectedIndex,
  setSelectedIndex,
  hideThumbnail = false,
}: {
  videoList: Video[];
  selectedIndex: number;
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  hideThumbnail?: boolean;
}) => {
  const { stdout } = useStdout();

  const terminalHeight = stdout.rows;
  const LIST_HEIGHT = terminalHeight - HEADER_HEIGHT;
  const itemHeight = hideThumbnail ? 3 : THUMBNAIL_HEIGHT + (isITerm ? 1 : 0);

  const itemsPerPage = Math.max(1, Math.floor(LIST_HEIGHT / itemHeight));

  const startIndex = Math.min(
    Math.max(0, selectedIndex - Math.floor(itemsPerPage / 2)),
    Math.max(0, videoList.length - itemsPerPage)
  );

  const visibleResults = videoList.slice(startIndex, startIndex + itemsPerPage);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((i) => Math.max(0, i - 1));
    }

    if (key.downArrow) {
      setSelectedIndex((i) => Math.min(videoList.length - 1, i + 1));
    }
  });

  return (
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
          <Box key={video.videoId} flexDirection="row" height={itemHeight}>
            {/* Thumbnail */}

            {hideThumbnail ? null : video.thumbnail ? (
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
                {"  "}
                {video.author} • {video.duration}
              </Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default ScrollableVideoList;
