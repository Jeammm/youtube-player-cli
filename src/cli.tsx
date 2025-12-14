import React from "react";
import { render } from "ink";
import App from "./app.js";
import ansiEscapes from "ansi-escapes";
import { TerminalInfoProvider } from "ink-picture";

// Enter alternate screen
process.stdout.write(ansiEscapes.enterAlternativeScreen);
process.stdout.write(ansiEscapes.cursorHide);

// Restore terminal on exit
const cleanup = () => {
  process.stdout.write(ansiEscapes.cursorShow);
  process.stdout.write(ansiEscapes.exitAlternativeScreen);
};

process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit();
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit();
});

render(
  <TerminalInfoProvider>
    <App />
  </TerminalInfoProvider>,
  {}
);
