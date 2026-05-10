# Sidekick Application Architecture

## Scope

This document describes the first implemented Sidekick architecture for inspecting one local project folder and generating a local context-package file from it.

## Process Boundaries

Sidekick is an Electron application with three clear runtime areas:

- Main process: owns privileged desktop capabilities, native dialogs, filesystem reads, external navigation rules, and application lifecycle.
- Preload script: exposes a narrow typed bridge from the renderer to the main process.
- Renderer: owns presentation state and UI rendering. It does not access Node.js, the filesystem, raw IPC, or Electron internals directly.

The renderer currently receives two APIs through `window.sidekick`:

- `getAppInfo()`
- `chooseProjectFolder()`
- `previewContextPackage()`
- `generateContextPackage()`

No generic filesystem API is exposed to the renderer.

## Folder Inspection Flow

1. The user clicks "Choose folder" in the renderer.
2. The renderer calls `window.sidekick.chooseProjectFolder()`.
3. The preload script invokes the `project-folder:choose-and-scan` IPC channel.
4. The main process opens a native folder selection dialog.
5. If the user cancels, the main process returns `null`.
6. If the user selects a folder, the main process scans it read-only.
7. The scanner returns a structured `ProjectFolderScan`.
8. The renderer displays the selected path, folder tree, artifact counts, folder signals, recent files, and scan warnings.

## Context Package Generation Flow

1. The user selects a project folder through the folder inspection flow.
2. The main process records the selected root path as a known Sidekick project root for the current app session.
3. The renderer shows a "Create context package" action for the selected folder.
4. The renderer calls `window.sidekick.previewContextPackage(rootPath)` before generation.
5. The preload script invokes the `context-package:preview` IPC channel.
6. The main process validates that the requested root path is absolute and was selected through Sidekick.
7. The main process returns the output filename, output path, overwrite status, and required warnings.
8. If the user confirms, the renderer calls `window.sidekick.generateContextPackage(rootPath)`.
9. The preload script invokes the `context-package:generate` IPC channel.
10. The main process runs Repomix against the selected root folder with Markdown output, compression disabled, security checks enabled, and generated context-package files ignored.
11. The generated file is written to the selected folder root as `<project-folder-name>.context-package.md`.
12. The renderer displays the output path, included count, skipped-file count, tokens, characters, output size, skipped files, and warnings.

## Shared Contract

Shared TypeScript types live in `src/shared/sidekick-api.ts`.

The shared contract currently includes:

- `ProjectFolderScan`
- `FolderTreeNode`
- `ScanSummary`
- `ScanWarning`
- `ArtifactType`
- `FolderSignal`
- `ScanOptions`
- `ContextPackagePreview`
- `ContextPackageResult`
- `ContextPackageSkippedFile`
- `ContextPackageWarning`
- `SidekickApi`

These types are used by main, preload, renderer, and tests to keep IPC payloads explicit.

## Scanner

The scanner lives in `src/main/folder-scanner.ts`.

The first version is intentionally simple and deterministic:

- recursive scan with maximum depth `5`
- maximum file count `2000`
- no symlink following
- hidden folders excluded by default
- noisy folders such as `.git`, `node_modules`, `out`, `dist`, `.vite`, and `.cache` excluded
- artifact type inferred from extension and filename
- folder signals inferred from folder names
- recent files based on filesystem modified time
- partial results returned when nested paths cannot be fully scanned

The scanner does not write, move, rename, delete, or parse file contents.

## Context Package Service

The context package service lives in `src/main/context-package.ts`.

The first version is a Sidekick-owned wrapper around Repomix:

- output format is Repomix Markdown
- output filename is `<project-folder-name>.context-package.md`
- output location is the selected project folder root
- compression is disabled
- Repomix security checks remain enabled
- generated context-package files are ignored during generation
- noisy folders such as `.git`, `node_modules`, `out`, `dist`, `.vite`, and `.cache` are ignored
- binary files are reported as skipped when Repomix cannot include them as text content

The service writes only the generated context-package file. It does not edit, move, rename, or delete source files.

## UI Shape

The renderer uses a three-column work surface:

- left: selected project, path, runtime, and folder signals
- center: read-only folder structure
- right: summary, context-package action/result, artifact counts, recent files, and warnings

The UI treats folder categories as inferred hints, not facts.

## Security Notes

The current architecture preserves the Electron security boundary:

- `contextIsolation` is enabled.
- `nodeIntegration` is disabled.
- `sandbox` is enabled.
- privileged work remains in the main process.
- preload exposes only task-specific methods.
- raw `ipcRenderer` is not exposed.
- context-package generation is allowed only for a root path selected through Sidekick in the current session.
- renderer requests do not provide arbitrary output paths.
- symlinks are skipped by default during folder scans.
- external windows are denied, with HTTPS links opened through Electron only after protocol checking.

## Verification

Automated verification is split by responsibility:

- Unit tests cover artifact classification and folder-name signals.
- Integration tests cover scanner behavior against a fixture project folder.
- Unit and integration tests cover context-package filename rules, ignore rules, preview behavior, generation, skipped binary files, and self-ignore behavior.
- Playwright smoke tests cover the renderer empty state, folder tree behavior, and mocked context-package confirmation/result states.
- Electron packaging verifies the main, preload, and renderer bundles.

Native folder dialog behavior is verified manually in Electron because full native dialog automation is out of scope for the first implementation.
