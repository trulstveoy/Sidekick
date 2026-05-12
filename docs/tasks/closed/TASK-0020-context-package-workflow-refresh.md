# Task: Context Package Workflow Refresh

ID: TASK-0020
Status: Closed
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0020-context-package-workflow-refresh
Worktree: ../Sidekick-worktrees/TASK-0020-context-package-workflow-refresh
Base branch: main after TASK-0019 is integrated
Write scope:
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/e2e`
- `tests/unit`
- `tests/integration`
Parallel safety: Coordinate
Depends on:
- `TASK-0015-design-system-shell-foundation.md`
- `TASK-0017-project-overview-scan-understanding.md`
- `TASK-0019-write-pattern-transcript-import.md`
Implementation ordering: Build after `TASK-0019`. Can be built before or after `TASK-0021` if write scopes are coordinated, but sequential execution is safer.

## Summary

Refresh context-package preview, generation, overwrite warning, result, skipped files, and warnings.

This task should preserve the current Repomix-based behavior and current filename behavior. It should not add streaming generation progress or make Codex depend on context packages.

This task should reuse the write-operation pattern from `TASK-0019` rather than defining a separate context-package-specific warning pattern.

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
- `../design/sidekick-ui design leveranse.zip::wireframe-04-kontekstpakke.html`
- `../design/sidekick-ui design leveranse.zip::fase3-ref-skriveoperasjoner.html`
- `../design/sidekick-ui design leveranse.zip::fase4-oppgave-06-kontekstpakke.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`

Related tasks:
- `TASK-0015-design-system-shell-foundation.md`
- `TASK-0019-write-pattern-transcript-import.md`
- `closed/TASK-0004-context-package-workflow.md`

## Explore Notes

Current app state:
- Context package preview already exists through `previewContextPackage(rootPath)`.
- Generation already exists through `generateContextPackage(rootPath)`.
- Output is written to the selected project root.
- Output filename is based on the project folder name and current filename sanitization rules.
- Existing generated context-package files are ignored during generation.
- Repomix security checks and suspicious file warnings are surfaced in the result.
- Current API returns after generation completes; it does not stream progress.
- Codex currently runs directly against the selected project folder and does not require a context package.

Design source observations:
- The consultant context-package flow should be used for preview, overwrite warning, result summary, skipped files, and warnings.
- The write-operation pattern from `TASK-0019` should be reused.
- The consultant suggests streaming/progress and Codex-with-context-package in places, but those are not part of current product decisions.

Resolved decisions:
- Preserve current context-package filename behavior.
- Do not require context package for Codex.
- Do not add streaming generation progress in the first GUI refresh.

Risk notes:
- This workflow writes to disk and may overwrite an existing generated package.
- The UI must show overwrite status before generation.
- Skipped files and warnings should be visible without overwhelming the user.
- The task shares renderer/CSS/test hotspots with transcript import and Codex refresh.

## Task Spec

### Problem

Context package generation works, but the UI should make preview, overwrite, warnings, and result summary clearer and more consistent with the refreshed write-operation pattern.

### Goal

Give users a clear, inspectable context-package workflow before and after generation.

### Scope

- Redesign context-package preview.
- Show output filename and output path.
- Show whether an existing context package will be replaced.
- Show binary-file and self-ignore warnings.
- Generate through existing backend behavior.
- Show result summary:
  - output path;
  - overwritten status;
  - included/processed file count;
  - skipped file count;
  - token count;
  - character count;
  - output size;
  - skipped files;
  - warnings.
- Use the shared write-operation pattern.
- Use Norwegian user-facing copy.

### Non-goals

- Streaming generation progress.
- Generation cancellation.
- Changing Repomix integration.
- Changing filename convention.
- Making Codex depend on context package.
- Opening the generated file.
- Context-package history.

### User Workflows

- User opens context-package preview for the selected project.
- User sees where the package will be written.
- User sees whether the operation overwrites an existing package.
- User confirms generation.
- User sees result summary and warnings.
- User can recover from errors without losing selected project context.

### Design Requirements

- Follow `wireframe-04-kontekstpakke.html` and `fase3-ref-skriveoperasjoner.html`.
- Use the shared write-operation indicator and confirmation pattern.
- Show target path before confirm.
- Use calm warning treatment for binary/self-ignore notes.
- Do not imply that a context package is required for Codex.
- Keep result details scannable.

### Acceptance Criteria

- [x] Context-package preview uses the refreshed visual design.
- [x] Preview shows output filename, output location, overwrite status, binary warning, and self-ignore warning.
- [x] Generation uses the current filename behavior.
- [x] Result shows output path and summary metrics.
- [x] Skipped files and warnings are available after generation.
- [x] Existing self-ignore behavior remains covered by tests.
- [x] UI states cover preview, generating/pending, success, overwrite, warning, cancel/back, and error.
- [x] UI smoke tests cover preview, overwrite warning, successful generation, skipped files/warnings, and error where practical.

### Dependencies

- Requires `TASK-0015`.
- Should follow `TASK-0019` so the shared write-operation pattern is available.

### Parallelization Notes

This task has a distinct user-visible deliverable, but it is not fully isolated in the current frontend structure.

It may be implemented near `TASK-0021` only if the implementation plan assigns separate modules and tests. Otherwise, run it sequentially after `TASK-0019`.

### Open Questions

None blocking.

## Implementation Plan

### Plan Status

Planning is complete.

Do not start Build until:

- the human approves the plan;
- `TASK-0019` is integrated into the intended base branch, or the human explicitly chooses `task/TASK-0019-write-pattern-transcript-import` as the build base;
- the main checkout status has been reviewed and unrelated task/backlog changes have been left untouched.

### Files Or Areas

Expected change areas:

- `index.html`
  - add a context-package operation-state container similar to the transcript import workflow from `TASK-0019`.
- `src/renderer.ts`
  - reuse or generalize the write-operation presentation helpers introduced by `TASK-0019`;
  - refresh all context-package states and copy;
  - keep existing typed API calls: `previewContextPackage(rootPath)` and `generateContextPackage(rootPath)`.
- `src/index.css`
  - reuse existing `.operation-state`, `.operation-steps`, `.write-operation-badge`, `.write-warning`, and `.result-banner` styles from `TASK-0019`;
  - add only small context-package-specific styling if required.
- `tests/e2e/renderer-smoke.spec.ts`
  - update the existing context-package smoke test for Norwegian copy and write-operation treatment;
  - add focused tests for back/cancel and error handling.

No main-process, preload, Repomix, or context-package backend changes are expected.

### Build Base And Worktree

When Build starts, use a worktree.

Recommended default after `TASK-0019` is integrated:

```text
git worktree add ../Sidekick-worktrees/TASK-0020-context-package-workflow-refresh -b task/TASK-0020-context-package-workflow-refresh main
```

If `TASK-0019` has not been integrated, stop and ask for direction before creating the worktree. This task depends on the write-operation primitives from `TASK-0019`; rebuilding those independently would increase merge risk.

During Build, edit the Task Record in the task worktree and merge it back with the task branch.

### Implementation Steps

1. Run baseline checks in the task worktree.
   - `npm run check`
   - `npm run test:ui`
   - `npm test`
   - Record failures before changing code.

2. Reuse the write-operation primitives from `TASK-0019`.
   - Keep the existing visual language: step indicator, `Skriveoperasjon` badge, amber write warning, and success/error result banner.
   - If the helpers are transcript-specific, generalize them just enough for both transcript import and context-package generation.
   - Do not introduce a component framework or broad renderer refactor.

3. Add a context-package operation-state area.
   - Add a dedicated target such as `data-context-package-state`.
   - Use it for steps, write badge, warning banner, and result banner.
   - Keep details in `data-context-package-details` and warnings/skipped files in `data-context-package-list`.

4. Refresh the ready and previewing states.
   - Use Norwegian copy.
   - Present the action as context-package generation, not Codex preparation.
   - Show scope and format before preview:
     - selected project folder;
     - generated Markdown package;
     - project-root output.
   - Use a primary action label such as `Forhåndsvis`.

5. Refresh the confirm state.
   - Show step 2 of the workflow.
   - Show the `Skriveoperasjon` badge.
   - Show output filename and full output path.
   - Show overwrite status as `Ja` or `Nei`.
   - If `willOverwrite` is true, use an amber warning that explicitly says the existing context package will be replaced.
   - If `willOverwrite` is false, use an amber write note that says Sidekick will write one Markdown file to the project root.
   - Show binary-file and self-ignore warnings as calm notes.
   - Primary action: `Generer pakke`.
   - Secondary action: `Tilbake`, returning to ready without generating.

6. Refresh the generating state.
   - Disable actions while generation is running.
   - Keep output filename/path visible.
   - Keep the operation marked as a write operation.
   - Do not add streaming progress or cancellation in this task.

7. Refresh the success state.
   - Show a success result banner such as `Kontekstpakke generert`.
   - Show:
     - output filename;
     - output path;
     - overwrite result;
     - included/processed file count;
     - skipped file count;
     - token count;
     - character count;
     - output size.
   - Show skipped files and warnings without overwhelming the panel.
   - Keep the existing overview context-package status update to `Finnes`.
   - Do not open the generated file.
   - Do not add a rescan API in this task.

8. Improve error states.
   - Distinguish preview errors from generation errors in renderer state if needed.
   - For preview errors, it is safe to say no file was written.
   - For generation errors, do not claim that no filesystem change occurred unless the backend guarantees it.
   - Keep retry available and preserve selected project context.

9. Update UI smoke tests.
   - Update the existing context-package generation test for Norwegian labels and refreshed states.
   - Assert preview shows:
     - output filename;
     - output path;
     - overwrite status;
     - binary warning;
     - self-ignore warning;
     - write-operation badge.
   - Assert secondary back returns to ready and does not call generation.
   - Assert success shows summary metrics, skipped files, warnings where present, and status chip `Finnes`.
   - Add at least one preview or generation error test where practical.

10. Preserve backend behavior and existing backend tests.
   - Do not change `src/main/context-package.ts` unless implementation reveals a bug.
   - Keep unit/integration tests protecting filename behavior, output path, and self-ignore patterns.

### Verification Plan

Automated verification from the task worktree:

```text
npm run check
npm run test:ui
npm test
```

Manual verification for Ready For Review handoff:

- Start the app from the task worktree.
- Select a project folder.
- Open the context-package workflow.
- Confirm the preview shows the output filename, output path, overwrite status, binary-file warning, self-ignore warning, and `Skriveoperasjon`.
- Click `Tilbake` and confirm no package generation happens.
- Open the preview again, click `Generer pakke`, and confirm the result shows output path, metrics, skipped files or warnings, and the overview status changes to `Finnes`.
- Verify the UI does not imply that Codex requires the context package.

### Security And Risk Review

- Preserve the existing Electron security boundary.
- Do not expose filesystem APIs, shell APIs, raw IPC, or Repomix controls to the renderer.
- Keep generation mediated by the existing typed preload API.
- Do not add drag-and-drop paths, arbitrary output destination, file opening, cancellation, streaming progress, or new IPC in this task.
- Explicitly show overwrite status before generation.
- If implementation appears to need backend changes, new IPC, direct rescan, file opening, or cancellation support, stop and ask for human direction.

### Documentation

- Update this Task Record during Build with:
  - worktree creation/base;
  - build log;
  - verification log;
  - Ready For Review handoff instructions;
  - review result;
  - closeout.
- No Decision Record is expected if the implementation stays within the existing renderer/CSS/API behavior.
- A Decision Record may be needed if the task introduces a new IPC API, changes context-package generation behavior, or changes overwrite semantics.

### Human Gates

- Required.
- Approval status: Approved.

This task is Major and writes UI around a disk-writing workflow. Human approval is required before Build.

## Build Log

Completed in worktree:

- Added a context-package operation-state area to the workflow panel.
- Reused the shared write-operation pattern from `TASK-0019`:
  - step indicator;
  - `Skriveoperasjon` badge;
  - amber write warning;
  - success/error result banners.
- Generalized the operation-step helper so transcript import and context-package generation share the same primitive.
- Refreshed context-package states in `src/renderer.ts`:
  - unavailable;
  - ready;
  - previewing;
  - confirm generation;
  - generating;
  - success;
  - preview error;
  - generation error.
- Changed context-package workflow copy to Norwegian.
- Preserved existing backend behavior:
  - same Repomix integration;
  - same filename behavior;
  - same output location;
  - same self-ignore behavior;
  - no new IPC.
- Updated UI smoke tests to cover:
  - refreshed preview;
  - overwrite warning;
  - back from confirmation;
  - successful generation;
  - skipped files and warnings;
  - preview error with no-write feedback.

Implementation deviations:

- `src/index.css` did not need changes because `TASK-0019` had already introduced reusable write-operation styles.
- No unit or integration tests needed changes because backend behavior was intentionally preserved.

Baseline:

- Ran `npm install` in the new worktree to install dependencies.
- Reverted install-only `package-lock.json` drift.
- Baseline before implementation:
  - `npm run check` passed.
  - `npm run test:ui` passed, 17 UI tests.
  - `npm test` passed, 57 tests.

## Verification Log

Final verification from the task worktree:

```text
npm run check
```

Passed.

```text
npm run test:ui
```

Passed: 18 UI tests.

```text
npm test
```

Passed: 15 test files, 57 tests.

## Review Notes

Agent self-review:

- Scope stayed in renderer markup, renderer state/copy, and UI smoke tests.
- No backend, preload, Repomix, IPC, overwrite semantics, or filename behavior changed.
- Preview errors can safely state that no file was written.
- Generation errors avoid claiming that no filesystem change occurred.
- Context-package UI does not imply that Codex requires a context package.

Human review:

- Human tested the workflow and confirmed that it works.

## Documentation Notes

Task record updated with build log, verification log, self-review, and Ready For Review state.

## Closeout

TASK-0020 refreshed the context-package workflow while preserving the existing backend behavior.

Completed outputs:

- Context-package preview uses the shared write-operation pattern.
- Preview shows output filename, output path, overwrite status, binary-file warning, self-ignore warning, and write intent.
- Confirmation supports going back without generation.
- Successful generation shows output path, metrics, skipped files, warnings, and overview status update.
- Preview errors show no-write feedback.
- UI tests cover preview, overwrite warning, back/cancel, success, skipped files/warnings, and preview error.

Final status: accepted and closed.
