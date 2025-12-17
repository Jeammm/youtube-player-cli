import { create } from "zustand";
import mpvPlayer from "../player/mpv.js";

export interface Video {
  videoId: string;
  title: string;
  author: string;
  duration: string; // e.g., "3:45"
  thumbnail?: string;
}

interface PlayerState {
  isInitialized: boolean;
  isPlaying: boolean;
  progress: number; // current playback position in seconds
  duration: number; // total duration in seconds
  autoplay: boolean;
  loop: boolean;
  queue: Video[];
  currentIndex: number;
  currentVideo: Video | null;
  status:
    | "idle"
    | "initializing"
    | "loading"
    | "playing"
    | "paused"
    | "ended"
    | "error"
    | "ready";
  error: string | null;
  searchResults: Video[];
  searchQuery: string;
  loadedVideoId: string;

  // Actions
  initPlayer: () => Promise<void>;
  loadVideo: (video?: Video) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  toggleAutoplay: () => void;
  toggleLoop: () => void;
  addVideoToQueue: (video: Video) => void;
  setQueue: (videos: Video[], startIndex?: number) => void;
  clearQueue: () => void;
  seek: (seconds: number) => Promise<void>;
  setCurrentVideo: (video: Video | null) => void;
  setSearchResults: (results: Video[]) => void;
  setSearchQuery: (query: string) => void;
  setLoadedVideoId: (videoId: string) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isInitialized: false,
  isPlaying: false,
  progress: 0,
  duration: 0,
  autoplay: true,
  loop: false,
  queue: [],
  currentIndex: -1,
  currentVideo: null,
  status: "idle",
  error: null,
  searchResults: [],
  searchQuery: "",
  loadedVideoId: "",

  initPlayer: async () => {
    if (get().isInitialized) return;
    set({ status: "initializing" });
    try {
      await mpvPlayer.start();
      let lastSecond = -1;

      mpvPlayer.on("property-change", (event: any) => {
        switch (event.name) {
          case "time-pos": {
            const sec = Math.floor(event.data ?? 0);
            if (sec !== lastSecond) {
              lastSecond = sec;
              set({ progress: sec });
            }
            break;
          }

          case "duration":
            set({ duration: event.data || 0 });
            break;

          case "pause":
            set({ isPlaying: !event.data });
            break;

          case "eof-reached":
            if (event.data !== true) return;

            const { next, loop, queue } = get();

            // 🔁 Loop current track
            if (loop) {
              mpvPlayer.command(["seek", "0", "absolute"]);
              return;
            }

            if (queue.length > 0) {
              next();
              return;
            }

            // ⏹ End of playback
            set({ isPlaying: false });
            break;
        }
      });
      await mpvPlayer.observeProperty("time-pos");
      await mpvPlayer.observeProperty("duration");
      await mpvPlayer.observeProperty("pause");
      await mpvPlayer.observeProperty("eof-reached");
      set({ isInitialized: true, status: "ready" });
    } catch (error: any) {
      set({ status: "error", error: error.message });
    }
  },

  loadVideo: async (video?: Video) => {
    set({ isPlaying: true, status: "loading" });
    if (video) {
      set({ currentVideo: video });
    }

    try {
      await mpvPlayer.load(get().currentVideo!.videoId);
      set({
        isPlaying: true,
        status: "playing",
        loadedVideoId: get().currentVideo!.videoId,
      });
    } catch (error: any) {
      set({ status: "error", error: error.message, isPlaying: false });
    }
  },

  play: async () => {
    if (get().status === "ended" && get().currentVideo) {
      // If ended, restart current video
      await mpvPlayer.load(get().currentVideo!.videoId);
      set({ isPlaying: true, status: "playing", progress: 0 });
    } else if (get().currentVideo) {
      await mpvPlayer.play();
      set({ isPlaying: true, status: "playing" });
    } else if (get().queue.length > 0) {
      // If nothing is playing but queue exists, play first item
      const firstVideo = get().queue[0];
      set({ currentIndex: 0, currentVideo: firstVideo });
      await get().loadVideo(firstVideo);
    }
  },

  pause: async () => {
    await mpvPlayer.pause();
    set({ isPlaying: false, status: "paused" });
  },

  togglePlayPause: async () => {
    const { isPlaying, play, pause } = get();
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  },

  next: async () => {
    const { queue, loadVideo } = get();

    // Remove current video
    const [, ...rest] = queue;

    if (rest.length === 0) {
      set({
        queue: [],
        currentVideo: null,
        currentIndex: -1,
        isPlaying: false,
        status: "ended",
      });
      await mpvPlayer.stop();
      return;
    }

    const nextVideo = rest[0];

    set({
      queue: rest,
      currentVideo: nextVideo,
      currentIndex: 0,
    });

    await loadVideo(nextVideo);
  },

  previous: async () => {
    const { queue, currentIndex, loadVideo } = get();
    if (queue.length === 0) return;

    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    if (prevIndex !== currentIndex || queue.length === 1) {
      const prevVideo = queue[prevIndex];
      set({ currentIndex: prevIndex, currentVideo: prevVideo });
      await loadVideo(prevVideo);
    } else {
      // Same logic as next, if queue has only one video
      set({ isPlaying: false, status: "ended" });
      await mpvPlayer.stop();
    }
  },

  toggleAutoplay: () => set((state) => ({ autoplay: !state.autoplay })),
  toggleLoop: () => set((state) => ({ loop: !state.loop })),

  addVideoToQueue: (video: Video) =>
    set((state) => ({ queue: [...state.queue, video] })),

  setQueue: (videos: Video[], startIndex: number = 0) => {
    set({ queue: videos, currentIndex: startIndex });
    if (videos.length > 0 && startIndex !== -1) {
      get().loadVideo(videos[startIndex]);
    }
  },

  clearQueue: () => set({ queue: [], currentIndex: -1, currentVideo: null }),

  seek: async (seconds: number) => {
    await mpvPlayer.seek(seconds);
  },

  setCurrentVideo: (video: Video | null) => {
    set({ currentVideo: video });
  },

  setSearchResults: (results: Video[]) => set({ searchResults: results }),

  setSearchQuery: (q: string) => set({ searchQuery: q }),

  setLoadedVideoId: (videoId: string) => set({ loadedVideoId: videoId }),
}));
