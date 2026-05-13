# Task: Revised Navigation Model

ID: TASK-0033
Status: Planned
Class: Major
Owner: Pair
Created: 2026-05-13
Updated: 2026-05-13
Branch: task/TASK-0033-revised-navigation-model
Worktree: Not required for this task
Base branch: local main after the approved plan commit
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

Plan

Specification and planning are complete. Build has not started.
Open points have been resolved and captured as task decisions.

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [x] Worktree created or reused, if required (not required for this task)
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

## Resolved Decisions

- The first version of the topbar project control should show the active project and support `Velg annen mappe...`. Recent projects are deferred.
- `Innstillinger` should replace the workspace body while keeping the topbar stable. Settings are app-level, not project context.
- During an active workflow, the action bar should remain visible but competing global actions should be disabled so the user cannot start competing workflows.
- Standard behavior is to disable competing global action-bar actions while an active workflow is open.
- Project switching and settings navigation must also be locked or explicitly guarded while an active workflow is in progress, because those actions can hide or interrupt the workflow.
- Global actions in the action bar should be visually secondary. The active workflow's confirmation action should be the visually primary action.
- The tree should keep the existing expand/collapse and selection behavior. Drill-down navigation is deferred.
- The project root selection should be treated as project context in the right panel, not as an ordinary folder context.
- The first simplified right panel should show:
  - project context: project folder, file count, folder count, scan status / last scanned, warning count when relevant;
  - folder context: folder name, relative path, file count, subfolder count, inferred signal/type when known, last modified when available, contextual actions when available;
  - file context: file name, relative path, file type, file size, and last modified when available.
- File-specific actions should not include `Open file` in this task because Sidekick does not currently support opening files.
- Warnings should remain visible when they exist, but should not occupy a permanent large right-panel section when there are no warnings.
- Artifact types should be summarized in project context, not always shown as a full list.
- Folder signals should be shown primarily on relevant folder context, not as a permanent global section.
- Recent files are deferred from the simplified right panel unless planning finds a low-noise placement.
- Contextual actions in the right panel should use full-width action rows with clear scope copy.
- `TASK-0033` should prepare the right panel structure for future contextual folder actions, but it should not show a disabled or placeholder folder-scoped context-package action. That visible action belongs to `TASK-0034`.
- `Settings` and nearby settings navigation labels should be translated to Norwegian as part of this task, while technical names such as `Codex CLI` may remain as technical terms.
- After successful transcript import, preserve the current behavior of selecting/focusing the imported file when it is found after rescan.
- After successful full-project context-package generation, return behavior should not invent a new selection rule; preserve the prior selected project/folder/file context when practical.

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
- Disable competing global action-bar actions while an active workflow is open.
- Lock or explicitly guard project switching and settings navigation while an active workflow is in progress.
- Keep existing design tokens, typography, compact density, and accessibility rules unless the revised model requires small adjustments.
- Update `docs/architecture/desktop-design-guidelines.md` with the durable navigation responsibility model if the implementation confirms it.
- Add or update UI tests for the revised navigation behavior.
- Translate visible settings navigation labels to Norwegian where they are part of this GUI area.

### Non-goals

- Do not implement folder-scoped context package generation in this task. That belongs to `TASK-0034`.
- Do not add a generic file manager.
- Do not add unrestricted terminal behavior.
- Do not redesign the product as a dashboard, chat UI, or IDE.
- Do not replace the existing design token palette.
- Do not add dark mode.
- Do not add project history persistence unless it is explicitly planned.
- Do not add recent-project history in the first version.
- Do not implement drill-down navigation unless it is explicitly accepted during planning.
- Do not add file opening behavior.
- Do not show a disabled or placeholder folder-scoped context-package action. The visible action belongs to `TASK-0034`.
- Do not change backend behavior except where required to support existing workflows in the new UI placement.

### User Workflows

#### Default project workspace

1. User opens a selected project.
2. Topbar shows Sidekick and the active project.
3. Middle panel shows the folder tree.
4. Right panel shows project-level context when no specific folder/file is selected or when the project root is selected.
5. Action bar shows global actions.

#### Select folder

1. User selects a folder in the tree.
2. Tree remains visible in the middle panel.
3. Right panel updates to selected-folder context.
4. The right panel structure may support future contextual actions, but no folder-scoped context-package action is shown until `TASK-0034`.

#### Select file

1. User selects a file in the tree.
2. Tree remains visible in the middle panel.
3. Right panel updates to file metadata.

#### Start global workflow

1. User starts import transcript, full-project context package generation, or Codex from the action bar.
2. Middle panel replaces the folder tree with the active workflow.
3. Right panel remains stable and continues showing the previous project/folder/file context.
4. Workflow has its own back/cancel/progress/result controls.
5. Competing global action-bar actions are disabled while the workflow is active.
6. Project switching and settings navigation are locked or guarded while the workflow is in progress.
7. When the user returns, the tree is restored and the previous selection remains selected when possible, except successful transcript import should keep the existing behavior of selecting the imported file when it is available after rescan.

Workflow cancel/back semantics:

- Context-package and transcript-import preview/confirm states: cancel/back writes nothing and returns to the tree.
- Context-package and transcript-import running states: the operation is already confirmed; cancellation is not treated as rollback.
- Context-package and transcript-import completed states: returning to the tree does not undo the generated/copied file.
- Codex running state: cancel stops the current Codex process when possible, but does not guarantee rollback of any file changes made by Codex in write mode.
- Codex completed/canceled/failed states: returning to the tree keeps the result state history only as long as the task implementation supports it; no filesystem rollback is implied.

#### Open settings

1. User opens settings from the topbar.
2. Settings appear as an app-level view that replaces the workspace body while the topbar remains stable.
3. User can return to the workspace without losing the active project selection.

### Design Requirements

- The app should feel like a focused local workspace, not a web dashboard.
- Topbar must stay visually stable during normal operations.
- The selected project must remain visible whenever a project is active.
- The right panel should not become a workflow host.
- Active workflows should have a clear title, status, primary action, secondary action, and result state.
- Global action-bar actions should be visually secondary; the active workflow confirmation should be visually primary.
- Competing navigation must not silently hide an active workflow. Disable it or require explicit confirmation according to workflow risk.
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
- [ ] Project root selection renders as project context, not as an ordinary folder context.
- [ ] Right panel does not switch to workflow progress when a workflow starts.
- [ ] Import transcript workflow runs in the middle panel.
- [ ] Full-project context-package workflow runs in the middle panel.
- [ ] Codex workflow runs in the middle panel.
- [ ] Back/cancel from a workflow returns to the folder tree without applying the operation unless explicitly confirmed.
- [ ] Existing write-operation preview, progress, success, and error states remain available.
- [ ] Global action bar contains only global actions or a clearly labeled overflow menu.
- [ ] Competing global action-bar actions are disabled while an exclusive workflow is active.
- [ ] Project switching and settings navigation cannot silently hide an active workflow.
- [ ] Project switching is no longer treated as a routine action-bar action.
- [ ] Successful transcript import still selects/focuses the imported file after rescan when available.
- [ ] No disabled or placeholder folder-scoped context-package action is shown before `TASK-0034`.
- [ ] Settings labels in this GUI area use Norwegian user-facing copy.
- [ ] Keyboard navigation and focus behavior work for tree selection and workflow entry/exit.
- [ ] UI tests cover project-ready state, folder selection, file selection, starting each existing workflow, and returning from a workflow.
- [ ] No new raw filesystem, shell, process, or IPC access is exposed to the renderer.

## Open Points

No open points remain for specification. Additional implementation tradeoffs should be handled during planning.

## Implementation Plan

### Build Control

This is a large GUI task, but it does not require a dedicated worktree because no other agents are currently working in the codebase.

Build setup:

1. Ensure local main contains the approved plan update.
2. Commit this planning update before build starts.
3. Build directly on local main.
4. Make several small commits during build, one per completed step below.
5. Run the verification listed for each step before committing that step when practical.
6. Do not stop for intermediate human review during build. Return to the human only at final Ready For Review, unless implementation reveals a blocker that changes security boundaries, backend write behavior, data model, dependencies, or makes the approved plan impossible.

Human interaction model:

- The next human gate is approval to start build from this plan.
- After build approval, the agent should proceed through the development steps autonomously.
- The final handoff must include concrete GUI verification instructions for the human.

### Step 0: Baseline And Local Main Safety

Goal: establish a clean baseline before changing the GUI.

Actions:

- Confirm local main is clean after the plan commit.
- Run baseline verification on local main.
- Inspect current UI tests for selectors that will need updates.

Verification:

```bash
npm run check
npm test
npm run test:ui
```

Commit:

- No implementation commit unless baseline fixes are required.

### Step 1: Shell Structure And Topbar Project Control

Goal: introduce the revised shell responsibilities without moving workflow behavior yet.

Actions:

- Adjust `index.html` so the topbar has app identity, active project control, and `Innstillinger`.
- Replace the current mode strip with a simpler stable topbar treatment.
- Make the active project control responsible for choosing another project.
- Remove `Bytt prosjekt` from the bottom action bar.
- Keep global action-bar actions visible only when a project is active.
- Style action-bar actions as secondary triggers.
- Preserve the existing empty/project-entry state.

Expected visible change:

- The topbar becomes the clear place for project identity and project switching.
- The action bar no longer treats project switching as a routine workflow action.

Verification:

```bash
npm run check
npm run test:ui -- --grep "empty state|project overview|shell"
```

Commit:

```text
feat(ui): revise shell and project navigation
```

### Step 2: Middle-Panel Workflow Host

Goal: make the middle panel switch between folder tree and active workflow.

Actions:

- Introduce an explicit renderer state for the active workflow, for example:
  - `null`;
  - `context-package`;
  - `transcription-import`;
  - `codex`.
- Add a middle-panel workflow host and a tree host.
- Route global action-bar clicks to activate the relevant workflow host.
- Render existing context-package states inside the middle panel.
- Render existing transcript-import states inside the middle panel.
- Render existing Codex states inside the middle panel.
- Keep the existing workflow state machines and preload/main APIs unchanged.
- Add a shared return/cancel path that restores the tree without performing the operation unless explicitly confirmed.
- Apply explicit cancel/back semantics per workflow:
  - context-package and transcript-import preview/confirm states return without writing;
  - context-package and transcript-import completed states do not roll back generated/copied files;
  - Codex cancel stops the process when possible but does not roll back write-mode changes.
- Disable competing global action-bar actions while an exclusive workflow is active.
- Lock or explicitly guard topbar project switching and settings navigation while a workflow is in progress.
- Move keyboard focus into the workflow when opened.
- Return focus to the selected tree row or the triggering action when the workflow closes.
- Preserve current successful transcript import selection behavior: select/focus the imported file after rescan when available.

Expected visible change:

- Import, full-project context package, and Codex no longer run in the right panel.
- Starting one of these actions replaces the tree in the middle panel.
- The bottom action bar stays visible but cannot start competing workflows.

Verification:

```bash
npm run check
npm run test:ui -- --grep "context package|transcription|Codex|workflow"
```

Commit:

```text
feat(ui): move active workflows into the middle panel
```

### Step 3: Stable Right Context Panel

Goal: simplify the right panel so it only shows context for the selected project, folder, or file.

Actions:

- Replace the current right-panel collection of sections with one rendered context surface.
- Project context should show:
  - project folder;
  - file count;
  - folder count;
  - scan status / last scanned;
  - warning count when relevant;
  - compact artifact summary when useful.
- Folder context should show:
  - folder name;
  - relative path;
  - file count;
  - subfolder count;
  - inferred signal/type when known;
  - last modified when available;
  - a structure that can later host contextual actions.
- File context should show:
  - file name;
  - relative path;
  - file type;
  - file size;
  - last modified when available.
- Do not add `Open file` or other unsupported file actions.
- Do not render a disabled or placeholder folder-scoped context-package action; `TASK-0034` owns the visible action.
- Treat root selection as project context.
- Keep warnings visible when warnings exist, but avoid permanent large empty warning sections.
- Keep folder signals on relevant folder context instead of as a permanent global section.
- Defer recent files from the simplified right panel unless a low-noise placement is obvious during implementation.

Expected visible change:

- The right panel becomes smaller, calmer, and stable during active workflows.
- Selecting a folder/file changes context only, not the middle workflow area.

Verification:

```bash
npm run check
npm run test:ui -- --grep "selects folders|keyboard navigation|partial scan|empty scanned project"
```

Commit:

```text
feat(ui): simplify the stable context panel
```

### Step 4: Settings As App-Level View And Norwegian Copy

Goal: make settings consistent with the revised navigation model and Norwegian UI language.

Actions:

- Rename `Settings` to `Innstillinger` in the topbar.
- Translate nearby visible settings labels:
  - `Application settings`;
  - `Back to workspace`;
  - `Integrations`;
  - `General`;
  - `About`;
  - `Codex CLI path`;
  - `Path`;
  - `Choose...`;
  - `Test`;
  - `Save`;
  - `Reset to automatic discovery`;
  - settings status messages where they are visible.
- Keep technical terms such as `Codex CLI` where they are product/technology names.
- Ensure settings replaces the workspace body while keeping topbar orientation.
- Hide project workflow actions while settings is active, unless planning implementation shows a better no-noise alternative.
- Do not let settings silently hide an in-progress workflow. If a workflow is active, settings navigation should be disabled or explicitly guarded.

Expected visible change:

- Settings feels like an app-level view, not a project context panel.
- The settings area no longer mixes English and Norwegian user-facing labels.

Verification:

```bash
npm run check
npm run test:ui -- --grep "settings"
```

Commit:

```text
feat(ui): localize and align settings navigation
```

### Step 5: Accessibility, Responsive Layout, And Regression Tests

Goal: make the revised navigation verifiable and reviewable.

Actions:

- Update existing UI tests to match the revised DOM and labels.
- Add coverage that proves:
  - workflow host replaces the tree;
  - right panel stays stable during a workflow;
  - competing global actions are disabled during active workflows;
  - focus enters workflow on start and returns on close;
  - file selection shows metadata but no unsupported file action;
  - settings uses Norwegian labels;
  - layout still fits the `1040 x 720` minimum viewport and `1280 x 820` reference viewport.
- Keep or adjust existing tests for:
  - empty state;
  - project creation;
  - existing project initialization;
  - folder expand/collapse;
  - context package preview/generation;
  - transcript import;
  - Codex read-only, write warning, login, cancellation, failure.
- Update `docs/architecture/desktop-design-guidelines.md` with the durable shell responsibility model.

Verification:

```bash
npm run check
npm test
npm run test:ui
```

Commit:

```text
test(ui): cover revised navigation model
```

Optional docs commit if documentation changes are substantial enough to separate:

```text
docs: document revised desktop navigation model
```

### Final Verification Before Ready For Review

Run the full suite from local main:

```bash
npm run check
npm test
npm run test:ui
```

Start the renderer for human review:

```bash
npm run dev:renderer -- --port 5174
```

Final Ready For Review message should include:

- build location;
- commit list made during the task;
- verification command results;
- the local review URL;
- concrete human GUI checks:
  - select a project and verify topbar project context;
  - select a folder and confirm right panel changes;
  - start context package generation and confirm the workflow replaces the tree;
  - cancel/return and confirm the tree and selection return;
  - start transcript import and confirm action-bar actions are guarded;
  - open Codex and confirm it appears in the middle panel;
  - open `Innstillinger` and confirm Norwegian settings labels;
  - confirm no `Open file` action appears for selected files.

### Risks And Mitigations

- Renderer coupling risk: current workflow render functions write directly into right-panel targets. Mitigation: move targets intentionally and keep state machines unchanged before refactoring deeper.
- Test churn risk: many UI tests reference current panel placement. Mitigation: update tests in the same step as each visible behavior change and run targeted Playwright groups before each commit.
- Focus regression risk: replacing the tree with workflows can lose keyboard position. Mitigation: store triggering element/selected tree path and explicitly restore focus on close.
- UI noise risk: warnings, artifacts, and signals may disappear too aggressively. Mitigation: keep warning counts and compact summaries in project context, and keep detailed warning UI only when warnings exist.
- Scope creep risk: folder-scoped context package and recent projects are tempting because the revised model suggests them. Mitigation: keep both out of this task and leave them for `TASK-0034` and future work.
- Navigation interruption risk: topbar project switching or settings can hide an active workflow. Mitigation: disable or explicitly guard these navigations while a workflow is in progress.

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
