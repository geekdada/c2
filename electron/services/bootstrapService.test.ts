// @vitest-environment node

import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { bootstrapApp } from "./bootstrapService";
import { createAppPaths } from "./paths";

async function createTestPaths() {
  const root = await mkdtemp(path.join(os.tmpdir(), "claude-profile-manager-"));
  const home = path.join(root, "home");

  await mkdir(path.join(home, ".config", "c2-app"), { recursive: true });
  await mkdir(path.join(home, ".claude"), { recursive: true });

  return {
    root,
    paths: createAppPaths(home),
  };
}

describe("bootstrapApp", () => {
  it("imports the first profile from Claude settings when credentials exist", async () => {
    const { paths } = await createTestPaths();

    await writeFile(
      paths.claudeSettingsFile,
      JSON.stringify(
        {
          env: {
            ANTHROPIC_API_KEY: " sk-imported-key ",
            ANTHROPIC_BASE_URL: "https://api.example.com",
            CUSTOM_FLAG: "leave-me-alone",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const result = await bootstrapApp(paths);
    const persisted = JSON.parse(await readFile(paths.profilesFile, "utf8")) as {
      activeProfileId: string | null;
      profiles: Array<{ env: Record<string, string> }>;
    };

    expect(result.importResult.status).toBe("imported");
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0]?.env).toEqual({
      ANTHROPIC_API_KEY: "sk-imported-key",
      ANTHROPIC_BASE_URL: "https://api.example.com",
    });
    expect(persisted.activeProfileId).toBe(result.activeProfileId);
  });

  it("keeps onboarding empty when no credentials are present", async () => {
    const { paths } = await createTestPaths();

    await writeFile(
      paths.claudeSettingsFile,
      JSON.stringify(
        {
          env: {
            ANTHROPIC_BASE_URL: "https://api.example.com",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const result = await bootstrapApp(paths);

    expect(result.importResult.status).toBe("empty");
    expect(result.profiles).toHaveLength(0);
    expect(result.activeProfileId).toBeNull();
  });
});
