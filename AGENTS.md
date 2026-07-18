# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

C2 — an Electron desktop app for managing multiple Claude Code configuration profiles. It reads/writes `~/.claude/settings.json`, letting users switch between different API keys, auth tokens, base URLs, model overrides, and advanced Claude Code settings without manually editing config files.

## Commands

```bash
pnpm dev          # Start Electron via Forge + Vite (hot-reload)
pnpm build        # Package the app (electron-forge package)
pnpm make         # Build distributable installers (dmg, zip, squirrel, deb)
pnpm typecheck    # TypeScript strict check (tsc --noEmit)
pnpm lint         # Lint with oxlint
pnpm format       # Format with oxfmt
pnpm format:check # Check formatting without writing
pnpm test         # Run unit tests (vitest, jsdom environment)
pnpm test:e2e     # Run Playwright e2e tests (builds + serves on port 4177)
pnpm release      # Bump version via bumpp (runs changelog generation)
```

Run a single test file: `pnpm vitest run path/to/file.test.ts`

Never assume `pnpm dev` is not running. It is always running.

## Architecture

### Electron ↔ Renderer Split

The app follows a strict main/renderer/preload separation with `contextIsolation: true` and `nodeIntegration: false`. Built with Electron Forge + Vite plugin.

- **`electron/`** — Main process. All filesystem I/O lives here. Services receive `AppPaths` (derived from `~/.config/c2-app/` and `~/.claude/`).
- **`electron/preload.ts`** — Bridges `DesktopApi` onto `window.api` via `contextBridge`. Imports types from `src/shared/ipc.ts`.
- **`src/`** — Renderer (React 19). Never touches the filesystem directly; all data flows through `DesktopApi` IPC calls.

### Data Paths

App state lives under `~/.config/c2-app/`, not Electron's default `userData`:

- `~/.config/c2-app/profiles.json` — Profile definitions and active profile ID
- `~/.config/c2-app/preferences.json` — User preferences (theme)
- `~/.config/c2-app/backups/` — Settings backups before profile switches
- `~/.claude/settings.json` — The Claude Code settings file that profiles write to

### Shared Code (`src/shared/`)

- **`profiles.ts`** — Domain types (`Profile`, `ProfileInput`, `ManagedEnv`, `AppState`), constants (`managedEnvKeys`, `managedSecretKeys`), key labels/descriptions, and advanced env key grouping. Imported by both main and renderer.
- **`schema.ts`** — Zod validation schemas and helper functions (normalize, mask, diff, import sanitization).
- **`ipc.ts`** — `DesktopApi` interface, IPC channel constants, and result types (`BootstrapResult`, `SwitchResult`, `ClaudeSettingsSnapshot`, `UpdateStatus`).
- **`preferences.ts`** — `ThemeMode` and `Preferences` types.

### Managed Environment Keys

Profiles manage these Claude Code env vars in `settings.json`:

- **Credentials**: `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`
- **Endpoint**: `ANTHROPIC_BASE_URL`
- **Model overrides**: `ANTHROPIC_DEFAULT_HAIKU_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_FABLE_MODEL`, `CLAUDE_CODE_SUBAGENT_MODEL`
- **Advanced**: `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW`, `CLAUDE_CODE_MAX_OUTPUT_TOKENS`, `CLAUDE_CODE_DISABLE_1M_CONTEXT`, `CLAUDE_CODE_DISABLE_ATTACHMENTS`, `CLAUDE_CODE_ENABLE_AUTO_MODE`, `CLAUDE_CODE_ATTRIBUTION_HEADER`

### IPC Channels

IPC handlers are organized across four modules in `electron/ipc/`:

| Module           | Channels                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles.ts`    | `profiles:bootstrap`, `profiles:getProfiles`, `profiles:getActiveProfileId`, `profiles:create`, `profiles:update`, `profiles:delete`, `profiles:switch` |
| `settings.ts`    | `settings:readSnapshot`, `settings:restoreBackup`                                                                                                       |
| `preferences.ts` | `preferences:get`, `preferences:save`                                                                                                                   |
| `updater.ts`     | `updater:checkForUpdate`, `updater:openReleasePage`, `updater:status`                                                                                   |

Each handler calls into service modules under `electron/services/`. The registration pattern calls `removeHandler` before `handle` to support hot-reload.

### Main Process Services (`electron/services/`)

- **`profileService.ts`** — CRUD operations on profiles, app state persistence
- **`claudeSettingsService.ts`** — Reads/writes `~/.claude/settings.json`, extracts managed env, preserves unmanaged keys, clears top-level `model` on profile apply
- **`backupService.ts`** — Creates backups before profile switches, keeps up to 5, lists and restores backups
- **`bootstrapService.ts`** — Loads profiles, active profile, settings snapshot, and preferences on app start
- **`preferencesService.ts`** — Reads/writes `preferences.json` (theme)
- **`updaterService.ts`** — Polls GitHub releases for updates, sends status events to renderer, opens release page
- **`validationService.ts`** — Wraps shared schema validation for incoming and stored profiles
- **`fileUtils.ts`** — Atomic writes (write-to-tmp + rename), directory creation helpers
- **`paths.ts`** — `AppPaths` type and `createAppPaths(homeDir)` factory

### Renderer State

Three Zustand stores (no providers needed):

- **`profiles`** store (`src/app/store/profiles.ts`) — Profiles, active profile, settings snapshot, CRUD, switch, backup restore, dirty tracking.
- **`ui`** store (`src/app/store/ui.ts`) — Theme, sidebar key, onboarding state, modal state (switch/delete).
- **`updater`** store (`src/app/store/updater.ts`) — Update check status (`idle`/`checking`/`available`/`not-available`/`error`), check and open actions.

### Routing

HashRouter with a `RouteCoordinator` component that auto-redirects: no profiles → `/onboarding`, has profiles + on onboarding → `/`.

Routes under `AppShell` layout:

- `/` — `HomePage` (profile list and status)
- `/profiles/new` — `ProfileEditorPage` (create)
- `/profiles/:id` — `ProfileEditorPage` (edit)
- `/settings` — `AppSettingsPage`
- `/onboarding` — `OnboardingPage` (outside layout)
- `*` — redirects to `/`

### Key Features (`src/features/`)

- **`profile-form/`** — `ProfileForm` component (TanStack React Form + Zod)
- **`profile-list/`** — `ProfileList`, `DeleteProfileModal`
- **`profile-switch/`** — `SwitchProfileModal`

### Testing

- **Unit tests**: Vitest with jsdom (configured in `vite.config.ts`). The `DesktopApi` is mockable via `window.__PROFILE_MANAGER_MOCK_API__` — see `src/testing/mockDesktopApi.ts`. Tests exist for services, IPC handlers, schemas, and the app component.
- **E2e tests**: Playwright against a Vite preview build (renderer only, no Electron). Config in `playwright.config.ts`, tests in `e2e/`.

### Key Data Flow: Profile Switch

1. Renderer calls `switchProfile(id)` → IPC → main process
2. Main reads current `~/.claude/settings.json`, creates a backup in `~/.config/c2-app/backups/`
3. Clears all managed env keys from settings, then applies profile's `env` values; preserves unmanaged keys
4. Clears top-level `model` field if present
5. Writes settings atomically (write-to-tmp + rename)
6. Updates `activeProfileId` in `~/.config/c2-app/profiles.json`
7. Returns `SwitchResult` with new snapshot and backup ID

### CI/CD

GitHub Actions workflows in `.github/workflows/`:

- **`ci.yml`** — Runs on push to `master` and PRs: typecheck, lint, format check, unit tests, e2e tests (with Playwright report upload on failure).
- **`release.yml`** — Runs on GitHub release published. Build matrix: macOS arm64, macOS universal, Windows x64, Linux x64. Uses `electron-forge make` and uploads artifacts to the release.

### Styling

Tailwind CSS v4 + HeroUI v3 component library. Dark mode by default (`<html class="dark">`). Custom CSS variables in `src/styles/theme.css` and `src/styles/linear.css`. Path alias `@/` maps to `src/`.

## Design

I want the app to look like Linear — efficient and straight to the point.
