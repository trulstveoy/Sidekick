# Task: Generate Summaries For Existing Transcriptions

ID: TASK-0028
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-14
Branch: task/TASK-0028-generate-summaries-for-existing-transcriptions
Worktree: ../Sidekick-worktrees/TASK-0028-generate-summaries-for-existing-transcriptions
Base branch: local main at `931c22b`
Write scope:
- `src/main/transcription-summary.ts`
- `src/main/transcription-summary-batch.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0028-generate-summaries-for-existing-transcriptions.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0026-transcription-summary-on-import.md`
- `closed/TASK-0018-folder-hierarchy-artifact-detail.md`
- `closed/TASK-0019-write-pattern-transcript-import.md`
- `closed/TASK-0021-controlled-codex-assistant-refresh.md`
- `closed/TASK-0033-revised-navigation-model.md`
Coordinates with:
- `TASK-0031-local-searchable-project-index.md`
- `BACKLOG.md` (`BL-0008`)

## Summary

Generate Codex summaries for transcription files that already exist in a selected project.

This extends the imported-transcription summary contract from `TASK-0026` so older or manually added project-local transcriptions can receive the same read-only conversation summaries.

## Current Phase

Close

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

## Backlog Source

Promoted from `BL-0002`.

## Links

Related docs:
- `../architecture/desktop-design-guidelines.md`
- `../architecture/prosjektuavhengig-innholdsmodell.md`

Related tasks:
- `TASK-0026-transcription-summary-on-import.md`
- `TASK-0031-local-searchable-project-index.md`

## Explore Notes

Current baseline:

- `TASK-0026` defines the generated summary file contract for imported transcriptions.
- The scanner marks folders and files with transcript signals based on names and context hints.
- Transcription import currently requires exactly one detected transcription folder.
- The revised navigation model places long-running workflows in the primary workspace and keeps the context surface tied to the selected object.
- Codex has controlled read-only execution, login/status checks, cancellation, and one-active-run behavior.
- The project-independent content model is only an exploration. This task should process files in the selected project folder only.

## Resolved Decisions

- First version generates summaries for files with missing or invalid summary metadata.
- First version detects stale summaries using transcription content hash, but does not regenerate stale summaries automatically.
- Existing valid summaries are not overwritten in this task.
- Stale-summary regeneration is deferred to a later explicit regeneration workflow.
- The workflow processes all missing and invalid summaries in the detected transcription folder after one confirmation.
- Users do not select individual transcription files in the first version.
- Long-running batch jobs are not cancelable in the first version once generation has started.
- Codex failures are handled per file. A failed file does not stop the batch.
- The workflow continues with the next file after Codex failure, malformed output, write failure, or read failure.
- The result shows completed, skipped, stale, invalid, and failed counts plus per-file failure details.
- The action should live in selected transcription-folder context in the first version.
- The action starts a primary-workspace workflow. The right context surface remains tied to the selected transcription folder while the batch runs.
- Shared transcription libraries and multi-project transcription assignment remain out of scope.

## Task Spec

### Problem

`TASK-0026` summarizes newly imported transcriptions only. Projects may already contain transcription files before that workflow exists, and users may manually add transcription files outside Sidekick.

Those existing transcriptions need a controlled way to get the same read-only conversation summaries without changing import behavior.

### Goal

Allow Sidekick to find existing project-local transcription files without summaries and generate missing summaries through Codex.

### Scope

- Detect existing `.txt`, `.md`, and `.markdown` transcription files in the project's detected transcription folder.
- Compare detected transcription files with existing `.sidekick/transcription-summaries/` metadata.
- Preview counts for missing, present, invalid, and stale summaries.
- Generate missing summaries through Codex in read-only mode.
- Generate replacement summaries for invalid summary metadata after the user confirms the batch.
- Detect stale summaries using transcription hash, but leave them unchanged in the first version.
- Store summaries using the same file contract as `TASK-0026`.
- Show preview, progress, partial completion, and failures in the primary workspace.
- Preserve successful summaries when later files fail.
- Keep selected-transcription summary display read-only in the file context surface.
- Exclude `.sidekick/` from scans and context-package input where relevant.

### Non-goals

- Audio transcription.
- Summarizing arbitrary non-transcription documents.
- Summarizing files outside the selected project root.
- Shared transcription library support.
- Editing summaries.
- Extracting tasks/action items.
- Changing transcription import behavior.
- Changing strict filename numbering.
- Running without explicit user action.
- Replacing local search or project indexing.
- Regenerating stale summaries.
- Selecting individual files for summary generation.
- Canceling a batch after generation has started.

### User Workflow

1. User selects the detected transcription folder in the tree.
2. User starts transcription summary maintenance from the selected transcription-folder context action.
2. Sidekick scans the selected project's transcription folder.
3. Sidekick shows a preview of missing, present, invalid, and stale summaries.
4. User confirms generation for all missing and invalid summaries.
5. Sidekick generates summaries one file at a time.
6. Sidekick continues after per-file failures.
7. Sidekick reports completed, skipped, stale, invalid, and failed files.
8. Selecting a transcript shows the available read-only summary in the file context surface.

### UI Requirements

- The maintenance workflow runs in the primary workspace.
- The right context surface must not become the batch progress surface.
- The action is shown from selected transcription-folder context, not as an always-visible global action.
- The action is not shown for ordinary folders, files, or project root.
- Preview must show how many files will be written before confirmation.
- Progress should make partial success and failed files easy to scan.
- Stale summaries should be visible in the preview and result as "not regenerated in this version".
- User-facing text should be Norwegian.

### Security Requirements

- Keep filesystem reads and writes in the main process.
- Keep Codex execution in the main process.
- Do not expose raw filesystem, shell, process, or IPC APIs to the renderer.
- Validate all transcription paths against the selected project root.
- Do not let Codex write summary files directly.
- Preserve existing summaries unless regeneration is explicitly confirmed.
- Do not let the renderer submit arbitrary file paths for batch processing.
- Do not let the renderer choose individual file paths for this first batch workflow.
- Confirmation should use a main-process-owned preview/batch id, not a renderer-provided file list.

### Acceptance Criteria

- [x] Sidekick can detect existing transcription files without summaries.
- [x] User sees a preview before summary generation starts.
- [x] Missing summaries can be generated through Codex in read-only mode.
- [x] Invalid summary metadata can be replaced after batch confirmation.
- [x] Existing valid summaries are not overwritten by default.
- [x] Stale summaries can be detected using transcription hash.
- [x] Stale summaries are not regenerated in this first version.
- [x] Partial failures do not discard successful summaries.
- [x] Codex failure for one file does not stop remaining files.
- [x] Summary files use the same contract as `TASK-0026`.
- [x] UI shows generation progress and per-file failures in the primary workspace.
- [x] The action appears only for selected transcription-folder context.
- [x] Selected-transcription display remains read-only in the file context surface.
- [x] Tests cover missing, present, stale, invalid, and failed summary cases.
- [x] Tests cover continue-after-failure behavior.
- [x] UI smoke coverage covers selected transcription-folder action, preview, confirmation, partial failure, and selected-file summary display.

## Deferred Questions

- How should this workflow evolve if transcriptions later live in a shared library and are linked to multiple projects?
- Should stale-summary regeneration become a separate explicit workflow?
- Should users later be able to select individual transcription files before generation?
- Should long-running batches become cancelable?
- Should a future maintenance/settings surface collect summary repair workflows across projects?

## Implementation Plan

### Plan Status

Approved for build.

### Base And Worktree

- Worktree: `../Sidekick-worktrees/TASK-0028-generate-summaries-for-existing-transcriptions`
- Branch: `task/TASK-0028-generate-summaries-for-existing-transcriptions`
- Base: local `main` at `931c22b`, because local `main` contains the closed `TASK-0026` implementation and related local commits not yet present on `origin/main`.
- Baseline: `npm run check` passed after installing dependencies in the worktree. The mechanical `package-lock.json` change from `npm install` was restored and is not part of this task.

### Implementation Steps

1. Extend shared contracts
   - Add typed preview, result, item, and count types for batch transcription summary generation.
   - Keep the renderer contract narrow:
     - `previewTranscriptionSummaryBatch(rootPath)`
     - `confirmTranscriptionSummaryBatch(previewId)`
   - Use a main-process-owned `previewId`; the renderer must not submit file lists or arbitrary paths.

2. Add main-process batch workflow
   - Create `src/main/transcription-summary-batch.ts`.
   - Reuse `findTranscriptionFolders` from `transcription-importer.ts` so the batch follows the same “exactly one transcription folder” rule as import.
   - Detect candidate files only inside the detected transcription folder.
   - Include only `.txt`, `.md`, and `.markdown`.
   - For each candidate, call `readTranscriptionSummary`.
   - Classify each file as:
     - `missing`: generate;
     - `invalid`: generate replacement;
     - `complete`: skip;
     - `stale`: skip in this version.
   - Store preview data in a pending map in `main.ts`.

3. Generate summaries sequentially
   - Confirm by `previewId`.
   - Revalidate the selected project root and rebuild the candidate list before generating.
   - Generate only files that are currently `missing` or `invalid`.
   - Use the same `generateTranscriptionSummary` function and storage contract as `TASK-0026`.
   - Continue after per-file failures.
   - Return counts and per-file result details.
   - Refresh the project scan after completion.

4. Add UI workflow
   - Add a new primary-workspace workflow panel for transcription summary maintenance.
   - Show the action only when the selected node is the detected transcription folder.
   - Keep the right context surface tied to the selected folder.
   - Preview state shows counts before any writes:
     - missing;
     - invalid;
     - complete;
     - stale;
     - total transcription files.
   - Confirm state explains that Sidekick will write `.sidekick/transcription-summaries/`.
   - Generating state shows that the batch is running and cannot be canceled in this version.
   - Result state shows generated, failed, skipped, stale, invalid, and total counts plus per-file failures.
   - Do not add stale regeneration or per-file selection.

5. Preserve existing flows
   - Do not change import behavior from `TASK-0026`.
   - Do not change selected-file read-only summary display.
   - Do not change context-package generation, document relationship analysis, project summary generation, or Codex panel behavior.
   - Avoid broad renderer refactors; add the new workflow beside existing workflow patterns.

6. Verification and tests
   - Unit tests:
     - batch candidate classification;
     - missing/complete/stale/invalid count calculation;
     - continue-after-failure result handling where practical.
   - Integration tests:
     - preview detects missing, complete, stale, and invalid summaries;
     - confirm generates missing and invalid summaries;
     - confirm skips complete and stale summaries;
     - Codex failure for one file does not stop the rest;
     - preview id is required for confirmation.
   - UI smoke tests:
     - action appears only on selected transcription folder;
     - preview and confirmation show counts;
     - result shows partial failure and completed counts;
     - selecting a summarized transcription still shows the read-only summary.

### Manual Verification Instructions For Ready For Review

After build, verify from `main` or the task worktree with `npm start`:

1. Select a project folder with one detected transcription folder.
2. Put at least two `.md` or `.txt` transcriptions in that folder.
3. Select the transcription folder in the tree.
4. Confirm the right context surface shows an action for generating missing summaries.
5. Start the workflow and check the preview counts.
6. Confirm generation.
7. Confirm the result reports generated/skipped/failed counts.
8. Select one generated transcription and confirm `Samtalesammendrag` appears in the context surface.
9. Confirm the workflow does not appear for ordinary folders, files, or the project root.

### Risks And Guardrails

- Long-running batch jobs are intentionally not cancelable in this version; the UI must say this clearly.
- Existing valid summaries must not be overwritten.
- Stale summaries must be detected but not regenerated.
- Codex must run read-only; Sidekick writes summary files after validating output.
- Renderer must never send file lists or summary paths.
- Main process must validate every generated path against the selected project root.
- `.sidekick/` must remain hidden from scans and context-package input.

## Build Log

- Added shared preview/result contracts for batch transcription summary generation.
- Added `src/main/transcription-summary-batch.ts` for main-process preview and sequential generation.
- Added IPC/preload methods:
  - `previewTranscriptionSummaryBatch(rootPath)`
  - `confirmTranscriptionSummaryBatch(previewId)`
- Added a primary-workspace workflow for generating missing transcription summaries.
- Added the selected-folder action only for the detected transcription folder.
- Kept existing valid summaries untouched and stale summaries skipped in this version.
- Preserved existing import, context package, document relationship, and Codex workflows.

## Verification Log

- `npm run check` passed.
- `npm test` passed: 100 tests.
- `npm run test:ui` passed: 30 UI tests.

## Review Notes

Human review complete.

- 2026-05-14: Human confirmed the workflow works as expected.

Manual check:

1. Start the app with `npm start`.
2. Select a project with exactly one transcriptions folder.
3. Select the transcriptions folder in the tree.
4. Confirm the right panel shows `Generer manglende sammendrag`.
5. Click it, run the preview, and confirm the counts look right.
6. Generate summaries and check the result counts.
7. Select a transcript afterwards and confirm the read-only `Samtalesammendrag` still appears when a summary exists.
8. Confirm the action is not shown on project root, ordinary folders, or files.

## Documentation Notes

Task record updated with build and verification status.

## Closeout

TASK-0028 is done.

Delivered:
- Existing project-local transcriptions can be previewed for missing, invalid, complete, and stale summaries.
- Missing and invalid summaries can be generated through the main-process Codex workflow.
- Valid summaries are preserved, stale summaries are detected but not regenerated, and per-file failures do not stop the batch.
- The renderer uses typed IPC/preload APIs and does not send file lists or summary paths.
- The primary workspace shows preview, progress, and result states while the selected-folder context remains separate.

Verified:
- `npm run check` passed during build verification and again on `main` after merge.
- `npm test` passed during build verification.
- `npm run test:ui` passed during build verification.
- Human manual review confirmed the workflow works.

Follow-up:
- Stale-summary regeneration, per-file selection, and cancelable long-running batches remain deferred future work.
