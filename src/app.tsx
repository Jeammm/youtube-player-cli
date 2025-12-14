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
        return width;
      case Screen.Results:
        return width;
      case Screen.Player:
        return width * (1 / 2);
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

  if (screen === Screen.Home) {
    return (
      <Box width={width} height={height} flexDirection="row">
        <Home
          setScreen={setScreen}
          setSearchQuery={setSearchQuery}
          setVideoId={setVideoId}
        />
      </Box>
    );
  }

  return (
    <Box width={width} height={height} flexDirection="row">
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
