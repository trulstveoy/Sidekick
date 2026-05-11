# Task: Folder Tree Expand Collapse

ID: TASK-0002
Status: Done
Class: Standard
Owner: Pair
Created: 2026-05-09
Updated: 2026-05-09

## Summary

Improve the middle "Folder structure" area so large project folders are shown as an expandable and collapsible tree view instead of rendering every scanned file at once.

## Current Phase

Close

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [x] Human approval received, if required
- [x] Build complete
- [x] Verification complete
- [x] Review complete
- [x] Documentation complete
- [x] Closeout complete

## Links

Related files:
- `docs/workflows/agentic-development.md`
- `AGENTS.md`
- `src/shared/sidekick-api.ts`
- `src/renderer.ts`
- `index.html`
- `src/index.css`
- `tests/e2e/renderer-smoke.spec.ts`
- `tests/fixtures/project-folder-basic/`

Related decisions:
- None yet.

Related docs:
- `docs/architecture/application-architecture.md`
- `docs/tasks/closed/TASK-0001-inspect-local-folder.md`

## Explore Notes

Relevant files:
- `src/renderer.ts`
- `index.html`
- `src/index.css`
- `src/shared/sidekick-api.ts`
- `tests/e2e/renderer-smoke.spec.ts`
- `tests/fixtures/project-folder-basic/`

Current behavior:
- The middle UI area is the `Folder structure` workspace.
- `renderTree()` currently renders `scan.tree.children` recursively with no collapsed state.
- `renderTreeNode()` renders every descendant node whenever a scan is available.
- Folder rows and file rows use the same `.tree-row` structure.
- Folder rows are visually bold, but they are not interactive.
- There is no state for expanded or collapsed folders.
- There is no root folder row in the tree panel; only the selected root folder's children are rendered.
- The existing scanner already returns a nested `FolderTreeNode` tree, so the data model supports expand/collapse without main-process changes.
- The current Playwright smoke test only covers the empty browser-preview state.

Constraints:
- This task should stay in the renderer layer unless implementation reveals a real data-contract gap.
- Do not change folder scanning behavior.
- Do not introduce persistence of tree state.
- Do not add lazy loading yet.
- Do not add file editing, moving, deleting, copying, or renaming.
- Preserve the existing read-only inspection model.
- Keep the UI dense and practical; this is a work surface, not a marketing view.

Open questions:
- None. Use the simple first-version choices recorded in "Spec Decisions".

Initial risk:
- Low to medium

## Task Spec

Goal:
- Make the `Folder structure` panel usable for larger projects by allowing folders to be expanded and collapsed.

Non-goals:
- No lazy filesystem loading.
- No persistence of expanded folders across app restarts.
- No keyboard-complete file explorer behavior beyond normal button focus and activation.
- No file preview.
- No file selection model.
- No drag and drop.
- No context menus.
- No scanner, IPC, preload, or main-process changes unless strictly required.

Acceptance criteria:
- The folder structure is shown as a tree view.
- Folder nodes can be expanded.
- Folder nodes can be collapsed.
- When a folder is expanded, its direct child folders and files are visible.
- When a folder is collapsed, its descendants are hidden.
- File nodes are not expandable.
- Root folder is visible in the tree and expanded by default after a scan.
- First-level child folders are collapsed by default after a scan.
- Clicking a folder disclosure control toggles that folder.
- Clicking the folder row can also toggle that folder if it does not conflict with future file-selection behavior.
- Folder rows visibly communicate expanded or collapsed state.
- Folder rows show a simple child count summary where practical.
- Existing file metadata display remains available for visible file rows.
- Existing artifact type and context hint display remains available for visible nodes.
- Empty, loading, ready, partial, and error states continue to work.
- Browser-preview empty state continues to work.

Accessibility criteria:
- The tree container uses appropriate tree semantics.
- Folder nodes expose expanded/collapsed state with `aria-expanded`.
- Toggle controls are keyboard reachable and work with normal button activation.
- Toggle labels identify the folder being expanded or collapsed.

## Spec Decisions

Initial choices for the first version:

- Use the existing scanned `ProjectFolderScan.tree`; do not change scanner output.
- Keep expand/collapse state entirely in renderer memory.
- Use `FolderTreeNode.relativePath` as the stable tree node key.
- Reset expanded state when a new project folder is scanned.
- Default expanded state after scan: only the root folder path `.` is expanded.
- Render the root folder as the first visible tree row.
- Add `Expand all` and `Collapse all` controls only if they fit cleanly in the existing header or tree panel without adding visual noise.
- Prefer simple text or CSS chevrons before adding an icon dependency.
- Keep the interaction deterministic and small before adding richer keyboard navigation.

## Implementation Plan

### Plan Scope

This plan covers the first interactive tree view for the existing folder structure panel.

In scope:
- Renderer-managed expanded/collapsed folder state.
- Root folder row.
- Folder disclosure controls.
- Conditional rendering of descendants.
- Folder child count summaries.
- Tree semantics and basic accessibility attributes.
- CSS updates for interactive folder rows.
- Playwright coverage for expand/collapse behavior.

Out of scope:
- Lazy loading.
- Persisted tree state.
- Virtualized rendering.
- Full file explorer keyboard navigation.
- File selection or preview.
- Main, preload, IPC, or scanner changes.

### State Model

Add renderer state for expanded folders:

```ts
let expandedPaths = new Set<string>();
```

Rules:
- Empty state: `expandedPaths` is empty.
- Loading state: preserve nothing from the previous scan unless the previous scan is still visible by design.
- New scan result: `expandedPaths = new Set(['.'])`.
- Toggle folder: add or remove the folder `relativePath`.
- File nodes never enter `expandedPaths`.

### Rendering Model

Change tree rendering from "render every descendant" to "render visible descendants only".

Rendering rules:
- Render `scan.tree` as the root row.
- For a folder, compute `isExpanded = expandedPaths.has(node.relativePath)`.
- Render child list only when `isExpanded` is true.
- Render no child list for files.
- Keep scanner-provided sorting.
- Preserve current file metadata: artifact type, size, and context hints.
- Add folder metadata such as direct child counts if available from `node.children`.

Useful helper functions:
- `isFolder(node)`
- `hasChildren(node)`
- `getDirectChildSummary(node)`
- `toggleFolder(relativePath)`
- `expandAllFolders(scan.tree)`
- `collapseAllFolders()`

### Interaction Model

Folder rows:
- Include a small disclosure button at the start of the row.
- Use `>` for collapsed and `v` for expanded, or CSS equivalents.
- The disclosure button toggles the folder.
- The row may also toggle the folder for easier use.
- Avoid toggling twice when the button itself is clicked.

Files:
- Render as non-interactive leaf rows for now.
- Do not expose `aria-expanded`.

Optional controls:
- `Expand all` expands every folder in the current scan.
- `Collapse all` collapses every folder except root.
- These controls should be small and secondary if included.

### HTML Changes

Expected changes in `index.html`:
- Add a compact tree toolbar if `Expand all` and `Collapse all` are included.
- Change the tree container to support `role="tree"` if applied directly in static markup.
- Add data hooks for tree toolbar buttons if needed.

Avoid broad layout changes to the surrounding shell.

### CSS Changes

Expected changes in `src/index.css`:
- Add a stable column for the disclosure control.
- Add compact styles for folder toggle buttons.
- Preserve row height so expanding and collapsing does not create visual jitter.
- Keep tree indentation readable.
- Ensure long folder/file names wrap or truncate safely without overlapping metadata.
- Keep the existing restrained app palette.

### Testing Strategy

Automated tests:
- Keep existing unit and integration tests unchanged unless renderer helpers are extracted into testable pure functions.
- Extend Playwright coverage with a mocked `window.sidekick` scan result so browser smoke tests can exercise the rendered tree without a native dialog.
- Verify initial scanned tree state:
  - root is visible and expanded
  - first-level folders are visible
  - nested files are hidden while their parent folders are collapsed
- Verify expanding a folder reveals its direct files.
- Verify collapsing the folder hides those files again.
- Verify browser-preview empty state still works.

Manual smoke:
- Start Electron with `npm start`.
- Select a representative folder.
- Confirm root is open, child folders are collapsed, and file-heavy folders do not flood the view.
- Expand and collapse several folders.
- Confirm no files are modified.

### Implementation Steps

1. Add renderer state for expanded folder paths.
2. Reset expanded state when a new scan result is accepted.
3. Render `scan.tree` as the root row instead of only rendering root children.
4. Add folder disclosure controls and toggle handling.
5. Conditionally render children only for expanded folders.
6. Add folder child count summaries.
7. Add tree semantics and accessible labels.
8. Update CSS for disclosure controls, row layout, and indentation.
9. Add or extend Playwright tests with a mocked scan result.
10. Run verification and update this task record.

### Verification Plan

Run:
- `npm run test`
- `npm run test:ui`
- `npm run check`
- `npm run package`
- `npm start`

Manual checks:
- Empty state still renders.
- Scanned root folder renders as the top tree node.
- Root is expanded by default.
- Child folders are collapsed by default.
- Expanding a folder reveals direct child files and folders.
- Collapsing the folder hides descendants.
- Visible file rows still show artifact labels, sizes, and context hints.
- UI remains readable with long names.

### Security Review

Check before closeout:
- No new filesystem access is added to renderer.
- No raw IPC is exposed.
- No main/preload API expansion is introduced.
- No file mutation behavior is introduced.
- Existing Electron security settings remain unchanged.

### Documentation Impact

Update:
- `docs/tasks/closed/TASK-0002-folder-tree-expand-collapse.md`

Consider updating:
- `README.md` only if user-facing behavior needs mention.
- `docs/architecture/application-architecture.md` only if the implementation changes process boundaries or data flow.

Decision record:
- Not required unless implementation introduces persistence, lazy loading, virtualization, or a new durable UI architecture.

### Open Decisions Before Build

- None. Use the simple first-version choices recorded in this plan.

## Build Log

Implemented:
- Added renderer-managed expanded folder state.
- Rendered the scanned root folder as the first tree row.
- Added folder disclosure controls with expanded/collapsed labels.
- Rendered child nodes only when their parent folder is expanded.
- Added direct child count summaries for folder rows.
- Added `Expand all` and `Collapse all` controls in the tree panel.
- Added tree semantics with `role="tree"`, `role="treeitem"`, `role="group"`, and `aria-expanded`.
- Updated tree CSS for disclosure controls, compact toolbar buttons, stable row columns, and readable indentation.
- Extended Playwright coverage with a mocked scan result so expand/collapse behavior can be tested without a native folder dialog.

Plan deviations:
- None.

## Verification Log

Passed:
- `npm run test`
  - 2 test files passed.
  - 5 tests passed.
- `npm run test:ui`
  - 3 Playwright tests passed.
  - Covered empty state, single-folder expand/collapse, and expand/collapse all.
- `npm run check`
  - ESLint passed.
  - TypeScript typecheck passed.
- `npm run package`
  - Electron Forge packaged the app for Linux x64.
- `npm start`
  - Electron Forge launched the development app.

Observed warnings:
- Electron startup printed the same GPU/WebGL blocklist warning previously observed in this environment. The app still launched.

## Review Notes

Security and architecture review:
- No scanner, main-process, preload, or IPC changes were introduced.
- No new renderer filesystem access was introduced.
- No raw IPC was exposed.
- No file mutation behavior was introduced.
- Expand/collapse state stays in renderer memory and is reset on new scan results.

Residual risk:
- Full file-explorer keyboard navigation is still out of scope.
- Large folders are easier to browse, but the renderer still receives the full scanned tree because lazy loading and virtualization are out of scope.

Decision record needed:
- No
- Reason: this is a contained renderer interaction using the existing data model.

## Documentation Notes

Docs updated:
- `docs/tasks/closed/TASK-0002-folder-tree-expand-collapse.md`

Docs intentionally not updated:
- `README.md` because the documented scripts and architecture did not change.
- `docs/architecture/application-architecture.md` because process boundaries and data flow did not change.

Decision record needed:
- No
- Reason: no durable architecture, persistence, packaging, or data-model decision was introduced.

## Closeout

Changed:
- The middle folder structure panel now behaves as an expandable/collapsible tree view.
- Root folder is rendered and expanded by default after a scan.
- Child folders are collapsed by default.
- Visible folders show child counts.
- Users can expand/collapse individual folders or use `Expand all` and `Collapse all`.

Verified:
- `npm run test`
- `npm run test:ui`
- `npm run check`
- `npm run package`
- `npm start`

Known gaps:
- No persisted tree state.
- No lazy loading or virtualization.
- No full keyboard file explorer navigation beyond normal button activation.

Next:
- Test manually with a representative large project folder and refine density, row metadata, and keyboard behavior if needed.

Final status:
- Done
