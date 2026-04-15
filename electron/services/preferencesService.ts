import { readFile } from "node:fs/promises";

import type { Preferences } from "../../src/shared/preferences";
import { writeJsonAtomic } from "./fileUtils";
import type { AppPaths } from "./paths";

const defaultPreferences: Preferences = { theme: "system" };

export async function readPreferences(paths: AppPaths): Promise<Preferences> {
  try {
    const raw = await readFile(paths.preferencesFile, "utf8");
    const parsed = JSON.parse(raw) as Preferences;

    if (!["dark", "light", "system"].includes(parsed.theme)) {
      return defaultPreferences;
    }

    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return defaultPreferences;
    }

    return defaultPreferences;
  }
}

export async function writePreferences(paths: AppPaths, prefs: Preferences): Promise<void> {
  await writeJsonAtomic(paths.preferencesFile, prefs);
}
