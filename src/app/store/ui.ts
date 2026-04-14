import { create } from "zustand";

import { getDesktopApi } from "@/app/desktopApi";
import type { ThemeMode } from "@/shared/preferences";

type UiState = {
  currentSidebarKey: string;
  theme: ThemeMode;
  hasCompletedOnboarding: boolean;
  showOnboarding: boolean;
  modals: {
    switchProfileId: string | null;
    deleteProfileId: string | null;
  };
  setCurrentSidebarKey: (key: string) => void;
  setTheme: (theme: ThemeMode) => void;
  setHasCompletedOnboarding: (value: boolean) => void;
  setShowOnboarding: (value: boolean) => void;
  openSwitchModal: (profileId: string) => void;
  closeSwitchModal: () => void;
  openDeleteModal: (profileId: string) => void;
  closeDeleteModal: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  currentSidebarKey: "profiles",
  theme: "dark",
  hasCompletedOnboarding: false,
  showOnboarding: false,
  modals: {
    switchProfileId: null,
    deleteProfileId: null,
  },
  setCurrentSidebarKey: (key) => {
    set({
      currentSidebarKey: key,
    });
  },
  setTheme: (theme) => {
    set({ theme });
    void getDesktopApi().savePreferences({ theme });
  },
  setHasCompletedOnboarding: (value) => {
    set({
      hasCompletedOnboarding: value,
    });
  },
  setShowOnboarding: (value) => {
    set({
      showOnboarding: value,
    });
  },
  openSwitchModal: (profileId) => {
    set((state) => ({
      modals: {
        ...state.modals,
        switchProfileId: profileId,
      },
    }));
  },
  closeSwitchModal: () => {
    set((state) => ({
      modals: {
        ...state.modals,
        switchProfileId: null,
      },
    }));
  },
  openDeleteModal: (profileId) => {
    set((state) => ({
      modals: {
        ...state.modals,
        deleteProfileId: profileId,
      },
    }));
  },
  closeDeleteModal: () => {
    set((state) => ({
      modals: {
        ...state.modals,
        deleteProfileId: null,
      },
    }));
  },
}));
