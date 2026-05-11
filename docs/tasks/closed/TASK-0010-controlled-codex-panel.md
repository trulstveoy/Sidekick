# Task: Controlled Codex Panel

ID: TASK-0010
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-11
Updated: 2026-05-11
Branch: task/TASK-0010-controlled-codex-panel
Worktree: ../Sidekick-worktrees/TASK-0010-controlled-codex-panel
Base branch: main
Write scope:
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `src/renderer.ts`
- `src/index.css`
- `src/main/codex-runner.ts`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/architecture/application-architecture.md`
- `docs/decisions`
Parallel safety: Exclusive

## Summary

Add a controlled Codex panel to Sidekick.

The panel should let the user run Codex against the currently selected project folder without exposing a general shell terminal. Sidekick should own the process boundary, validate the selected folder, stream Codex output into the UI, support cancellation, and refresh the project folder after a completed run.

This is not an embedded shell. It is a Sidekick-owned work surface for user-initiated Codex tasks.

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
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `src/renderer.ts`
- `docs/architecture/application-architecture.md`
- `docs/design/desktop-design-guidelines.md`

Related tasks:
- `closed/TASK-0001-inspect-local-folder.md`
- `closed/TASK-0002-folder-tree-expand-collapse.md`
- `closed/TASK-0006-minimalist-ui-refresh.md`

Primary documentation sources:
- OpenAI Codex CLI: https://developers.openai.com/codex/cli
- OpenAI Codex non-interactive mode: https://developers.openai.com/codex/noninteractive
- OpenAI Codex authentication: https://developers.openai.com/codex/auth
- OpenAI Codex command line options: https://developers.openai.com/codex/cli/reference
- Electron Security: https://www.electronjs.org/docs/latest/tutorial/security

Local Codex checks:
- `which codex` -> `/home/trutve/.nvm/versions/node/v25.1.0/bin/codex`
- `codex --version` -> `codex-cli 0.130.0`
- `codex login status` -> `Logged in using ChatGPT`

## Explore Notes

Current Sidekick architecture:
- Sidekick is an Electron app with main, preload, and renderer process boundaries.
- The renderer has no direct Node.js, filesystem, shell, raw IPC, or Electron access.
- Privileged actions live in the main process and are exposed through typed, task-specific APIs in `src/shared/sidekick-api.ts`.
- Existing main-process actions validate that a project root was selected through Sidekick before operating on it.
- Current write-capable workflows are controlled workflows:
  - context package generation writes a known output file to the selected project root;
  - transcription import copies a selected file into a detected transcription folder after preview/confirm.
- The renderer currently has a three-column work surface:
  - left: selected project and runtime information;
  - center: folder structure;
  - right: actions, summary, artifact counts, recent files, and warnings.

Current Codex CLI observations:
- The installed CLI exposes `codex exec` for non-interactive runs.
- `codex exec` can stream machine-readable JSONL events with `--json`.
- `codex exec` supports `--sandbox read-only` and `--sandbox workspace-write`.
- `codex exec` supports `--cd <DIR>` to set the working root.
- `codex exec` supports `--skip-git-repo-check`, which matters because Sidekick project folders may be ordinary note/work folders rather than Git repositories.
- `codex exec` supports `--ephemeral`, which may be useful if Sidekick should avoid persisting Codex rollout/session files for one-off panel runs.
- `codex login status` can report whether the user is logged in.
- `codex login --device-auth` is available and can be used when browser or interactive login is not suitable.

Important product decision from brainstorming:
- Sidekick should not embed a general shell terminal for this task.
- The first direction is a controlled Codex panel.
- The panel should run Codex processes, not arbitrary user shell commands.
- The user should remain logged in as their own Codex user. Sidekick should not store OpenAI credentials.

Initial risk framing:
- This is a security-sensitive feature because Codex may edit files and run commands inside the selected project folder.
- The feature should start as explicitly user-initiated only.
- Automatic/background Codex actions should be deferred until the manual panel is proven and reviewed.
- A controlled panel is safer and more product-aligned than `xterm.js` plus `node-pty` for the first version.

## Task Spec

Goal:
- Add a controlled UI panel that lets the user run Codex prompts against the selected project folder.

Primary outcome:
- A user can select a project folder, open/use the Codex panel, submit a prompt, watch output stream into Sidekick, cancel a running task, and see the folder view refresh after completion.

Acceptance criteria:
- Sidekick detects whether the Codex CLI is available.
- Sidekick displays the detected Codex version when available.
- Sidekick can check Codex login status.
- If Codex is not logged in, Sidekick offers a login action that runs `codex login --device-auth` and streams the login instructions/output into the panel.
- The user can submit a prompt only after selecting a project folder.
- Codex runs with the selected project folder as the working root.
- The first implementation uses Codex CLI non-interactive mode, not a general shell terminal.
- The renderer cannot choose an arbitrary executable or shell command.
- The renderer cannot choose an arbitrary working directory.
- The main process validates the selected project root before each Codex operation.
- The user can cancel a running Codex process.
- Only one Codex run is active per app window or selected project in the first version.
- Codex output is streamed into the UI.
- The UI distinguishes at least these states:
  - unavailable;
  - available but not logged in;
  - ready;
  - running;
  - canceled;
  - failed;
  - completed.
- The UI should not look like a full terminal. It should look like a focused Sidekick work panel.
- After a completed edit-mode Codex run, Sidekick refreshes the selected folder scan because files may have changed.
- Completed read-only runs do not refresh automatically.
- Failed or canceled runs do not silently refresh the folder; the UI may offer a manual refresh later, but that is not required for the first version.
- Errors are shown with actionable messages.
- Tests cover command construction, process lifecycle, IPC validation, renderer state, and at least one UI smoke path with mocked Codex APIs.

Initial run modes:
- Read-only mode should run with `codex exec --sandbox read-only`.
- Edit mode should run with `codex exec --sandbox workspace-write`.
- Edit mode must require an explicit per-run UI choice and confirmation that Codex may change files in the selected project folder.
- `danger-full-access` is out of scope for this task.

Non-goals:
- General shell terminal.
- `xterm.js` or `node-pty` integration.
- Running arbitrary shell commands from the renderer.
- Automatic background Codex actions triggered without a user prompt.
- Long-lived Codex daemon or remote-control server.
- Codex SDK integration.
- Multi-run queueing.
- Multi-project concurrent Codex runs.
- Rich diff viewer.
- Git commit creation.
- Auto-accepting or auto-reverting Codex changes.
- Storing OpenAI API keys or ChatGPT credentials in Sidekick.
- Replacing the existing folder scanner or context-package workflow.

Constraints:
- Preserve Electron security settings: `contextIsolation`, `sandbox`, and `nodeIntegration: false`.
- Keep privileged process management in the main process.
- Expose only typed, task-specific APIs through preload.
- Do not expose raw `ipcRenderer`, filesystem, process, shell, or generic command execution to the renderer.
- Validate all IPC inputs in the main process.
- Do not run Codex without a selected project root known to Sidekick.
- Do not run outside the selected project root in the first version.
- Do not use `--dangerously-bypass-approvals-and-sandbox`.
- Do not use `--sandbox danger-full-access`.
- Avoid storing prompt/output history outside normal app runtime memory in the first version unless explicitly specified.
- Do not persist prompt or output history in the first version.

Risks:
- Codex can modify user files in edit mode.
- Sidekick project folders may not be Git repositories, so file changes may not be easy to diff or revert.
- `codex exec` behavior and JSONL event shapes may change across CLI versions.
- Login behavior may differ across operating systems and account types.
- Device-auth output may include URLs and one-time codes; UI must display enough information without logging secrets.
- Packaged Electron apps may not inherit the same PATH as the user's terminal, especially on Windows and macOS.
- Long-running Codex tasks may need robust cancellation and cleanup.
- Canceling the parent `codex` process may leave child processes running unless process-tree or process-group cleanup is handled correctly.
- Running Codex may consume account quota or API credits.
- Prompt/output may include sensitive local project content.
- A prompt passed as a command-line argument may appear in OS process listings and may be fragile for long prompts or special characters.
- Login processes may wait for network, browser, or device-code interaction and must be cancellable.

Resolved decisions:
- Use a controlled Codex panel, not an embedded shell terminal.
- Use Codex CLI first, not the Codex SDK.
- Use `codex exec` first, not interactive Codex TUI.
- Keep all process spawning in the main process.
- Require explicit user action before running Codex.
- Defer autonomous Sidekick-triggered Codex actions until the manual panel exists.

Planning decisions:
- First-version UI should default to read-only mode.
- Edit mode should be available through an explicit per-run "Allow file changes" choice.
- First-version Codex runs should use `--ephemeral` to avoid persisting Codex session files for Sidekick panel runs.
- First-version Codex discovery should use PATH only.
- User-configured CLI path is deferred.
- First-version completion should show a "project files may have changed" message and refresh the folder scan after completed edit-mode runs.
- Changed-file counting is deferred.
- First-version runs should send prompts through stdin using `codex exec ... -`, not as command-line arguments.
- First-version process management should enforce one global active Codex process.
- Cancellation should attempt to stop the full Codex process tree or process group.
- Login should be handled by running `codex login --device-auth` and streaming the output into the panel.
- Login runs should have the same cancel path as normal Codex runs.
- Automatic opening of device-auth URLs is deferred unless it is needed for usability after the first implementation.

## Implementation Plan

The simplest useful implementation is a main-process `CodexRunner` plus a compact inspector-panel UI. The feature should be useful without adding terminal emulation.

### 1. Add shared Codex types

Update `src/shared/sidekick-api.ts`.

Add types for:
- Codex availability/status;
- Codex run mode: `read-only` or `workspace-write`;
- Codex run request;
- Codex run id;
- Codex output event;
- Codex run completion state.

Extend `SidekickApi` with task-specific methods only:
- `getCodexStatus(rootPath: string)`
- `startCodexLogin(rootPath: string)`
- `startCodexRun(rootPath: string, prompt: string, mode: CodexRunMode)`
- `cancelCodexRun(runId: string)`
- event subscription helpers for output and completion.

The renderer must not receive a generic command execution API.

### 2. Implement a main-process Codex runner

Create `src/main/codex-runner.ts`.

Responsibilities:
- find the `codex` executable through PATH;
- call `codex --version`;
- call `codex login status`;
- start `codex login --device-auth`;
- start `codex exec --json --ephemeral --skip-git-repo-check --cd <projectRoot> --sandbox <mode> -`;
- write the prompt to the Codex process stdin;
- stream stdout and stderr as structured Sidekick events;
- parse JSONL stdout when possible and fall back to raw output lines when needed;
- track active process by `runId`;
- cancel a running process, including child processes when possible;
- enforce one global active Codex process in the first version.

The runner should not use shell execution. Use `spawn` with an argument array.

Packaged-app behavior:
- If Codex cannot be found through PATH, return a clear unavailable status.
- Do not fail app startup when Codex is missing.
- Do not add a user-configured Codex path in the first version.
- On Windows, the first version should discover a Windows-installed `codex`; WSL-only Codex installations are not assumed to be visible to the packaged app.

### 3. Wire IPC through main and preload

Update `src/main.ts`.

Rules:
- validate `rootPath` with the existing selected-project-root model before any Codex action;
- register narrowly scoped IPC handlers;
- send output/completion events only to the requesting `webContents`;
- remove active run state on exit, cancel, or error;
- refresh the selected project scan after a completed edit-mode run.
- do not refresh automatically after read-only, failed, or canceled runs.

Update `src/preload.ts`.

Rules:
- expose only typed `window.sidekick` methods;
- wrap `ipcRenderer.on` subscriptions so the renderer never receives raw IPC access;
- return unsubscribe functions for event listeners.

### 4. Add the controlled panel UI

Update `index.html`, `src/renderer.ts`, and `src/index.css`.

Panel placement:
- first version should live in the right inspector column near the other project actions.
- It should be visually consistent with the transcription and context-package panels.

UI elements:
- status/title text;
- prompt textarea;
- read-only/edit mode control;
- explicit "Allow file changes" choice for edit mode;
- Run button;
- Cancel button while running;
- Login button when not logged in;
- compact output log.

Renderer behavior:
- no folder selected: panel is disabled;
- no Codex CLI: show unavailable state;
- not logged in: show login action;
- ready: allow prompt entry;
- running: disable prompt/mode, stream output, allow cancel;
- completed read-only run: show final status without automatic refresh;
- completed edit-mode run: show final status and refresh the selected folder scan;
- failed: show error and keep prior scan state.
- edit mode: require an explicit confirmation that Codex may change files in the selected project folder.
- login run: allow cancel and show output needed to complete device authentication.

### 5. Add tests

Unit tests:
- command construction uses argument arrays and never shell strings;
- prompt is passed through stdin and not through process arguments;
- read-only mode maps to `--sandbox read-only`;
- edit mode maps to `--sandbox workspace-write`;
- runner rejects empty prompts;
- runner rejects unknown roots through main-process validation;
- one global active run limit is enforced;
- cancel attempts process-tree or process-group cleanup;
- JSONL output parsing tolerates unknown event types.

Integration-style tests with a fake Codex executable:
- status success path;
- missing CLI path;
- login status path;
- login run streaming and cancel path;
- streaming output path;
- cancel path.

UI smoke tests:
- empty/no-folder panel state;
- mocked ready state;
- mocked run output/completion state;
- mocked login-required state if practical.

### 6. Update documentation

Update `docs/architecture/application-architecture.md`.

Add:
- Codex panel flow;
- process boundary;
- CLI dependency;
- selected-root validation;
- read-only versus edit mode;
- security notes.

Add a decision record:
- `docs/decisions/0004-controlled-codex-panel.md`

The decision should record:
- controlled Codex panel instead of embedded shell terminal;
- Codex CLI instead of SDK for first version;
- main-process-only process spawning;
- no `danger-full-access`;
- no background automation in the first version.

### 7. Verification plan

Local verification:
- `npm run check`
- `npm run test`
- `npm run test:ui`
- manual Electron run with selected folder and local Codex status check.

Manual Codex verification:
- status shows installed `codex-cli 0.130.0` or equivalent;
- login status shows the current user's Codex login;
- read-only prompt can summarize the selected project without editing files;
- edit-mode prompt can make a small file change in a disposable test project;
- cancel stops a long-running run;
- cancel does not leave obvious child processes running in the disposable verification case;
- folder view refreshes after a completed edit-mode run.

Packaging check:
- `npm run make`
- packaged app can detect Codex through PATH or reports actionable unavailable state.

## Build Log

Changes made:
- Added `src/main/codex-runner.ts` as a main-process Codex CLI wrapper.
- Added typed Codex status, run, output, and completion contracts to `src/shared/sidekick-api.ts`.
- Added narrow Codex IPC handlers in `src/main.ts`.
- Added typed preload methods and event subscriptions without exposing raw IPC.
- Added a controlled Codex panel to the right inspector column.
- Added read-only default mode and explicit edit-mode confirmation.
- Added process cancellation and one-active-run enforcement.
- Added scan refresh on completed edit-mode runs.
- Added unit, integration, and UI smoke coverage.
- Updated architecture documentation.
- Added `docs/decisions/0004-controlled-codex-panel.md`.

Important decisions during build:
- Prompts are sent through stdin using `codex exec ... -`.
- Runner output/completion events are deferred one tick so main can register the run before fast processes emit output.
- Packaged app behavior remains PATH-only for Codex discovery.
- Main process reports missing Codex as an unavailable state instead of failing startup.

Deviations from plan:
- No meaningful scope deviations.

Files changed:
- `src/main/codex-runner.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `src/renderer.ts`
- `src/index.css`
- `index.html`
- `tests/unit/codex-runner.test.ts`
- `tests/integration/codex-runner.test.ts`
- `tests/e2e/renderer-smoke.spec.ts`
- `docs/architecture/application-architecture.md`
- `docs/decisions/0004-controlled-codex-panel.md`

## Verification Log

Initial exploration verification:
- `codex --help`
- `codex exec --help`
- `codex login --help`
- `codex login status`
- Reviewed current `src/main.ts`, `src/preload.ts`, `src/shared/sidekick-api.ts`, and `src/renderer.ts`.
- Reviewed `docs/architecture/application-architecture.md`.

Baseline:
- Initial `npm run check` and `npm run test` failed before dependency install because the new worktree had no `node_modules`.
- `npm ci` completed successfully.
- Baseline `npm run check` passed.
- Baseline `npm run test` passed.

Passed:
- `npm run check`
- `npm run test`
- `CI=1 npm run test:ui`
- `npm run make`
- Rebased on `main` after TASK-0011 and TASK-0012.
- Fast-forward merged to `main`.
- Final verification from `main`: `npm run check`
- Final verification from `main`: `npm run test`
- Final verification from `main`: `CI=1 npm run test:ui`
- `codex --version` -> `codex-cli 0.130.0`
- `codex login status` -> `Logged in using ChatGPT`

Failed during implementation:
- First `npm run test:ui` run used a stale reused Vite server from another worktree and showed the wrong DOM. Reran with `CI=1` so Playwright started the correct worktree server.

Not run:
- Manual Electron app run with real Codex prompt.
  Reason: left for human/manual review before integration.
- Real edit-mode Codex file change.
  Reason: should be performed in a disposable project folder by the human or during a dedicated manual QA pass.

## Review Notes

Diff matches goal:
- Yes.

Scope respected:
- Yes. The feature is a controlled Codex panel, not a general terminal or arbitrary command runner.

Risks remaining:
- Packaged Windows apps may not find WSL-only Codex installations through PATH.
- Real Codex JSONL event shapes may contain variants beyond the mocked and helper-tested shapes; raw output is still shown as fallback.
- Manual edit-mode behavior should be validated in a disposable project before release.

Security concerns:
- Renderer cannot choose executable, working directory, sandbox mode outside the allowed enum, or arbitrary command.
- Main process validates selected project root before each Codex action.
- Edit mode requires explicit confirmation.
- No `danger-full-access` or sandbox bypass flag is exposed.

Maintainability concerns:
- Renderer gained more state-management code. It remains local to the first-version panel, but future growth may justify extracting UI modules.

## Documentation Notes

Docs updated:
- `docs/architecture/application-architecture.md`
- `docs/decisions/0004-controlled-codex-panel.md`

Docs intentionally not updated:
- Runtime/user guide for installing Codex CLI.
  Reason: first implementation reports unavailable state; a user-facing setup guide can follow after manual packaging review.

Decision record needed:
- Yes.
- Added `docs/decisions/0004-controlled-codex-panel.md`.

## Closeout

Changed:
- Added controlled Codex panel for selected project folders.
- Added main-process Codex CLI runner with status, login, run, output streaming, cancellation, and edit-mode refresh behavior.
- Added typed shared/preload API for Codex operations.
- Added tests for runner helpers, fake Codex process lifecycle, and renderer smoke flow.
- Added architecture documentation and decision record.

Verified:
- `npm run check`
- `npm run test`
- `CI=1 npm run test:ui`
- `npm run make`
- Final verification from `main`: `npm run check`
- Final verification from `main`: `npm run test`
- Final verification from `main`: `CI=1 npm run test:ui`

Known gaps:
- Manual Electron run with real Codex prompt has not been performed.
- Real edit-mode file change should be tested in a disposable project folder.
- Packaged app Codex PATH discovery should be checked on Windows.

Next:
- Human manual QA of read-only and edit-mode Codex runs.
- Remove task worktree after push if no further local inspection is needed.

Final status:
- Done
