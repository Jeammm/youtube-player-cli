import { create } from "zustand";
import { Screen } from "../router/screen.js";

export interface RouterState {
  screens: { [key in Screen]: boolean };
  focusedScreen: Screen;

  toggleScreen: (screen: Screen) => void;
  closeScreens: (screensToClose: Screen[]) => void;
  openScreens: (screensToOpen: Screen[]) => void;
  setFocusedScreen: (screen: Screen) => void;
  cycleFocusedScreen: () => void;
}

export const useRouterStore = create<RouterState>((set, get) => ({
  screens: {
    [Screen.Home]: true,
    [Screen.Results]: false,
    [Screen.Player]: false,
  },
  focusedScreen: Screen.Home,

  toggleScreen: (screen: Screen) =>
    set((state) => ({
      screens: {
        ...state.screens,
        [screen]: !state.screens[screen],
      },
    })),

  closeScreens: (screensToClose: Screen[]) =>
    set((state) => {
      const newScreens = { ...state.screens };
      screensToClose.forEach((screen) => {
        newScreens[screen] = false;
      });
      return { screens: newScreens };
    }),

  openScreens: (screensToOpen: Screen[]) =>
    set((state) => {
      const newScreens = { ...state.screens };
      screensToOpen.forEach((screen) => {
        newScreens[screen] = true;
      });
      return { screens: newScreens };
    }),

  setFocusedScreen: (screen: Screen) => {
    const { screens } = get();

    if (!screens[screen]) {
      set((state) => ({
        screens: {
          ...state.screens,
          [screen]: true,
        },
        focusedScreen: screen,
      }));
    } else {
      set({ focusedScreen: screen });
    }
  },

  cycleFocusedScreen: () => {
    const { screens, focusedScreen } = get();

    if (focusedScreen === Screen.Home) {
      if (screens[Screen.Results]) {
        set({ focusedScreen: Screen.Results });
      } else if (screens[Screen.Player]) {
        set({ focusedScreen: Screen.Player });
      }
    } else if (focusedScreen === Screen.Results) {
      if (screens[Screen.Player]) {
        set({ focusedScreen: Screen.Player });
      } else {
        set({ focusedScreen: Screen.Home });
      }
    } else if (focusedScreen === Screen.Player) {
      set({ focusedScreen: Screen.Home });
    }
  },
}));
