// @vitest-environment node

import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { switchProfileInClaudeSettings } from "./claudeSettingsService";
import { createAppPaths } from "./paths";
import { writeAppState } from "./profileService";

async function createTestPaths() {
  const root = await mkdtemp(path.join(os.tmpdir(), "claude-profile-manager-"));
  const home = path.join(root, "home");

  await mkdir(path.join(home, ".config", "c2-app"), { recursive: true });
  await mkdir(path.join(home, ".claude"), { recursive: true });

  return createAppPaths(home);
}

describe("switchProfileInClaudeSettings", () => {
  it("deletes stale managed keys, preserves unmanaged keys, and creates a backup", async () => {
    const paths = await createTestPaths();
    const profile = {
      id: "profile-2",
      name: "Token profile",
      env: {
        ANTHROPIC_AUTH_TOKEN: "auth-next",
      },
      createdAt: "2026-04-13T00:00:00.000Z",
      updatedAt: "2026-04-13T00:00:00.000Z",
    };

    await writeAppState(paths, {
      schemaVersion: 1,
      activeProfileId: "profile-1",
      profiles: [
        {
          id: "profile-1",
          name: "API profile",
          env: {
            ANTHROPIC_API_KEY: "key-current",
            ANTHROPIC_BASE_URL: "https://old.example.com",
          },
          createdAt: "2026-04-13T00:00:00.000Z",
          updatedAt: "2026-04-13T00:00:00.000Z",
        },
        profile,
      ],
    });

    await writeFile(
      paths.claudeSettingsFile,
      JSON.stringify(
        {
          env: {
            ANTHROPIC_API_KEY: "key-current",
            ANTHROPIC_BASE_URL: "https://old.example.com",
            CUSTOM_FLAG: "keep-me",
          },
          permissions: {
            allow: ["Read", "Write"],
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const result = await switchProfileInClaudeSettings(paths, profile);
    const persisted = JSON.parse(await readFile(paths.claudeSettingsFile, "utf8")) as {
      env: Record<string, string>;
      permissions: Record<string, string[]>;
    };

    expect(persisted).toEqual({
      env: {
        CUSTOM_FLAG: "keep-me",
        ANTHROPIC_AUTH_TOKEN: "auth-next",
      },
      permissions: {
        allow: ["Read", "Write"],
      },
    });
    expect(result.activeProfileId).toBe(profile.id);
    expect(result.snapshot.backups).toHaveLength(1);
    expect(result.snapshot.managedEnv).toEqual({
      ANTHROPIC_AUTH_TOKEN: "auth-next",
    });
  });
});
