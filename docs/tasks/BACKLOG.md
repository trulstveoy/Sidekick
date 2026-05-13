# Backlog

This backlog tracks deferred ideas that may become tasks later.

Backlog items are not approved work. Active work belongs in `docs/tasks/TASK-0000-title.md`. Completed work belongs in `docs/tasks/closed/`.

## How To Use This Backlog

- Add an item when useful future work is discovered but deliberately left out of the current task.
- Keep each item short enough to scan.
- Give each item a stable `BL-0000` id.
- Link the source task, report, decision, or conversation context when available.
- State why the item was deferred.
- State the next decision or trigger that would turn the item into a task.
- When an item becomes active work, create a normal `TASK-0000-title.md` file and mark the backlog item as `Promoted`.

## Status Values

- `Candidate`: captured idea that still needs refinement.
- `Deferred`: valid future work, intentionally not part of current scope.
- `Ready for Task`: clear enough to become a task when prioritized.
- `Promoted`: converted to a task record.
- `Dropped`: intentionally not going forward.

## Items

| ID | Status | Title | Source | Why Deferred | Next Step |
| --- | --- | --- | --- | --- | --- |
| BL-0001 | Promoted | Initialize existing folder as project | `TASK-0011` | This is a different workflow from creating a new project. It needs separate decisions about existing content, missing required folders, confirmation, and safety. | Promoted to `TASK-0027`. |
| BL-0002 | Promoted | Generate summaries for existing transcriptions | `TASK-0026` | `TASK-0026` only summarizes newly imported transcriptions so the first workflow stays tied to a clear user action and one imported file. Existing files need separate decisions about batch behavior, progress, failures, and overwrite policy. | Promoted to `TASK-0028`. |
| BL-0003 | Promoted | Find relationships across documents | Conversation 2026-05-12 | This is broader than project or transcription summaries. It needs separate decisions about what counts as a relationship, how Codex should analyze the context package, where relationship notes are stored, and whether visualization is part of the first version. | Promoted to `TASK-0029`. |
| BL-0004 | Promoted | Generate thematic context packages | Conversation 2026-05-12 | This is a new context-package mode, not just a UI change. It needs decisions about how users specify a theme, whether Sidekick uses search, Codex, or both to select relevant files, how relevance is explained, and how partial context packages are named/stored. | Promoted to `TASK-0030`. |
| BL-0005 | Promoted | Add local searchable project index | Conversation 2026-05-12 | This needs a local indexing design separate from Codex. Decisions are needed about Lucene or an equivalent library, supported file types, index storage location, rebuild/update triggers, query syntax, and how search results should be shown in the GUI. | Promoted to `TASK-0031`. |
| BL-0006 | Candidate | Refine similar-folder warning rules | `TASK-0027` | `TASK-0027` uses a simple temporary heuristic for warning about folders that may resemble required folders. The candidate terms `transkrips`, `transkrib`, `transcript`, `forutset`, and `assumption` may be too broad, language-specific, or noisy. | Refine into a task when Sidekick should define better matching rules, examples, tests, and user-facing warning language for similar-folder detection. |
| BL-0007 | Candidate | Fix or remove renderer-only Vite review server | `TASK-0033` review | The renderer-only Vite server does not provide a realistic Electron review environment: the first screen loads, but native folder selection and app APIs cannot be tested there. This makes handoff instructions misleading when manual verification requires `npm start`. | Decide whether to replace the Vite review flow with an Electron-based local review command, add reliable mock APIs for renderer-only review, or remove the renderer-only review path from task closeout guidance. |
