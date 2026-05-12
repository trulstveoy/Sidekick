# Task: Project Entry And Creation Refresh

ID: TASK-0016
Status: Closed
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0016-project-entry-creation-refresh
Worktree: ../Sidekick-worktrees/TASK-0016-project-entry-creation-refresh
Base branch: origin/main
Write scope:
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `src/shared`
- `tests/e2e`
- `tests/unit`
Parallel safety: Coordinate
Depends on:
- `TASK-0015-design-system-shell-foundation.md`
Implementation ordering: Build after `TASK-0015`. Build before `TASK-0017`.

## Summary

Refresh the project entry experience: empty state, choose existing project folder, create new project folder, loading states, and errors.

This task should produce a visible and testable first-use experience without changing the project creation rules or adding persistence.

This task is part of a sequential GUI refresh chain. It should not be built in parallel with `TASK-0017` or `TASK-0018` unless the frontend has first been split into clearly owned modules.

## Current Phase

Closed

Human review approved. Task is complete and merged into `main`.

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
- `../design/sidekick-ui design leveranse.zip::wireframe-01-tom-tilstand.html`
- `../design/sidekick-ui design leveranse.zip::fase3-ref-tom-tilstand.html`
- `../design/sidekick-ui design leveranse.zip::fase4-oppgave-02-prosjektinngang.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`

Related tasks:
- `closed/TASK-0015-design-system-shell-foundation.md`
- `closed/TASK-0011-create-project-folder-structure.md`

## Explore Notes

Current app state:
- Existing project selection is handled by `window.sidekick.chooseProjectFolder()`.
- Project creation is handled by `window.sidekick.createProjectFolder({ projectName })`.
- The main process asks the user to choose the parent folder with a native folder dialog.
- Project creation creates `00. Forutsetninger` and `01. Transkripsjoner`.
- If the target folder exists, the main process reports an error instead of overwriting.
- `TASK-0015` is integrated in `main`; the app now uses the refreshed shell with topbar, primary workspace, context surface, action bar, status bar, and tokenized base styles.
- Current empty state still uses the old state-banner copy inside the new primary workspace.
- Current project creation still lives as a small form in the context surface, not as the consultant's focused empty-state/modal entry flow.
- The settings view for Codex path configuration exists in the same shell and must be preserved.

Design source observations:
- The consultant empty-state reference is calmer and more focused than the current app.
- The entry flow should support two equal paths: choose existing project folder and create new project folder.
- The design should not copy the old proof-of-concept layout.
- The user-facing language should be Norwegian.
- The final design should use the new shell foundation from `TASK-0015`.

Resolved decisions:
- Do not add last-selected-project persistence in this task.
- Keep native folder dialogs for local filesystem access.
- Do not change the project folder structure created by Sidekick.

Risk notes:
- The UI must not imply cloud storage, sync, or remote project creation.
- Project creation is a write operation because it creates folders on disk.
- The selected parent path and resulting project path should be explicit before or after creation, depending on the final flow.
- This task will likely touch the same renderer, CSS, and smoke-test files as the overview and folder hierarchy tasks. Treat those as coordination points.

## Task Spec

### Problem

The current first-use experience is functional but proof-of-concept. It does not yet match the calmer, clearer consultant design direction.

### Goal

Give the user a clear, minimal project entry experience for choosing an existing folder or creating a new Sidekick project folder.

### Scope

- Redesign the no-project-selected state.
- Redesign the choose-existing-project entry action.
- Redesign the create-project flow.
- Show loading/pending state while project folder selection, creation, or scanning is in progress.
- Show clear errors for cancelled, invalid, or failed creation flows.
- Show creation success by selecting and scanning the created project.
- Use Norwegian user-facing copy.
- Preserve native dialogs for folder selection.
- Preserve current folder creation rules.

### Non-goals

- Persist last selected project.
- Convert existing folders into Sidekick projects.
- Change required project folders.
- Add project templates.
- Add cloud/project accounts.
- Add scan progress or scan cancellation.
- Redesign the full project overview after scan.

### User Workflows

- User opens Sidekick without an active project and sees a calm empty state.
- User chooses an existing project folder and Sidekick scans it.
- User creates a new project folder and Sidekick creates the required folders, selects it, and scans it.
- User sees an understandable error if creation fails.
- User can cancel a native dialog without Sidekick entering a broken state.

### Design Requirements

- Follow `wireframe-01-tom-tilstand.html` and `fase3-ref-tom-tilstand.html`.
- Keep the empty state focused on the next available action.
- Use the shared shell and base components from `TASK-0015`.
- Treat project creation as a write operation when the final confirmation/result is shown.
- Show project path information clearly where available.
- Avoid long explanatory copy.
- Preserve accessible labels and focus order.

### Acceptance Criteria

- [x] Empty state uses the refreshed visual design and Norwegian copy.
- [x] User can choose an existing project folder from the empty state.
- [x] User can create a new project folder using the existing required folder structure.
- [x] Creation flow clearly indicates that folders will be created on disk.
- [x] Existing error cases are visible and actionable.
- [x] Cancelling folder selection or project creation leaves the UI in a stable state.
- [x] Successful project creation transitions to the selected/scanned project state.
- [x] UI smoke tests cover empty state, choose folder, create project success, and create project error/cancel paths where practical.

### Dependencies

- Requires `TASK-0015` shell and component foundation.
- Should be completed before `TASK-0017` because the refreshed project overview depends on the selected/scanned project state produced by project entry.

### Parallelization Notes

This task has a distinct user-visible deliverable, but it is not practically isolated from nearby GUI tasks in the current frontend structure.

Do not build it in parallel with:

- `TASK-0017-project-overview-scan-understanding.md`
- `TASK-0018-folder-hierarchy-artifact-detail.md`

unless the implementation plan first assigns disjoint renderer/CSS modules and test files.

### Open Questions

None blocking.

## Implementation Plan

### Plan Status

This plan intentionally stops before Build. Build should not start until the human approves it.

`TASK-0015` is now integrated in `origin/main`, so this task should branch from the current `origin/main` and build directly on the refreshed shell. Do not recreate the old sidebar/workspace/inspector structure.

Before Build starts, create or reuse the task worktree from the current integration base:

```text
git fetch
git worktree add ../Sidekick-worktrees/TASK-0016-project-entry-creation-refresh -b task/TASK-0016-project-entry-creation-refresh origin/main
```

If the branch already exists, reuse it:

```text
git worktree add ../Sidekick-worktrees/TASK-0016-project-entry-creation-refresh task/TASK-0016-project-entry-creation-refresh
```

After creating the worktree, run a quick baseline status/check from the worktree before editing. If the baseline fails, record it in the Build Log before implementation.

### Integrated Shell Baseline

`TASK-0015` established the refreshed shell:

- topbar with selected project name/path;
- primary workspace;
- context surface;
- action bar;
- status bar;
- token-driven base CSS and shared control styles;
- Norwegian shell labels for the touched foundation areas;
- Playwright assertions for shell structure.

`TASK-0016` should build inside that shell rather than reintroducing the previous sidebar/workspace/inspector model.

Specific impacts:

- The empty state should live in the `primary-workspace`, not in the old sidebar.
- The current project-creation form in the context surface should be replaced by a proper project-entry modal flow.
- Disabled transcript/context/Codex panels should not compete with the no-project entry card; hide or visually suppress no-project workflow panels where needed.
- The action bar should not duplicate the centered empty-state actions. In no-project entry states, either keep it empty/quiet or hide its controls while preserving shell stability.
- Preserve the settings UI and settings data hooks already present in the integrated shell:
  - `data-open-settings`;
  - `data-open-workspace`;
  - `data-close-settings`;
  - `data-settings-view`;
  - `data-settings-*`.
- Keep the settings smoke test passing while changing the project-entry experience.

### UX Model

Use the consultant's `wireframe-01-tom-tilstand.html` and `fase3-ref-tom-tilstand.html` as the primary visual references, normalized to the actual Sidekick behavior.

Target states:

1. Empty entry state.
   - Topbar and status bar remain visible.
   - Primary workspace shows one focused entry card.
   - Card copy is short and Norwegian.
   - Primary action: `Velg eksisterende mappe...`.
   - Secondary action: `Opprett ny prosjektmappe...`.
   - Status bar says `Ingen aktiv prosjektkontekst`.

2. Choose existing folder.
   - Button opens the existing native folder dialog.
   - While the selected folder is being scanned, show a read-only loading state: `Leser mappeinnhold`.
   - Cancelled dialog returns to the empty entry state with no error.
   - Errors show a compact, actionable error banner and keep the entry actions available.

3. Create new project.
   - Secondary action opens a centered modal, not a side panel.
   - Modal asks for project name and parent location.
   - Parent location is selected through a native folder dialog.
   - The resulting target path and required folders are previewed before creation.
   - Show calm write-operation copy because creating a project writes folders to disk.
   - `Opprett mappe` stays disabled until project name and parent location are valid.
   - Escape and `Avbryt` close the modal without filesystem changes.

4. Create success.
   - Existing backend behavior creates the root folder plus `00. Forutsetninger` and `01. Transkripsjoner`.
   - The created project becomes the active scanned project.
   - Success is visible briefly through status/copy and the resulting project path.

5. Create error.
   - Invalid project name, duplicate folder, cancelled parent selection, and filesystem errors stay in the modal or entry card.
   - Messages should be user-actionable and should not expose stack traces.

### Functional Boundary

Preserve current product rules:

- no last-project persistence;
- no recent-project list;
- no project templates;
- no change to required folder names;
- no conversion flow for existing folders;
- no scan progress percentage or cancellation API;
- no cloud/account behavior.

The consultant handoff mentions persistence and a stricter 64-character name limit. Those are intentionally out of scope for this task because the resolved Sidekick spec preserves current project creation rules.

### IPC And Security Plan

The current `createProjectFolder({ projectName })` API opens a native parent-folder dialog inside the main process and then creates the project immediately. That is functional, but it cannot show the selected parent location and resulting target path before the write happens.

For this task, add a small typed IPC extension so the modal can preview the write target without exposing raw filesystem access:

- Add `chooseProjectParentFolder(): Promise<string | null>` to the preload API.
- Main process opens a native directory dialog and returns only the selected parent path.
- Main process records selected parent paths in a small allow-list for the current app session.
- Extend project creation to pass `parentPath` with `projectName`.
- Main process validates that `parentPath` came from the native parent-folder dialog before creating folders.
- Keep all path validation and folder creation in the main process.

This keeps the renderer from inventing arbitrary write targets while allowing the user to see the destination before confirming creation.

### Renderer Plan

1. Add project-entry markup in `index.html`.
   - Add a focused empty-state card inside `primary-workspace`.
   - Add a project-create modal with stable data hooks:
     - `data-project-create-dialog`;
     - `data-project-parent-path`;
     - `data-choose-project-parent`;
     - `data-project-target-preview`;
     - `data-project-create-cancel`;
     - existing `data-project-name`, `data-create-project`, and `data-create-project-message`.
   - Keep existing workflow hooks for later tasks.
   - Preserve existing settings view hooks and the settings section outside the project-entry rewrite.

2. Update renderer state.
   - Replace the always-visible project-create panel behavior with modal state.
   - Track selected parent path for project creation.
   - Track project creation states: closed, editing, selecting parent, creating, error.
   - Validate the project name before enabling `Opprett mappe`.
   - Keep validation aligned with current backend rules: required name, not absolute path, no slash, backslash, NUL, `.`, or `..`.
   - Do not add a new max length unless backend rules are explicitly changed later.

3. Render empty/loading/error states.
   - Empty: entry card visible, no noisy disabled workflow panels.
   - Loading after choosing or creating: show `Leser mappeinnhold`, target path when known, and `Ingen filer endres. Kun lesing.` for scans.
   - Error: show compact banner with what failed, affected path if known, and recovery action.
   - Cancel: return to stable empty state without showing an error.

4. Focus and keyboard behavior.
   - Focus first meaningful action in the empty card on initial render.
   - Focus project-name input when the create modal opens.
   - Trap practical tab flow inside the modal while it is open.
   - Escape closes the modal when not actively creating.
   - Enter submits only when the modal form is valid.

### Styling Plan

Build on `TASK-0015` tokens and base primitives.

Add styles for:

- centered entry card;
- folder icon wrapper using neutral surfaces;
- divider text `eller`;
- modal overlay and modal panel;
- inline parent-path picker row;
- target-folder preview;
- write-operation hint;
- compact error banner;
- scanning/loading card.

Do not introduce decorative gradients, large hero treatment, nested cards, or new accent colors.

At `1040 x 720`, the empty card and modal must fit without hiding primary actions. Long paths should truncate or wrap inside the preview area without expanding the modal beyond its max width.

### Test Plan

Update Playwright smoke coverage for the refreshed entry flow:

- empty state renders with Norwegian heading and entry actions;
- choose existing folder success selects/scans the project;
- choose existing folder cancel returns to empty state without error;
- create modal opens from empty state;
- project-name input receives focus when modal opens;
- invalid project names keep `Opprett mappe` disabled and show validation feedback;
- parent-folder selection cancel keeps the modal open and no write occurs;
- successful project creation transitions to selected/scanned project state and shows required folders;
- project creation error shows an actionable error and keeps the modal usable;
- Escape closes the modal without calling create;
- shell remains usable at `1040 x 720` through existing or added UI smoke checks.

Add unit coverage only if a shared project-name validation helper is introduced. Existing main-process project-creator tests should continue to prove folder creation rules and no-overwrite behavior.

Required verification during Build:

```text
npm run check
npm run test:ui
npm test
```

Manual/visual checks:

- empty app at `1280 x 820`;
- empty app at `1040 x 720`;
- create modal at both supported sizes;
- loading state after mocked folder selection;
- error banner state.

### File-Level Plan

Expected implementation files:

- `index.html`: entry card, modal markup, shell hook adjustments.
- `src/index.css`: entry card, modal, error/loading, and responsive styling.
- `src/renderer.ts`: entry state, modal behavior, validation, IPC calls, focus handling.
- `src/main.ts`: typed IPC for choosing project parent and guarded creation with selected parent path.
- `src/preload.ts`: expose the new typed parent-folder selection API.
- `src/shared/sidekick-api.ts`: update project creation request/API types.
- `src/shared/*`: optional shared validation helper if it prevents duplication.
- `tests/e2e/renderer-smoke.spec.ts`: refreshed entry-flow smoke tests.
- `tests/unit/*`: only if shared validation or main behavior changes require focused coverage.

Avoid touching:

- scanner behavior;
- required folder names;
- transcript import backend behavior;
- context package backend behavior;
- Codex runner behavior;
- packaging/signing/release files.

### Rollback And Risk Controls

- Keep the backend project creation rules as the source of truth.
- Keep native dialogs in the main process.
- Do not let the renderer provide arbitrary filesystem write targets; only create inside a parent path selected through the native dialog in this session.
- Adapt entry markup to the current integrated shell rather than reapplying old proof-of-concept layout assumptions.
- Preserve settings behavior and record any visual compromise in Review Notes.
- If parent-path preview requires more API change than planned, stop before broadening scope.

## Build Log

- Created dedicated task worktree at `../Sidekick-worktrees/TASK-0016-project-entry-creation-refresh` from `origin/main`.
- Added refreshed no-project entry card in the primary workspace with Norwegian copy and focused choose/create actions.
- Replaced the old context-surface project creation form with a centered create-project dialog.
- Added parent-folder selection preview before project creation, including destination path and required folder preview.
- Added guarded typed IPC for `chooseProjectParentFolder()` and extended project creation to require a parent path selected through the native dialog in the same app session.
- Updated renderer state, validation, cancellation, loading, error, focus, Escape, Enter, and practical tab-trap behavior for the project creation dialog.
- Hid noisy workflow panels/action bar while no project is active, while preserving the refreshed shell and settings view.
- Updated Playwright smoke tests for empty state, create success, create validation/cancel, and create error flows.

## Verification Log

- `npm run check` passed.
- `npm run test:ui` passed: 10 Playwright tests.
- `npm test` passed: 15 files, 57 tests.
- Manual visual check via local dev server at `1280 x 820` and `1040 x 720`.
- Screenshot checks written to `/tmp/sidekick-task16-empty-final-1280x820.png` and `/tmp/sidekick-task16-modal-final-1280x820.png`.
- Confirmed the create dialog no longer shows the required-name validation error before the user interacts with the field.

## Review Notes

- Implementation follows the consultant's empty-state and project-entry direction while preserving existing project creation rules.
- The renderer still cannot invent arbitrary write paths; project creation is limited to parent folders selected through the native folder dialog during the current session.
- The dialog uses concise Norwegian copy and keeps write behavior explicit without adding extra project templates or persistence.
- Existing settings, scanned-project, transcript, context-package, and Codex smoke flows continue to pass after the entry refresh.

## Documentation Notes

- Task record updated with build, verification, and review notes.

## Closeout

- Human reviewed and approved the task on 2026-05-12.
- Merged into `main` with merge commit `2bbf9a0`.
- Closed task record moved to `docs/tasks/closed/`.
