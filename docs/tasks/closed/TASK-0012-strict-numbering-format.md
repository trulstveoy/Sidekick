# Task: Strict Numbering Format

ID: TASK-0012
Status: Done
Class: Standard
Owner: Pair
Created: 2026-05-11
Updated: 2026-05-11
Branch: task/TASK-0012-strict-numbering-format
Worktree: ../Sidekick-worktrees/TASK-0012-strict-numbering-format
Base branch: main
Write scope:
- `src/main/transcription-importer.ts`
- `src/shared/sidekick-api.ts`
- `src/renderer.ts`
- `tests`
- `docs/tasks/TASK-0012-strict-numbering-format.md`
Parallel safety: Safe

## Summary

Make generated numbered filenames follow the same numbering format as project folders.

The required format is:

```text
00. name.ext
01. name.ext
02. name.ext
```

The rule is intentionally strict because file and folder ordering depends on the exact prefix format.

## Current Phase

Close

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

Related files:
- `src/main/transcription-importer.ts`
- `src/shared/sidekick-api.ts`
- `src/renderer.ts`
- `tests/unit/transcription-importer.test.ts`
- `tests/integration/transcription-importer.test.ts`
- `tests/e2e/renderer-smoke.spec.ts`

Related decisions:
- `docs/decisions/0004-project-folder-structure.md`

Related tasks:
- `docs/tasks/closed/TASK-0011-create-project-folder-structure.md`

## Explore Notes

Current behavior:
- Project creation uses folders named `00. Forutsetninger` and `01. Transkripsjoner`.
- Transcription import currently detects and continues several filename formats, including `01-name.md`, `002_name.md`, and `03 - name.md`.
- That flexible inference can produce filenames that do not sort the same way as the project folders.

Approved rule:
- Use exactly two digits.
- Start at `00`.
- Use a period followed by one space.
- Put the original filename after the prefix.
- Do not infer `_`, `-`, or `" - "` separators from existing files.

## Task Spec

Goal:
- Generated transcription filenames must use the strict numbering format.

Acceptance criteria:
- First imported transcription file is named `00. <source-file-name>`.
- Second imported transcription file is named `01. <source-file-name>`.
- Existing files with strict prefixes are detected when choosing the next number.
- Generated filenames always use the separator `. `.
- Generated filenames always use two digits.
- Flexible legacy separators are not used for new generated filenames.
- Source filenames that already have a numeric prefix have that prefix removed before adding the strict prefix.

Non-goals:
- Renaming existing files.
- Migrating fixtures or user projects to the new folder numbering.
- Changing project folder names.

Constraints:
- Keep transcription import as a controlled main-process filesystem workflow.
- Do not change Electron security boundaries.
- Preserve existing copy-not-move behavior.

## Implementation Plan

Steps:
1. Replace flexible transcription-numbering inference with strict parsing and formatting.
2. Keep helper behavior that strips existing numeric prefixes from source filenames.
3. Update shared numbering type if separator/width no longer need to be variable.
4. Update unit, integration, and UI tests.
5. Run verification.

Verification:
- `npm run check`
- `npm run test`
- `npm run test:ui`

Security and risk review:
- Low filesystem risk because only generated destination names change.
- Existing files are not renamed or deleted.

Docs:
- This task record documents the product rule.

Human gates:
- Required because the exact numbering format is product-critical.
- Approval status: Approved in conversation.

## Build Log

- 2026-05-11: Created task worktree `../Sidekick-worktrees/TASK-0012-strict-numbering-format` on branch `task/TASK-0012-strict-numbering-format`.
- 2026-05-11: Baseline setup:
  - `npm run check` initially failed because the new worktree did not have `node_modules`.
  - `npm run test` initially failed for the same reason.
  - Ran `npm ci` in the task worktree.
  - `npm run check`: passed after install.
  - `npm run test`: passed after install.
- 2026-05-11: Updated transcription numbering logic:
  - generated filenames now use `00. name.ext`, `01. name.ext`, `02. name.ext`;
  - next-number detection only counts strict prefixes;
  - generated filenames always use two digits and `. `;
  - source filenames with legacy or strict numeric prefixes still have their existing prefix stripped before adding the new strict prefix.
- 2026-05-11: Updated unit, integration, and UI smoke tests.

## Verification Log

- 2026-05-11: Baseline after `npm ci`:
  - `npm run check`: passed.
  - `npm run test`: passed, 10 files and 38 tests.
- 2026-05-11: First final verification:
  - `npm run check`: passed.
  - `npm run test`: failed because prefix stripping no longer handled `01 - downloaded transcript.md`.
  - `npm run test:ui`: passed, 6 Playwright tests.
- 2026-05-11: After prefix-stripping fix:
  - `npm run check`: passed.
  - `npm run test`: passed, 10 files and 38 tests.
  - `npm run test:ui`: passed, 6 Playwright tests.

## Review Notes

Diff matches goal:
- Yes. Generated transcription filenames now follow the strict project-style numbering format.

Scope respected:
- Yes. Existing files are not renamed, and project folder names are unchanged.

Risks remaining:
- Existing legacy-numbered files are ignored when detecting the next number. This is intentional so new output follows the strict format, but mixed old/new folders may start at `00` unless strict-numbered files already exist.

Security concerns:
- No new filesystem capability was added. Existing controlled transcription import remains copy-only.

Follow-up items:
- None.

## Documentation Notes

Docs updated:
- This task record documents the strict numbering rule.

Decision record needed:
- No.
- Reason: this narrows behavior under the existing project folder structure decision.

## Closeout

Changed:
- Replaced flexible transcription numbering with strict `NN. name.ext` generation.
- Updated tests to expect `00.`, `01.`, and `02.` prefixes.

Verified:
- `npm run check`: passed.
- `npm run test`: passed.
- `npm run test:ui`: passed.

Known gaps:
- Existing legacy filenames are not renamed.

Final status:
- Done.
