import ytSearch from "yt-search";

interface PlaylistItem {
  videoId: string;
  title: string;
  author: string;
  duration: string;
  thumbnail?: string;
}

export const getPlaylistVideos = async (
  playlistId: string
): Promise<PlaylistItem[]> => {
  try {
    const result = await ytSearch({ listId: playlistId });
    if (!result || !result.videos) {
      return [];
    }

    return result.videos.map((video) => ({
      videoId: video.videoId,
      title: video.title,
      author: video.author.name,
      duration: formatDuration(video.duration.seconds),
      thumbnail: video.thumbnail,
    }));
  } catch (error) {
    console.error("Error fetching playlist videos:", error);
    return [];
  }
};

// Helper function to format duration from seconds to "MM:SS"
const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

export const getPlaylistIdFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const playlistId = urlObj.searchParams.get("list");
    return playlistId;
  } catch (error) {
    return null;
  }
};
