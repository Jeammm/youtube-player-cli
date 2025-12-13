import { create } from "zustand";
import mpvPlayer from "../player/mpv.js";

interface Video {
  videoId: string;
  title: string;
  author: string;
  duration: string; // e.g., "3:45"
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

  // Actions
  initPlayer: () => Promise<void>;
  loadVideo: (video: Video) => Promise<void>;
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

  initPlayer: async () => {
    if (get().isInitialized) return;
    set({ status: "initializing" });
    try {
      await mpvPlayer.start();
      mpvPlayer.on("property-change", (event: any) => {
        if (event.name === "time-pos") {
          set({ progress: event.data || 0 });
        } else if (event.name === "duration") {
          set({ duration: event.data || 0 });
        } else if (event.name === "pause") {
          set({ isPlaying: !event.data });
        } else if (event.name === "eof-reached" && event.data === true) {
          const { loop, autoplay, next } = get();
          if (loop) {
            mpvPlayer.load(get().currentVideo!.videoId);
          } else if (autoplay) {
            next();
          } else {
            set({ isPlaying: false, status: "ended" });
          }
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

  loadVideo: async (video: Video) => {
    set({ status: "loading", currentVideo: video, progress: 0, duration: 0 });
    try {
      await mpvPlayer.load(video.videoId);
      set({ isPlaying: true, status: "playing" });
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
    const { queue, currentIndex, loadVideo } = get();
    if (queue.length === 0) return;

    const nextIndex = (currentIndex + 1) % queue.length;
    if (nextIndex !== currentIndex || queue.length === 1) {
      // Play next or replay if only one and not looped
      const nextVideo = queue[nextIndex];
      set({ currentIndex: nextIndex, currentVideo: nextVideo });
      await loadVideo(nextVideo);
    } else {
      // If queue has only one video and not explicitly looped, stop.
      set({ isPlaying: false, status: "ended" });
      await mpvPlayer.stop();
    }
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
}));
