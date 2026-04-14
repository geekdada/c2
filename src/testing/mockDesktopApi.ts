import type { BackupEntry, ClaudeSettingsSnapshot, DesktopApi, SwitchResult } from "@/shared/ipc";
import type { Preferences } from "@/shared/preferences";
import type { ManagedEnv, Profile, ProfileInput } from "@/shared/profiles";
import { normalizeManagedEnv, normalizeProfileInput } from "@/shared/schema";

type MockOptions = {
  profiles?: Profile[];
  activeProfileId?: string | null;
  managedEnv?: ManagedEnv;
  unmanagedKeys?: string[];
  path?: string;
  preferences?: Preferences;
};

type MockBackup = BackupEntry & {
  managedEnv: ManagedEnv;
};

export function createMockDesktopApi(options: MockOptions = {}): DesktopApi {
  let profiles = structuredClone(options.profiles ?? []);
  let activeProfileId = options.activeProfileId ?? null;
  let managedEnv = normalizeManagedEnv(options.managedEnv ?? {});
  let backups: MockBackup[] = [];
  let preferences: Preferences = options.preferences ?? { theme: "dark" };
  const path = options.path ?? "/Users/test/.claude/settings.json";
  const unmanagedKeys = options.unmanagedKeys ?? ["permissions", "hooks"];

  const createSnapshot = (): ClaudeSettingsSnapshot => ({
    path,
    exists: profiles.length > 0 || Object.keys(managedEnv).length > 0,
    managedEnv: structuredClone(managedEnv),
    unmanagedKeys,
    hasModelOverride: false,
    backups: backups.map(({ id, createdAt }) => ({
      id,
      createdAt,
    })),
    error: null,
  });

  return {
    async bootstrap() {
      return {
        profiles: structuredClone(profiles),
        activeProfileId,
        settingsSnapshot: createSnapshot(),
        preferences: structuredClone(preferences),
      };
    },
    async getProfiles() {
      return structuredClone(profiles);
    },
    async getActiveProfileId() {
      return activeProfileId;
    },
    async createProfile(input: ProfileInput) {
      const normalized = normalizeProfileInput(input);
      const now = new Date().toISOString();
      const profile: Profile = {
        id: crypto.randomUUID(),
        name: normalized.name,
        env: normalized.env,
        createdAt: now,
        updatedAt: now,
      };

      profiles = [...profiles, profile];

      return structuredClone(profile);
    },
    async updateProfile(profileId: string, input: ProfileInput) {
      const existing = profiles.find((profile) => profile.id === profileId);

      if (!existing) {
        throw new Error("Profile not found.");
      }

      const normalized = normalizeProfileInput(input);

      const updatedProfile: Profile = {
        ...existing,
        name: normalized.name,
        env: normalized.env,
        updatedAt: new Date().toISOString(),
      };

      profiles = profiles.map((profile) => (profile.id === profileId ? updatedProfile : profile));

      if (activeProfileId === profileId) {
        managedEnv = normalizeManagedEnv(updatedProfile.env);
      }

      return structuredClone(updatedProfile);
    },
    async deleteProfile(profileId: string) {
      profiles = profiles.filter((profile) => profile.id !== profileId);

      if (activeProfileId === profileId) {
        activeProfileId = profiles[0]?.id ?? null;
        managedEnv = profiles.find((profile) => profile.id === activeProfileId)?.env ?? {};
      }
    },
    async switchProfile(profileId: string) {
      const target = profiles.find((profile) => profile.id === profileId);

      if (!target) {
        throw new Error("Profile not found.");
      }

      if (Object.keys(managedEnv).length > 0) {
        backups = [
          {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            managedEnv: structuredClone(managedEnv),
          },
          ...backups,
        ];
      }

      activeProfileId = profileId;
      managedEnv = normalizeManagedEnv(target.env);

      const result: SwitchResult = {
        activeProfileId: profileId,
        backupId: backups[0]?.id ?? null,
        snapshot: createSnapshot(),
      };

      return structuredClone(result);
    },
    async readClaudeSettingsSnapshot() {
      return createSnapshot();
    },
    async restoreBackup(backupId: string) {
      const backup = backups.find((candidate) => candidate.id === backupId);

      if (!backup) {
        throw new Error("Backup not found.");
      }

      managedEnv = structuredClone(backup.managedEnv);
    },
    async getPreferences() {
      return structuredClone(preferences);
    },
    async savePreferences(prefs: Preferences) {
      preferences = prefs;
    },
  };
}
