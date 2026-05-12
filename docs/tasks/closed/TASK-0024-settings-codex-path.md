# Task: Settings For Codex CLI Path

ID: TASK-0024
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0024-settings-codex-path
Worktree: ../Sidekick-worktrees/TASK-0024-settings-codex-path
Base branch: origin/main
Write scope:
- `index.html`
- `src/index.css`
- `src/renderer.ts`
- `src/main.ts`
- `src/main/codex-runner.ts`
- `src/shared/sidekick-api.ts`
- `src/preload.ts`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0024-settings-codex-path.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0023-codex-cli-path-discovery.md`
Coordinates with:
- `TASK-0015-design-system-shell-foundation.md`
- `TASK-0021-controlled-codex-assistant-refresh.md`

## Summary

Add a dedicated Settings screen where the user can inspect and override the Codex CLI path used by Sidekick.

The setting should be organized like a normal desktop app settings screen, with clear sections, labels, descriptions, validation, save/reset behavior, and status feedback.

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
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `src/renderer.ts`
- `index.html`
- `src/index.css`

Related tasks:
- `closed/TASK-0023-codex-cli-path-discovery.md`
- `TASK-0015-design-system-shell-foundation.md`
- `TASK-0021-controlled-codex-assistant-refresh.md`

Related decision:
- `docs/decisions/0004-controlled-codex-panel.md`

## Explore Notes

Current state:
- TASK-0023 added controlled Codex executable discovery.
- Discovery checks `SIDEKICK_CODEX_PATH`, inherited PATH, and common Codex/npm locations.
- The override is currently environment-based only.
- There is no app settings screen.
- The renderer cannot choose executables today.
- Existing Electron security rules require typed, task-specific preload APIs and main-process validation.

Terminology:
- User-facing setting name should be `Codex CLI path`.
- Internal persisted setting key should be `sidekick_codex_path`.
- Environment variable compatibility should remain `SIDEKICK_CODEX_PATH`.

Important security boundary:
- The renderer may request settings reads/writes through typed APIs.
- The renderer must not receive raw filesystem, shell, process, or arbitrary IPC access.
- The main process must validate any configured executable path before using it.

Coordination notes:
- `TASK-0015` may change the app shell and navigation model.
- `TASK-0021` may change the Codex assistant UI.
- This settings task should either build after `TASK-0015` or explicitly coordinate if it must add navigation before the shell refresh lands.

## Task Spec

### Problem

When Sidekick cannot find Codex automatically, the user has no GUI path for telling Sidekick where the Codex CLI is installed.

Today the user must rely on the process environment, including `SIDEKICK_CODEX_PATH`. That is not practical for normal desktop use, especially on Windows.

### Goal

Add a Settings screen where the user can configure the Codex CLI executable path and verify whether Sidekick can use it.

### Scope

- Add a Settings entry point in the app shell.
- Add a dedicated Settings screen/view.
- Organize Settings using common desktop settings conventions:
  - clear page title;
  - category or section navigation;
  - settings grouped by purpose;
  - each setting row has label, description, control, current state, and actions;
  - destructive/reset actions are visually secondary;
  - save/validation feedback is explicit and local to the relevant setting.
- Add an `Integrations` or `Codex` settings section.
- Add a `Codex CLI path` setting that maps to internal key `sidekick_codex_path`.
- Allow the user to:
  - view the current override;
  - enter or paste a full executable path;
  - choose an executable path through a native file picker;
  - test/validate the configured path;
  - save the override;
  - reset to automatic discovery.
- Persist the setting locally.
- Make Codex runner discovery use the persisted setting before automatic discovery.
- Keep `SIDEKICK_CODEX_PATH` support for environment-based override.
- Show enough status information for the user to understand whether Codex is available and logged in after saving.

### Non-goals

- Full settings system for every future preference.
- Cloud sync.
- User accounts.
- WSL bridge support.
- Generic executable picker for arbitrary tools.
- Generic terminal.
- Model selection.
- API key configuration.
- Changing Codex run permissions or sandbox behavior.

### User Workflows

- User opens Settings from the app shell.
- User navigates to the Codex/Integrations section.
- User sees whether Sidekick is using automatic discovery, `SIDEKICK_CODEX_PATH`, or a saved `sidekick_codex_path` value.
- User chooses or types a Codex CLI executable path.
- User tests the path and sees version/status feedback.
- User saves the path.
- User returns to the Codex assistant and Sidekick uses the saved path.
- User resets the override and Sidekick returns to automatic discovery.

### Functional Requirements

- Settings are stored in a local app settings file under Electron `app.getPath('userData')`.
- Settings file writes must be atomic enough to avoid corrupting the file on normal app shutdown.
- If the settings file is missing, Sidekick uses defaults.
- If the settings file is unreadable or invalid JSON, Sidekick should not crash; it should report a settings warning and continue with defaults.
- `sidekick_codex_path` may be empty/null to mean automatic discovery.
- Saved Codex path must be an absolute path.
- Saved Codex path must point to an existing file.
- On Windows, valid Codex executable names include `codex.exe`, `codex.cmd`, `codex.bat`, and `codex`.
- On non-Windows platforms, valid Codex executable name is normally `codex`, but the validation should primarily require an existing file path rather than hardcoding one filename.
- Testing the path should run the equivalent of `codex --version` through the existing controlled main-process runner logic.
- Reset should remove the saved override and fall back to environment/automatic discovery.

### Settings Screen Requirements

- The screen should feel like a real settings surface, not a modal stuffed into the current inspector.
- Recommended information architecture:
  - `General` section for future app-level preferences, initially read-only or minimal if needed;
  - `Integrations` section with `Codex`;
  - optional `About` section for version/runtime info if it fits the existing app.
- The Codex settings section should include:
  - setting title: `Codex CLI path`;
  - explanation: Sidekick normally discovers Codex automatically, but this path can override discovery;
  - text input for the path;
  - `Choose...` action using native file picker;
  - `Test` action;
  - `Save` action;
  - `Reset to automatic discovery` action;
  - status text showing validation/test result.
- Use concise UI text. Do not add long explanatory copy in the app.
- Follow the app's current or refreshed design system, depending on whether TASK-0015 has landed.

### Security Requirements

- Do not expose raw `ipcRenderer`.
- Do not expose filesystem APIs to the renderer.
- Do not expose shell/process APIs to the renderer.
- Add typed preload APIs only for settings-specific operations.
- Validate all settings writes in the main process.
- Use native dialogs from the main process.
- Do not let the renderer pass arbitrary command arguments for validation.
- Validation/test may only run the selected executable with `--version`.
- Codex runs must still use the controlled Codex runner and existing sandbox modes.

### Acceptance Criteria

- [ ] App has a visible Settings entry point.
- [ ] Settings opens a dedicated settings screen/view.
- [ ] Settings screen is organized into conventional sections/categories.
- [ ] Codex CLI path can be viewed, edited, chosen through native file picker, tested, saved, and reset.
- [ ] Internal persisted key is `sidekick_codex_path`.
- [ ] Environment override `SIDEKICK_CODEX_PATH` still works.
- [ ] Saved `sidekick_codex_path` is used by Codex discovery when environment override is not set.
- [ ] Invalid paths are rejected with clear local feedback.
- [ ] Missing or invalid settings file does not crash the app.
- [ ] Renderer does not receive raw filesystem, process, shell, or IPC access.
- [ ] Unit tests cover settings validation and Codex path precedence.
- [ ] Integration tests cover settings persistence and Codex status using a saved fake Codex path.
- [ ] UI smoke tests cover opening Settings, saving a path, reset behavior, and returning to Codex status.

## Open Questions

- Should `SIDEKICK_CODEX_PATH` have higher precedence than the saved GUI setting, or should the GUI setting override the environment variable?
  - Recommended default: environment variable has highest precedence because it is explicit at process startup and useful for debugging.
- Should settings be reachable before a project folder is selected?
  - Recommended default: yes. Settings are app-level, not project-level.
- Should the Settings screen be modal or a normal app view?
  - Recommended default: normal app view/screen, because it can grow to contain future settings.

## Implementation Plan

1. Add app settings types and a main-process settings store.
2. Add validation for `sidekick_codex_path`.
3. Wire persisted setting into Codex executable resolution.
4. Add typed preload APIs for reading/saving/resetting/testing settings and choosing the Codex executable.
5. Add Settings screen markup/state in renderer.
6. Add settings styling.
7. Add unit, integration, and UI smoke tests.
8. Run full verification.

## Build Log

- 2026-05-12: Created task worktree `../Sidekick-worktrees/TASK-0024-settings-codex-path`.
- 2026-05-12: Copied TASK-0024 task record into the task worktree as the active source of truth.
- 2026-05-12: Ran `npm ci` because the new task worktree did not have `node_modules`.
- 2026-05-12: Baseline verification passed before implementation:
  - `npm run check`: passed.
  - `npm run test`: passed, 13 files and 50 tests.
- 2026-05-12: Added shared settings types and settings-specific preload APIs.
- 2026-05-12: Added `AppSettingsStore` with local JSON persistence under Electron `userData`, default handling, invalid JSON fallback, atomic temp-file write, and Codex path validation.
- 2026-05-12: Wired saved `sidekick_codex_path` into Codex executable discovery while preserving `SIDEKICK_CODEX_PATH` precedence.
- 2026-05-12: Added main-process handlers for reading settings, choosing Codex path through native file picker, saving, resetting, and testing Codex path.
- 2026-05-12: Added Settings navigation and a dedicated Settings screen with Integrations/Codex section.
- 2026-05-12: Added unit, integration, and UI smoke coverage.

## Verification Log

- 2026-05-12: `npm run check`: passed.
- 2026-05-12: `npm run test`: passed, 15 files and 57 tests.
- 2026-05-12: First `npm run test:ui`: failed because the new Settings smoke test matched `Codex` and `Automatic discovery` too broadly.
- 2026-05-12: Tightened UI smoke selectors.
- 2026-05-12: `npm run test:ui`: passed, 8 Playwright tests.
- 2026-05-12: Final combined verification:
  - `npm run check`: passed.
  - `npm run test`: passed, 15 files and 57 tests.
  - `npm run test:ui`: passed, 8 Playwright tests.
- 2026-05-12: `npm run package`: passed for Linux x64.

## Review Notes

- Settings APIs are typed and task-specific.
- Renderer does not receive raw filesystem, shell, process, or IPC access.
- Native file selection remains in the main process.
- Settings writes are validated in the main process before persistence.
- Codex path testing only uses controlled Codex runner behavior.
- `SIDEKICK_CODEX_PATH` keeps highest precedence over saved GUI settings.

## Documentation Notes

- This task record documents the settings behavior, security boundary, validation rules, and verification.
- No new decision record was added; the implementation follows and extends `docs/decisions/0004-controlled-codex-panel.md`.

## Closeout

Changed:
- Added a dedicated Settings screen with Integrations/Codex settings.
- Added persisted `sidekick_codex_path`.
- Added Codex path choose/test/save/reset actions.
- Wired saved settings into Codex discovery.
- Added settings store tests, settings-backed Codex integration test, and Settings UI smoke test.

Verified:
- `npm run check`: passed.
- `npm run test`: passed.
- `npm run test:ui`: passed.
- `npm run package`: passed.

Known gaps:
- Real Windows validation still needs user smoke testing on the Windows machine where the original Codex PATH issue appeared.

Final status:
- Done.
