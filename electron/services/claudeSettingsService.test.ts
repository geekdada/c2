// @vitest-environment node

import { describe, expect, it } from "vitest";

import { applyProfile } from "./claudeSettingsService";

describe("applyProfile", () => {
  it("replaces only managed keys and preserves unmanaged settings", () => {
    const result = applyProfile(
      {
        env: {
          ANTHROPIC_API_KEY: "old-key",
          ANTHROPIC_BASE_URL: "https://old.example.com",
          CUSTOM_FLAG: "preserve-me",
        },
        permissions: {
          allow: ["Read"],
        },
      },
      {
        id: "profile-1",
        name: "Work",
        env: {
          ANTHROPIC_AUTH_TOKEN: "auth-token",
          ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-sonnet-4-20250514",
        },
        createdAt: "2026-04-13T00:00:00.000Z",
        updatedAt: "2026-04-13T00:00:00.000Z",
      },
    );

    expect(result).toEqual({
      env: {
        CUSTOM_FLAG: "preserve-me",
        ANTHROPIC_AUTH_TOKEN: "auth-token",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-sonnet-4-20250514",
      },
      permissions: {
        allow: ["Read"],
      },
    });
  });

  it("removes the top-level model override", () => {
    const result = applyProfile(
      {
        model: "claude-sonnet-4-5-20250514",
        env: {
          ANTHROPIC_API_KEY: "old-key",
        },
      },
      {
        id: "profile-1",
        name: "Work",
        env: {
          ANTHROPIC_API_KEY: "new-key",
        },
        createdAt: "2026-04-13T00:00:00.000Z",
        updatedAt: "2026-04-13T00:00:00.000Z",
      },
    );

    expect(result.model).toBeUndefined();
    expect(result).toEqual({
      env: {
        ANTHROPIC_API_KEY: "new-key",
      },
    });
  });
});
