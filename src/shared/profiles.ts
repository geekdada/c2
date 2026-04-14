export const managedEnvKeys = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE",
  "CLAUDE_CODE_AUTO_COMPACT_WINDOW",
  "CLAUDE_CODE_MAX_OUTPUT_TOKENS",
] as const;

export const managedSecretKeys = ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN"] as const;

export const appStateSchemaVersion = 1 as const;

export type ManagedEnvKey = (typeof managedEnvKeys)[number];
export type ManagedSecretKey = (typeof managedSecretKeys)[number];

export type ManagedEnv = Partial<Record<ManagedEnvKey, string>>;

export type ProfileInput = {
  name: string;
  env: ManagedEnv;
};

export type Profile = ProfileInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type AppState = {
  schemaVersion: typeof appStateSchemaVersion;
  activeProfileId: string | null;
  profiles: Profile[];
};

export const advancedEnvKeys: readonly ManagedEnvKey[] = [
  "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE",
  "CLAUDE_CODE_AUTO_COMPACT_WINDOW",
  "CLAUDE_CODE_MAX_OUTPUT_TOKENS",
];

export const managedKeyLabels: Record<ManagedEnvKey, string> = {
  ANTHROPIC_API_KEY: "API key",
  ANTHROPIC_AUTH_TOKEN: "Auth token",
  ANTHROPIC_BASE_URL: "Base URL",
  ANTHROPIC_DEFAULT_HAIKU_MODEL: "Default Haiku model",
  ANTHROPIC_DEFAULT_SONNET_MODEL: "Default Sonnet model",
  ANTHROPIC_DEFAULT_OPUS_MODEL: "Default Opus model",
  CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: "Auto-compact threshold",
  CLAUDE_CODE_AUTO_COMPACT_WINDOW: "Auto-compact window",
  CLAUDE_CODE_MAX_OUTPUT_TOKENS: "Max output tokens",
};

export const managedKeyDescriptions: Partial<Record<ManagedEnvKey, string>> = {
  CLAUDE_AUTOCOMPACT_PCT_OVERRIDE:
    "Set the percentage of context capacity (1–100) at which auto-compaction triggers. By default, auto-compaction triggers at approximately 95% capacity. Use lower values like 50 to compact earlier. Values above the default threshold have no effect. Applies to both main conversations and subagents.",
  CLAUDE_CODE_AUTO_COMPACT_WINDOW:
    "Set the context capacity in tokens used for auto-compaction calculations. Defaults to the model's context window: 200K for standard models or 1M for extended context models. Use a lower value like 500000 on a 1M model to treat the window as 500K for compaction purposes. The value is capped at the model's actual context window. `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` is applied as a percentage of this value. Setting this variable decouples the compaction threshold from the status line's used_percentage, which always uses the model's full context window.",
  CLAUDE_CODE_MAX_OUTPUT_TOKENS:
    "Set the maximum number of output tokens for most requests. Defaults and caps vary by model. Increasing this value reduces the effective context window available before auto-compaction triggers.",
};
