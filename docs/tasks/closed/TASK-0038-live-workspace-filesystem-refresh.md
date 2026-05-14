# Task: Live Workspace Filesystem Refresh

ID: TASK-0038
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-14
Updated: 2026-05-14
Branch: task/TASK-0038-live-workspace-filesystem-refresh
Worktree: ../Sidekick-worktrees/TASK-0038-live-workspace-filesystem-refresh
Base branch: origin/main
Write scope:
- `src/main`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0038-live-workspace-filesystem-refresh.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0031-local-searchable-project-index.md`
- `closed/TASK-0035-read-only-context-views.md`
- `closed/TASK-0036-create-workspace-instead-of-project.md`
- `closed/TASK-0037-folder-context-tagging.md`
Coordinates with:
- `docs/architecture/kontekstbasert-innholdsmodell.md`

## Summary

Sidekick must keep the active workspace tree and derived context views in sync when files or folders are created, renamed, moved, edited, or deleted outside Sidekick, for example from a Markdown editor such as Obsidian.

The first version should listen to filesystem changes for the selected workspace, rescan safely in the main process, and push a refreshed `WorkspaceScan` to the renderer through a typed preload API. The renderer should update the physical `Mapper` view and logical context views such as `Prosjekter` without requiring the user to re-open the workspace.

## Current Phase

Close

Implementation, verification, and closeout are complete.

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
- `src/main/folder-scanner.ts`
- `src/main/search-index.ts`
- `src/shared/sidekick-api.ts`
- `src/preload.ts`
- `src/renderer.ts`

Related tasks:
- `closed/TASK-0031-local-searchable-project-index.md`
- `closed/TASK-0035-read-only-context-views.md`
- `closed/TASK-0037-folder-context-tagging.md`

## Explore Notes

Current baseline:

- Sidekick scans a selected workspace root through `scanWorkspaceFolder`.
- The renderer receives a `WorkspaceScan` when the user selects, creates, or initializes a workspace.
- The renderer currently treats that scan as a snapshot.
- If the user creates folders or Markdown files in an external editor while Sidekick is open, those changes are not reliably reflected in the tree or context views until the workspace is manually re-opened or another workflow returns a fresh scan.
- TASK-0035 added derived context views to the scan result. Those views also become stale when the physical workspace changes.
- TASK-0037 stores folder tags in `.sidekick-folder.json` inside folders. Changes to those marker files can affect logical views such as `Prosjekter`.
- TASK-0031 already introduced filesystem watching for the local search index in `src/main/search-index.ts`.
- The search-index watcher is index-specific. It updates search data and status, but it does not update the active `WorkspaceScan` in the renderer.
- The search-index implementation treats watcher events as hints, uses main-process validation, and keeps scan/search-open fallback behavior. This is the right pattern to reuse conceptually.

## Task Spec

### Problem

Sidekick is not live with the filesystem.

When the user creates, renames, moves, or deletes folders and files in a Markdown editor, the Sidekick UI can keep showing the old workspace snapshot. This breaks the core local-first workflow because Sidekick and the editor are supposed to operate on the same folder tree.

This is especially visible after the context-based model:

- `Mapper` can miss new folders/files.
- `Prosjekter` can miss newly tagged project folders.
- A deleted or renamed selected item can remain selected in the right panel.
- Context actions can point at stale paths.

### Goal

Keep the active workspace UI synchronized with filesystem changes made outside Sidekick.

Sidekick should watch the selected workspace, rescan after relevant changes, and push an updated `WorkspaceScan` to the renderer. The renderer should then re-render the physical tree, context views, selected item state, and right context panel.

### Scope

- Add main-process filesystem monitoring for the active selected workspace.
- Watch the workspace root and relevant subdirectories in a cross-platform way.
- Treat watcher events as hints, not as trusted state.
- Debounce bursts of filesystem events before rescanning.
- Re-run `scanWorkspaceFolder(rootPath)` after relevant changes.
- Push a typed workspace-scan update event from main to renderer through preload.
- Update renderer state when a fresh scan arrives for the currently active workspace.
- Refresh both:
  - `Mapper`, the physical tree;
  - `Prosjekter`, the derived project context view.
- Preserve the current selected item when it still exists after refresh.
- If the selected item no longer exists, move selection to the nearest valid parent when possible, otherwise to the workspace root or empty workspace state.
- Surface a small non-intrusive status when Sidekick refreshes because the filesystem changed.
- Keep `.sidekick/`, `.sidekick/search-index/`, generated context packages, and ignored files from causing noisy UI refresh loops.
- Include folder metadata marker changes:
  - `.sidekick-folder.json` changes should trigger a rescan because tags affect context views.
- Rebuild or adjust watcher coverage when folders are added, removed, renamed, or moved.
- Close watchers when the active workspace changes or the app exits.

### Non-goals

- Do not implement cross-workspace background watching.
- Do not watch workspaces that are not currently open.
- Do not replace the existing search-index watcher in this task unless planning proves consolidation is required.
- Do not make the renderer read the filesystem directly.
- Do not expose raw `fs`, `ipcRenderer`, or process APIs to the renderer.
- Do not implement collaborative conflict handling.
- Do not implement full persistent workspace sessions.
- Do not create a database-backed file inventory.
- Do not rebuild context packages automatically when files change.
- Do not run Codex automatically when files change.

### Expected User Workflow

1. User opens Sidekick.
2. User selects an existing workspace.
3. Sidekick shows the current folder tree in `Mapper`.
4. User opens the same workspace in a Markdown editor.
5. User creates a folder, for example `Strategi/`.
6. Sidekick notices the filesystem change and refreshes the tree automatically.
7. User creates `Strategi/notat.md`.
8. Sidekick shows the new file without requiring re-opening the workspace.
9. User adds or edits `Strategi/.sidekick-folder.json` through Sidekick tagging or another safe metadata path.
10. Sidekick refreshes `Prosjekter` so the tagged folder appears or disappears in the logical view.
11. User deletes or renames a selected file in the Markdown editor.
12. Sidekick removes or updates the selected row and avoids stale right-panel actions.

### Functional Requirements

- When a file or folder is added under the active workspace, it appears in `Mapper` after a short debounce.
- When a file or folder is removed under the active workspace, it disappears from `Mapper` after a short debounce.
- When a file or folder is renamed or moved inside the active workspace, Sidekick eventually reflects the new path.
- When a folder with `.sidekick-folder.json` is added, removed, or changed, derived context views update.
- When a folder becomes tagged as `Prosjektmappe`, it appears in `Prosjekter`.
- When a `Prosjektmappe` tag is removed, that folder disappears from `Prosjekter`.
- When an item remains available at the same workspace-relative path after refresh, selection is preserved.
- When a selected item disappears, selection is repaired to a valid state and stale actions are disabled.
- The user does not need to click a refresh button for normal external editor changes.
- Manual refresh may still exist as a fallback if planning decides it is useful.

### Security Requirements

- Watcher setup and rescans must stay in the main process.
- Renderer updates must be delivered through a typed, task-specific preload API.
- Every watched path and rescanned path must be validated as inside the selected workspace root.
- Watcher event paths must be normalized before use.
- Unknown, missing, relative, absolute-outside-root, or malformed watcher paths must not be trusted.
- `.sidekick/` generated metadata must not become ordinary workspace content.
- Watcher failures must not crash the app.
- If watcher state becomes unreliable, Sidekick should fall back to a visible stale/manual-refresh state rather than silently trusting bad state.

### UX Requirements

- Keep the current dense work-surface style.
- Avoid modal dialogs for normal file refreshes.
- Show refresh status quietly, for example:
  - `Oppdaterer arbeidsområde...`
  - `Arbeidsområde oppdatert`
  - `Filovervåking feilet. Oppdater manuelt.`
- Do not interrupt Codex runs, imports, context-package generation, or tagging workflows with aggressive re-renders.
- If the user is in `Prosjekter`, keep them in `Prosjekter` after refresh.
- If the user is in `Mapper`, keep them in `Mapper` after refresh.

### Acceptance Criteria

- [ ] Creating a folder in an external editor or terminal makes it appear in Sidekick without re-opening the workspace.
- [ ] Creating a Markdown file in an external editor or terminal makes it appear in Sidekick without re-opening the workspace.
- [ ] Renaming a file or folder updates the Sidekick tree after debounce.
- [ ] Deleting a selected file removes it and clears or repairs the right-panel selection safely.
- [ ] Adding/removing `Prosjektmappe` metadata updates `Prosjekter`.
- [ ] `Mapper` and `Prosjekter` both update from the same refreshed scan model.
- [ ] Watchers are closed when switching workspaces.
- [ ] Watcher failure is visible and recoverable.
- [ ] Renderer receives updates through typed preload API only.
- [ ] Tests cover event debounce, rescan triggering, selection repair, ignored path behavior, and context-view refresh.

## Open Points

- Should Sidekick show a manual `Oppdater` action as a fallback in the main UI, or only when watcher failure is detected?
- What debounce interval is best for external Markdown editors that save by temporary-file rename? A first candidate is 500-1000 ms.
- Should generated context-package files trigger a visible refresh, or should they be ignored to avoid noise?
- Should Sidekick coalesce search-index watcher status and workspace-scan watcher status into one UI status later?
- Should the watcher service be a separate main-process module shared by search indexing and live workspace refresh, or should this first task keep it separate and later consolidate?

## Planning Notes

Planning should decide:

- Whether to introduce a dedicated `WorkspaceWatchManager`.
- How to avoid duplicate watcher work with `SearchIndexManager`.
- How to test watcher behavior deterministically without relying only on real OS timing.
- How renderer selection should be repaired for:
  - deleted file;
  - deleted folder;
  - renamed project root;
  - removed `Prosjektmappe` tag while viewing `Prosjekter`.
- Which paths should be ignored for refresh-loop prevention.

## Implementation Plan

1. Add a main-process `WorkspaceWatchManager` that watches the active workspace root and discovered subfolders with `fs.watch`.
2. Treat watcher events as hints only:
   - validate paths are inside the active workspace;
   - ignore generated Sidekick folders and context-package output;
   - keep `.sidekick-folder.json` marker changes visible.
3. Debounce event bursts and request a full `scanWorkspaceFolder(rootPath)` after the debounce.
4. Wire the manager from `src/main.ts` when a workspace is selected, created, or initialized.
5. Send typed `workspace:scan-updated` and `workspace:watch-status` events through preload.
6. Update renderer state for the active workspace only:
   - replace the scan;
   - keep the active context view;
   - preserve selection when possible;
   - fall back to nearest existing parent or workspace root when the selected item disappears.
7. Add tests for ignored paths, debounce refresh, and watcher coverage after new folders are discovered.
8. Bump app version to `0.1.11` for release.

## Build Log

- Created `src/main/workspace-watch-manager.ts`.
- Wired active workspace watching from `src/main.ts`.
- Added typed workspace watch and scan update events in `src/shared/sidekick-api.ts` and `src/preload.ts`.
- Updated `src/renderer.ts` to consume live scan updates and repair stale selection.
- Added unit coverage in `tests/unit/workspace-watch-manager.test.ts`.
- Bumped version to `0.1.11`.

## Verification Log

- `npm ci`
- `npm run check`
- `npm run test`
  - 27 files passed
  - 117 tests passed
- `npm run test:ui -- tests/e2e/renderer-smoke.spec.ts`
  - 35 tests passed
- `git diff --check`
- `npm run package -- --platform=linux --arch=x64`
- `npm run verify:packaged-context`

## Verification Plan

Automated verification should include:

- `npm run check`
- `npm run test`
- UI smoke coverage for live refresh behavior if practical.
- Unit or integration tests around watcher event normalization and debounce.
- Integration tests around rescanning after file/folder create/delete/rename.

Manual verification should include:

1. Start Sidekick from the repository root:

   ```bash
   cd /home/trutve/code/Sidekick
   npm start
   ```

2. Create a disposable workspace, or choose an existing disposable folder.
3. In a separate terminal or Markdown editor, create:

   ```text
   Strategi/
   Strategi/notat.md
   Operasjon/
   Operasjon/status.md
   ```

4. Verify in Sidekick:
   - `Mapper` shows both folders and files without re-opening the workspace.
   - Selecting the new files shows correct details in the right panel.
5. Tag `Strategi` as `Prosjektmappe` in Sidekick.
6. Verify in Sidekick:
   - `Prosjekter` shows `Strategi`.
7. Delete or rename `Strategi/notat.md` from the external editor or terminal.
8. Verify in Sidekick:
   - the row updates or disappears;
   - stale right-panel actions are not left pointing to the old path.
9. Switch workspaces.
10. Verify old workspace changes no longer push updates into the active UI.

## Closeout Notes

- Added live filesystem refresh for the active workspace.
- Sidekick now watches the selected workspace in the main process and rescans after debounced filesystem changes.
- Renderer receives typed scan/status events through preload and updates `Mapper`, `Prosjekter`, selection, and right-panel context without reopening the workspace.
- Generated Sidekick paths and context-package output are ignored to avoid noisy refresh loops.
- `.sidekick-folder.json` marker changes are intentionally not ignored because they affect logical context views.
- Version bumped to `0.1.11` for release.
