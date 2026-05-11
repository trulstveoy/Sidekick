# Sidekick

Sidekick is a local-first desktop app for inspecting and organizing project folders. It is built on Electron, Electron Forge, Vite, and TypeScript.

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

Use `AGENTS.md` as the working agreement for future agent sessions. The full workflow lives in `docs/workflows/agentic-development.md`.

## Static Analysis

Use `docs/workflows/static-analysis.md` for the local static analysis workflow, including dead-code analysis, import-boundary checks, maintainability metrics, and security-oriented review.
