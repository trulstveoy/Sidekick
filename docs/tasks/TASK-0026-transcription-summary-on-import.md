# Task: Transcription Summary On Import

ID: TASK-0026
Status: Specified
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-13
Branch: task/TASK-0026-transcription-summary-on-import
Worktree: ../Sidekick-worktrees/TASK-0026-transcription-summary-on-import
Base branch: origin/main
Write scope:
- `src/main/transcription-importer.ts`
- `src/main/transcription-summary.ts`
- `src/main/prompts/transcription-summary.nb.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0026-transcription-summary-on-import.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0007-add-transcription-import.md`
- `closed/TASK-0010-controlled-codex-panel.md`
- `closed/TASK-0012-strict-numbering-format.md`
- `closed/TASK-0018-folder-hierarchy-artifact-detail.md`
- `closed/TASK-0019-write-pattern-transcript-import.md`
- `closed/TASK-0021-controlled-codex-assistant-refresh.md`
- `closed/TASK-0023-codex-cli-path-discovery.md`
- `closed/TASK-0024-settings-codex-path.md`
- `closed/TASK-0033-revised-navigation-model.md`
Coordinates with:
- `TASK-0025-project-summary-from-context.md`
- `TASK-0028-generate-summaries-for-existing-transcriptions.md`
- `BACKLOG.md` (`BL-0008`)

## Summary

Generate a short Norwegian conversation summary when Sidekick imports a transcription.

The first version stays project-local: the imported file is copied into the detected transcription folder, Codex summarizes that copied file in read-only mode, Sidekick stores the generated summary under `.sidekick/`, and the summary appears read-only when that transcription file is selected.

## Current Phase

Specify

Specification is updated. Planning has not started.

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

## Links

Related docs:
- `../architecture/desktop-design-guidelines.md`
- `../architecture/product-vision.md`
- `../architecture/prosjektuavhengig-innholdsmodell.md`

Related tasks:
- `closed/TASK-0019-write-pattern-transcript-import.md`
- `closed/TASK-0021-controlled-codex-assistant-refresh.md`
- `closed/TASK-0033-revised-navigation-model.md`
- `TASK-0028-generate-summaries-for-existing-transcriptions.md`

## Explore Notes

Current baseline:

- Transcript import is a global project action that runs in the primary workspace under the revised navigation model.
- The right context surface remains tied to the selected project, folder, or file while import runs.
- Import accepts `.txt`, `.md`, and `.markdown` files only.
- The main process detects exactly one transcription folder through folder signals and copies the selected file into that folder.
- Destination filenames use strict `NN. original-name.ext` numbering.
- The renderer confirms imports by `previewId`; it never submits an arbitrary destination path.
- Codex can run in read-only mode and write mode, but this task should use read-only mode only.
- Only one Codex process can run at a time in the first version.
- The project-independent content model is only a draft. This task should not introduce shared transcription libraries or cross-project assignment.

## Resolved Decisions

- Summary generation happens after a transcription import has successfully copied the file.
- The summary is based on the copied transcription inside the selected project, not the original source file outside the project.
- The summary is only a summary of the conversation in the transcription.
- The summary is shown in the selected file context surface when that transcription file is selected.
- The prompt is application logic and should live in Sidekick's source code.
- Generated summaries are stored in the project folder under `.sidekick/`.
- The summary is read-only in the UI.
- Import still succeeds if summary generation fails.
- Summary generation failure should be visible in the import result and later as a compact missing/failed state for the selected transcription.

## Task Spec

### Problem

Sidekick can import transcription files, but imported transcriptions do not receive a compact conversation summary that can be read from the file context surface.

Users need a quick way to understand a transcription without opening the full file or running a separate manual Codex instruction.

### Goal

When a transcription import completes, Sidekick should generate and store a short Norwegian conversation summary for the copied transcription file.

### Storage Recommendation

Use Markdown as the first-version storage format, aligned with `TASK-0025`.

Project metadata folder:

```text
<project-root>/.sidekick/
```

Transcription summary folder:

```text
<project-root>/.sidekick/transcription-summaries/
```

Each imported transcription should get one generated summary file. Recommended filename:

```text
<sha256-of-transcription-relative-path>.summary.md
```

Rationale:

- The generated summary stays out of the numbered transcription folder.
- The strict `NN. filename.ext` transcription numbering remains untouched.
- Summary files do not pollute scans or future context packages when `.sidekick/` is excluded.
- The relative-path hash gives a stable first-version lookup key without unsafe filenames.
- A later project-independent content model may need artifact IDs beyond relative paths; that is out of scope here.

### Transcription Summary File Contract

`*.summary.md` should be Sidekick-owned generated metadata.

Recommended structure:

```markdown
---
sidekick_schema: transcription-summary.v1
generated_at: 2026-05-13T12:00:00.000Z
transcription_path: ./01. Transkripsjoner/00. samtale.md
transcription_sha256: <hash>
summary_language: nb
---

# Sidekick Transcription Summary

## Conversation Summary

<short generated summary of the conversation>
```

Parsing contract:

- Sidekick reads `## Conversation Summary` for selected-file context display.
- `generated_at`, `transcription_path`, `transcription_sha256`, and `summary_language` are used to show freshness and trace which transcription produced the summary.
- Unknown future sections should be ignored by the first parser.
- First version may overwrite the summary file for the same transcription path because it is generated Sidekick metadata.

### Prompt Storage

Store the reusable prompt template in application source.

Suggested path:

```text
src/main/prompts/transcription-summary.nb.ts
```

Suggested prompt:

```text
Du er Sidekick, en lokal applikasjon som hjelper brukeren å forstå transkripsjoner i et prosjekt.

Lag et kort, presist sammendrag på norsk av samtalen i transkripsjonen.

Bruk bare informasjon som finnes i transkripsjonen. Ikke finn opp personer, roller, beslutninger eller temaer. Hvis samtalen er uklar eller mangler nok innhold, skriv det tydelig.

Sammendraget skal passe i et detaljpanel i Sidekick.

Returner bare Markdown med nøyaktig denne seksjonen:

## Conversation Summary
Skriv 4-8 korte setninger som oppsummerer hva samtalen handler om, hvilke hovedpunkter som diskuteres, og eventuelle tydelige konklusjoner. Ikke legg til egne råd, oppgaver, tema-lister eller analyse utover samtalesammendraget.
```

### Scope

- Generate a summary for newly imported text/Markdown transcriptions.
- Summarize the copied destination file after import, not the external source file.
- Create `.sidekick/transcription-summaries/` on demand.
- Store one generated Markdown summary per imported transcription path.
- Add typed main/preload APIs for reading a transcription summary by selected transcription path.
- Show the summary in the selected file context surface when a transcript file is selected.
- Surface import-time summary generation status and errors in the primary workspace result.
- Preserve the existing copy-not-move import behavior.
- Preserve strict `NN. filename.ext` numbering.
- Exclude `.sidekick/` from scans and context package input where relevant.

### Non-goals

- Summarizing existing transcriptions already present before this task.
- Batch summary generation.
- Manual summary editing.
- Manual regeneration button.
- Summary history or versions.
- Audio transcription.
- Changing import file types.
- Changing transcription numbering.
- Moving summaries into the numbered transcription folder.
- Running Codex independently of the import workflow.
- Project-independent transcription libraries or multi-project transcription assignment.

### UI Requirements

- Transcript import remains a primary-workspace workflow.
- The right context surface remains stable while import and summary generation run.
- When a transcript file is selected, show a read-only `Samtalesammendrag` section if a summary exists.
- If no summary exists for the selected transcription, show a compact missing state.
- If summary generation failed during import, show a clear import result message.
- Do not show task extraction, action items, themes, or project-level analysis in this surface.
- Keep user-facing text Norwegian.
- Avoid long explanatory UI copy.

### Security Requirements

- Keep filesystem reads and writes in the main process.
- Keep Codex execution in the main process.
- Do not expose raw filesystem, shell, process, or IPC APIs to the renderer.
- Do not let the renderer provide arbitrary Codex command arguments.
- Codex should not write summary files directly. Sidekick should capture Codex output and write the summary file itself.
- Validate selected transcription paths against the selected project root before reading summary metadata.
- Exclude `.sidekick/` from scans and context package input where relevant.

### Error Handling

- If transcription import fails, summary generation must not start.
- If Codex is unavailable or not logged in, import still succeeds, but summary status is `failed`.
- If Codex is already running, import still succeeds, but summary status is `failed`.
- If Codex returns malformed output, import still succeeds, but no summary file is written.
- If `.sidekick/transcription-summaries/` cannot be created or written, import still succeeds, but summary status is `failed`.
- Selecting a transcription without a summary should not be treated as a fatal error.

### Acceptance Criteria

- [ ] A newly imported transcription triggers summary generation after the file has been copied.
- [ ] Summary generation uses Codex and the copied transcription content.
- [ ] Codex runs in read-only mode for this workflow.
- [ ] Codex does not write the summary file directly.
- [ ] `.sidekick/transcription-summaries/` is created on demand.
- [ ] A Markdown summary file is written with front matter and `## Conversation Summary`.
- [ ] Summary is Norwegian.
- [ ] The imported transcription keeps strict `NN. filename.ext` numbering.
- [ ] Import still succeeds if summary generation fails.
- [ ] The import result exposes summary success/failure status.
- [ ] Selecting a transcript file in the context surface shows the read-only conversation summary when available.
- [ ] Selecting a transcript file without a summary shows a compact missing state.
- [ ] Tests cover summary filename/key generation.
- [ ] Tests cover summary Markdown writing/parsing.
- [ ] Tests cover import success plus summary success.
- [ ] Tests cover import success plus summary failure.
- [ ] UI smoke coverage covers selected-transcript summary display.

## Open Points For Future Planning

- Should the summary key include both relative path and content hash, or should the content hash remain metadata only?
- Should selecting a stale summary show a warning when the transcription hash has changed?
- Should failed import-time summary generation be retryable in a later maintenance workflow?
- How should this contract evolve if transcriptions later live in a shared library and are linked to multiple projects?

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
