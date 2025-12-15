import React, { useState, useEffect, useMemo } from "react";
import { Box, Text, useInput } from "ink";
import { Screen } from "./router/screen.js";
import Home from "./screens/Home.js";
import Results from "./screens/Results.js";
import Player from "./screens/Player.js";
import mpvPlayer from "./player/mpv.js";
import { useStdoutDimensions } from "./utils/useStdoutDimensions.js";
import { usePlayerStore } from "./store/playerStore.js";

const App = () => {
  const [width, height] = useStdoutDimensions();

  const [screens, setScreens] = useState<{ [key in Screen]: boolean }>({
    [Screen.Home]: true,
    [Screen.Results]: false,
    [Screen.Player]: false,
  });
  const [focusedScreen, setFocusedScreen] = useState<Screen>(Screen.Home);

  const [searchQuery, setSearchQuery] = useState("");
  const [videoId, setVideoId] = useState("");

  const { pause } = usePlayerStore();

  // Cleanup mpv on exit
  useEffect(() => {
    return () => {
      mpvPlayer.quit();
    };
  }, []);

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      process.exit();
    }

    if (key.tab) {
      setFocusedScreen((prev) => {
        if (prev === Screen.Home && screens[Screen.Results])
          return Screen.Results;
        if (prev === Screen.Home && screens[Screen.Player])
          return Screen.Player;
        if (prev === Screen.Results && screens[Screen.Player])
          return Screen.Player;
        if (prev === Screen.Results && screens[Screen.Home]) return Screen.Home;
        if (prev === Screen.Player) return Screen.Home;
        return prev;
      });
    }
  });

  const setScreen = (screen: Screen) => {
    setScreens((prev) => {
      return { ...prev, [screen]: true };
    });
    setFocusedScreen(screen);
  };

  const handleBack = () => {
    setScreens((prev) => {
      // CASE 1:
      // Player focused → close Player → focus Results
      if (focusedScreen === Screen.Player && prev[Screen.Player]) {
        setFocusedScreen(Screen.Results);
        pause();
        return { ...prev, [Screen.Player]: false };
      }

      // CASE 2:
      // Player running, focus on Results → close both → focus Home
      if (
        focusedScreen === Screen.Results &&
        prev[Screen.Player] &&
        prev[Screen.Results]
      ) {
        setFocusedScreen(Screen.Home);
        pause();
        return {
          ...prev,
          [Screen.Player]: false,
          [Screen.Results]: false,
        };
      }

      // CASE 3:
      // No Player, focus Results → close Results → focus Home
      if (
        focusedScreen === Screen.Results &&
        !prev[Screen.Player] &&
        prev[Screen.Results]
      ) {
        setFocusedScreen(Screen.Home);
        pause();
        return {
          ...prev,
          [Screen.Results]: false,
        };
      }

      return prev;
    });
  };

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
        <Home
          setScreen={setScreen}
          setSearchQuery={setSearchQuery}
          setVideoId={setVideoId}
        />
      )}

      {focusedScreen === Screen.Results && (
        <Box width={width} height="100%" flexDirection="column">
          <Results
            searchQuery={searchQuery}
            setScreen={setScreen}
            setVideoId={setVideoId}
            handleBack={handleBack}
          />
        </Box>
      )}

      {focusedScreen === Screen.Player && (
        <Box width={width} height="100%" flexDirection="column">
          <Player
            videoId={videoId}
            setScreen={setScreen}
            handleBack={handleBack}
          />
        </Box>
      )}
    </Box>
  );
};

export default App;
