# Task: Write Pattern And Transcript Import Refresh

ID: TASK-0019
Status: Closed
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0019-write-pattern-transcript-import
Worktree: ../Sidekick-worktrees/TASK-0019-write-pattern-transcript-import
Base branch: main
Write scope:
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/e2e`
- `tests/unit`
- `tests/integration`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0015-design-system-shell-foundation.md`
- `closed/TASK-0017-project-overview-scan-understanding.md`
- `closed/TASK-0018-folder-hierarchy-artifact-detail.md`
Implementation ordering: Build after `TASK-0018` is committed or otherwise established as the integration base. Build before `TASK-0020` and `TASK-0021`.

## Summary

Implement the shared write-operation UX pattern through the transcript import workflow.

This task should visibly refresh transcript import while preserving current import behavior: text/Markdown only, single detected transcription folder, strict `NN. filename.ext` numbering, copy not move, and no overwrite.

This task intentionally combines the shared write-operation pattern with one concrete workflow. The pattern must be usable by later context package and Codex tasks.

## Current Phase

Closed

Build, verification, and human review are complete.

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [x] Worktree created or reused, if required
- [x] Human approval received, if required
- [x] Build complete
- [x] Verification complete
- [x] Review complete
- [x] Documentation complete
- [x] Closeout complete

## Links

Related docs:
- `../design/gui-refresh-implementation-analysis.md`
- `../design/desktop-design-guidelines.md`
- `../design/sidekick-ui design leveranse.zip::wireframe-03-transkripsjonimport.html`
- `../design/sidekick-ui design leveranse.zip::fase3-ref-skriveoperasjoner.html`
- `../design/sidekick-ui design leveranse.zip::fase4-oppgave-05-transkripsjonimport.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-tilstandsbibliotek.html`
- `../design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`

Related tasks:
- `closed/TASK-0015-design-system-shell-foundation.md`
- `closed/TASK-0017-project-overview-scan-understanding.md`
- `closed/TASK-0018-folder-hierarchy-artifact-detail.md`
- `closed/TASK-0007-add-transcription-import.md`
- `closed/TASK-0012-strict-numbering-format.md`

## Explore Notes

Current app state:
- Transcript import already exists through typed APIs:
  - `previewTranscriptionImport(rootPath)`;
  - `confirmTranscriptionImport(previewId)`.
- The main process opens a native file picker filtered to `.txt`, `.md`, and `.markdown`.
- The importer detects exactly one transcript folder from folder signals.
- The importer copies the source file; it does not move it.
- The importer strips an incoming numeric prefix and applies the project sequence.
- The current authoritative filename convention is `NN. original-name.ext`.
- Conflicts are handled by trying the next available number.
- The app rescans the project after successful import.

Design source observations:
- The consultant write-operation pattern is useful, but the consultant task spec includes audio/API assumptions that are out of scope.
- The import flow should show source file, target folder, generated destination filename, and write intent before confirmation.
- The amber write-operation indicator should be reusable by later write workflows.

Resolved decisions:
- Text/Markdown only. No audio import.
- Preserve `NN. filename.ext`.
- Preserve copy-not-move behavior.
- Preserve automatic conflict handling.

Risk notes:
- This workflow writes to disk and must remain explicit.
- The UI must not imply transcription from audio.
- Existing import tests should continue to protect numbering and no-overwrite behavior.
- This task establishes UI conventions that `TASK-0020` and `TASK-0021` should reuse rather than reimplement.

## Task Spec

### Problem

Transcript import is functionally correct, but the UI does not yet match the refreshed write-operation design or make the copy target clear enough.

### Goal

Give transcript import a clear, calm, and explicit write workflow that users can inspect before confirming.

### Scope

- Implement the shared write-operation indicator and confirmation treatment through transcript import.
- Redesign the transcript import flow around:
  - choose source file;
  - preview destination;
  - confirm copy;
  - success/error result.
- Show source file name/path.
- Show detected transcription folder.
- Show generated destination filename.
- Show numbering basis.
- Show that the file will be copied, not moved.
- Show success with final path and copied size.
- Preserve rescan after successful import.
- Use Norwegian user-facing copy.

### Non-goals

- Audio import.
- External transcription service.
- Changing supported file extensions.
- Changing filename convention.
- Selecting an arbitrary destination folder.
- Creating a missing transcription folder.
- Opening the imported file.
- Batch import.

### User Workflows

- User starts import from the refreshed UI.
- User chooses an existing `.txt`, `.md`, or `.markdown` transcript.
- User previews where Sidekick will copy it.
- User confirms import.
- User sees success and the project view updates.
- User sees actionable errors for no transcript folder, multiple transcript folders, unsupported source, or copy failure.

### Design Requirements

- Follow `wireframe-03-transkripsjonimport.html` and `fase3-ref-skriveoperasjoner.html`.
- Use the write-operation badge and amber confirmation pattern.
- Display target path before confirm.
- Keep warning language calm and precise.
- Use the base components and shell from `TASK-0015`.
- Do not present audio or transcription-service UI.

### Acceptance Criteria

- [x] Transcript import visibly uses the shared write-operation pattern.
- [x] Import preview shows source file, detected target folder, destination filename, and numbering.
- [x] Preview uses the current `NN. filename.ext` convention.
- [x] UI states cover ready, choosing, preview, confirming, success, cancel, and error.
- [x] Successful import rescans and updates project information.
- [x] Unsupported formats are not presented as valid.
- [x] No UI copy implies audio transcription.
- [x] Existing numbering/conflict/no-overwrite tests still pass.
- [x] UI smoke tests cover import preview, cancel, confirm success, and at least one error state where practical.

### Dependencies

- Requires `TASK-0015`.
- Should follow `TASK-0017` so rescan result returns to the refreshed project view.
- Should be completed before `TASK-0020` and `TASK-0021` so those tasks can reuse the shared write-operation pattern.

### Parallelization Notes

This task is not just a transcript-import task; it also establishes the shared write-operation UI pattern.

Do not build `TASK-0020` or `TASK-0021` in parallel with this task unless the write-operation components have already been extracted and integrated.

### Open Questions

None blocking.

## Implementation Plan

### Plan Status

Build has been approved by the human.

`TASK-0018` is committed on local `main`, and the task worktree has been created from that base.

Before implementation starts, run a baseline check from the chosen task checkout:

```text
npm run check
npm run test:ui
npm test
```

If the baseline fails, record the failure in the Build Log before implementation.

### Design Sources

Use these consultant artifacts as the design source for this task:

- `docs/design/sidekick-ui design leveranse.zip::wireframe-03-transkripsjonimport.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3-ref-skriveoperasjoner.html`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-05-transkripsjonimport.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-tilstandsbibliotek.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-terminologi-og-avvik.md`
- `docs/design/gui-refresh-implementation-analysis.md`
- `docs/design/desktop-design-guidelines.md`

Normalize the consultant scope against the approved Sidekick scope:

- Do not add audio import, external transcription services, or transcription API UI.
- Do not add drag-and-drop file import in this task. Keep the native file picker mediated by the main process.
- Do not change supported file extensions: `.txt`, `.md`, `.markdown`.
- Do not change the filename convention: `NN. original-name.ext`.
- Do not add arbitrary destination-folder selection. Import still targets the single detected transcription folder.
- Do not create a missing transcription folder.
- Do not open the imported file.
- Preserve copy-not-move behavior and automatic conflict handling.

### Integrated Baseline From TASK-0018

Build on the post-0018 UI structure:

- The project overview, context surface, action bar, selected-folder context, and tree selection now exist.
- Transcript import currently lives in the context surface and already uses typed APIs.
- Successful import currently rescans the project and expands the detected transcription folder.
- This task should improve the transcript import workflow without disrupting the selected-folder context from `TASK-0018`.

### Implementation Steps

1. Add shared write-operation presentation primitives.
   - Keep this lightweight and local to the current renderer/CSS structure.
   - Add reusable CSS classes for:
     - write-operation badge;
     - amber write warning;
     - step indicator;
     - success/result summary;
     - monospace path/value treatment.
   - Prefer generic class names so `TASK-0020` and `TASK-0021` can reuse the pattern.

2. Refine transcript import state presentation in `src/renderer.ts`.
   - Keep the existing state machine: `ready`, `previewing`, `confirming`, `importing`, `complete`, `error`.
   - Treat `ready` as step 1: choose source file.
   - Treat `confirming` as step 2: explicit write preview.
   - Treat `complete` and `error` as step 3 results.
   - Use Norwegian user-facing labels and copy.

3. Improve the ready/choose-file state.
   - Show accepted formats: `.txt`, `.md`, `.markdown`.
   - Explain that the file will be copied, not moved.
   - Derive and show the detected transcription folder from the scan when exactly one transcript folder is present.
   - If no or multiple transcript folders can be inferred from the scan, show that the native import flow will report a precise error after file selection.
   - Primary action label should be `Velg fil...`.

4. Improve the preview/confirm state.
   - Show the write-operation badge.
   - Show source file name and full source path from the preview.
   - Show detected target folder and destination path.
   - Show generated destination filename.
   - Show numbering basis using current `NN. ` convention and whether it was inferred from existing files.
   - Show an amber warning that says exactly one file will be copied into the transcription folder and no other files are changed.
   - Primary action label should be `Importer fil`.
   - Secondary action should return to the ready state without writing.

5. Improve the importing state.
   - Disable actions while copying.
   - Keep target filename/path visible.
   - Keep the operation clearly marked as a write operation.

6. Improve the success state.
   - Show a success banner: `Transkripsjon importert`.
   - Show imported filename, destination path, source file, copied size, and final sequence number.
   - Explicitly state that the original source file was left unchanged.
   - Keep the existing rescan behavior.
   - If practical, make a secondary action select or focus the imported file in the tree using the `TASK-0018` selection helpers. Do not open the file.

7. Improve the error state.
   - Show the error message from the main process.
   - Add calm reassurance text: `Ingen filer ble endret.` when the error happens before or instead of a confirmed copy.
   - Keep retry available.
   - Cover at least one preview error in UI tests.

8. Preserve backend import behavior.
   - Avoid changes to `src/main/transcription-importer.ts` unless implementation reveals a bug.
   - Keep existing unit and integration tests as the authoritative guard for:
     - allowed extensions;
     - numbering;
     - prefix stripping;
     - conflict handling;
     - no overwrite;
     - no/multiple transcript-folder errors.

9. Update UI smoke tests.
   - Update existing transcript import test for Norwegian copy and the refreshed write pattern.
   - Cover preview details:
     - source file;
     - target folder;
     - destination filename;
     - destination path;
     - numbering.
   - Cover secondary cancel/back from confirmation.
   - Cover successful confirm and rescan/update.
   - Cover at least one import preview error, preferably no detected transcription folder.
   - Keep existing folder/tree tests passing after the context surface changes.

### Verification Plan

Run from the chosen task checkout:

```text
npm run check
npm run test:ui
npm test
```

Manual verification before review:

- Select a project with one transcription folder.
- Start transcript import.
- Cancel from the native file picker and confirm the UI returns to ready state.
- Choose a `.txt`, `.md`, or `.markdown` file.
- Confirm source, target folder, generated filename, destination path, copy-not-move text, and write badge are visible before import.
- Use the back/cancel action from confirmation and confirm no import occurs.
- Confirm import and verify the project rescans and the imported file appears in the tree.
- Verify the UI does not mention audio, transcription services, or arbitrary destination folder selection.

### Security And Architecture Notes

This task should preserve the existing security boundary:

- native file selection stays in the main process;
- renderer does not get raw filesystem capabilities;
- no new IPC channels are expected;
- import confirmation continues to use `previewId`;
- main process validation remains authoritative;
- no file is opened after import.

If implementation appears to require drag-and-drop file paths, renderer filesystem access, arbitrary destination selection, or a new IPC channel, stop and ask for a human decision before continuing.

### Documentation Notes

No decision record is expected if the task preserves current import behavior and security boundaries.

Update this Task Record during Build with:

- actual worktree creation/reuse or human override;
- implementation deviations from this plan;
- verification commands and results;
- review notes;
- closeout summary.

## Build Log

Completed in worktree:

- Added a transcript import operation-state area to the workflow panel.
- Added reusable write-operation presentation classes for:
  - step indicators;
  - write-operation badge;
  - amber write warning;
  - success/error result banners.
- Refreshed transcript import states in `src/renderer.ts`:
  - ready/choose file;
  - previewing;
  - confirm import;
  - importing;
  - success;
  - error.
- Changed user-facing transcript import copy to Norwegian.
- Preserved the existing backend import behavior and IPC boundary.
- Kept native file selection, `previewId` confirmation, copy-not-move behavior, and strict `NN. filename.ext` numbering.
- After successful import, the project is rescanned and the imported file is selected in the folder tree when present.
- Updated UI smoke tests to cover:
  - preview details;
  - explicit write warning;
  - back from confirmation;
  - successful import and tree update;
  - native file picker cancellation;
  - preview error with no-change feedback.

Implementation deviations:

- No backend changes were needed.
- The write-operation primitives were added as lightweight shared CSS/renderer helpers, not extracted into a separate component system. This keeps the change small and lets `TASK-0020` reuse the pattern without creating new architecture first.

Baseline note:

- Initial baseline failed in the newly created worktree because `node_modules` was not installed there.
- Ran `npm install` in the worktree.
- Re-ran baseline successfully before implementation:
  - `npm run check` passed.
  - `npm run test:ui` passed, 15 tests.
  - `npm test` passed, 57 tests.

## Verification Log

Final verification from the task worktree:

```text
npm run check
```

Passed.

```text
npm test
```

Passed: 15 test files, 57 tests.

```text
npm run test:ui
```

Passed: 17 UI tests.

## Review Notes

Human tested the implemented flow and confirmed: "det fungerer".

## Documentation Notes

Task record updated with build log, verification log, review result, and closeout.

## Closeout

TASK-0019 refreshed the transcript import write workflow while preserving the existing import backend behavior.

Completed outputs:

- Transcript import now uses the shared write-operation pattern.
- Import preview clearly shows source, target, generated filename, numbering, and write intent.
- Success state confirms the original source file remains unchanged.
- Successful import rescans the project and selects the imported file in the folder tree.
- UI smoke tests cover preview, back/cancel, successful import, picker cancellation, and preview error.

Final status: accepted and closed.
