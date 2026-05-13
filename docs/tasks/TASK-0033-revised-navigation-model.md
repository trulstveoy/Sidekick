# Task: Revised Navigation Model

ID: TASK-0033
Status: Specified
Class: Major
Owner: Pair
Created: 2026-05-13
Updated: 2026-05-13
Branch: task/TASK-0033-revised-navigation-model
Worktree: ../Sidekick-worktrees/TASK-0033-revised-navigation-model
Base branch: origin/main
Write scope:
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/e2e`
- `tests/unit`
- `docs/architecture/desktop-design-guidelines.md`
- `docs/tasks/TASK-0033-revised-navigation-model.md`
Parallel safety: Exclusive
Depends on:
- `closed/TASK-0015-design-system-shell-foundation.md`
- `closed/TASK-0016-project-entry-creation-refresh.md`
- `closed/TASK-0017-project-overview-scan-understanding.md`
- `closed/TASK-0018-folder-hierarchy-artifact-detail.md`
- `closed/TASK-0019-write-pattern-transcript-import.md`
- `closed/TASK-0020-context-package-workflow-refresh.md`
- `closed/TASK-0021-controlled-codex-assistant-refresh.md`
- `closed/TASK-0022-gui-refresh-accessibility-regression.md`
Coordinates with:
- `TASK-0034-folder-scoped-context-package.md`

## Summary

Refine the Sidekick GUI navigation model so each major surface has one clear responsibility.

The revised model keeps the topbar as project orientation, the middle panel as the active work surface, the right panel as stable context for the selected project/folder/file, and the bottom action bar as the entry point for global actions.

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

## Links

Related docs:
- `../architecture/revidert-designdokument.md`
- `../architecture/revidert-navigasjonsmodell.html`
- `../architecture/desktop-design-guidelines.md`
- `../architecture/product-vision.md`

Related tasks:
- `TASK-0034-folder-scoped-context-package.md`

## Explore Notes

The revised design proposal identifies a structural problem in the current UI: too many responsibilities live in the right context surface.

Current app structure, observed from `index.html` and `src/renderer.ts`:

- The topbar shows app identity, selected project context, mode pills, and settings.
- The middle workspace contains project entry, stats, scan state, and the folder tree.
- The right context surface contains scan status, context-package status, selected item details, transcription import, context package generation, Codex, folder signals, artifact counts, recent files, and warnings.
- Existing write workflows already have explicit state machines in `src/renderer.ts`, but their visible surfaces are embedded in the right panel.
- Existing CSS already has the core dimensions and tokens needed for the revised model: topbar, action bar, context width, warm neutral palette, compact typography, focus states, and tree styling.

The revised design proposal changes the responsibility split:

- Topbar: app identity and active project context.
- Middle panel: folder tree in the default state, or one active workflow while an action is running.
- Right panel: stable context for the selected project, folder, or file.
- Action bar: global actions only.

The proposal is intentionally structural, not a complete new visual design. It should preserve the established minimalist design system while reducing panel competition and making active workflows easier to understand.

## Task Spec

### Problem

The current GUI puts project context, selected item context, write workflows, Codex, warnings, recent files, and metadata into the same right-side surface.

This makes the app harder to scan and weakens the mental model. Users can see a lot of information, but it is not always clear what is the primary work area, what is contextual information, and where a workflow is active.

### Goal

Implement the revised navigation model so the app has clearer, more stable regions:

- the topbar orients the user;
- the middle panel is the active work surface;
- the right panel shows context for the selected project/folder/file;
- the action bar starts global actions.

The user should be able to understand where they are, what is selected, and which workflow is active without scanning multiple competing panels.

### Scope

- Update the shell layout to match the revised responsibility model.
- Keep the selected project visible in the topbar.
- Make project switching a topbar responsibility rather than a routine action-bar action.
- Keep the folder tree as the default middle-panel state when a project is active.
- Move active workflows out of the right context panel and into the middle panel.
- Keep the right panel stable while a workflow is active.
- Render right-panel context for:
  - no explicit selection / project context;
  - selected folder;
  - selected file.
- Keep global actions in the action bar:
  - import transcript;
  - generate full-project context package;
  - run Codex;
  - additional actions menu if needed.
- Disable or otherwise guard global action-bar actions while an exclusive workflow is active.
- Keep existing design tokens, typography, compact density, and accessibility rules unless the revised model requires small adjustments.
- Update `docs/architecture/desktop-design-guidelines.md` with the durable navigation responsibility model if the implementation confirms it.
- Add or update UI tests for the revised navigation behavior.

### Non-goals

- Do not implement folder-scoped context package generation in this task. That belongs to `TASK-0034`.
- Do not add a generic file manager.
- Do not add unrestricted terminal behavior.
- Do not redesign the product as a dashboard, chat UI, or IDE.
- Do not replace the existing design token palette.
- Do not add dark mode.
- Do not add project history persistence unless it is explicitly planned.
- Do not implement drill-down navigation unless it is explicitly accepted during planning.
- Do not change backend behavior except where required to support existing workflows in the new UI placement.

### User Workflows

#### Default project workspace

1. User opens a selected project.
2. Topbar shows Sidekick and the active project.
3. Middle panel shows the folder tree.
4. Right panel shows project-level context when no specific folder/file is selected.
5. Action bar shows global actions.

#### Select folder

1. User selects a folder in the tree.
2. Tree remains visible in the middle panel.
3. Right panel updates to selected-folder context.
4. Contextual actions for the selected folder may appear in the right panel, but folder-scoped context generation is implemented separately in `TASK-0034`.

#### Select file

1. User selects a file in the tree.
2. Tree remains visible in the middle panel.
3. Right panel updates to file metadata and file-specific actions.

#### Start global workflow

1. User starts import transcript, full-project context package generation, or Codex from the action bar.
2. Middle panel replaces the folder tree with the active workflow.
3. Right panel remains stable and continues showing the previous project/folder/file context.
4. Workflow has its own back/cancel/progress/result controls.
5. When the user returns, the tree is restored and the previous selection remains selected when possible.

#### Open settings

1. User opens settings from the topbar.
2. Settings appear as an app view that replaces the workspace or middle panel according to the planned implementation.
3. User can return to the workspace without losing the active project selection.

### Design Requirements

- The app should feel like a focused local workspace, not a web dashboard.
- Topbar must stay visually stable during normal operations.
- The selected project must remain visible whenever a project is active.
- The right panel should not become a workflow host.
- Active workflows should have a clear title, status, primary action, secondary action, and result state.
- Write operations must show the target path before execution.
- Contextual actions must be visually distinct from global actions by location and copy.
- Use Norwegian for user-facing workflow labels where the surrounding UI is Norwegian.
- Keep keyboard focus predictable:
  - focus moves into a workflow when the workflow replaces the tree;
  - focus returns to the selected tree row when the workflow closes;
  - tree keyboard behavior remains usable.
- The layout must remain usable at approximately `1280 x 820` and maintain the documented minimum experience around `1040 x 720`.

### Acceptance Criteria

- [ ] User can identify the active project from the topbar.
- [ ] User can select folders and files from the middle-panel tree.
- [ ] Right panel shows project, folder, or file context based on selection.
- [ ] Right panel does not switch to workflow progress when a workflow starts.
- [ ] Import transcript workflow runs in the middle panel.
- [ ] Full-project context-package workflow runs in the middle panel.
- [ ] Codex workflow runs in the middle panel.
- [ ] Back/cancel from a workflow returns to the folder tree without applying the operation unless explicitly confirmed.
- [ ] Existing write-operation preview, progress, success, and error states remain available.
- [ ] Global action bar contains only global actions or a clearly labeled overflow menu.
- [ ] Project switching is no longer treated as a routine action-bar action.
- [ ] Keyboard navigation and focus behavior work for tree selection and workflow entry/exit.
- [ ] UI tests cover project-ready state, folder selection, file selection, starting each existing workflow, and returning from a workflow.
- [ ] No new raw filesystem, shell, process, or IPC access is exposed to the renderer.

## Open Points

- Should the topbar project control include recent projects in the first version, or only `Velg annen mappe...`?
- Should settings replace the full workspace or only the middle panel?
- Should the action bar be fully disabled during an active workflow, or should safe navigation actions remain available?
- Should global actions be visually secondary by default, with only the current workflow action primary?
- Should the tree keep the existing expand/collapse behavior only, or should the proposed `drill-down` affordance be added later?
- Which metadata currently shown in the right panel should remain visible in the first simplified project/folder/file context views?
- How should warnings, recent files, artifact counts, and folder signals be surfaced after the right panel becomes simpler?
- Should context actions in the right panel use full-width buttons, compact buttons, or menu rows?
- Should `Settings` be translated to `Innstillinger` throughout the UI as part of this task?

## Implementation Plan

Not started. Stop after Specify until this task is explicitly approved for planning/build.

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
