import { readFile } from "node:fs/promises";

import type { ClaudeSettingsSnapshot, SwitchResult } from "../../src/shared/ipc";
import {
  managedEnvKeys,
  type ManagedEnv,
  type ManagedEnvKey,
  type Profile,
} from "../../src/shared/profiles";
import { normalizeManagedEnv } from "../../src/shared/schema";
import { createBackup, listBackups } from "./backupService";
import { writeJsonAtomic } from "./fileUtils";
import type { AppPaths } from "./paths";
import { setActiveProfileId } from "./profileService";
import { validateStoredProfile } from "./validationService";

export type ClaudeSettingsData = Record<string, unknown>;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function extractManagedEnv(settings: ClaudeSettingsData): ManagedEnv {
  const env = isRecord(settings.env) ? settings.env : null;

  if (!env) {
    return {};
  }

  return normalizeManagedEnv(
    Object.fromEntries(
      managedEnvKeys.flatMap((key) => {
        const value = env[key];

        return typeof value === "string" ? ([[key, value]] as const) : [];
      }),
    ) as Partial<Record<ManagedEnvKey, string>>,
  );
}

export function applyProfile(
  existingSettings: ClaudeSettingsData,
  profile: Profile,
): ClaudeSettingsData {
  const validatedProfile = validateStoredProfile(profile);
  const nextSettings = structuredClone(existingSettings);

  delete nextSettings.model;

  const nextEnv = isRecord(nextSettings.env) ? { ...nextSettings.env } : {};

  for (const key of managedEnvKeys) {
    delete nextEnv[key];
  }

  for (const key of managedEnvKeys) {
    const value = validatedProfile.env[key]?.trim();

    if (value) {
      nextEnv[key] = value;
    }
  }

  if (Object.keys(nextEnv).length > 0) {
    nextSettings.env = nextEnv;
  } else {
    delete nextSettings.env;
  }

  return nextSettings;
}

export async function readClaudeSettingsSource(paths: AppPaths): Promise<{
  exists: boolean;
  contents: string | null;
}> {
  try {
    return {
      exists: true,
      contents: await readFile(paths.claudeSettingsFile, "utf8"),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        exists: false,
        contents: null,
      };
    }

    throw new Error("Failed to read Claude settings.");
  }
}

export function parseClaudeSettings(contents: string, filePath: string): ClaudeSettingsData {
  try {
    const parsed = JSON.parse(contents) as unknown;

    if (!isRecord(parsed)) {
      throw new Error("Settings root must be an object.");
    }

    return parsed;
  } catch {
    throw new Error(`Invalid JSON in Claude settings at ${filePath}.`);
  }
}

export async function readClaudeSettingsSnapshot(paths: AppPaths): Promise<ClaudeSettingsSnapshot> {
  const source = await readClaudeSettingsSource(paths);
  const backups = await listBackups(paths);

  if (!source.exists || source.contents === null) {
    return {
      path: paths.claudeSettingsFile,
      exists: false,
      managedEnv: {},
      unmanagedKeys: [],
      hasModelOverride: false,
      backups,
      error: null,
    };
  }

  try {
    const parsed = parseClaudeSettings(source.contents, paths.claudeSettingsFile);
    const unmanagedKeys = isRecord(parsed.env)
      ? Object.keys(parsed.env).filter((key) => !managedEnvKeys.includes(key as ManagedEnvKey))
      : [];

    return {
      path: paths.claudeSettingsFile,
      exists: true,
      managedEnv: extractManagedEnv(parsed),
      unmanagedKeys,
      hasModelOverride: typeof parsed.model === "string",
      backups,
      error: null,
    };
  } catch (error) {
    return {
      path: paths.claudeSettingsFile,
      exists: true,
      managedEnv: {},
      unmanagedKeys: [],
      hasModelOverride: false,
      backups,
      error: error instanceof Error ? error.message : "Unknown settings error.",
    };
  }
}

export async function writeClaudeSettings(
  paths: AppPaths,
  settings: ClaudeSettingsData,
): Promise<void> {
  await writeJsonAtomic(paths.claudeSettingsFile, settings);
}

export async function switchProfileInClaudeSettings(
  paths: AppPaths,
  profile: Profile,
): Promise<SwitchResult> {
  const validatedProfile = validateStoredProfile(profile);
  const source = await readClaudeSettingsSource(paths);
  const existingSettings =
    source.exists && source.contents !== null
      ? parseClaudeSettings(source.contents, paths.claudeSettingsFile)
      : {};

  const backup =
    source.exists && source.contents !== null ? await createBackup(paths, source.contents) : null;
  const nextSettings = applyProfile(existingSettings, validatedProfile);

  await writeClaudeSettings(paths, nextSettings);
  await setActiveProfileId(paths, validatedProfile.id);

  return {
    activeProfileId: validatedProfile.id,
    backupId: backup?.id ?? null,
    snapshot: await readClaudeSettingsSnapshot(paths),
  };
}
