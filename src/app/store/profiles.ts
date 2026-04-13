import { create } from "zustand";

import { getDesktopApi } from "@/app/desktopApi";
import { useUiStore } from "@/app/store/ui";
import type {
  BootstrapResult,
  ClaudeSettingsSnapshot,
  ImportResult,
  SwitchResult,
} from "@/shared/ipc";
import type { Profile, ProfileInput } from "@/shared/profiles";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

type ProfilesState = {
  profiles: Profile[];
  activeProfileId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  dirtyProfileId: string | null;
  importResult: ImportResult | null;
  settingsSnapshot: ClaudeSettingsSnapshot | null;
  error: string | null;
  bootstrap: () => Promise<BootstrapResult>;
  refreshProfiles: () => Promise<void>;
  refreshSettingsSnapshot: () => Promise<ClaudeSettingsSnapshot>;
  createProfile: (input: ProfileInput) => Promise<Profile>;
  updateProfile: (profileId: string, input: ProfileInput) => Promise<Profile>;
  deleteProfile: (profileId: string) => Promise<void>;
  switchProfile: (profileId: string) => Promise<SwitchResult>;
  restoreBackup: (backupId: string) => Promise<void>;
  setDirtyProfileId: (profileId: string | null) => void;
  clearImportResult: () => void;
};

export const useProfilesStore = create<ProfilesState>((set) => ({
  profiles: [],
  activeProfileId: null,
  isLoading: true,
  isSaving: false,
  dirtyProfileId: null,
  importResult: null,
  settingsSnapshot: null,
  error: null,
  async bootstrap() {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const result = await getDesktopApi().bootstrap();

      useUiStore.getState().setTheme(result.preferences.theme);

      set({
        profiles: result.profiles,
        activeProfileId: result.activeProfileId,
        importResult: result.importResult,
        settingsSnapshot: result.settingsSnapshot,
        isLoading: false,
      });

      return result;
    } catch (error) {
      const message = toErrorMessage(error);

      set({
        isLoading: false,
        error: message,
      });

      throw error;
    }
  },
  async refreshProfiles() {
    const api = getDesktopApi();
    const [profiles, activeProfileId] = await Promise.all([
      api.getProfiles(),
      api.getActiveProfileId(),
    ]);

    set({
      profiles,
      activeProfileId,
    });
  },
  async refreshSettingsSnapshot() {
    const settingsSnapshot = await getDesktopApi().readClaudeSettingsSnapshot();

    set({
      settingsSnapshot,
    });

    return settingsSnapshot;
  },
  async createProfile(input) {
    set({
      isSaving: true,
      error: null,
    });

    try {
      const profile = await getDesktopApi().createProfile(input);

      set((state) => ({
        isSaving: false,
        profiles: [...state.profiles, profile],
      }));

      return profile;
    } catch (error) {
      const message = toErrorMessage(error);

      set({
        isSaving: false,
        error: message,
      });

      throw error;
    }
  },
  async updateProfile(profileId, input) {
    set({
      isSaving: true,
      error: null,
    });

    try {
      const profile = await getDesktopApi().updateProfile(profileId, input);

      set((state) => ({
        isSaving: false,
        profiles: state.profiles.map((candidate) =>
          candidate.id === profileId ? profile : candidate,
        ),
      }));

      return profile;
    } catch (error) {
      const message = toErrorMessage(error);

      set({
        isSaving: false,
        error: message,
      });

      throw error;
    }
  },
  async deleteProfile(profileId) {
    set({
      isSaving: true,
      error: null,
    });

    try {
      const api = getDesktopApi();

      await api.deleteProfile(profileId);

      const [profiles, activeProfileId, settingsSnapshot] = await Promise.all([
        api.getProfiles(),
        api.getActiveProfileId(),
        api.readClaudeSettingsSnapshot(),
      ]);

      set((state) => ({
        profiles,
        activeProfileId,
        settingsSnapshot,
        isSaving: false,
        dirtyProfileId: state.dirtyProfileId === profileId ? null : state.dirtyProfileId,
      }));
    } catch (error) {
      const message = toErrorMessage(error);

      set({
        isSaving: false,
        error: message,
      });

      throw error;
    }
  },
  async switchProfile(profileId) {
    set({
      isSaving: true,
      error: null,
    });

    try {
      const result = await getDesktopApi().switchProfile(profileId);

      set({
        isSaving: false,
        activeProfileId: result.activeProfileId,
        settingsSnapshot: result.snapshot,
      });

      return result;
    } catch (error) {
      const message = toErrorMessage(error);

      set({
        isSaving: false,
        error: message,
      });

      throw error;
    }
  },
  async restoreBackup(backupId) {
    set({
      isSaving: true,
      error: null,
    });

    try {
      const api = getDesktopApi();

      await api.restoreBackup(backupId);

      const settingsSnapshot = await api.readClaudeSettingsSnapshot();

      set({
        isSaving: false,
        settingsSnapshot,
      });
    } catch (error) {
      const message = toErrorMessage(error);

      set({
        isSaving: false,
        error: message,
      });

      throw error;
    }
  },
  setDirtyProfileId(profileId) {
    set({
      dirtyProfileId: profileId,
    });
  },
  clearImportResult() {
    set({
      importResult: null,
    });
  },
}));

export function sortProfiles(profiles: Profile[]): Profile[] {
  return [...profiles].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}
