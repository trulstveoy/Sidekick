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
- `previewTranscriptionImport()`
- `confirmTranscriptionImport()`

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

## Transcription Import Flow

1. The user selects a project folder through the folder inspection flow.
2. The main process records the selected root path as a known Sidekick project root for the current app session.
3. The renderer shows an "Add transcription" action for the selected project.
4. The renderer calls `window.sidekick.previewTranscriptionImport(rootPath)`.
5. The preload script invokes the `transcription:preview-import` IPC channel.
6. The main process validates that the requested root path is absolute and was selected through Sidekick.
7. The main process opens a native file picker for `.txt`, `.md`, and `.markdown` files.
8. If the user cancels, the main process returns `null`.
9. If the user chooses a file, the main process detects exactly one transcription folder in the selected project.
10. The main process generates a destination filename by continuing the target folder's leading-number sequence.
11. The main process stores the preview in a short-lived pending-import map and returns a `previewId` plus source and destination details to the renderer.
12. If the user confirms, the renderer calls `window.sidekick.confirmTranscriptionImport(previewId)`.
13. The preload script invokes the `transcription:confirm-import` IPC channel.
14. The main process looks up the pending preview by `previewId`, revalidates the selected project root, recomputes a safe destination if needed, and copies the source file without overwriting existing files.
15. The main process rescans the project folder and returns the import result with the fresh `ProjectFolderScan`.
16. The renderer updates the folder tree and displays the copied destination path.

The renderer never sends a destination path for a write operation. Confirmation uses only the `previewId` created by the main process.

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
- `TranscriptionImportPreview`
- `TranscriptionImportResult`
- `TranscriptionImportWarning`
- `TranscriptionImportNumbering`
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

The context package service lives in `src/main/context-package.ts`. Repomix execution details
live in `src/main/repomix-runner.ts`.

The first version is a Sidekick-owned wrapper around Repomix:

- output format is Repomix Markdown
- output filename is `<project-folder-name>.context-package.md`
- output location is the selected project folder root
- compression is disabled
- Repomix security checks remain enabled
- Repomix token counting and security checks run in-process so packaged Electron builds do not depend on worker files inside `app.asar`
- generated context-package files are ignored during generation
- noisy folders such as `.git`, `node_modules`, `out`, `dist`, `.vite`, and `.cache` are ignored
- binary files are reported as skipped when Repomix cannot include them as text content

The service writes only the generated context-package file. It does not edit, move, rename, or delete source files.

## Transcription Import Service

The transcription import service lives in `src/main/transcription-importer.ts`.

The first version is a controlled copy workflow:

- accepted source files are `.txt`, `.md`, and `.markdown`
- source files are copied, not moved
- Sidekick does not create a transcription folder
- exactly one transcription folder must be detected through existing folder signals
- destination filenames continue the target folder's leading-number sequence
- the original source basename is preserved after the generated number prefix
- existing destination files are not overwritten
- conflicts are handled by trying the next available number
- after a successful copy, the selected project folder is rescanned

The service never exposes a general filesystem write API to the renderer.

## UI Shape

The renderer uses a three-column work surface:

- left: selected project, path, runtime, and folder signals
- center: read-only folder structure
- right: summary, transcription import action/result, context-package action/result, artifact counts, recent files, and warnings

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
- transcription import is allowed only for a root path selected through Sidekick in the current session.
- renderer requests do not provide arbitrary output paths.
- transcription import confirmation uses a `previewId`, not renderer-supplied source or destination paths.
- symlinks are skipped by default during folder scans.
- external windows are denied, with HTTPS links opened through Electron only after protocol checking.

## Release Automation

GitHub Actions owns repository verification and package publishing automation.

The first release pipeline targets Linux and Windows only:

- pushes to `main` run verification and upload Linux/Windows packages as workflow artifacts
- tags matching `v*` run verification, build Linux/Windows packages, and publish a GitHub prerelease
- release tags must match `v<package.json version>`
- release tag commits must be reachable from `main`
- Linux output includes DEB and RPM packages
- Windows output uses the existing unsigned Squirrel Windows maker
- macOS packaging, code signing, notarization, and auto-update are deferred

The release pipeline uses the built-in GitHub token. Read-only jobs use `contents: read`; the publish job uses `contents: write` only when creating a GitHub prerelease.

## Verification

Automated verification is split by responsibility:

- Unit tests cover artifact classification and folder-name signals.
- Integration tests cover scanner behavior against a fixture project folder.
- Unit and integration tests cover context-package filename rules, ignore rules, preview behavior, generation, skipped binary files, and self-ignore behavior.
- Unit and integration tests cover transcription import extension rules, numbering, target-folder detection, no-overwrite behavior, copy behavior, and post-import rescanning.
- Unit tests cover CI artifact staging rules for release package files.
- Playwright smoke tests cover the renderer empty state, folder tree behavior, mocked transcription import confirmation/result states, and mocked context-package confirmation/result states.
- Electron packaging verifies the main, preload, and renderer bundles.
- GitHub Actions runs verification and package builds before publishing release assets.

Native folder dialog behavior is verified manually in Electron because full native dialog automation is out of scope for the first implementation.
