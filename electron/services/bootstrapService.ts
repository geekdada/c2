import type { BootstrapResult, ImportResult } from "../../src/shared/ipc";
import type { Profile } from "../../src/shared/profiles";
import { hasCredential, sanitizeManagedEnvForImport } from "../../src/shared/schema";
import {
  extractManagedEnv,
  parseClaudeSettings,
  readClaudeSettingsSnapshot,
  readClaudeSettingsSource,
} from "./claudeSettingsService";
import type { AppPaths } from "./paths";
import { readPreferences } from "./preferencesService";
import { createEmptyAppState, readAppState, writeAppState } from "./profileService";

function createImportedProfile(env: Profile["env"]): Profile {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: "Imported profile",
    env,
    createdAt: now,
    updatedAt: now,
  };
}

export async function bootstrapApp(paths: AppPaths): Promise<BootstrapResult> {
  const existingState = await readAppState(paths);
  const preferences = await readPreferences(paths);

  if (existingState.profiles.length > 0) {
    return {
      profiles: existingState.profiles,
      activeProfileId: existingState.activeProfileId,
      importResult: {
        status: "existing",
      },
      settingsSnapshot: await readClaudeSettingsSnapshot(paths),
      preferences,
    };
  }

  const source = await readClaudeSettingsSource(paths);
  let importResult: ImportResult = {
    status: "empty",
  };
  let nextState = createEmptyAppState();

  if (source.exists && source.contents !== null) {
    try {
      const parsed = parseClaudeSettings(source.contents, paths.claudeSettingsFile);
      const importedEnv = sanitizeManagedEnvForImport(extractManagedEnv(parsed));

      if (hasCredential(importedEnv)) {
        const importedProfile = createImportedProfile(importedEnv);

        nextState = {
          schemaVersion: existingState.schemaVersion,
          activeProfileId: importedProfile.id,
          profiles: [importedProfile],
        };

        await writeAppState(paths, nextState);

        importResult = {
          status: "imported",
          profileId: importedProfile.id,
        };
      }
    } catch {
      importResult = {
        status: "empty",
      };
    }
  }

  return {
    profiles: nextState.profiles,
    activeProfileId: nextState.activeProfileId,
    importResult,
    settingsSnapshot: await readClaudeSettingsSnapshot(paths),
    preferences,
  };
}
