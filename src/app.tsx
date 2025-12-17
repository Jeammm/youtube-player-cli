import React, { useState, useEffect, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { Screen } from "./router/screen.js";
import Home from "./screens/Home.js";
import Results from "./screens/Results.js";
import Player from "./screens/Player.js";
import mpvPlayer from "./player/mpv.js";
import { useStdoutDimensions } from "./utils/useStdoutDimensions.js";
import { usePlayerStore } from "./store/playerStore.js";
import { useRouterStore } from "./store/routerStore.js";

const App = () => {
  const [width, height] = useStdoutDimensions();

  const [searchQuery, setSearchQuery] = useState("");

  const { initPlayer } = usePlayerStore();
  const { screens, focusedScreen, cycleFocusedScreen } = useRouterStore();

  // Cleanup mpv on exit
  useEffect(() => {
    return () => {
      mpvPlayer.quit();
    };
  }, []);

  useEffect(() => {
    initPlayer();
  }, [initPlayer]);

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      process.exit();
    }

    if (key.tab) {
      cycleFocusedScreen();
    }
  });

  return (
    <Box width={width} height={height} flexDirection="column">
      <Box
        width={width}
        borderStyle="round"
        borderTop={false}
        borderLeft={false}
        borderRight={false}
      >
        {Object.keys(screens).map((screen) => {
          if (!screens[screen as Screen]) return null;
          return (
            <Box
              backgroundColor={focusedScreen === screen ? "white" : undefined}
              justifyContent="center"
              width={20}
            >
              <Text color={focusedScreen === screen ? "black" : "white"}>
                {screen}
              </Text>
            </Box>
          );
        })}

        {Object.values(screens).filter(Boolean).length > 1 && (
          <Box flexGrow={1} justifyContent="flex-end">
            <Box
              borderStyle="single"
              borderTop={false}
              borderBottom={false}
              paddingX={1}
            >
              <Text>Tab ⇥</Text>
            </Box>
          </Box>
        )}
      </Box>

      {focusedScreen === Screen.Home && (
        <Home setSearchQuery={setSearchQuery} />
      )}

      {focusedScreen === Screen.Results && (
        <Box width={width} height="100%" flexDirection="column">
          <Results searchQuery={searchQuery} />
        </Box>
      )}

      {focusedScreen === Screen.Player && (
        <Box width={width} height="100%" flexDirection="column">
          <Player />
        </Box>
      )}
    </Box>
  );
};

export default App;
