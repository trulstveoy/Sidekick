# Task: Folder Hierarchy And Artifact Detail

ID: TASK-0018
Status: Closed
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0018-folder-hierarchy-artifact-detail
Worktree: main checkout (`/home/trutve/code/Sidekick`)
Base branch: main
Write scope:
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/e2e`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0015-design-system-shell-foundation.md`
- `closed/TASK-0017-project-overview-scan-understanding.md`
Implementation ordering: Build after `TASK-0017`. Can be built before or after `TASK-0019` if write scopes are coordinated, but sequential execution is safer.

## Summary

Refresh folder exploration: expandable hierarchy, selected folder detail, artifact rows, keyboard behavior, and breadcrumb/drill-down where useful.

This task should make the middle project structure area easier to scan and control. It should not add file opening.

This task has a distinct deliverable, but it depends on the refreshed overview and shares renderer state with workflow panels. It should be treated as sequential unless the implementation plan creates disjoint modules.

## Current Phase

Close

Human review approved. Task is complete.

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
- `../design/sidekick-ui design leveranse.zip::fase3b-mappehierarki.html`
- `../design/sidekick-ui design leveranse.zip::wireframe-02-prosjektoversikt.html`
- `../design/sidekick-ui design leveranse.zip::fase3-ref-prosjektoversikt.html`
- `../design/sidekick-ui design leveranse.zip::fase4-oppgave-04-mappehierarki.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-komponentveiledning.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-minimumsopplevelse.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-tokens-v2.json`
- WAI-ARIA Tree View Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/

Related tasks:
- `closed/TASK-0015-design-system-shell-foundation.md`
- `closed/TASK-0017-project-overview-scan-understanding.md`
- `closed/TASK-0002-folder-tree-expand-collapse.md`

## Explore Notes

Current app state:
- The scanner already returns a recursive `FolderTreeNode`.
- The renderer already renders a recursive tree with expand/collapse, expand all, collapse all, ARIA tree roles, and folder/file rows.
- Current behavior toggles folders but does not provide a polished selected-folder detail view.
- Current tree does not implement a consultant-style drill-down panel with breadcrumbs.
- Current app does not open files from the UI.

Design source observations:
- `fase3b-mappehierarki.html` is the strongest source for this task.
- The consultant design emphasizes expandable rows, selected folder context, drill-down, breadcrumbs, and a stable bottom action area.
- The design should reduce the need to scroll through too many files at once.
- Folder names and folder contents often carry the meaning of a project, so folder structure must remain primary.

Resolved decisions:
- File opening is not included in this task.
- Transcript import still targets the single detected transcription folder, not arbitrary selected folders.

Risk notes:
- Tree keyboard behavior is easy to regress when custom rendering changes.
- Selection and focus must not be conflated.
- Deep project structures can become visually noisy if every level is expanded inline.
- This task is likely to touch the same project state, selection state, and CSS surface as later workflow tasks.

## Task Spec

### Problem

The current tree can expand and collapse, but it still exposes too much raw structure at once and lacks a focused selected-folder/artifact detail experience.

### Goal

Make folder exploration more deliberate: users can expand/minimize, select folders, understand direct contents, and navigate deep structures without losing project context.

### Scope

- Refresh folder and file row styling.
- Preserve expand/collapse behavior.
- Add clear selected-row state.
- Keep focus state distinct from selected state.
- Add selected folder detail in the context surface or primary workspace.
- Present direct child folders/files and key metadata for the selected folder.
- Add breadcrumb/drill-down behavior where useful for deep structures.
- Ensure long names and paths truncate predictably.
- Improve keyboard navigation and ARIA state.
- Use Norwegian labels and status text.

### Non-goals

- Opening files in the system default app.
- Moving, renaming, deleting, or editing files.
- Changing scanner classification rules.
- Changing transcript import target rules.
- Adding file search/filter unless explicitly scoped later.
- Adding file watching.

### User Workflows

- User expands and collapses folders.
- User selects a folder and sees meaningful details about that folder.
- User explores direct files and child folders without seeing every nested file at once.
- User navigates deeper folders through breadcrumb/drill-down where the design calls for it.
- User can operate the hierarchy with keyboard and pointer.

### Design Requirements

- Follow `fase3b-mappehierarki.html`.
- Keep folder rows stronger than file rows.
- Use compact indentation and aligned counts/hints.
- Keep selection visible but calm.
- Use breadcrumbs for drill-down context when drilling into a folder.
- Preserve the shell/action/status patterns from earlier tasks.
- Follow WAI-ARIA tree-view expectations where applicable.

### Acceptance Criteria

- [ ] Folders can be expanded and collapsed in the refreshed hierarchy.
- [ ] Selected folder state is visible and distinct from keyboard focus.
- [ ] Selected folder detail shows path, counts, signals, warnings if any, and direct contents.
- [ ] Deep structures can be explored without requiring every nested level to stay visible inline.
- [ ] File rows are visually quieter than folder rows.
- [ ] Keyboard navigation supports expected tree movement and activation.
- [ ] ARIA expanded/selected/focus state matches visual state.
- [ ] Long folder names, filenames, and paths do not break layout.
- [ ] UI smoke tests cover expand/collapse, selection, keyboard navigation, and a deep structure path.

### Dependencies

- Requires `TASK-0015`.
- Should follow `TASK-0017` because it extends the project overview.

### Parallelization Notes

This task should usually be implemented after `TASK-0017` and before the final accessibility pass.

It may be possible to run it near `TASK-0019` only if the implementation plan assigns non-overlapping modules. In the current frontend structure, assume it is not safely parallel with other renderer-heavy GUI tasks.

### Open Questions

None blocking.

## Implementation Plan

### Plan Status

Build has been approved by the human.

`TASK-0017` is closed and committed on local `main`. At planning time, local `main` is ahead of `origin/main`, so the correct implementation base is local `main` unless those commits are pushed before Build starts.

Human override: this task does not need a separate worktree. Build is done directly in the main checkout.

Before implementation starts, run a baseline check from the main checkout:

```text
npm run check
npm run test:ui
```

If the baseline fails, record the failure in the Build Log before implementation.

### Design Sources

Use these consultant artifacts as the design source for this task:

- `docs/design/sidekick-ui design leveranse.zip::fase3b-mappehierarki.html`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-04-mappehierarki.md`
- `docs/design/sidekick-ui design leveranse.zip::wireframe-02-prosjektoversikt.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3-ref-prosjektoversikt.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-komponentveiledning.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-minimumsopplevelse.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-tokens-v2.json`
- `docs/design/gui-refresh-implementation-analysis.md`
- `docs/design/desktop-design-guidelines.md`
- WAI-ARIA Tree View Pattern

Normalize the consultant scope against the approved Sidekick scope:

- Do not add file opening in this task, even though the consultant handoff mentions it.
- Do not add a new `shell.openPath` IPC API in this task. If file opening becomes desired, it needs its own scoped security design and tests.
- Do not change scanner behavior or add filesystem reads from the renderer.
- Do not change transcript import targeting. It still targets the single detected transcription folder.
- Use the consultant's drill-down idea as folder-selection context, breadcrumb, and direct-content detail, not as a separate route or full navigation subsystem unless the simple implementation proves insufficient.

### Integrated Baseline From TASK-0017

`TASK-0017` already refreshed the project overview, shell, stats strip, action bar, scan status, warnings, and context-package status.

Build on that implementation:

- Keep the primary workspace and context surface introduced in `TASK-0017`.
- Keep the existing recursive scanner data and current expand/collapse tree behavior as the foundation.
- Extend the existing tree instead of replacing it with a new component architecture.
- Add selected-folder state as a narrow renderer concern.
- Keep overview actions wired to their existing workflow handlers.

### Implementation Steps

1. Add selected tree state in `src/renderer.ts`.
   - Track `selectedTreePath` and `focusedTreePath` separately from `expandedPaths`.
   - Initialize selection to `ROOT_PATH` after a successful scan.
   - Reset selection, focus, and expansion when scan state is cleared or replaced.

2. Add tree navigation helpers in `src/renderer.ts`.
   - Find a node by relative path.
   - Find parent and ancestor paths.
   - Flatten currently visible tree rows for keyboard movement.
   - Compute direct child folders/files and selected-folder summary data.

3. Refactor tree row rendering.
   - Keep `role="tree"` / `role="treeitem"` / `role="group"` semantics.
   - Add `aria-selected` to selectable rows.
   - Keep `aria-expanded` only on expandable folder rows.
   - Use roving `tabindex` so keyboard focus has one active tree row.
   - Make click on the row select the folder or file, while the disclosure control only expands/collapses.
   - Keep file rows visually quieter than folder rows.

4. Implement keyboard behavior.
   - `ArrowDown` / `ArrowUp`: move focus through visible rows.
   - `ArrowRight`: expand a collapsed folder, or move to the first visible child if already expanded.
   - `ArrowLeft`: collapse an expanded folder, or move focus to the parent.
   - `Enter` / `Space`: select the focused row.
   - Do not trigger file opening.

5. Add selected-folder detail UI.
   - Prefer the existing context surface for selected-folder details so the primary tree remains scannable.
   - Show selected name, relative path, direct file/folder counts, total file count, signals, relevant warnings, and direct contents.
   - Include a breadcrumb from project root to the selected folder.
   - Make breadcrumb ancestors selectable so the user can move back up without relying on tree expansion state.
   - For files, show a read-only artifact detail state with file name, path, type, size, modified date, and hints where available.

6. Add deep-structure behavior without a heavy navigation subsystem.
   - Keep inline expand/collapse for the tree.
   - Use the selected detail panel to show only direct contents for the selected folder.
   - Avoid rendering every nested file as prominent primary content at once.
   - Keep expand-all/collapse-all, but ensure collapse-all leaves the root selected and the detail panel usable.

7. Update layout and styling in `src/index.css`.
   - Add selected-row treatment using the design token approach from `fase3b-komponentveiledning.md`.
   - Add visible focus treatment distinct from selected state.
   - Add compact indentation/connector treatment where practical without disrupting current recursive rendering.
   - Add breadcrumb, direct-content rows, artifact badges, and empty-folder messaging.
   - Preserve the `1040 x 720` minimum experience by hiding lower-priority detail columns before the core tree breaks.

8. Update `index.html` only where stable hooks are needed.
   - Add data targets for selected-folder context, breadcrumb, and direct-content list if the existing context surface cannot be cleanly reused.
   - Keep markup generic enough for later transcript import and context-package refresh tasks.

9. Update UI smoke tests in `tests/e2e/renderer-smoke.spec.ts`.
   - Extend the mock scan with at least one deep nested folder path and direct files.
   - Cover expand/collapse behavior after the refactor.
   - Cover folder selection and selected-detail rendering.
   - Cover breadcrumb navigation back to an ancestor.
   - Cover keyboard movement and activation.
   - Assert `aria-expanded` and `aria-selected` for representative rows.
   - Cover long names or minimum viewport behavior where practical.

### Verification Plan

Run from the main checkout:

```text
npm run check
npm run test:ui
```

If implementation touches pure helper functions in a way that can be unit-tested directly, add or update unit tests and run:

```text
npm test
```

Manual verification before review:

- Select a sample project with nested folders.
- Expand and collapse folders with pointer.
- Select folders and files with pointer.
- Navigate the tree with keyboard only.
- Confirm focus and selection are visually different.
- Confirm breadcrumb ancestor selection works.
- Confirm no file opens when a file row is selected.
- Check the view around `1280 x 820` and `1040 x 720`.

### Security And Architecture Notes

This task should remain renderer-only plus static markup/style updates.

Do not add:

- new IPC channels;
- raw filesystem access;
- `shell.openPath`;
- external navigation;
- file mutation operations.

If implementation reveals that file opening, new filesystem data, or selected-folder write actions are required to satisfy the design, stop and ask for a human decision before continuing.

### Documentation Notes

No decision record is expected because this task should not change security boundaries, persistence, packaging, or agent workflow.

Update this Task Record during Build with:

- actual worktree creation/reuse;
- implementation deviations from this plan;
- verification commands and results;
- review notes;
- closeout summary.

## Build Log

- Built directly in the main checkout per human override.
- Added selected tree state for folder/file rows while preserving existing expand/collapse behavior.
- Added selected folder/file context surface with breadcrumb, metadata, direct contents, and empty-folder/file messaging.
- Added keyboard navigation for visible tree rows:
  - `ArrowUp` / `ArrowDown` move focus;
  - `ArrowRight` expands or moves into children;
  - `ArrowLeft` collapses or moves to parent;
  - `Enter` / `Space` selects the focused row.
- Added calm selected-row and focus styling, direct-content rows, artifact badges, and breadcrumb styles.
- Added UI smoke coverage for selection, selected details, keyboard navigation, breadcrumb navigation, and deep nested folder paths.
- No new IPC, filesystem access, shell opening, external navigation, or file mutation was added.

## Verification Log

- Baseline before implementation:
  - `npm run check` passed.
  - `npm run test:ui` passed, 13 tests.
- During implementation:
  - `npm run check` passed.
  - Targeted UI tests for existing expand/collapse passed.
  - Targeted keyboard-navigation UI test initially failed because the test focus target did not match the final row-focus model. The implementation and test were adjusted so rows are the keyboard focus target while `aria-selected` stays on the treeitem.
- Final verification:
  - `npm run check` passed.
  - `npm run test:ui` passed, 15 tests.
  - `npm test` passed, 57 tests across 15 files.

## Review Notes

Human review approved: "det fungerer."

## Documentation Notes

Task record updated with build notes and verification results.

## Closeout

- Implemented folder/file selection in the project tree.
- Added selected context surface with breadcrumb, metadata, and direct contents.
- Added keyboard navigation and ARIA selected/expanded state for tree rows.
- Verified with `npm run check`, `npm run test:ui`, and `npm test`.
- No new privileged Electron APIs or filesystem write behavior were added.
