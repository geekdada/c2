# C2

> Desktop app for managing multiple Claude Code configuration profiles.

[English](./README.md) · [简体中文](./README.zh-CN.md)

C2 is an Electron app that lets you switch between multiple Claude Code configurations — API keys, auth tokens, base URLs, model overrides, and advanced settings — without manually editing `~/.claude/settings.json`.

## Features

![](./assets/screenshot-1.png)

- **Fully local, no fuss** — Runs entirely on your machine, no network required, no background process.
- **Multiple profiles** — Store unlimited credential profiles.
- **One-click switching** — Safely rewrite `~/.claude/settings.json` with automatic backups (last 5 kept).
- **Managed env keys** — `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, model overrides (Haiku / Sonnet / Opus), and advanced Claude Code flags.
- **Preserves unmanaged settings** — Any keys C2 doesn't manage are left untouched, so you can still edit them manually.
- **Backup & restore** — Restore any of the last 5 settings snapshots in one click.

## Managed Settings

C2 writes these env keys in `~/.claude/settings.json`:

| Category    | Keys                                                                                                                                                                       |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credentials | `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`                                                                                                                                |
| Endpoint    | `ANTHROPIC_BASE_URL`                                                                                                                                                       |
| Model       | `ANTHROPIC_DEFAULT_HAIKU_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`, `ANTHROPIC_DEFAULT_OPUS_MODEL`                                                                          |
| Advanced    | `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`, `CLAUDE_CODE_AUTO_COMPACT_WINDOW`, `CLAUDE_CODE_MAX_OUTPUT_TOKENS`, `CLAUDE_CODE_DISABLE_1M_CONTEXT`, `CLAUDE_CODE_DISABLE_ATTACHMENTS` |

## Install

Download the latest installer for your platform from the [Releases page](https://github.com/royli/c2/releases):

- **macOS** — `.dmg` (arm64 or universal) or `.zip`
- **Windows** — Squirrel installer (`.exe`)
- **Linux** — `.deb`

Or use Homebrew:

```bash
brew install geekdada/tap/c2 --cask
xattr -d com.apple.quarantine /Applications/C2.app
```

## Data Locations

- `~/.config/c2-app` — Config directory
- `~/.claude/settings.json` — Claude Code settings (managed target)

## Development

Requires Node.js 20+ and pnpm 10+.

```bash
pnpm install
pnpm dev          # Start Electron (hot-reload)
pnpm typecheck    # TypeScript strict check
pnpm lint         # oxlint
pnpm format       # oxfmt
pnpm test         # Unit tests (vitest)
pnpm test:e2e     # Playwright e2e tests
pnpm make         # Build distributable installers
```

Run a single test file: `pnpm vitest run path/to/file.test.ts`

### Tech Stack

- **Shell**: Electron 41 + Electron Forge + Vite
- **UI**: React 19, React Router, Zustand, HeroUI v3, Tailwind CSS v4
- **Forms & validation**: TanStack React Form + Zod
- **Tests**: Vitest (jsdom) + Playwright

## License

[MIT](./LICENSE)
