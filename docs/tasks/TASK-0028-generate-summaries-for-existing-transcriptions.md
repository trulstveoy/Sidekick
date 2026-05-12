# Task: Generate Summaries For Existing Transcriptions

ID: TASK-0028
Status: Specified
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0028-generate-summaries-for-existing-transcriptions
Worktree: ../Sidekick-worktrees/TASK-0028-generate-summaries-for-existing-transcriptions
Base branch: origin/main
Write scope:
- `src/main/transcription-summary.ts`
- `src/main/transcription-importer.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
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
Coordinates with:
- `TASK-0021-controlled-codex-assistant-refresh.md`

## Summary

Generate Codex summaries for transcription files that already exist in a project.

This extends the imported-transcription summary workflow to cover older or manually added transcriptions that were not summarized when imported.

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

## Task Spec

### Problem

`TASK-0026` summarizes newly imported transcriptions only. Projects may already contain transcription files before that workflow exists.

Those existing transcriptions need a controlled way to get the same read-only conversation summaries.

### Goal

Allow Sidekick to find existing transcription files without summaries and generate missing summaries through Codex.

### Scope

- Detect existing text/Markdown transcription files in the project's detected transcription folder.
- Compare detected transcription files with existing `.sidekick/transcription-summaries/` metadata.
- Preview how many summaries are missing, present, invalid, or stale.
- Generate missing summaries through Codex.
- Optionally regenerate stale summaries when a transcription hash has changed.
- Store summaries using the same file contract as `TASK-0026`.
- Show progress and failures in the GUI.
- Preserve successful summaries when later files fail.
- Keep selected-transcription summary display read-only.

### Non-goals

- Audio transcription.
- Summarizing arbitrary non-transcription documents.
- Editing summaries.
- Extracting tasks/action items.
- Changing transcription import behavior.
- Changing strict filename numbering.
- Running without user action.

### User Workflow

1. User opens the transcription summary maintenance action.
2. Sidekick scans the transcription folder.
3. Sidekick shows a preview of missing/present/stale summaries.
4. User confirms generation.
5. Sidekick generates summaries one file at a time.
6. Sidekick reports completed and failed files.
7. Selecting a transcript shows the available read-only summary.

### Security Requirements

- Keep filesystem reads and writes in the main process.
- Keep Codex execution in the main process.
- Do not expose raw filesystem, shell, process, or IPC APIs to the renderer.
- Validate all transcription paths against the selected project root.
- Do not let Codex write summary files directly.
- Preserve existing summaries unless regeneration is explicitly confirmed.

### Acceptance Criteria

- [ ] Sidekick can detect existing transcription files without summaries.
- [ ] User sees a preview before summary generation starts.
- [ ] Missing summaries can be generated through Codex.
- [ ] Existing valid summaries are not overwritten by default.
- [ ] Stale summaries can be detected using transcription hash.
- [ ] Partial failures do not discard successful summaries.
- [ ] Summary files use the same contract as `TASK-0026`.
- [ ] UI shows generation progress and per-file failures.
- [ ] Tests cover missing, present, stale, and failed summary cases.

## Open Points

- Should the first version include stale-summary regeneration, or only missing-summary generation?
- Should users be able to select individual transcription files, or should the workflow process all missing summaries?
- Should long batch jobs be cancelable?
- Should Codex failures stop the batch or continue with the next file?
- Should this action live in the transcription import panel, selected-folder detail, or a later maintenance/settings surface?

## Implementation Plan

Not started. Stop after Specify until this task is explicitly approved for planning/build.

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
