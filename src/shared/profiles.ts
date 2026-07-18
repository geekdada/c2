export const managedEnvKeys = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_DEFAULT_FABLE_MODEL",
  "CLAUDE_CODE_SUBAGENT_MODEL",
  "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE",
  "CLAUDE_CODE_AUTO_COMPACT_WINDOW",
  "CLAUDE_CODE_MAX_OUTPUT_TOKENS",
  "CLAUDE_CODE_DISABLE_1M_CONTEXT",
  "CLAUDE_CODE_DISABLE_ATTACHMENTS",
  "CLAUDE_CODE_ENABLE_AUTO_MODE",
  "CLAUDE_CODE_ATTRIBUTION_HEADER",
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
  "CLAUDE_CODE_DISABLE_1M_CONTEXT",
  "CLAUDE_CODE_DISABLE_ATTACHMENTS",
  "CLAUDE_CODE_ENABLE_AUTO_MODE",
  "CLAUDE_CODE_ATTRIBUTION_HEADER",
];

export const managedKeyLabels: Record<ManagedEnvKey, string> = {
  ANTHROPIC_API_KEY: "API key",
  ANTHROPIC_AUTH_TOKEN: "Auth token",
  ANTHROPIC_BASE_URL: "Base URL",
  ANTHROPIC_DEFAULT_HAIKU_MODEL: "Default Haiku model",
  ANTHROPIC_DEFAULT_SONNET_MODEL: "Default Sonnet model",
  ANTHROPIC_DEFAULT_OPUS_MODEL: "Default Opus model",
  ANTHROPIC_DEFAULT_FABLE_MODEL: "Default Fable model",
  CLAUDE_CODE_SUBAGENT_MODEL: "Subagent model",
  CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: "Auto-compact threshold",
  CLAUDE_CODE_AUTO_COMPACT_WINDOW: "Auto-compact window",
  CLAUDE_CODE_MAX_OUTPUT_TOKENS: "Max output tokens",
  CLAUDE_CODE_DISABLE_1M_CONTEXT: "Disable 1M context",
  CLAUDE_CODE_DISABLE_ATTACHMENTS: "Disable attachments",
  CLAUDE_CODE_ENABLE_AUTO_MODE: "Enable auto mode",
  CLAUDE_CODE_ATTRIBUTION_HEADER: "Attribution header",
};

export const managedKeyDescriptions: Partial<Record<ManagedEnvKey, string>> = {
  CLAUDE_AUTOCOMPACT_PCT_OVERRIDE:
    "Set the percentage of context capacity (1–100) at which auto-compaction triggers. By default, auto-compaction triggers at approximately 95% capacity. Use lower values like 50 to compact earlier. Values above the default threshold have no effect. Applies to both main conversations and subagents.",
  CLAUDE_CODE_AUTO_COMPACT_WINDOW:
    "Set the context capacity in tokens used for auto-compaction calculations. Defaults to the model's context window: 200K for standard models or 1M for extended context models. Use a lower value like 500000 on a 1M model to treat the window as 500K for compaction purposes. The value is capped at the model's actual context window. `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` is applied as a percentage of this value. Setting this variable decouples the compaction threshold from the status line's used_percentage, which always uses the model's full context window.",
  CLAUDE_CODE_MAX_OUTPUT_TOKENS:
    "Set the maximum number of output tokens for most requests. Defaults and caps vary by model. Increasing this value reduces the effective context window available before auto-compaction triggers.",
  CLAUDE_CODE_DISABLE_1M_CONTEXT:
    "Set to `1` to disable 1M context window support. Leave unset to keep 1M context enabled when Claude Code supports it.",
  CLAUDE_CODE_DISABLE_ATTACHMENTS:
    "Set to `1` to disable attachment processing so `@` file mentions are sent as plain text. Leave unset to keep attachment processing enabled.",
  CLAUDE_CODE_ENABLE_AUTO_MODE:
    "Claude executes all actions with background safety checks that verify alignment with your request. Reduces permission prompts while maintaining oversight. Only available when Base URL is set.",
  CLAUDE_CODE_ATTRIBUTION_HEADER:
    "Set to `0` to omit the attribution block (client version and prompt fingerprint) from the start of the system prompt. Disabling it improves prompt-cache hit rates when routing through an LLM gateway. Caching on a direct connection to the Anthropic API is unaffected either way",
};
