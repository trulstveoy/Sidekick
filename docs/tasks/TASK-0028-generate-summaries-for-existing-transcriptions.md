# Task: Generate Summaries For Existing Transcriptions

ID: TASK-0028
Status: Specified
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-13
Branch: task/TASK-0028-generate-summaries-for-existing-transcriptions
Worktree: ../Sidekick-worktrees/TASK-0028-generate-summaries-for-existing-transcriptions
Base branch: origin/main
Write scope:
- `src/main/transcription-summary.ts`
- `src/main/transcription-importer.ts`
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
- `TASK-0026-transcription-summary-on-import.md`
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

Specify

Specification is complete. Planning has not started.

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [ ] Plan complete
- [ ] Worktree created or reused, if required
- [ ] Human approval received, if required
- [ ] Build complete
- [ ] Verification complete
- [ ] Review complete
- [ ] Documentation complete
- [ ] Closeout complete

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

- [ ] Sidekick can detect existing transcription files without summaries.
- [ ] User sees a preview before summary generation starts.
- [ ] Missing summaries can be generated through Codex in read-only mode.
- [ ] Invalid summary metadata can be replaced after batch confirmation.
- [ ] Existing valid summaries are not overwritten by default.
- [ ] Stale summaries can be detected using transcription hash.
- [ ] Stale summaries are not regenerated in this first version.
- [ ] Partial failures do not discard successful summaries.
- [ ] Codex failure for one file does not stop remaining files.
- [ ] Summary files use the same contract as `TASK-0026`.
- [ ] UI shows generation progress and per-file failures in the primary workspace.
- [ ] The action appears only for selected transcription-folder context.
- [ ] Selected-transcription display remains read-only in the file context surface.
- [ ] Tests cover missing, present, stale, invalid, and failed summary cases.
- [ ] Tests cover continue-after-failure behavior.
- [ ] UI smoke coverage covers selected transcription-folder action, preview, confirmation, partial failure, and selected-file summary display.

## Deferred Questions

- How should this workflow evolve if transcriptions later live in a shared library and are linked to multiple projects?
- Should stale-summary regeneration become a separate explicit workflow?
- Should users later be able to select individual transcription files before generation?
- Should long-running batches become cancelable?
- Should a future maintenance/settings surface collect summary repair workflows across projects?

## Implementation Plan

Not started. Stop after Specify until this task is explicitly approved for planning.

## Build Log

Not started.

## Verification Log

Not started.

## Review Notes

Not started.

## Documentation Notes

Not started.

## Closeout

Not started.
