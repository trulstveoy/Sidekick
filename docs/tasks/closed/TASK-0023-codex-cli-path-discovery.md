# Task: Codex CLI Path Discovery

ID: TASK-0023
Status: Done
Class: Standard
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0023-codex-cli-path-discovery
Worktree: ../Sidekick-worktrees/TASK-0023-codex-cli-path-discovery
Base branch: origin/main
Write scope:
- `src/main/codex-runner.ts`
- `tests/unit/codex-runner.test.ts`
- `tests/integration/codex-runner.test.ts`
- `src/renderer.ts`
- `docs/decisions/0004-controlled-codex-panel.md`
- `docs/tasks/TASK-0023-codex-cli-path-discovery.md`
Parallel safety: Coordinate

## Summary

Fix Codex panel status reporting `Codex CLI was not found on PATH` when the Codex CLI is installed but not visible through the exact PATH inherited by the Electron app.

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
- `src/main/codex-runner.ts`
- `tests/unit/codex-runner.test.ts`
- `tests/integration/codex-runner.test.ts`
- `src/renderer.ts`
- `docs/decisions/0004-controlled-codex-panel.md`

## Explore Notes

Observed bug:
- GUI reports `Codex CLI was not found on PATH`.

Current implementation:
- `CodexRunner` spawns executable name `codex` directly.
- Status check uses `codex --version`.
- If spawn emits an error, the UI reports that Codex was not found on PATH.

Known risk already recorded in TASK-0010:
- Packaged Electron apps may not inherit the same PATH as a terminal, especially on Windows and macOS.
- First implementation deliberately used PATH-only discovery.

Likely Windows-specific cause:
- npm global command shims are commonly installed as `codex.cmd` under `%APPDATA%\npm`.
- A packaged GUI process may not include that directory in PATH.
- Spawning `codex` directly with `shell: false` may not resolve npm command shims reliably.

## Task Spec

Goal:
- Make Sidekick find and run a locally installed Codex CLI in common install locations, especially Windows npm global installs.

Acceptance criteria:
- Codex runner still uses controlled main-process spawning only.
- Renderer still cannot select arbitrary executables.
- Default discovery checks PATH plus safe common Codex/npm binary locations.
- Windows discovery supports `codex.cmd`, `codex.exe`, and related PATHEXT names.
- A user can override discovery with `SIDEKICK_CODEX_PATH` when needed.
- Status message remains clear when no executable can be found.
- Tests cover path discovery behavior.

Non-goals:
- UI for selecting a Codex executable.
- WSL bridge support.
- General terminal support.
- Running arbitrary commands.

## Implementation Plan

1. Add a Codex executable resolver in `src/main/codex-runner.ts`.
2. Search explicit `SIDEKICK_CODEX_PATH`, PATH directories, and common npm/global locations.
3. On Windows, support npm `.cmd`/`.bat` shims by running them through the shell only after Sidekick resolves the command target.
4. Use the resolved command consistently for status, login, exec, and cancellation.
5. Add unit tests for Windows path discovery and environment override.
6. Run verification.

## Build Log

- 2026-05-12: Created task worktree `../Sidekick-worktrees/TASK-0023-codex-cli-path-discovery`.
- 2026-05-12: Ran `npm ci` because the task worktree did not have `node_modules`.
- 2026-05-12: Baseline verification passed before implementation:
  - `npm run check`: passed.
  - `npm run test`: passed, 13 files and 47 tests.
- 2026-05-12: Added `resolveCodexExecutable` in the main-process Codex runner.
- 2026-05-12: Added discovery through:
  - `SIDEKICK_CODEX_PATH`;
  - inherited PATH;
  - common Windows npm/node locations;
  - common Unix/macOS local binary locations.
- 2026-05-12: Added Windows `.cmd`/`.bat` support by using shell execution only for resolved Windows command shims.
- 2026-05-12: Updated unavailable-message fallback to mention `SIDEKICK_CODEX_PATH`.
- 2026-05-12: Updated the controlled Codex panel decision record to replace PATH-only wording.

## Verification Log

- 2026-05-12: `npm run check`: passed.
- 2026-05-12: `npm run test`: passed, 13 files and 50 tests.
- 2026-05-12: Local Codex environment check:
  - `command -v codex`: `/home/trutve/.nvm/versions/node/v25.1.0/bin/codex`;
  - `codex --version`: `codex-cli 0.130.0`;
  - `codex login status`: `Logged in using ChatGPT`.
- 2026-05-12: `npm run test:ui`: passed, 7 Playwright tests.

## Review Notes

- Diff is limited to Codex executable discovery, the renderer fallback message, tests, and the Codex panel decision record.
- Renderer still cannot provide an executable path.
- Main process still controls all process spawning.
- The only shell-enabled path is a main-process-resolved Windows `.cmd` or `.bat` command shim.

## Documentation Notes

- Updated `docs/decisions/0004-controlled-codex-panel.md` to document controlled discovery beyond inherited PATH.
- This task record documents the bug, likely Windows cause, and fix.

## Closeout

Changed:
- Codex CLI discovery now checks PATH, common install locations, and optional `SIDEKICK_CODEX_PATH`.
- Windows npm command shims are supported.
- Unavailable status text is more actionable.
- Tests cover the resolver behavior.

Verified:
- `npm run check`: passed.
- `npm run test`: passed.
- `npm run test:ui`: passed.

Known gaps:
- This was verified on Linux with Windows path behavior covered by unit tests. The original Windows GUI environment still needs a real smoke test on the user's Windows machine.

Final status:
- Done.
