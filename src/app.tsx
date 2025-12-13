import React, { useState, useEffect, useMemo } from "react";
import { Box, useInput } from "ink";
import { Screen } from "./router/screen.js";
import Home from "./screens/Home.js";
import Results from "./screens/Results.js";
import Player from "./screens/Player.js";
import mpvPlayer from "./player/mpv.js";
import { useStdoutDimensions } from "./utils/useStdoutDimensions.js";

const App = () => {
  const [width, height] = useStdoutDimensions();

  const [screen, setScreen] = useState<Screen>(Screen.Home);
  const [searchQuery, setSearchQuery] = useState("");
  const [videoId, setVideoId] = useState("");

  const screenColumnsWidth = useMemo(() => {
    switch (screen) {
      case Screen.Home:
        return width * 1;
      case Screen.Results:
        return width * (1 / 2);
      case Screen.Player:
        return width * (1 / 3);
    }
  }, [screen]);

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
  });

  return (
    <Box width={width} height={height} flexDirection="row">
      <Box
        width={screenColumnsWidth}
        height="100%"
        borderStyle="round"
        flexDirection="column"
        borderLeft={true}
      >
        <Home
          setScreen={setScreen}
          setSearchQuery={setSearchQuery}
          setVideoId={setVideoId}
        />
      </Box>

      {/* MIDDLE: Results */}
      {screen !== Screen.Home && (
        <Box
          width={screenColumnsWidth}
          height="100%"
          borderStyle="round"
          flexDirection="column"
        >
          <Results
            searchQuery={searchQuery}
            setScreen={setScreen}
            setVideoId={setVideoId}
          />
        </Box>
      )}

      {/* RIGHT: Player */}
      {screen === Screen.Player && (
        <Box
          width={screenColumnsWidth}
          height="100%"
          borderStyle="round"
          flexDirection="column"
        >
          <Player videoId={videoId} setScreen={setScreen} />
        </Box>
      )}
    </Box>
  );
};

export default App;
