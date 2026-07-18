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
          CLAUDE_CODE_DISABLE_ATTACHMENTS: "1",
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
          CLAUDE_CODE_DISABLE_1M_CONTEXT: "1",
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
        CLAUDE_CODE_DISABLE_1M_CONTEXT: "1",
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

  it("writes auto mode when base URL and flag are both set", () => {
    const result = applyProfile(
      {},
      {
        id: "profile-1",
        name: "Work",
        env: {
          ANTHROPIC_API_KEY: "new-key",
          ANTHROPIC_BASE_URL: "https://api.example.com",
          CLAUDE_CODE_ENABLE_AUTO_MODE: "1",
          CLAUDE_CODE_ATTRIBUTION_HEADER: "0",
        },
        createdAt: "2026-04-13T00:00:00.000Z",
        updatedAt: "2026-04-13T00:00:00.000Z",
      },
    );

    expect(result).toEqual({
      env: {
        ANTHROPIC_API_KEY: "new-key",
        ANTHROPIC_BASE_URL: "https://api.example.com",
        CLAUDE_CODE_ENABLE_AUTO_MODE: "1",
        CLAUDE_CODE_ATTRIBUTION_HEADER: "0",
      },
    });
  });

  it("clears auto mode when profile has no base URL", () => {
    const result = applyProfile(
      {
        env: {
          ANTHROPIC_API_KEY: "old-key",
          ANTHROPIC_BASE_URL: "https://old.example.com",
          CLAUDE_CODE_ENABLE_AUTO_MODE: "1",
          CLAUDE_CODE_ATTRIBUTION_HEADER: "0",
        },
      },
      {
        id: "profile-1",
        name: "Work",
        env: {
          ANTHROPIC_API_KEY: "new-key",
          CLAUDE_CODE_ENABLE_AUTO_MODE: "1",
          CLAUDE_CODE_ATTRIBUTION_HEADER: "0",
        },
        createdAt: "2026-04-13T00:00:00.000Z",
        updatedAt: "2026-04-13T00:00:00.000Z",
      },
    );

    expect(result).toEqual({
      env: {
        ANTHROPIC_API_KEY: "new-key",
      },
    });
  });
});
