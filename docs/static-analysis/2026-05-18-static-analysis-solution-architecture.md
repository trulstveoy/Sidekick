# Static Analysis: Solution Architecture

Date: 2026-05-18
Scope: Sidekick desktop application
Purpose: Bruke static analysis til å etablere et presist grunnlag for `docs/architecture/solution-architecture.md`.

## Summary

Gjennomgangen bekrefter at Sidekick er en lokal-first Electron-applikasjon med tydelig runtime-grense mellom renderer, preload og main process. Renderer har ikke direkte tilgang til Node, filsystem eller IPC. All privilegert funksjonalitet går via `window.sidekick`, definert i `src/shared/sidekick-api.ts` og implementert i `src/preload.ts` og `src/main.ts`.

Sidekick har ikke en klassisk database. Persistens skjer gjennom brukerens arbeidsområde, `.sidekick`-metadata, `.sidekick-folder.json` i taggede mapper, en lokal MiniSearch-indeks, genererte Markdown-rapporter og appens `settings.json` under Electron `userData`.

## Commands Run

| Command | Result |
| --- | --- |
| `npm run check` | Passed |
| `npm audit --omit=dev` | Passed, 0 vulnerabilities |
| `npx --yes knip --version && npx --yes knip --no-progress` | Completed with findings |
| `NODE_PATH=./node_modules npm exec --yes --package dependency-cruiser -- dependency-cruiser --no-config --exclude "^node_modules|^out|^dist|^\\.vite|^test-results" src tests scripts --output-type err` | Passed, no dependency violations |
| `git diff --check` | Passed |

## Codebase Shape

Relevant entrypoints:

- `src/main.ts` - Electron main process, IPC handlers, BrowserWindow setup, lifecycle, orchestration.
- `src/preload.ts` - typed bridge from renderer to main through `contextBridge`.
- `src/renderer.ts` - renderer UI, state, interaction logic.
- `src/shared/sidekick-api.ts` - shared DTOs and `SidekickApi` contract.
- `src/shared/context-views.ts` - pure derivation of logical context views from scanned workspace tree.
- `src/main/*.ts` - main-process services for scanning, metadata, search, context packages, Codex, transcription, settings and live filesystem refresh.

Large modules and likely maintenance hotspots:

- `src/renderer.ts` - about 5800 lines.
- `src/main/search-index.ts` - about 1000 lines.
- `src/main.ts` - about 860 lines.
- `src/shared/sidekick-api.ts` - about 700 lines.
- `src/main/folder-scanner.ts` - about 650 lines.
- `src/main/codex-runner.ts` - about 540 lines.

This is not automatically a defect, but these modules carry most of the coupling and should be treated carefully during future feature work.

## Dependency Boundaries

`dependency-cruiser` reported no dependency violations for `src`, `tests` and `scripts` in the report-only run.

Observed direction:

- `renderer` depends on shared types, DOM and `window.sidekick`.
- `preload` depends on Electron `ipcRenderer` and shared types.
- `main.ts` depends on Electron main APIs and main-process services.
- main-process services depend on Node APIs and shared DTOs.
- shared modules avoid Electron and Node process privileges except type references where needed.

No automated architectural boundary rules are currently checked by a committed dependency-cruiser config. The command was run without config to establish a baseline.

## Knip Findings

`knip` reported one unused devDependency and several unused exports/types.

Unused devDependency:

- `encoding` in `package.json`.

Unused exports reported in main modules:

- `buildCodexExecTextArgs` in `src/main/codex-runner.ts`.
- `FOLDER_METADATA_SCHEMA`, `normalizeFolderTagLabel`, `getSystemTagDefinition`, `markerRelativePathForFolder` in `src/main/context-metadata.ts`.
- `CONTEXT_PACKAGE_SUFFIX`, `BINARY_FILE_WARNING`, `SELF_IGNORE_WARNING` in `src/main/context-package.ts`.
- `DOCUMENT_RELATIONSHIPS_FILE_NAME`, `DOCUMENT_RELATIONSHIPS_SCHEMA`, `DEFAULT_RELATIONSHIPS_MAX_CONTEXT_TOKENS`, `buildDocumentRelationshipsPrompt`, `normalizeDocumentRelationshipsOutput` in `src/main/document-relationships.ts`.
- `SEARCH_INDEX_SCHEMA`, `SEARCH_UPDATE_DEBOUNCE_MS` in `src/main/search-index.ts`.
- `SIDEKICK_METADATA_FOLDER`, `WORKSPACE_INFO_FILE_NAME`, `WORKSPACE_INFO_SCHEMA`, `parseWorkspaceInfoMarkdown` in `src/main/workspace-info.ts`.
- `WORKSPACE_REFRESH_DEBOUNCE_MS` in `src/main/workspace-watch-manager.ts`.

Unused exported shared types reported:

- `FolderTagEditResult`, `ScanStatus`, `ScanWarningSeverity`, `ContextViewSourceKind`, `FolderContextView`, `ProjectContextView`.
- Workspace creation/initialization helper types.
- Search index state/result helper types.
- Transcription warning/status/result helper types.
- Codex status/run/event helper types.

Assessment:

- Many shared exported types are part of a stable renderer/preload/main API contract even when TypeScript reports no direct runtime usage.
- Some exported constants/functions are test helpers or future extension points.
- The unused `encoding` dependency should be reviewed before removal because earlier CI/release work added it for package-install stability.
- No cleanup was performed in this task because the goal was architecture documentation, not API pruning.

## Security Observations

Confirmed by code inspection:

- `app.enableSandbox()` is enabled.
- BrowserWindow uses `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- Preload exposes a typed `SidekickApi`, not raw `ipcRenderer`.
- Main process validates selected workspace roots through an allowlist before privileged workspace operations.
- Folder tag writes validate that target folders stay inside the selected workspace.
- External navigation is constrained: app windows deny new windows and allow only `https:` links through `shell.openExternal`.
- Codex prompts are written to stdin, not process arguments.
- Context package generation ignores `.git`, `.sidekick`, generated context packages, `node_modules`, build output and `.sidekick-folder.json`.
- Repomix security checks run in process and suspicious files are excluded from generated packages.

## Architecture Inputs Produced

This report feeds the current solution architecture:

- `docs/architecture/solution-architecture.md`

The architecture document should be updated when any of these change materially:

- Electron process boundary.
- `SidekickApi` surface.
- Workspace metadata schema.
- Search index storage.
- Context package or Codex execution model.
- Release/package pipeline.
- Persistent storage model.
