# Task: Add Transcription Import

ID: TASK-0007
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-11
Updated: 2026-05-11

## Summary

Add a Sidekick workflow that lets the user import a new transcription file into the selected project folder.

Transcriptions are produced by another tool and exist somewhere else on disk, usually in the user's downloads folder. The user should be able to choose a transcription file, and Sidekick should copy it into the project folder's transcription directory while preserving the directory's existing numbering sequence.

## Current Phase

Closeout

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
- `docs/architecture/application-architecture.md`
- `docs/design/desktop-design-guidelines.md`
- `src/main/folder-scanner.ts`
- `src/shared/sidekick-api.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/renderer.ts`
- `src/index.css`
- `tests/integration/folder-scanner.test.ts`
- `tests/e2e/renderer-smoke.spec.ts`

Related decisions:
- None yet.

Related tasks:
- `docs/tasks/closed/TASK-0001-inspect-local-folder.md`
- `docs/tasks/closed/TASK-0002-folder-tree-expand-collapse.md`
- `docs/tasks/closed/TASK-0004-context-package-workflow.md`
- `docs/tasks/closed/TASK-0006-minimalist-ui-refresh.md`

## Explore Notes

User goal:
- The user should be able to add a new transcription to the selected project.
- The source transcription is created by another tool.
- The source transcription is usually a text or Markdown file.
- The source transcription usually lives outside the project folder, often in the downloads folder.
- The user should choose the transcription file.
- Sidekick should place the file into the project folder's transcription directory.
- The imported file should be placed at the end of the current transcription sequence by continuing existing file numbering.

Current product shape:
- Sidekick is a local-first desktop app for understanding and organizing local project folders.
- Project folders can contain thematic directories such as background information, transcriptions, information models, architecture, and other artifacts.
- The current app scans selected project folders read-only, shows folder signals, shows a folder tree, and can generate a context package.
- Existing folder-signal logic already recognizes transcription-oriented folders.

Current implementation:
- Filesystem access belongs in the Electron main process.
- The renderer accesses privileged behavior only through typed preload APIs.
- The renderer currently does not get raw filesystem access.
- The current scanner does not write, move, rename, delete, or parse file contents.
- Context-package generation is currently the only write operation, and it writes a generated file only to a selected project root.

New behavior introduced by this task:
- Sidekick will copy a user-selected source file into a project subfolder.
- Sidekick will generate a destination filename based on existing transcription numbering.
- Sidekick will rescan or update the visible project structure after the import succeeds.

Risk level:
- High.

Risk drivers:
- This task introduces user-facing file mutation inside project folders.
- The app must avoid arbitrary write access from the renderer.
- The app must avoid overwriting existing files unintentionally.
- Target-folder detection can be ambiguous if a project has zero or multiple transcription-like folders.
- Numbering conventions can vary between projects.

## Task Spec

Draft status:
- The product goal is known.
- The first-version behavior is decided.
- Target-folder ambiguity is intentionally out of scope because each project is expected to have exactly one transcription folder.

Goal:
- Let the user import one text or Markdown transcription file into the selected project's transcription folder with a generated filename that continues the existing sequence.

Primary workflow:
1. User selects or has already selected a project folder in Sidekick.
2. Sidekick detects the transcription folder inside that project.
3. User starts "Add transcription".
4. Sidekick opens a native file picker.
5. User chooses one `.txt`, `.md`, or `.markdown` file.
6. Sidekick previews the target transcription folder and generated destination filename.
7. User confirms the import.
8. Sidekick copies the source file into the target transcription folder.
9. Sidekick rescans the project folder.
10. Sidekick shows a success state with the copied file path.

Acceptance criteria:
- The workflow is only available after a project folder has been selected through Sidekick.
- The renderer does not receive raw filesystem write capability.
- Source file selection uses a native file picker owned by the main process.
- The first version accepts `.txt`, `.md`, and `.markdown` files.
- The source file is copied, not moved.
- The source file remains unchanged.
- The destination folder must be inside the selected project root.
- The destination folder must be the detected transcription folder.
- Sidekick generates the destination filename by continuing the existing numeric prefix sequence.
- Sidekick does not overwrite an existing destination file silently.
- If the generated destination filename already exists, Sidekick automatically chooses the next available number.
- The import preview shows:
  - source path;
  - target transcription folder;
  - generated destination filename;
  - generated destination path;
  - whether any numbering convention was inferred.
- The confirmation step must happen before copying.
- On success, the folder tree and summary update so the new transcription is visible.
- On failure, the source file and project folder contents remain unchanged except for any destination file that was fully and intentionally copied.
- Errors are readable and specific.
- Automated tests cover numbering, allowed file extensions, target path safety, copy behavior, and renderer smoke behavior.

Out of scope:
- Multiple-file import.
- Drag and drop.
- Audio or video transcription processing.
- Creating transcriptions from audio.
- Editing transcription contents.
- Parsing or summarizing transcription contents.
- Moving the source file instead of copying it.
- Persistent project database.
- Undo workflow.
- Import history.
- Automatic target-folder creation unless explicitly approved later.

## Proposed Simple Rules

Target transcription folder:
- Prefer exactly one folder in the selected project whose folder signal is `transcript`.
- If exactly one transcription folder is found, use it as the default target.
- If no transcription folder is found, stop and tell the user that no transcription folder was detected.
- If multiple transcription folders are found, stop with a clear error. Multiple transcription folders are not expected in the first version.

Allowed source files:
- `.txt`
- `.md`
- `.markdown`

Copy behavior:
- Copy the source file into the target transcription folder.
- Do not delete or move the source file.
- Do not overwrite an existing destination path.
- If a generated destination path already exists, automatically try the next number until an available destination path is found.

Numbering behavior:
- Inspect existing files in the target transcription folder.
- Detect leading numeric prefixes such as:
  - `01-interview.md`
  - `01 - interview.md`
  - `01_interview.md`
  - `01 interview.md`
- Use the highest existing numeric prefix as the current end of the sequence.
- Generate the next number as `highest + 1`.
- Preserve the most common prefix width from existing numbered files.
- Preserve the most common separator from existing numbered files when possible.
- If no numbered files exist, start with `01-`.
- Preserve the source basename after the generated prefix.
- If the source basename already starts with a numeric prefix, strip that source prefix before adding the project sequence prefix.

Example:
- Existing target files:
  - `01-interview-a.md`
  - `02-interview-b.md`
- Source file:
  - `new-transcription.md`
- Generated destination:
  - `03-new-transcription.md`

## Resolved Decisions And Assumptions

Target folder:
- Decision: Sidekick should not create a transcription folder in the first version.
- Decision: each project is expected to have exactly one transcription folder. If multiple are found, stop with a clear error.

Naming:
- Decision: use the original source basename after the generated number prefix.
- Decision: preserve the source file extension exactly.

Conflict handling:
- Decision: automatically try the next number until an available destination path is found.

UI placement:
- Default assumption: place "Add transcription" in the right inspector as a project action after a project folder has been selected. This keeps the first version simple and avoids requiring tree-row selection behavior.

## Initial Implementation Ideas

Likely shared types:
- `TranscriptionImportPreview`
- `TranscriptionImportResult`
- `TranscriptionImportWarning`

Likely main-process service:
- `src/main/transcription-importer.ts`

Likely IPC/preload methods:
- `previewTranscriptionImport()` or combined source-file selection and preview method.
- `confirmTranscriptionImport(previewId)` or explicit confirmation payload.

Likely renderer changes:
- Add a quiet "Add transcription" action near project or transcription-folder context.
- Show preview details before copy.
- Show success/error status after copy.
- Rescan the selected project after successful import.

Likely tests:
- Unit tests for numbering convention detection.
- Unit tests for generated destination filenames.
- Unit tests for source extension validation.
- Integration tests for safe copy behavior in a fixture folder.
- Integration tests for no overwrite behavior.
- Playwright smoke test for preview/confirm/success states using mocked APIs.

## Implementation Plan

Architectural rule:
- The renderer must not receive a general filesystem API and must not be allowed to choose arbitrary write destinations.
- The main process owns native file selection, target-folder detection, destination filename generation, copy execution, and post-import rescan.
- The renderer owns only presentation state and user confirmation.

### 1. Shared Contract

Update `src/shared/sidekick-api.ts` with explicit import types:

- `TranscriptionImportPreview`
- `TranscriptionImportResult`
- `TranscriptionImportWarning`

Recommended preview shape:
- `previewId`
- `rootPath`
- `sourcePath`
- `sourceFileName`
- `targetFolderPath`
- `targetFolderRelativePath`
- `destinationPath`
- `destinationFileName`
- `numbering`
  - `nextNumber`
  - `width`
  - `separator`
  - `inferredFromExistingFiles`
- `warnings`

Recommended result shape:
- `status: 'complete'`
- `rootPath`
- `sourcePath`
- `sourceFileName`
- `targetFolderPath`
- `targetFolderRelativePath`
- `destinationPath`
- `destinationFileName`
- `finalNumber`
- `copiedBytes`
- `scan`

Extend `SidekickApi` with:
- `previewTranscriptionImport(rootPath): Promise<TranscriptionImportPreview | null>`
- `confirmTranscriptionImport(previewId): Promise<TranscriptionImportResult>`

Rationale:
- Returning `null` from preview cleanly represents native file-picker cancellation.
- `previewId` avoids trusting renderer-provided file paths during confirmation.
- Returning `scan` lets the renderer update the folder tree immediately after a successful import.

### 2. Main-Process Import Service

Add `src/main/transcription-importer.ts`.

Responsibilities:
- Detect exactly one transcription folder under the selected root.
- Validate allowed source file extensions:
  - `.txt`
  - `.md`
  - `.markdown`
- Generate a destination path inside the detected transcription folder.
- Copy the source file to the destination using exclusive create/copy semantics.
- Recompute the destination number if a conflict appears between preview and confirmation.
- Return a fresh project scan after a successful copy.

Recommended exported helpers:
- `isAllowedTranscriptionFile(filePath)`
- `stripLeadingNumberPrefix(fileName)`
- `detectNumberingConvention(fileNames)`
- `createTranscriptionDestination(sourceFileName, targetFileNames)`
- `findTranscriptionFolders(scan)`
- `createTranscriptionImportPreview(rootPath, sourcePath)`
- `confirmTranscriptionImport(preview)`

Rationale:
- Helper functions make numbering and safety behavior easy to unit test without Electron dialogs.
- The service can reuse `scanProjectFolder()` and traverse the returned `FolderTreeNode` structure so target-folder detection stays aligned with existing folder-signal logic.

### 3. IPC And Pending Import State

Update `src/main.ts`:

- Keep `selectedProjectRoots`.
- Add `pendingTranscriptionImports = new Map<string, TranscriptionImportPreview>()`.
- Reuse `assertKnownProjectRoot()` for transcription import.
- Add `transcription:preview-import` handler:
  1. Validate root path.
  2. Open native file picker with filters for text and Markdown files.
  3. If canceled, return `null`.
  4. Build preview through the import service.
  5. Store preview by `previewId`.
  6. Return preview to renderer.
- Add `transcription:confirm-import` handler:
  1. Validate `previewId`.
  2. Read the stored pending preview.
  3. Validate the preview root is still a known selected project root.
  4. Confirm/copy through the import service.
  5. Delete the pending preview whether confirmation succeeds or fails.
  6. Return result with fresh scan.

Security details:
- The renderer sends only `rootPath` for preview and `previewId` for confirmation.
- The renderer never sends destination path for a write operation.
- The main process recomputes or revalidates the destination before copying.
- Use exclusive copy semantics so existing files are not overwritten.
- Verify final destination remains inside the selected root and target transcription folder.

### 4. Preload Bridge

Update `src/preload.ts` to expose only the two typed methods:

- `previewTranscriptionImport(rootPath)`
- `confirmTranscriptionImport(previewId)`

Do not expose:
- raw `ipcRenderer`;
- source-path write APIs;
- destination-path write APIs;
- directory creation APIs.

### 5. Renderer Workflow

Update `src/renderer.ts` with a new `TranscriptionImportState`:

- `unavailable`
- `ready`
- `previewing`
- `confirming`
- `importing`
- `complete`
- `error`

Behavior:
- State is `ready` when a project scan is active and `window.sidekick` exists.
- "Add transcription" appears in the right inspector as a quiet project action.
- Clicking it calls `previewTranscriptionImport(scan.rootPath)`.
- If preview returns `null`, return to `ready`.
- If preview returns a preview, show:
  - source file;
  - target transcription folder;
  - destination file;
  - destination path;
  - numbering details;
  - warnings if present.
- User confirms.
- Renderer calls `confirmTranscriptionImport(preview.previewId)`.
- On success:
  - update main `state` with `result.scan`;
  - keep existing expanded folders where practical;
  - show a compact success state with destination filename/path.
- On failure:
  - show readable error;
  - keep the current scan visible.

UI placement:
- Add a small "Transcriptions" section in the right inspector.
- Keep the styling aligned with the minimalist guidelines:
  - no new card treatment;
  - compact details;
  - quiet secondary action;
  - clear primary confirmation.

### 6. HTML And CSS

Update `index.html`:
- Add a section in the inspector for transcription import.
- Include title, short message, details list, warning list, and primary/secondary buttons.

Update `src/index.css`:
- Reuse existing context-package detail/action styles where practical.
- Avoid introducing a second visual language.
- Keep the section visually quieter than the folder tree.

### 7. Test Plan

Unit tests:
- Add `tests/unit/transcription-importer.test.ts`.
- Cover allowed extensions:
  - accepts `.txt`, `.md`, `.markdown`;
  - rejects other formats.
- Cover numbering:
  - starts with `01-` when no numbered files exist;
  - continues `01-`, `02-` as `03-`;
  - preserves width such as `001-` -> `002-`;
  - preserves common separator such as ` - ` or `_`;
  - strips a numeric prefix from the source basename before adding the project sequence;
  - automatically advances to the next available number on conflicts.

Integration tests:
- Add `tests/integration/transcription-importer.test.ts`.
- Copy the fixture project to a temporary folder.
- Create a source transcription in a temporary downloads-like folder.
- Preview import against the copied fixture.
- Confirm import.
- Assert:
  - source file still exists;
  - destination file exists;
  - destination content matches source content;
  - no existing file was overwritten;
  - returned scan includes the new transcription file.
- Add tests for:
  - no transcription folder;
  - multiple transcription folders;
  - rejected source extension.

UI smoke tests:
- Extend `tests/e2e/renderer-smoke.spec.ts`.
- Mock `previewTranscriptionImport` and `confirmTranscriptionImport`.
- Cover:
  - "Add transcription" disabled/unavailable before folder selection;
  - preview and confirmation state;
  - success state updates folder tree from returned scan;
  - error state is readable.

Verification commands:
- `npm run check`
- `npm run test`
- `npm run test:ui`

### 8. Documentation Updates

Update `docs/architecture/application-architecture.md`:
- Add a short "Transcription Import Flow" section.
- Document that import is a controlled copy operation owned by the main process.
- Document that renderer confirms with a `previewId`, not raw destination paths.

Update this task during build:
- Mark build, verification, review, documentation, and closeout as work completes.

## Plan Risks

- Target-folder detection relies on the existing folder signal model. If a real project uses a non-obvious folder name, import will stop instead of guessing.
- Returning source and destination paths in preview is useful for user confirmation, but confirmation must use only `previewId`.
- Filename preservation means unusual but valid source filenames will be preserved after the generated prefix. This matches the user decision, but can produce long destination names.
- The first version has no undo. The safest mitigation is explicit preview plus exclusive no-overwrite copy behavior.

## Human Gate

Human approval is required before implementation because this task introduces file writes into user project folders.

Minimum approval questions before build:
- Confirm the implementation plan before build.

Outcome:
- Human approval received.

## Build Notes

Implemented changes:
- Added transcription import types to `src/shared/sidekick-api.ts`.
- Added `src/main/transcription-importer.ts` for source validation, transcription-folder detection, numbering, no-overwrite copy behavior, and post-import rescanning.
- Added Electron IPC handlers for transcription preview and confirmation in `src/main.ts`.
- Added preload bridge methods in `src/preload.ts`.
- Added a compact "Transcriptions" inspector workflow in `index.html`, `src/renderer.ts`, and `src/index.css`.
- Updated `docs/architecture/application-architecture.md` with the transcription import flow, service, security notes, and verification notes.

Key implementation details:
- Preview opens a native file picker in the main process.
- Confirmation uses a main-process `previewId`; renderer does not provide write paths.
- Source files are copied, not moved.
- Existing destination files are not overwritten.
- If the expected destination is taken, the importer chooses the next available number.
- A fresh project scan is returned after successful import so the folder tree updates immediately.

Files changed:
- `docs/architecture/application-architecture.md`
- `docs/tasks/closed/TASK-0007-add-transcription-import.md`
- `index.html`
- `src/index.css`
- `src/main.ts`
- `src/main/transcription-importer.ts`
- `src/preload.ts`
- `src/renderer.ts`
- `src/shared/sidekick-api.ts`
- `tests/e2e/renderer-smoke.spec.ts`
- `tests/integration/transcription-importer.test.ts`
- `tests/unit/transcription-importer.test.ts`

## Verification Log

Commands run:
- `npm run check`
- `npm run test`
- `npm run test:ui`

Result:
- TypeScript and lint passed.
- Unit and integration tests passed: 8 test files, 26 tests.
- Playwright UI smoke tests passed: 5 tests.

## Closeout

The first transcription import workflow is complete.

The implementation adds a controlled file-copy operation for importing one text or Markdown transcription into the detected transcription folder. It preserves the security boundary by keeping filesystem writes in the main process and requiring renderer confirmation through a `previewId`.

## Review Checklist

- [x] Import is only possible for a selected project root.
- [x] Renderer does not receive raw filesystem APIs.
- [x] Source file is copied, not moved.
- [x] Destination path is inside the selected project root.
- [x] Existing files are not overwritten silently.
- [x] Numbering behavior is deterministic and tested.
- [x] Target-folder ambiguity is handled clearly.
- [x] UI follows the minimalist desktop design guidelines.
- [x] Folder tree updates after successful import.
- [x] Unit, integration, and UI smoke tests cover the workflow.
