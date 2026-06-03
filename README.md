# Sidekick

Sidekick is a local-first desktop app for working with project material on your own machine. It helps you inspect, organize, search, summarize, and package a workspace so it can be used in agentic workflows without sending project files through a hosted backend.

## What Sidekick Does

- Opens an existing folder as a workspace or creates a new workspace with a simple standard structure.
- Shows the workspace as both a physical folder tree and a project-oriented context view.
- Classifies files and folders with practical hints such as transcripts, notes, information models, architecture, and background material.
- Lets you tag folders, including project folders, so the same workspace can be navigated through richer context views.
- Watches the active workspace for filesystem changes and refreshes the UI automatically.
- Builds and updates a local searchable index for supported text-based files.
- Imports transcription files through a controlled copy workflow that previews the destination and avoids overwriting existing files.
- Generates and reads local transcription summaries, workspace summaries, and document relationship reports through controlled Codex runs.
- Creates workspace-level or folder-level context packages with Repomix for use in agent prompts and review workflows.
- Provides a controlled Codex panel for login, read-only analysis runs, editable workspace runs, streaming output, and cancellation.

All privileged work happens locally in the Electron main process. The renderer receives only a narrow typed API and never gets raw filesystem, shell, process, or IPC access.

## Setup

Use the Node version declared in `.nvmrc` before installing dependencies:

```bash
nvm use
npm ci
```

The lockfile is maintained with modern npm. If `npm ci` fails with lockfile or comparator errors, confirm that `node` and `npm` both resolve through `~/.nvm`.

## Scripts

- `npm start` starts the Electron app in development.
- `npm run package` creates an unpacked local app build.
- `npm run make` creates platform-specific distributables.
- `npm run test` runs unit and integration tests.
- `npm run test:ui` runs Playwright UI smoke tests.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs TypeScript without emitting files.
- `npm run check` runs lint and typecheck together.

## Architecture

- `src/main.ts` owns the Electron main process, window creation, application lifecycle, and IPC handlers.
- `src/main/folder-scanner.ts` owns read-only project folder scanning and artifact classification.
- `src/preload.ts` is the only bridge between the renderer and privileged Electron APIs.
- `src/shared/sidekick-api.ts` defines the typed contract exposed from preload to renderer.
- `src/renderer.ts`, `index.html`, and `src/index.css` own the first renderer workspace.

## Security Defaults

- Renderer sandbox is enabled.
- Node integration is disabled in the renderer.
- Context isolation is enabled explicitly.
- The preload exposes narrow methods through `contextBridge`.
- Raw `ipcRenderer` is never exposed to the renderer.
- New windows are denied and HTTPS links open in the system browser.
- Packaged builds use Electron fuses and ASAR.

## Agentic Development

Use `AGENTS.md` as the working agreement for future agent sessions. Superpowers is the governing workflow, with Sidekick-specific conventions in `docs/workflows/agentic-development.md`.

## Static Analysis

Use `docs/workflows/static-analysis.md` for the local static analysis workflow, including dead-code analysis, import-boundary checks, maintainability metrics, and security-oriented review.
