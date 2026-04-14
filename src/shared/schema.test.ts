import { describe, expect, it } from "vitest";

import { diffManagedEnv, normalizeManagedEnv, validateProfileInput } from "./schema";

describe("schema helpers", () => {
  it("trims and removes empty managed env values", () => {
    expect(
      normalizeManagedEnv({
        ANTHROPIC_API_KEY: "  key-123  ",
        ANTHROPIC_AUTH_TOKEN: "   ",
        ANTHROPIC_BASE_URL: "\nhttps://example.com  ",
      }),
    ).toEqual({
      ANTHROPIC_API_KEY: "key-123",
      ANTHROPIC_BASE_URL: "https://example.com",
    });
  });

  it("requires one credential when validating a profile", () => {
    expect(() =>
      validateProfileInput({
        name: "Empty",
        env: {},
      }),
    ).toThrowError(/API key or auth token/i);
  });

  it("trims advanced env keys in normalizeManagedEnv", () => {
    expect(
      normalizeManagedEnv({
        ANTHROPIC_API_KEY: "key-123",
        CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: "  50  ",
        CLAUDE_CODE_AUTO_COMPACT_WINDOW: " 500000 ",
        CLAUDE_CODE_MAX_OUTPUT_TOKENS: "  ",
      }),
    ).toEqual({
      ANTHROPIC_API_KEY: "key-123",
      CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: "50",
      CLAUDE_CODE_AUTO_COMPACT_WINDOW: "500000",
    });
  });

  it("accepts valid numeric strings for advanced keys", () => {
    expect(() =>
      validateProfileInput({
        name: "With advanced",
        env: {
          ANTHROPIC_API_KEY: "sk-test-123",
          CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: "50",
          CLAUDE_CODE_AUTO_COMPACT_WINDOW: "500000",
          CLAUDE_CODE_MAX_OUTPUT_TOKENS: "16384",
        },
      }),
    ).not.toThrow();
  });

  it("rejects non-integer value for auto-compact threshold", () => {
    expect(() =>
      validateProfileInput({
        name: "Bad pct",
        env: {
          ANTHROPIC_API_KEY: "sk-test-123",
          CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: "abc",
        },
      }),
    ).toThrowError(/integer between 1 and 100/i);
  });

  it("rejects out-of-range value for auto-compact threshold", () => {
    expect(() =>
      validateProfileInput({
        name: "Bad pct",
        env: {
          ANTHROPIC_API_KEY: "sk-test-123",
          CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: "101",
        },
      }),
    ).toThrowError(/integer between 1 and 100/i);
  });

  it("rejects non-positive value for max output tokens", () => {
    expect(() =>
      validateProfileInput({
        name: "Bad tokens",
        env: {
          ANTHROPIC_API_KEY: "sk-test-123",
          CLAUDE_CODE_MAX_OUTPUT_TOKENS: "0",
        },
      }),
    ).toThrowError(/positive integer/i);
  });

  it("detects added, updated, and removed managed env keys", () => {
    expect(
      diffManagedEnv(
        {
          ANTHROPIC_API_KEY: "old",
          ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-old",
        },
        {
          ANTHROPIC_AUTH_TOKEN: "new-token",
          ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-next",
        },
      ),
    ).toEqual({
      added: ["ANTHROPIC_AUTH_TOKEN"],
      removed: ["ANTHROPIC_API_KEY"],
      updated: ["ANTHROPIC_DEFAULT_SONNET_MODEL"],
    });
  });
});
