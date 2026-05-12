# Task: Controlled Codex Assistant Refresh

ID: TASK-0021
Status: Closed
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0021-controlled-codex-assistant-refresh
Worktree: ../Sidekick-worktrees/TASK-0021-controlled-codex-assistant-refresh
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
- `TASK-0015-design-system-shell-foundation.md`
- `TASK-0019-write-pattern-transcript-import.md`
- `TASK-0020-context-package-workflow-refresh.md`
Implementation ordering: Build after `TASK-0020`. Do not build in parallel with other renderer-heavy workflow refresh tasks.

## Summary

Refresh the controlled Codex assistant UI while preserving current Codex behavior.

This task should make Codex availability, login, read-only mode, write mode, instruction input, streaming output, cancellation, success, failure, and cancelled states clearer. It must not add model selection, API-key setup, context-package dependency, or a generic terminal.

This task should reuse the shell, state library, output surface, and write-operation pattern established by earlier GUI refresh tasks.

## Current Phase

Closed

Build is complete, reviewed, and accepted.

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
- `../design/sidekick-ui design leveranse.zip::fase3b-ref-codex.html`
- `../design/sidekick-ui design leveranse.zip::fase4-oppgave-07-codex-assistent.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-terminologi-og-avvik.md`

Related tasks:
- `TASK-0015-design-system-shell-foundation.md`
- `TASK-0019-write-pattern-transcript-import.md`
- `TASK-0020-context-package-workflow-refresh.md`
- `closed/TASK-0010-controlled-codex-panel.md`

## Explore Notes

Current app state:
- Codex backend support already exists.
- The main process checks Codex CLI availability and login status.
- Login uses `codex login --device-auth`.
- Runs use `codex exec` with `--sandbox read-only` or `--sandbox workspace-write`.
- The renderer can stream output, cancel a run, and receive completion events.
- Completed write-mode runs trigger project rescan.
- Current runner does not expose model selection.
- Current runner does not require a context package.
- Current UI uses a checkbox for "Allow file changes" and English labels.

Design source observations:
- The consultant Codex reference provides useful state treatment for availability, run setup, read/write mode, streaming output, success, failure, and cancellation.
- The consultant reference includes API-key copy and model selection that do not match current behavior.
- The refreshed UI should present Codex as a controlled assistant operation, not a shell or terminal.
- `Skrivetilgang` should visibly use the write-operation pattern.

Resolved decisions:
- Keep current Codex CLI login/device-auth model.
- Do not use API-key language.
- Defer model selection.
- Run Codex directly against the selected project folder.
- Do not require or imply a context package.

Risk notes:
- Codex write mode can modify user files.
- Prompt/output may contain sensitive project content.
- Cancellation and run state must remain robust.
- The UI must not expose arbitrary command execution.
- This task has the highest security sensitivity of the GUI workflow tasks and should avoid concurrent changes to shared shell/write-pattern code.

## Task Spec

### Problem

The controlled Codex panel works, but its UI needs to match the refreshed design and make status, mode, write access, and run states clearer.

### Goal

Give users a calm, explicit, controlled assistant workflow for running Codex against the selected project folder.

### Scope

- Redesign Codex availability and login states.
- Use Norwegian terms:
  - `Codex`;
  - `Instruksjon`;
  - `Lesetilgang`;
  - `Skrivetilgang`;
  - `Skriveoperasjon`;
  - `Kjøring`;
  - `Kjørelogg`.
- Redesign run setup.
- Redesign read-only/write mode selection.
- Apply the write-operation pattern to write mode.
- Redesign streaming output display.
- Redesign cancellation.
- Redesign completed, failed, and cancelled states.
- Preserve current backend behavior and security boundaries.

### Non-goals

- Generic terminal.
- Arbitrary shell commands.
- `xterm.js` or `node-pty`.
- Model selector.
- API-key setup UI.
- Making context package required.
- Persistent Codex run history.
- Diff viewer.
- Automatic background Codex actions.
- Multi-run queue.

### User Workflows

- User sees whether Codex CLI is unavailable, logged out, or ready.
- User starts Codex login when needed and sees login output.
- User writes an instruction and runs Codex in read-only mode.
- User explicitly chooses write mode and sees that Codex may change files.
- User watches streaming output.
- User cancels a running operation.
- User sees clear completed, failed, and cancelled states.
- After successful write-mode completion, the project view refreshes.

### Design Requirements

- Follow `fase3b-ref-codex.html` for layout and state treatment, normalized to current product behavior.
- Use `Instruksjon`, not `Prompt`, in user-facing UI.
- Use `Lesetilgang` as the default mode.
- Use the write-operation pattern for `Skrivetilgang`.
- Show selected project folder context during the run.
- Present output as controlled run output, not an unrestricted shell.
- Avoid API-key language.
- Do not show model selector.

### Acceptance Criteria

- [ ] Codex UI shows unavailable, logged-out, ready, running, completed, failed, and cancelled states.
- [ ] Login flow uses current device-auth backend behavior and does not mention API keys.
- [ ] Read-only mode is the default.
- [ ] Write mode requires an explicit per-run choice and uses the write-operation pattern.
- [ ] Codex runs directly against the selected project folder.
- [ ] UI does not require a context package.
- [ ] UI does not expose arbitrary command execution.
- [ ] Streaming output remains visible during runs.
- [ ] Cancel action remains available and visible while running.
- [ ] Completed write-mode runs still refresh the project scan.
- [ ] UI smoke tests cover availability, logged-out, read-only run, write-mode warning, cancellation, failure, and success where practical.

### Dependencies

- Requires `TASK-0015`.
- Should follow `TASK-0019` so the write-operation pattern is available.

### Parallelization Notes

This task is functionally separate from `TASK-0020`, but both are renderer-heavy workflow refreshes.

Do not build this in parallel with `TASK-0019`. It may run near `TASK-0020` only if the implementation plan assigns disjoint renderer/CSS modules and tests. Sequential execution is safer.

### Open Questions

None blocking.

## Implementation Plan

### Plan Status

Planning is complete.

Do not start Build until:

- the human approves the plan;
- the main checkout status has been reviewed and unrelated task/backlog changes have been left untouched;
- a dedicated task worktree has been created from `main`.

### Files Or Areas

Expected change areas:

- `index.html`
  - update the Codex panel markup;
  - add a Codex state/operation area if needed;
  - replace checkbox copy with a clearer mode control or mode-specific labels.
- `src/renderer.ts`
  - refresh all Codex renderer states and copy;
  - preserve current Codex state machine and typed APIs;
  - use the shared write-operation pattern for `Skrivetilgang`;
  - preserve completion handling and rescan behavior for completed write-mode runs.
- `src/index.css`
  - add focused Codex panel styles for mode selection, status treatment, and controlled output surface;
  - reuse shared write-operation and result banner styles from `TASK-0019` and `TASK-0020`;
  - avoid broad shell/layout refactors.
- `tests/e2e/renderer-smoke.spec.ts`
  - expand Codex UI smoke tests for availability, login, read-only, write mode, cancellation, failure, and success.

Backend areas expected to remain unchanged:

- `src/main/codex-runner.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`

Only touch backend or shared API code if implementation reveals a real bug or an unavoidable mismatch. If that happens, stop and ask for human direction before continuing.

### Build Base And Worktree

When Build starts, use a worktree from `main`:

```text
git worktree add ../Sidekick-worktrees/TASK-0021-controlled-codex-assistant-refresh -b task/TASK-0021-controlled-codex-assistant-refresh main
```

During Build, edit this Task Record in the task worktree and merge it back with the task branch.

### Implementation Steps

1. Run baseline checks in the task worktree.
   - `npm run check`
   - `npm run test:ui`
   - `npm test`
   - Record failures before changing code.

2. Preserve the controlled-assistant backend boundary.
   - Keep existing APIs:
     - `getCodexStatus(rootPath)`;
     - `startCodexLogin(rootPath)`;
     - `startCodexRun({ rootPath, prompt, mode })`;
     - `cancelCodexRun(runId)`;
     - `onCodexOutput(listener)`;
     - `onCodexCompletion(listener)`.
   - Keep `codex exec` behavior in the main process.
   - Do not add arbitrary shell execution, `xterm.js`, `node-pty`, terminal emulation, model selector, API-key setup, run history, queueing, or context-package dependency.

3. Refresh Codex panel structure.
   - Keep the panel in the existing workflow surface.
   - Rename user-facing `Prompt` to `Instruksjon`.
   - Show selected project folder context in ready/running states.
   - Present the output as `Kjørelogg`, not as a terminal.
   - Keep the output area scrollable and compact.

4. Redesign availability and login states.
   - `unavailable`: explain Codex CLI is unavailable and point to settings/path configuration without using API-key language.
   - `checking`: show that Sidekick checks CLI and login status.
   - `logged-out`: show device-auth login status and a clear `Logg inn` action.
   - login run: show output stream as a login run and allow cancellation when backend supports it through the existing cancel API.

5. Redesign ready state.
   - Default mode must be `Lesetilgang`.
   - Replace or restyle the current `Allow file changes` checkbox so the choice reads as `Lesetilgang` versus `Skrivetilgang`.
   - Keep the actual mode source simple, likely still backed by the existing checkbox/input unless a small renderer-only state variable is cleaner.
   - Primary action should use Norwegian copy such as `Kjør Codex`.
   - Do not imply that a context package is required.

6. Apply write-operation treatment to `Skrivetilgang`.
   - When write mode is selected, show `Skriveoperasjon` and an amber warning before the run starts.
   - Show the selected project folder path as the write scope.
   - Replace the browser `window.confirm` prompt if practical with the visible in-panel confirmation treatment.
   - If removing `window.confirm` would increase scope too much, keep it only as an extra guard and document the deviation in the Build Log.

7. Refresh running state.
   - Show state title for:
     - login running;
     - read-only Codex run;
     - write-mode Codex run.
   - Keep run id and mode visible.
   - Keep `Avbryt` visible and enabled while running.
   - Disable instruction and mode controls while running.
   - Keep streaming output visible and update with recent output.

8. Refresh finished states.
   - Completed read-only run:
     - show success banner;
     - keep output visible;
     - allow another run.
   - Completed write-mode run:
     - show success banner;
     - show that project information was refreshed when `completion.scan` exists;
     - preserve current scan update behavior.
   - Failed run:
     - show error banner and error message;
     - keep output visible for diagnosis.
   - Canceled run:
     - show cancelled status and keep partial output visible.

9. Keep current run-state robustness.
   - Ignore output/completion events for stale run ids.
   - Do not lose selected project context.
   - Preserve existing refresh behavior after login completion.
   - Preserve existing refresh behavior after write-mode completion.

10. Update UI smoke tests.
   - Update existing Codex test for Norwegian copy and refreshed layout.
   - Cover ready/read-only run:
     - `Instruksjon`;
     - default `Lesetilgang`;
     - `Kjør Codex`;
     - output displayed;
     - completion displayed.
   - Cover `Skrivetilgang` warning and mode sent as `workspace-write`.
   - Cover logged-out state and login start where practical.
   - Cover cancellation while running.
   - Cover failed completion.
   - Cover write-mode completion with scan refresh where practical.

11. Preserve backend tests.
   - Keep unit/integration tests for Codex runner argument construction, login args, executable resolution, shell-free spawn behavior, settings-backed path handling, and active-run protection.
   - Add backend tests only if backend behavior changes, which is not expected.

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
- Confirm Codex status is shown as unavailable, login required, or ready depending on local setup.
- If logged out, click `Logg inn` and confirm the login output appears in `Kjørelogg`.
- In ready state, enter an `Instruksjon` and run with `Lesetilgang`.
- Confirm output streams into the controlled log and completion is shown.
- Select `Skrivetilgang` and confirm the visible write-operation warning shows the selected project folder scope before running.
- Start a run and confirm `Avbryt` is visible while running.
- Verify the UI does not show API-key setup, model selection, context-package dependency, or a generic terminal.

### Security And Risk Review

- This task is security-sensitive because `Skrivetilgang` can modify project files.
- Preserve Electron boundaries:
  - no renderer filesystem access;
  - no raw IPC exposure;
  - no shell/terminal APIs in the renderer;
  - no arbitrary command execution UI.
- Preserve main-process validation of project root, prompt, and mode.
- Keep Codex execution scoped to the selected project folder.
- Keep `Lesetilgang` as the default.
- Make `Skrivetilgang` an explicit per-run choice.
- Do not add model selection unless current official Codex documentation is checked and a separate task/decision approves it.
- Do not add API-key language unless actual Codex CLI behavior requires it and the human approves the scope change.

If implementation requires new IPC, new persistence, backend mode changes, terminal emulation, shell access, model selection, or context-package coupling, stop and ask for human direction before continuing.

### Documentation

- Update this Task Record during Build with:
  - worktree creation/base;
  - build log;
  - verification log;
  - Ready For Review handoff instructions;
  - review result;
  - closeout.
- No Decision Record is expected if the implementation stays within existing renderer/CSS/API behavior.
- A Decision Record is required if this task changes Codex execution semantics, persistence, security boundaries, or introduces a new integration surface.

### Human Gates

- Required.
- Approval status: Received.

This task is Major and affects a security-sensitive assistant workflow. Human approval is required before Build.

## Build Log

- Worktree used: `/home/trutve/code/Sidekick-worktrees/TASK-0021-controlled-codex-assistant-refresh`.
- Refreshed the Codex panel copy and structure in `index.html`.
- Updated renderer Codex states in `src/renderer.ts`:
  - unavailable;
  - checking;
  - logged out;
  - ready;
  - login running;
  - read-only running;
  - write-mode running;
  - completed;
  - failed;
  - canceled.
- Replaced user-facing `Prompt` with `Instruksjon`.
- Kept `Lesetilgang` as the default mode.
- Added explicit `Skrivetilgang` copy and visible `Skriveoperasjon` warning before a write-mode run.
- Removed the browser `window.confirm` guard for write mode because the in-panel write-operation warning now provides the visible per-run confirmation treatment.
- Preserved the existing backend, preload, shared API, and Codex runner behavior.
- Updated UI smoke tests for ready/read-only run, write-mode warning, login, cancellation, failure, and write-mode completion with scan refresh.

## Verification Log

- Baseline before Build:
  - `npm run check` passed.
  - `npm test` passed, 57 tests.
  - `npm run test:ui` passed, 18 UI tests.
- After Build:
  - `npm run check` passed.
  - `npm test` passed, 57 tests.
  - `npm run test:ui` passed, 22 UI tests.

## Review Notes

Reviewed and accepted by the human.

Suggested manual verification:

- Start the app from this worktree.
- Select a project folder.
- Confirm the Codex panel shows `Codex er klar`, `Instruksjon`, `Lesetilgang`, `Kjørelogg`, and the selected project folder path.
- Enter an instruction and run with `Lesetilgang`; verify output appears in `Kjørelogg` and the completed state is clear.
- Select `Skrivetilgang`; verify `Skriveoperasjon` and the project-folder write warning appear before running.
- Start a run and verify `Avbryt` is visible while the run is active.
- If local Codex is logged out, verify `Logg inn` starts the existing device-auth flow and returns to ready after completion.
- Confirm the UI does not show API-key setup, model selection, context-package dependency, or a generic terminal.

## Documentation Notes

Task record updated with Build Log, Verification Log, and Ready For Review instructions.

## Closeout

- Merged to `main`.
- Human tested from `main` and confirmed that the refreshed Codex workflow works.
- Final verification before review:
  - `npm run check` passed.
  - `npm test` passed, 57 tests.
  - `npm run test:ui` passed, 22 UI tests.
