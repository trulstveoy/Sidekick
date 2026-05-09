# Task: Inspect Local Folder

ID: TASK-0001
Status: Done
Class: Standard
Owner: Pair
Created: 2026-05-09
Updated: 2026-05-09

## Summary

Sidekick should let the user choose one local project folder and show a simple, understandable overview of what exists inside that folder.

## Current Phase

Close

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [x] Human approval received, if required
- [x] Build complete
- [x] Verification complete
- [x] Review complete
- [x] Documentation complete
- [x] Closeout complete

## Links

Related files:
- `docs/product/vision.md`
- `docs/workflows/agentic-development.md`
- `AGENTS.md`
- `package.json`
- `package-lock.json`
- `.gitignore`
- `playwright.config.ts`
- `src/main.ts`
- `src/main/folder-scanner.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `src/renderer.ts`
- `index.html`
- `src/index.css`
- `tests/unit/folder-classification.test.ts`
- `tests/integration/folder-scanner.test.ts`
- `tests/e2e/renderer-smoke.spec.ts`
- `tests/fixtures/project-folder-basic/`
- `README.md`

Related decisions:
- None yet.

Related docs:
- `docs/product/vision.md`
- `docs/architecture/application-architecture.md`

## Explore Notes

Relevant files:
- `AGENTS.md`
- `docs/product/vision.md`
- `package.json`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `src/renderer.ts`
- `index.html`
- `src/index.css`

Current behavior:
- Sidekick currently shows a static workspace mockup oriented around agentic development, not folder inspection.
- The renderer can call a narrow preload API to retrieve app information through `window.sidekick.getAppInfo()`.
- The main process currently registers one IPC handler: `app:get-info`.
- No native folder selection dialog exists yet.
- No filesystem inspection exists yet.
- No renderer state model exists beyond setting the runtime label.
- Package scripts available for verification are `npm run check`, `npm run package`, and `npm start`.

Observed patterns:
- Privileged Electron functionality belongs in the main process.
- The renderer should access privileged behavior through typed preload APIs only.
- The product direction is folder understanding before deep content understanding.
- Project folders are often semantically organized: the folder names describe the kind of content inside them.
- Common project subfolders may represent background information, transcripts, information models, architecture, or thematic groupings.
- The app already uses `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
- External navigation is restricted in the main process.
- The current UI has a three-column shell that can be adapted to selected folder, folder contents, and summary.
- Existing product copy in `package.json` and `index.html` still reflects the initial agentic-development scaffold and may need alignment with the folder-understanding direction.

Constraints:
- The first version should not modify files.
- The first version should avoid database or persistence.
- Folder inspection should start with structure and metadata, not deep content parsing.
- Filesystem access should stay in the main process.
- The preload API should expose narrow methods only, not raw filesystem, shell, or IPC access.
- The renderer should receive structured folder-inspection results instead of filesystem handles.

Open questions:
- None for the current spec. Initial choices are recorded in "Spec Decisions".

Initial risk:
- Medium

## Task Spec

Goal:
- Let the user choose one local project folder and see a simple overview of the folder contents.

Non-goals:
- No file editing.
- No moving, deleting, copying, or renaming files.
- No database or persistent workspace management.
- No multi-project workspace or root-folder management.
- No agent or AI analysis.
- No deep parsing of Markdown, PDFs, transcripts, audio, or video.
- No automatic restructuring of the selected folder.

Acceptance criteria:
- The user can click a "Choose folder" action.
- The app opens a native folder selection dialog.
- After selection, the app shows the selected folder path.
- The app shows a folder tree or structured list of folders and files.
- The app shows total file count and folder count.
- The app groups or counts simple artifact types using file metadata, names, and extensions.
- The app uses folder names as additional context when describing what kind of content exists in the project.
- Each file can have one primary artifact type and optional folder-derived context hints.
- The app identifies likely transcripts using simple filename and extension heuristics.
- The app counts common work artifacts such as PowerPoint files and draw.io diagrams.
- The app counts common document files such as Word, OpenDocument, and RTF files.
- The app scans recursively with safe first-version limits.
- The app excludes or downplays common hidden, system, dependency, build, and cache folders.
- The app shows recent files based on filesystem modified time.
- The app handles folder read errors with a visible message or warning.
- The app can show partial scan results when some nested files or folders cannot be read.
- The app does not write, move, rename, or delete any files.

Constraints:
- Filesystem access must stay in the Electron main process.
- Renderer access must go through a typed preload API.
- The first version should stay read-only.
- The UI should remain a practical work surface, not a marketing page.

Risks:
- Very large folders may make recursive scanning slow.
- Simple artifact classification may be wrong or incomplete.
- Hidden/system files may create noise.
- Permission errors may occur while scanning nested folders.

## Spec Decisions

Initial choices for the first version:

- The user chooses one project folder directly.
- Sidekick does not manage a root folder containing multiple projects in this task.
- Scanning is recursive, with implementation-defined safety limits for depth and file count.
- Hidden and noisy folders should not dominate the result.
- Common folders such as `.git`, `node_modules`, build outputs, and cache directories should be excluded or downplayed.
- Files have one primary artifact type based mainly on extension and filename.
- Folder names add context hints but do not override the primary artifact type.
- A file may have multiple folder-derived context hints.
- Recent files are based on filesystem modified time.
- Partial scan results are acceptable when some nested paths cannot be read, as long as warnings are shown.

## Terminology

- Project folder: the one local folder selected by the user for inspection.
- Artifact: a file inside the selected project folder.
- Artifact type: a simple primary classification based on metadata, extension, or filename.
- Folder signal: a hint inferred from a folder name.
- Context hint: additional information attached to a file or folder because of surrounding folder names.
- Recent file: a file with a recent filesystem modified time.

## Initial Visualization

The first version can use a three-area layout that separates folder context, folder structure, and project-level signals.

```text
+--------------------------------------------------------------------------------+
| Sidekick                                                        Choose folder   |
+------------------------+--------------------------------+----------------------+
| Selected project       | Folder structure               | Project summary      |
|                        |                                |                      |
| Kundeintervjuer mai    | v 01-bakgrunn/                 | Files: 128           |
| /Users/.../project     |    brief.pdf                   | Folders: 12          |
|                        |    marked-notes.md             | Last changed: Today  |
| Folder signals         |                                |                      |
| - Background           | v 02-transkripsjoner/          | Artifact counts      |
| - Transcripts          |    intervju-01.txt             | - Transcripts: 9     |
| - Info models          |    intervju-02.docx            | - PDFs: 4            |
| - Architecture         |                                | - Presentations: 3   |
|                        | v 03-informasjonsmodell/       | - draw.io: 5         |
| Read-only              |    begrepsmodell.drawio        | - Images: 18         |
| No file changes        |    domene-modell.png           | - Media: 3           |
|                        |                                |                      |
|                        | v 04-arkitektur/               | Folder hints         |
|                        |    systemskisse.drawio         | - Background: 2 dirs |
|                        |    arkitektur.pptx             | - Transcripts: 1 dir |
|                        |                                | - Architecture: 1 dir|
|                        | > 05-tema/                     |                      |
+------------------------+--------------------------------+----------------------+
```

Proposed areas:
- Left: selected project folder, path context, read-only status, and high-level folder signals.
- Middle: folder tree or structured content list, with folder names treated as content signals.
- Right: project-level summary, artifact counts, folder-category hints, and recent change information.

The visualization should make it clear that folder categories are inferred hints. It should avoid presenting folder-name classification as certain fact.

## Folder Structure Assumptions

Project folders are usually not arbitrary. They often describe the work structure and the type of content inside them.

Common folder categories may include:

- Background information: source material, context, references, supporting documents.
- Transcripts: interview transcripts, meeting transcripts, recordings converted to text.
- Information models: diagrams, domain models, conceptual models, data models.
- Architecture: system sketches, technical diagrams, structure notes, architecture descriptions.
- Thematic folders: topic-based organization where the folder name describes a subject area.

For the first version, Sidekick should treat folder names as useful metadata. A file inside a folder named `transcriptions`, `transkripsjoner`, or `interviews` is more likely to be a transcript-related artifact than the same file in a generic folder.

Folder-name signals should be shown carefully as hints, not facts. The UI should avoid pretending that simple heuristics are certain.

## Artifact Classification Draft

Initial classification can use simple heuristics:

- Markdown/text: `.md`, `.markdown`, `.txt`
- Documents: `.doc`, `.docx`, `.odt`, `.rtf`
- PDF: `.pdf`
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.heic`
- Audio: `.mp3`, `.wav`, `.m4a`, `.aac`, `.flac`, `.ogg`
- Video: `.mp4`, `.mov`, `.mkv`, `.webm`
- Spreadsheets/data: `.csv`, `.xlsx`, `.xls`, `.json`
- Presentations: `.ppt`, `.pptx`, `.key`
- Draw.io diagrams: `.drawio`, `.dio`, `.drawio.svg`, `.drawio.png`
- Likely transcripts: file name contains `transcript`, `transkripsjon`, `interview`, `intervju`, or `transcription`
- Notes: file name contains `note`, `notes`, `notat`, `meeting`, or `møte`
- Information models: file or folder name contains `model`, `modell`, `information-model`, `informasjonsmodell`, or `domain-model`
- Architecture: file or folder name contains `architecture`, `arkitektur`, `system`, or `diagram`
- Unclassified: anything not matched by the above

## Implementation Plan

### Plan Scope

This plan covers the first read-only folder inspection feature for one selected project folder.

In scope:
- Native folder selection.
- Read-only recursive folder scanning with simple safety limits.
- Artifact classification from filename, extension, and folder-name context.
- Folder summary, artifact counts, folder hints, warnings, and recent files.
- Unit tests, scanner tests, and a simple UI smoke direction.
- Short architecture documentation.

Out of scope:
- Multi-project workspace/root-folder management.
- Persistence of the selected folder.
- File editing, moving, copying, deleting, or renaming.
- AI/agent analysis.
- Deep content parsing.
- Full native dialog automation.

### Information Model

Initial shared types should be defined in `src/shared/sidekick-api.ts` and used by main, preload, renderer, and tests.

Core information elements:

- `ProjectFolderScan`
  - `rootPath`
  - `rootName`
  - `scannedAt`
  - `status: 'complete' | 'partial'`
  - `tree`
  - `summary`
  - `warnings`
- `FolderTreeNode`
  - `name`
  - `relativePath`
  - `kind: 'folder' | 'file'`
  - `children`
  - `artifactType`
  - `contextHints`
  - `size`
  - `modifiedAt`
- `ArtifactType`
  - `markdown-text`
  - `document`
  - `pdf`
  - `image`
  - `audio`
  - `video`
  - `spreadsheet-data`
  - `presentation`
  - `drawio`
  - `transcript`
  - `note`
  - `information-model`
  - `architecture`
  - `unclassified`
- `FolderSignal`
  - `background`
  - `transcript`
  - `information-model`
  - `architecture`
  - `thematic`
- `ScanSummary`
  - `fileCount`
  - `folderCount`
  - `artifactTypeCounts`
  - `folderSignalCounts`
  - `recentFiles`
  - `limitsReached`
- `ScanWarning`
  - `path`
  - `type`
  - `message`
  - `severity: 'info' | 'warning' | 'error'`
- `ScanOptions`
  - `maxDepth`
  - `maxFiles`
  - `excludedFolderNames`
  - `includeHidden`
  - `followSymlinks`

### Architecture Shape

- Main process owns native folder selection and filesystem scanning.
- Preload exposes a narrow typed API.
- Renderer never receives raw filesystem access or raw IPC access.
- Shared types are the contract between main, preload, renderer, and tests.
- Folder scanning and classification should be testable outside the IPC handler.

Planned files or areas:
- `src/shared/sidekick-api.ts`
- `src/main.ts`
- `src/main/folder-scanner.ts`
- `src/preload.ts`
- `src/renderer.ts`
- `index.html`
- `src/index.css`
- `tests/fixtures/project-folder-basic/`
- `tests/unit/`
- `tests/integration/`
- `tests/e2e/`
- `docs/architecture/application-architecture.md`
- `package.json`

### Data Flow

1. User clicks "Choose folder".
2. Renderer calls `window.sidekick.chooseProjectFolder()`.
3. Preload invokes a narrow IPC channel.
4. Main process opens the native folder selection dialog.
5. If the user cancels, main returns `null`.
6. If the user selects a folder, main scans it read-only.
7. Scanner returns a structured `ProjectFolderScan`.
8. Renderer displays selected folder, tree, summary, folder hints, warnings, and recent files.

### API Contract

Add one new preload method:

- `chooseProjectFolder(): Promise<ProjectFolderScan | null>`

IPC channel:

- `project-folder:choose-and-scan`

Rules:
- Do not expose raw `ipcRenderer`.
- Do not expose generic filesystem methods.
- Return structured scan results only.

### Scan Rules

Use simple first-version defaults:

- Recursive scan.
- Maximum depth: `5`.
- Maximum files: `2000`.
- Do not follow symlinks.
- Exclude common noisy folders:
  - `.git`
  - `node_modules`
  - `out`
  - `dist`
  - `.vite`
  - `.cache`
- Hidden folders are excluded by default.
- Counts reflect the files and folders actually scanned.
- If limits are reached, return partial results with warnings.
- If nested paths cannot be read, continue scanning where possible and return warnings.
- If the selected folder itself cannot be read, show a fatal error state.

### Classification Rules

Use simple deterministic heuristics:

- Extension determines the primary artifact type first.
- Filename keywords can promote a text/document-like file to `transcript`, `note`, `information-model`, or `architecture`.
- Folder names add context hints but do not override the primary artifact type.
- A file may have multiple context hints.
- Classification should be case-insensitive.
- Folder signals should be presented as hints, not facts.

### UI Plan

Use the existing three-column shell, adapted to folder inspection:

- Left: selected project folder, absolute root path, read-only status, folder signals.
- Middle: indented folder tree with folders before files and alphabetical sorting.
- Right: project summary, artifact counts, folder hints, recent files, warnings.

States:
- `empty`: no folder selected.
- `loading`: scan is running.
- `ready`: complete scan result.
- `partial`: scan result plus warnings.
- `error`: selected folder could not be scanned.

Display rules:
- Show the root path as an absolute path.
- Show child paths as names or relative paths.
- Sort folders before files.
- Sort alphabetically within folders and files.
- Do not implement expand/collapse in the first version.

### Testing Strategy

Use both unit/integration tests and UI/smoke tests.

Unit tests:
- Artifact classification.
- Folder-name context hints.
- Excluded folder rules.
- Summary aggregation.

Integration-style tests:
- Scanner reads a fixture project folder.
- Scanner counts files and folders.
- Scanner excludes noisy folders.
- Scanner identifies documents, presentations, draw.io files, transcripts, and folder hints.
- Scanner returns warnings when limits are reached.

UI/smoke tests:
- Add Playwright for simple renderer smoke coverage.
- First automated UI smoke should verify empty state and basic layout.
- Native folder dialog automation is out of scope for the first automated UI test.
- Native folder selection is verified manually in Electron.

Test structure:

```text
tests/
  fixtures/
    project-folder-basic/
  unit/
  integration/
  e2e/
```

Expected scripts:
- `npm run test`
- `npm run test:watch`
- `npm run test:ui`

### Implementation Steps

1. Add test tooling and scripts for Vitest and Playwright.
2. Create fixture folder under `tests/fixtures/project-folder-basic/`.
3. Extend shared API types in `src/shared/sidekick-api.ts`.
4. Implement classification helpers in a testable module.
5. Implement `src/main/folder-scanner.ts`.
6. Add unit tests for classification.
7. Add integration-style tests for folder scanning.
8. Add IPC handler in `src/main.ts`.
9. Expose `chooseProjectFolder()` through `src/preload.ts`.
10. Replace scaffold UI copy with folder-inspection UI.
11. Implement renderer state for empty/loading/ready/partial/error.
12. Render folder tree, summary, hints, warnings, and recent files.
13. Add a simple Playwright smoke test for initial renderer layout.
14. Add `docs/architecture/application-architecture.md`.
15. Update task logs and verification results.

### Verification Plan

Run:
- `npm run test`
- `npm run test:ui`
- `npm run check`
- `npm run package`
- `npm start`

Manual smoke test:
- Start the Electron app.
- Confirm empty state is visible.
- Click "Choose folder".
- Select a small local project folder.
- Confirm selected path is shown.
- Confirm file and folder counts are shown.
- Confirm artifact counts include documents, presentations, draw.io, and transcripts when present.
- Confirm folder hints are shown as inferred hints.
- Confirm recent files are shown from modified time.
- Confirm no files are written, moved, renamed, or deleted.

### Security Review

Check before closeout:
- Renderer has no raw filesystem access.
- Renderer has no raw IPC access.
- Preload exposes only `getAppInfo()` and `chooseProjectFolder()`.
- Filesystem scanning is read-only.
- Symlinks are not followed.
- External navigation restrictions remain in place.
- Errors and warnings do not expose more information than the selected local path context.

### Documentation Impact

Update or create:
- `docs/tasks/TASK-0001-inspect-local-folder.md`
- `docs/architecture/application-architecture.md`

Consider updating:
- `README.md` if the first folder-inspection workflow is usable.
- `docs/product/vision.md` only if implementation changes product terminology.

Decision record:
- Not required yet unless implementation introduces a durable architecture choice beyond the existing Electron boundary.

### Open Decisions Before Build

- None. Use the simple first-version choices recorded in this plan.

## Build Log

Implemented:
- Added Vitest and Playwright test tooling and scripts.
- Added shared folder-inspection types in `src/shared/sidekick-api.ts`.
- Added a read-only scanner in `src/main/folder-scanner.ts`.
- Added artifact classification, folder signals, recent files, scan limits, excluded folders, symlink skipping, and scan warnings.
- Added fixture-based unit and integration tests.
- Added `project-folder:choose-and-scan` IPC in the main process.
- Added `chooseProjectFolder()` to the preload API.
- Replaced the scaffold renderer with a three-column folder-inspection work surface.
- Added a Playwright smoke test for the renderer empty state.
- Added architecture documentation for the current Electron process boundaries and folder-inspection flow.
- Updated README with the current Sidekick direction and test scripts.

Plan deviations:
- The noisy-folder fixture uses `dist/` instead of `node_modules/` so the fixture can be tracked by Git. The scanner still excludes both.
- Folder exclusion is applied only after confirming an entry is a directory, so hidden files are not incorrectly reported as excluded folders.

## Verification Log

Passed:
- `npm run test`
  - 2 test files passed.
  - 5 tests passed.
- `npm run test:ui`
  - 1 Playwright smoke test passed.
- `npm run check`
  - ESLint passed.
  - TypeScript typecheck passed.
- `npm run package`
  - Electron Forge packaged the app for Linux x64.
- `npm start`
  - Electron Forge launched the development app.
- `npm audit --omit=dev`
  - Found 0 production dependency vulnerabilities.

Observed warnings:
- Electron startup printed GPU/WebGL blocklist messages in this environment. The app still launched.
- Native folder selection through the OS dialog was not interactively completed from this tool session. Scanner behavior is covered by integration tests, and Electron startup was verified.

## Review Notes

Security and architecture review:
- Renderer does not receive raw filesystem access.
- Renderer does not receive raw IPC access.
- Preload exposes only `getAppInfo()` and `chooseProjectFolder()`.
- Filesystem scanning is read-only.
- Symlinks are skipped by default.
- The scanner uses bounded recursion and file count limits.
- External navigation restrictions remain in the main process.
- No persistent storage was introduced.

Residual risk:
- Artifact classification is intentionally heuristic and will need refinement after real folder examples.
- Very large or unusual folders may still need better progress reporting or cancellation in a later task.

Decision record needed:
- No
- Reason: the implementation follows the already documented Electron security boundary and does not introduce persistence, packaging, or data-model decisions beyond this first feature.

## Documentation Notes

Docs updated:
- `docs/tasks/TASK-0001-inspect-local-folder.md`
- `docs/architecture/application-architecture.md`
- `README.md`

Docs intentionally not updated:
- `docs/product/vision.md` because the product terminology did not change during implementation.

Decision record needed:
- No
- Reason: no durable decision beyond the current task implementation was introduced.

## Closeout

Changed:
- Implemented read-only local folder inspection from Electron.
- Added scanner, IPC, preload API, renderer state, folder tree rendering, summary panels, warnings, and recent files.
- Added unit, integration, and UI smoke tests.
- Added architecture documentation and updated README.

Verified:
- `npm run test`
- `npm run test:ui`
- `npm run check`
- `npm run package`
- `npm start`
- `npm audit --omit=dev`

Known gaps:
- Full native folder-dialog selection was not interactively completed in this tool session.
- The first version does not include scan cancellation, progress updates, expand/collapse, persistence, or deep file parsing.

Next:
- Manually select a representative local project folder in the Electron app.
- Use the result to refine artifact labels, folder signals, and tree interaction.

Final status:
- Done
