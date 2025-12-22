import { create } from "zustand";
import mpvPlayer from "../player/mpv.js";
import { Video } from "../types/video.js";

interface PlayerState {
  isInitialized: boolean;
  isPlaying: boolean;
  progress: number;
  duration: number;
  autoplay: boolean;
  queue: Video[];
  currentIndex: number;
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
  loopMode: "off" | "one" | "all";
  mpvReady: boolean;

  // Actions
  initPlayer: () => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  toggleAutoplay: () => void;
  cycleLoopMode: () => void;
  addVideoToQueue: (video: Video) => void;
  addVideoToQueueAndPlay: (
    video: Video,
    options?: {
      priority?: boolean;
      playNow?: boolean;
    }
  ) => Promise<void>;
  setQueue: (videos: Video[], startIndex?: number) => void;
  clearQueue: () => void;
  seek: (seconds: number) => Promise<void>;
  setSearchResults: (results: Video[]) => void;
  setSearchQuery: (query: string) => void;
  loadByIndex: (index: number) => Promise<void>;
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
  loopMode: "off",
  mpvReady: false,

  initPlayer: async () => {
    if (get().isInitialized) return;

    set({ status: "initializing" });

    try {
      await mpvPlayer.start();

      let lastSecond = -1;

      mpvPlayer.on("property-change", async (event: any) => {
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
            set({ duration: event.data ?? 0 });
            break;

          case "pause":
            const { status } = get();

            if (status === "playing" || status === "paused") {
              set({ isPlaying: !event.data });
            }
            break;
        }
      });

      mpvPlayer.on("end-file", async (event: any) => {
        // event.reason: "eof" | "stop" | "error" | "quit"

        if (event.reason !== "eof") return;

        const { autoplay, loopMode, currentIndex, queue } = get();

        if (currentIndex === -1 || queue.length === 0) return;

        // 🔁 Loop ONE
        if (loopMode === "one") {
          await mpvPlayer.command(["seek", "0", "absolute"]);
          await mpvPlayer.command(["set_property", "pause", "false"]);
          return;
        }

        if (!autoplay) {
          set({ isPlaying: false, status: "ended" });
          return;
        }

        await get().next();
      });

      mpvPlayer.on("file-loaded", () => {
        set({ mpvReady: true });
      });

      await mpvPlayer.observeProperty("time-pos");
      await mpvPlayer.observeProperty("duration");
      await mpvPlayer.observeProperty("pause");

      set({ isInitialized: true, status: "ready" });
    } catch (error: any) {
      set({ status: "error", error: error.message });
    }
  },

  play: async () => {
    const { status, currentIndex, queue, loadByIndex } = get();

    if (status === "paused") {
      await mpvPlayer.play();
      set({ isPlaying: true, status: "playing" });
      return;
    }

    if (status === "ended" && currentIndex !== -1) {
      await loadByIndex(currentIndex);
      return;
    }

    if (currentIndex === -1 && queue.length > 0) {
      await loadByIndex(0);
      return;
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
    const { queue, currentIndex, loadByIndex } = get();

    if (queue.length === 0) return;

    const nextIndex = currentIndex + 1;

    // End of queue
    if (nextIndex >= queue.length) {
      set({
        isPlaying: false,
        status: "ended",
        currentIndex: -1,
      });
      await mpvPlayer.stop();
      return;
    }

    await loadByIndex(nextIndex);
  },

  previous: async () => {
    const { queue, currentIndex, loadByIndex } = get();

    if (queue.length === 0 || currentIndex === -1) return;

    if (currentIndex === 0) {
      await mpvPlayer.command(["seek", "0", "absolute"]);
      return;
    }

    await loadByIndex(currentIndex - 1);
  },

  toggleAutoplay: () => set((state) => ({ autoplay: !state.autoplay })),

  cycleLoopMode: () =>
    set((state) => {
      let newMode: "off" | "one" | "all";
      if (state.loopMode === "off") {
        newMode = "one";
      } else if (state.loopMode === "one") {
        newMode = "all";
      } else {
        newMode = "off";
      }
      return { loopMode: newMode };
    }),

  addVideoToQueue: (video: Video) =>
    set((state) => ({ queue: [...state.queue, video] })),

  addVideoToQueueAndPlay: async (
    video: Video,
    options?: { priority?: boolean; playNow?: boolean }
  ) => {
    const { priority = false, playNow = false } = options ?? {};

    let indexToPlay: number | null = null;

    set((state) => {
      const { queue, currentIndex, isPlaying } = state;

      // 🟢 Idle → append and play
      if (!isPlaying || currentIndex === -1) {
        const newQueue = [...queue, video];
        indexToPlay = newQueue.length - 1;

        return {
          queue: newQueue,
          currentIndex: indexToPlay,
        };
      }

      // ▶️ Playing
      if (priority) {
        // Insert right after current
        const insertIndex = currentIndex + 1;
        const newQueue = [
          ...queue.slice(0, insertIndex),
          video,
          ...queue.slice(insertIndex),
        ];

        if (playNow) {
          indexToPlay = insertIndex;
          return {
            queue: newQueue,
            currentIndex: insertIndex,
          };
        }

        return { queue: newQueue };
      }

      // ⏭ Normal enqueue (end of queue)
      return { queue: [...queue, video] };
    });

    if (indexToPlay !== null) {
      await get().loadByIndex(indexToPlay);
    }
  },

  loadByIndex: async (index: number) => {
    const { queue } = get();
    const video = queue[index];
    if (!video) return;

    set({
      currentIndex: index,
      status: "loading",
      progress: 0,
      mpvReady: false,
    });

    await mpvPlayer.stop();
    await mpvPlayer.load(video.videoId);

    set({
      isPlaying: true,
      status: "playing",
    });
  },

  setQueue: async (videos: Video[], startIndex: number = 0) => {
    const validIndex =
      videos.length === 0 || startIndex < 0 || startIndex >= videos.length
        ? -1
        : startIndex;

    set({
      queue: videos,
      currentIndex: validIndex,
      progress: 0,
    });

    if (validIndex !== -1) {
      await get().loadByIndex(validIndex);
    }
  },

  clearQueue: async () => {
    await mpvPlayer.stop();
    set({
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      status: "idle",
      progress: 0,
      duration: 0,
    });
  },

  seek: async (seconds: number) => {
    const { mpvReady } = get();
    if (!mpvReady) return;
    await mpvPlayer.seek(seconds);
  },

  setSearchResults: (results: Video[]) => set({ searchResults: results }),

  setSearchQuery: (q: string) => set({ searchQuery: q }),
}));
