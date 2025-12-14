import terminalImage from "terminal-image";
import fetch from "node-fetch";

export const getTerminalImage = async (
  imageUrl: string | undefined
): Promise<string> => {
  if (!imageUrl) return "No thumbnail available.";
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();
    return await terminalImage.buffer(buffer, {
      width: 40,
      height: 20,
      preserveAspectRatio: true,
    });
  } catch (error) {
    console.error("Failed to generate terminal image:", error);
    return "Could not generate thumbnail.";
  }
};
