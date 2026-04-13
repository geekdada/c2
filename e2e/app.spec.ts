import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    type ManagedEnv = Record<string, string>;
    type Profile = {
      id: string;
      name: string;
      env: ManagedEnv;
      createdAt: string;
      updatedAt: string;
    };

    const profiles: Profile[] = [];
    let activeProfileId: string | null = null;
    let managedEnv: ManagedEnv = {};
    const backups: Array<{ id: string; createdAt: string; env: ManagedEnv }> = [];

    const buildSnapshot = () => ({
      path: "/Users/test/.claude/settings.json",
      exists: profiles.length > 0 || Object.keys(managedEnv).length > 0,
      managedEnv: { ...managedEnv },
      unmanagedKeys: ["permissions"],
      backups: backups.map(({ id, createdAt }) => ({ id, createdAt })),
      error: null,
    });

    window.__PROFILE_MANAGER_MOCK_API__ = {
      async bootstrap() {
        return {
          profiles: [...profiles],
          activeProfileId,
          importResult: { status: "empty" },
          settingsSnapshot: buildSnapshot(),
        };
      },
      async getProfiles() {
        return [...profiles];
      },
      async getActiveProfileId() {
        return activeProfileId;
      },
      async createProfile(input) {
        const now = new Date().toISOString();
        const profile = {
          id: crypto.randomUUID(),
          name: input.name.trim(),
          env: Object.fromEntries(Object.entries(input.env).filter(([, value]) => value?.trim())),
          createdAt: now,
          updatedAt: now,
        };

        profiles.push(profile);

        return { ...profile };
      },
      async updateProfile(id, input) {
        const index = profiles.findIndex((profile) => profile.id === id);
        const existing = profiles[index];

        if (index < 0 || !existing) {
          throw new Error("Profile not found.");
        }

        const updated = {
          ...existing,
          name: input.name.trim(),
          env: Object.fromEntries(Object.entries(input.env).filter(([, value]) => value?.trim())),
          updatedAt: new Date().toISOString(),
        };

        profiles[index] = updated;

        return { ...updated };
      },
      async deleteProfile(id) {
        const index = profiles.findIndex((profile) => profile.id === id);

        if (index >= 0) {
          profiles.splice(index, 1);
        }

        if (activeProfileId === id) {
          activeProfileId = profiles[0]?.id ?? null;
          managedEnv = profiles.find((profile) => profile.id === activeProfileId)?.env ?? {};
        }
      },
      async switchProfile(id) {
        const target = profiles.find((profile) => profile.id === id);

        if (!target) {
          throw new Error("Profile not found.");
        }

        if (Object.keys(managedEnv).length > 0) {
          backups.unshift({
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            env: { ...managedEnv },
          });
        }

        activeProfileId = id;
        managedEnv = { ...target.env };

        return {
          activeProfileId,
          backupId: backups[0]?.id ?? null,
          snapshot: buildSnapshot(),
        };
      },
      async readClaudeSettingsSnapshot() {
        return buildSnapshot();
      },
      async restoreBackup(backupId) {
        const backup = backups.find((candidate) => candidate.id === backupId);

        if (!backup) {
          throw new Error("Backup not found.");
        }

        managedEnv = { ...backup.env };
      },
    };
  });
});

test("shows onboarding in browser preview with a mock desktop bridge", async ({ page }) => {
  await page.goto("/#/");

  await expect(page.getByRole("heading", { name: "Create your first C2 profile" })).toBeVisible();
});
