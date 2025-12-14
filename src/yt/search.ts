import ytSearch from "yt-search";

export interface VideoResult {
  videoId: string;
  title: string;
  author: string;
  duration: string;
  thumbnail: string | undefined;
}

export const searchYouTube = async (query: string): Promise<VideoResult[]> => {
  try {
    const result = await ytSearch(query);
    if (!result || !result.videos) {
      return [];
    }

    return result.videos.slice(0, 15).map((video) => ({
      videoId: video.videoId,
      title: video.title,
      author: video.author.name,
      duration: formatDuration(video.duration.seconds),
      thumbnail: video.thumbnail,
    }));
  } catch (error) {
    console.error("Error searching YouTube:", error);
    return [];
  }
};

// Helper function to format duration from seconds to "MM:SS"
const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};
