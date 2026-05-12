# Task: Transcription Summary On Import

ID: TASK-0026
Status: Specified
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
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
- `closed/TASK-0023-codex-cli-path-discovery.md`
- `closed/TASK-0024-settings-codex-path.md`
- `TASK-0018-folder-hierarchy-artifact-detail.md`
- `TASK-0019-write-pattern-transcript-import.md`
Coordinates with:
- `TASK-0025-project-summary-from-context.md`
- `TASK-0021-controlled-codex-assistant-refresh.md`

## Summary

Generate a short Norwegian conversation summary every time Sidekick imports a transcription.

The summary is produced by Codex from the imported transcription file, stored under the project `.sidekick/` metadata folder, and shown read-only in the GUI when the user selects that transcription.

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

## Resolved Decisions

- Summary generation happens when a transcription is added through the import workflow.
- The summary is only a summary of the conversation in the transcription.
- The summary is shown in the GUI when that transcription file is selected.
- The prompt is application logic and should live in Sidekick's source code.
- The generated summary should be stored in the project folder under `.sidekick/`.
- The summary is read-only in the UI.

## Storage Recommendation

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
- The relative-path hash gives a stable lookup key without making unsafe filenames from project paths.

## Transcription Summary File Contract

`*.summary.md` should be Sidekick-owned generated metadata.

Recommended structure:

```markdown
---
sidekick_schema: transcription-summary.v1
generated_at: 2026-05-12T12:00:00.000Z
transcription_path: ./01. Transkripsjoner/00. samtale.md
transcription_sha256: <hash>
summary_language: nb
---

# Sidekick Transcription Summary

## Conversation Summary

<short generated summary of the conversation>
```

Parsing contract:
- Sidekick reads `## Conversation Summary` for GUI display.
- `generated_at`, `transcription_path`, `transcription_sha256`, and `summary_language` are used to show freshness and trace which transcription produced the summary.
- Unknown future sections should be ignored by the first parser.
- First version may overwrite the summary file for the same transcription path because it is generated Sidekick metadata.

## Prompt Storage

Store the reusable prompt template in application source.

Suggested path:

```text
src/main/prompts/transcription-summary.nb.ts
```

Rationale:
- The prompt is application behavior and should be versioned with Sidekick.
- A TypeScript module is safer for the first version because Electron Forge/Vite already bundles TypeScript entry dependencies.
- The project `.sidekick/` folder should store generated output, not prompt logic.

Suggested prompt:

```text
Du er Sidekick, en lokal applikasjon som hjelper brukeren å forstå transkripsjoner i et prosjekt.

Lag et kort, presist sammendrag på norsk av samtalen i transkripsjonen.

Bruk bare informasjon som finnes i transkripsjonen. Ikke finn opp personer, roller, beslutninger eller temaer. Hvis samtalen er uklar eller mangler nok innhold, skriv det tydelig.

Sammendraget skal passe i et detaljpanel i GUI-et.

Returner bare Markdown med nøyaktig denne seksjonen:

## Conversation Summary
Skriv 4-8 korte setninger som oppsummerer hva samtalen handler om, hvilke hovedpunkter som diskuteres, og eventuelle tydelige konklusjoner. Ikke legg til egne råd, oppgaver, tema-lister eller analyse utover samtalesammendraget.
```

## Workflow

1. User imports a transcription.
2. Sidekick validates and copies the transcription into the detected transcription folder.
3. Sidekick reads the imported transcription file.
4. Sidekick runs Codex with the Norwegian transcription-summary prompt and the imported transcription content.
5. Sidekick validates that the Codex response contains `## Conversation Summary`.
6. Sidekick writes `.sidekick/transcription-summaries/<key>.summary.md`.
7. Sidekick rescans the project after import, as today.
8. When the user selects the imported transcription in the GUI, Sidekick shows the read-only conversation summary.

## Scope

- Generate a summary for newly imported text/Markdown transcriptions.
- Create `.sidekick/transcription-summaries/` on demand.
- Store one generated Markdown summary per imported transcription.
- Add typed main/preload APIs for reading a transcription summary by selected transcription path.
- Show the summary in the selected artifact/detail view when a transcript file is selected.
- Surface import-time summary generation status and errors.
- Preserve the existing copy-not-move import behavior.
- Preserve the existing strict `NN. filename.ext` numbering behavior.

## Non-goals

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

## UI Requirements

- When a transcript file is selected, show a read-only `Samtalesammendrag` section if a summary exists.
- If no summary exists for the selected transcription, show a compact missing state.
- If summary generation failed during import, show a clear import result message.
- Do not show task extraction, action items, themes, or project-level analysis in this surface.
- Keep user-facing text Norwegian.
- Avoid long explanatory UI copy.

## Security Requirements

- Keep filesystem reads and writes in the main process.
- Keep Codex execution in the main process.
- Do not expose raw filesystem, shell, process, or IPC APIs to the renderer.
- Do not let the renderer provide arbitrary Codex command arguments.
- Codex should not write summary files directly. Sidekick should capture Codex output and write the summary file itself.
- Validate selected transcription paths against the selected project root before reading summary metadata.
- Exclude `.sidekick/` from scans and context package input where relevant.

## Error Handling

- If transcription import fails, summary generation must not start.
- If Codex is unavailable or not logged in, import still succeeds, but summary status is `failed`.
- If Codex is already running, import still succeeds, but summary status is `failed`.
- If Codex returns malformed output, import still succeeds, but no summary file is written.
- If `.sidekick/transcription-summaries/` cannot be created or written, import still succeeds, but summary status is `failed`.
- Selecting a transcription without a summary should not be treated as a fatal error.

## Acceptance Criteria

- [ ] A newly imported transcription triggers summary generation after the file has been copied.
- [ ] Summary generation uses Codex and the imported transcription content.
- [ ] Codex runs in read-only mode for this workflow.
- [ ] Codex does not write the summary file directly.
- [ ] `.sidekick/transcription-summaries/` is created on demand.
- [ ] A Markdown summary file is written with front matter and `## Conversation Summary`.
- [ ] Summary is Norwegian.
- [ ] The imported transcription keeps the strict `NN. filename.ext` numbering.
- [ ] Import still succeeds if summary generation fails.
- [ ] The import result exposes summary success/failure status.
- [ ] Selecting a transcript file in the GUI shows the read-only conversation summary when available.
- [ ] Selecting a transcript file without a summary shows a compact missing state.
- [ ] Tests cover summary filename/key generation.
- [ ] Tests cover summary Markdown writing/parsing.
- [ ] Tests cover import success plus summary success.
- [ ] Tests cover import success plus summary failure.
- [ ] UI smoke tests cover selecting a transcription with a summary.

## Open Questions

None blocking.

Implementation should use these assumptions unless changed before planning:
- Summary language is Norwegian.
- Summary is generated only for newly imported transcriptions.
- Existing transcriptions can be handled by a later backlog/task if needed.
- Summary storage should reuse the `.sidekick/` metadata convention from `TASK-0025`.

## Implementation Plan

Not started. Stop after Specify until this task is explicitly approved for planning/build.

Suggested build sequence:
1. Add transcription summary writer/parser and path-key helper.
2. Add reusable Norwegian transcription-summary prompt template.
3. Add main-process transcription summary generator that runs Codex from imported transcription text and captures Markdown output.
4. Couple summary generation to `confirmTranscriptionImport` after copy succeeds.
5. Extend shared import result types with summary status.
6. Add typed API to read summary by selected transcript path.
7. Show read-only summary in selected artifact/detail UI after `TASK-0018`.
8. Add unit, integration, and UI tests.
9. Run full verification.

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
