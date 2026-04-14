# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Claude Profile Manager — an Electron desktop app for managing multiple Anthropic API credential profiles. It reads/writes `~/.claude/settings.json`, letting users switch between different API keys, auth tokens, base URLs, and model overrides without manually editing config files.

## Commands

```bash
pnpm dev          # Start Vite dev server + Electron (hot-reload)
pnpm build        # Production build (renderer → dist/, electron → dist-electron/)
pnpm typecheck    # TypeScript strict check (tsc --noEmit)
pnpm lint         # Lint with oxlint
pnpm format       # Format with oxfmt
pnpm format:check # Check formatting without writing
pnpm test         # Run unit tests (vitest, jsdom environment)
pnpm test:e2e     # Run Playwright e2e tests (builds first, serves on port 4173)
```

Run a single test file: `pnpm vitest run path/to/file.test.ts`

Never assume `pnpm dev` is not running. It is always running.

## Architecture

### Electron ↔ Renderer Split

The app follows a strict main/renderer/preload separation with `contextIsolation: true` and `nodeIntegration: false`.

- **`electron/`** — Main process. All filesystem I/O lives here. Services are injected with `AppPaths` (derived from Electron's `userData` and `home` paths).
- **`electron/preload.ts`** — Bridges `DesktopApi` onto `window.api` via `contextBridge`. The preload imports types from `src/shared/ipc.ts`.
- **`src/`** — Renderer (React). Never touches the filesystem directly; all data flows through `DesktopApi` IPC calls.

### Shared Code (`src/shared/`)

- **`profiles.ts`** — Domain types (`Profile`, `ProfileInput`, `ManagedEnv`, `AppState`) and constants (`managedEnvKeys`, `managedSecretKeys`). Imported by both main and renderer.
- **`schema.ts`** — Zod validation schemas and helper functions (normalize, mask, diff). Used for both input validation and persistence validation.
- **`ipc.ts`** — `DesktopApi` interface, IPC channel constants, and result types (`BootstrapResult`, `SwitchResult`, `ClaudeSettingsSnapshot`).

### IPC Channel Registration

IPC handlers are registered in `electron/ipc/profiles.ts` and `electron/ipc/settings.ts`. Each calls into service modules under `electron/services/`. The handler registration pattern calls `removeHandler` before `handle` to support hot-reload.

### Renderer State

Two Zustand stores (no providers needed):
- **`profiles`** store — Profiles, active profile, bootstrap, CRUD, switch, backup restore. This is the primary data store.
- **`ui`** store — Theme, sidebar key, modal state, toast queue.

### Routing

HashRouter with a `RouteCoordinator` component that auto-redirects: no profiles → `/onboarding`, has profiles + on onboarding → `/`. Pages nest under `AppShell` layout.

### Testing

- Unit tests use vitest with jsdom. The `DesktopApi` is mockable via `window.__PROFILE_MANAGER_MOCK_API__` — see `src/testing/mockDesktopApi.ts` for the in-memory mock.
- E2e tests use Playwright against a Vite preview build (renderer only, no Electron).

### Key Data Flow: Profile Switch

1. Renderer calls `switchProfile(id)` → IPC → main process
2. Main reads current `~/.claude/settings.json`, creates a backup in `userData/backups/`
3. Applies profile's `env` keys onto settings (clears managed keys first, then sets new ones, preserves unmanaged keys)
4. Writes settings atomically (write-to-tmp + rename)
5. Updates `activeProfileId` in `userData/profiles.json`
6. Returns `SwitchResult` with new snapshot

### Styling

Tailwind CSS v4 + HeroUI component library. Dark mode by default (`<html class="dark">`). Custom CSS variables defined in `src/styles/theme.css` and `src/styles/linear.css`. Path alias `@/` maps to `src/`.

## Design

I want the app to look like Linear -- efficient and straight to the point.
