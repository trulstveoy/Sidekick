# Task: Shared Filesystem Event Layer

ID: TASK-0040
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-18
Updated: 2026-05-18
Branch: task/TASK-0040-shared-filesystem-event-layer
Worktree: `/home/trutve/code/Sidekick`
Base branch: origin/main
Write scope:
- `src/main/workspace-file-events.ts`
- `src/main/workspace-watch-manager.ts`
- `src/main/search-index.ts`
- `src/main.ts`
- `tests/unit`
- `tests/integration`
- `docs/architecture/solution-architecture.md`
- `docs/tasks/TASK-0040-shared-filesystem-event-layer.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0031-local-searchable-project-index.md`
- `closed/TASK-0038-live-workspace-filesystem-refresh.md`
- `closed/TASK-0039-solution-architecture-static-analysis.md`

## Summary

Sidekick har i dag to separate watcher-mekanismer:

- `WorkspaceWatchManager` lytter på filsystemet for å trigge ny `WorkspaceScan` til UI.
- `SearchIndexManager` lytter på filsystemet for å oppdatere lokal MiniSearch-indeks.

De bør ikke slås sammen til én domenemodul. De bør bruke et felles lavnivålag for filsystemevents, med to separate konsumenter. Målet er å dele watcher-lifecycle, path-normalisering, inside-root-validering, watch-folder-innsamling og watcher-feilhåndtering, men beholde workspace-refresh og search-index som egne domener.

## Current Phase

Close

Build og automatisert verifikasjon er fullført. Bruker avklarte at review ikke trengs for denne tasken, og tasken er lukket.

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [x] Worktree created or reused, if required
- [x] Human approval received for Build
- [x] Build complete
- [x] Verification complete
- [x] Review complete
- [x] Documentation complete
- [x] Closeout complete

## Links

Related source:
- `../../src/main/workspace-watch-manager.ts`
- `../../src/main/search-index.ts`
- `../../src/main.ts`
- `../../src/shared/sidekick-api.ts`
- `../../tests/unit/workspace-watch-manager.test.ts`
- `../../tests/integration/search-index.test.ts`

Related docs:
- `../architecture/solution-architecture.md`
- `closed/TASK-0031-local-searchable-project-index.md`
- `closed/TASK-0038-live-workspace-filesystem-refresh.md`
- `closed/TASK-0039-solution-architecture-static-analysis.md`

## Explore Notes

### Current Workspace Watcher

`src/main/workspace-watch-manager.ts`:

- owns `fs.watch` watchers directly;
- collects folders recursively;
- ignores `.git`, `.sidekick`, `node_modules`, `out`, `dist`, `.vite`, `.cache`;
- has workspace-refresh-specific ignore logic through `shouldIgnoreWorkspaceRefreshPath`;
- treats `.sidekick-folder.json` as relevant because folder tags affect logical context views;
- debounces refresh events with `WORKSPACE_REFRESH_DEBOUNCE_MS = 800`;
- emits:
  - `refresh(rootPath)`;
  - `status(WorkspaceWatchStatus)`;
- refreshes watcher coverage after `notifyUpdated` or `notifyRefreshFailed`.

### Current Search Watcher

`src/main/search-index.ts`:

- owns `fs.watch` watchers directly inside `SearchIndexManager`;
- keeps watchers per indexed workspace state;
- collects folders recursively;
- ignores `.git`, `.sidekick`, `node_modules`, `out`, `dist`, `.vite`, `.cache` and all hidden folders;
- debounces incremental updates with `SEARCH_UPDATE_DEBOUNCE_MS = 1000`;
- treats `rename` events specially and may run manifest diff;
- marks index stale when root-level or unsafe events occur;
- keeps search-specific state: `manifest`, `MiniSearch` index, pending paths and update queue.

### Duplication

The duplicate low-level behavior is:

- `fs.watch` setup and teardown;
- recursive folder collection;
- root-relative path calculation;
- inside-workspace validation;
- watcher failure handling;
- closing timers/watchers;
- reacting to newly created folders by refreshing watcher coverage.

### Real Domain Differences

The following should remain separate:

- Workspace refresh wants a new full `WorkspaceScan`.
- Search wants incremental index updates and manifest diff logic.
- Workspace refresh must react to `.sidekick-folder.json`.
- Search must not index `.sidekick-folder.json`.
- Search status and workspace-watch status are different user-facing concepts.
- Search can have stale index semantics. Workspace refresh should retry scan and update UI status.

## Task Spec

### Problem

The current implementation has two independent watcher stacks that solve the same low-level filesystem problem. This makes Sidekick harder to reason about and increases the risk that search and workspace views react differently to the same external file change.

### Goal

Introduce a shared low-level filesystem event layer for workspace file changes. Keep `WorkspaceWatchManager` and `SearchIndexManager` as separate consumers of that event layer.

Target shape:

```text
WorkspaceFileEventService
  -> WorkspaceWatchManager -> scanWorkspaceFolder -> renderer workspace update
  -> SearchIndexManager -> MiniSearch incremental update / stale status
```

### Scope

- Add a new main-process module, planned name: `src/main/workspace-file-events.ts`.
- Move shared low-level watcher concerns into the new module:
  - recursive watch-folder collection;
  - `fs.watch` lifecycle;
  - path normalization;
  - root containment checks;
  - watcher status/error events;
  - watcher coverage refresh;
  - per-root watcher reuse.
- Refactor `WorkspaceWatchManager` to consume normalized file events instead of owning `fs.watch`.
- Refactor `SearchIndexManager` to consume normalized file events instead of owning `fs.watch`.
- Keep each consumer's domain filter and debounce policy.
- Keep renderer API unchanged unless implementation proves a typed event/status addition is strictly necessary.
- Keep existing user behavior:
  - external file changes update `Mapper`;
  - folder metadata changes update `Prosjekter`;
  - search index updates or becomes stale as before;
  - watcher failures remain visible.

### Non-goals

- Do not merge `WorkspaceWatchManager` and `SearchIndexManager`.
- Do not move scanning or indexing logic into the shared event layer.
- Do not add a new dependency such as `chokidar` in this task.
- Do not change renderer layout or UX beyond preserving current statuses.
- Do not add database-backed file inventory.
- Do not make renderer read the filesystem.
- Do not automatically regenerate context packages, summaries or Codex outputs when files change.
- Do not support background watching of workspaces that have never been opened or indexed in the current process.

### Proposed Design

Add `WorkspaceFileEventService`.

Planned public types:

```ts
export type WorkspaceFileEventType = 'change' | 'rename';

export type WorkspaceFileEvent = {
  rootPath: string;
  absolutePath: string;
  relativePath: string;
  eventType: WorkspaceFileEventType;
  createdAt: string;
};

export type WorkspaceFileWatchStatus = {
  rootPath: string;
  state: 'watching' | 'error';
  message: string;
  createdAt: string;
};
```

Planned class responsibilities:

```ts
export class WorkspaceFileEventService extends EventEmitter {
  watchWorkspace(rootPath: string, ownerId: string): () => void;
  refreshWorkspaceWatchers(rootPath: string): Promise<void>;
  closeWorkspace(rootPath: string): void;
  close(): void;
}
```

Design decisions:

- `WorkspaceFileEventService` is main-process only.
- It owns actual `FSWatcher` instances.
- It keeps one watcher set per root path.
- It supports multiple owners per root, for example `workspace-refresh` and `search-index`.
- `watchWorkspace(rootPath, ownerId)` is idempotent for the same owner/root pair and returns an unsubscribe function.
- Watchers close only when the last owner unsubscribes or the service closes.
- It emits raw normalized file events; consumers decide what the event means.
- It does not know about `WorkspaceScan`, MiniSearch, `.sidekick-folder.json`, document types or context views.
- It validates candidate paths before emitting events. Unsafe paths emit an error/status and are not delivered as normal file events.
- It should ignore folders that neither consumer needs:
  - `.git`
  - `.sidekick`
  - `node_modules`
  - `out`
  - `dist`
  - `.vite`
  - `.cache`
  - hidden folders
- It should not ignore `.sidekick-folder.json`, because that file lives inside normal folders and is needed by workspace refresh. Search can filter it later.

### Consumer Behavior

`WorkspaceWatchManager` after refactor:

- keeps `WorkspaceWatchStatus`;
- subscribes to `WorkspaceFileEventService` for the active workspace;
- filters events through `shouldIgnoreWorkspaceRefreshPath`;
- debounces relevant events for full workspace refresh;
- emits `refresh(rootPath)` as before;
- calls `refreshWorkspaceWatchers(rootPath)` after a successful or failed scan so newly created folders become watched;
- exposes the same API to `src/main.ts` as today.

`SearchIndexManager` after refactor:

- accepts a shared `WorkspaceFileEventService` in its constructor;
- subscribes when an index is loaded, built or refreshed;
- unsubscribes on `deleteIndex`, root close or manager close;
- keeps existing search-specific debounce, queue, stale handling and manifest diff;
- handles `rename` events as today;
- filters unsupported paths through existing search logic rather than in the shared event layer.

`src/main.ts` after refactor:

```ts
const workspaceFileEventService = new WorkspaceFileEventService();
const searchIndexManager = new SearchIndexManager(workspaceFileEventService);
const workspaceWatchManager = new WorkspaceWatchManager(workspaceFileEventService);
```

On app shutdown, close managers and the shared event service.

### Security Requirements

- Keep all watcher code in main process.
- Do not expose raw filesystem events to renderer.
- Validate every event path as inside the selected root before consumers see it.
- Normalize relative paths to POSIX-style workspace-relative paths.
- Treat events as hints. Consumers must still rescan or revalidate before trusting the filesystem state.
- Watcher failures must not crash the app.
- Existing sandbox, context isolation and typed preload boundaries must remain unchanged.

### Acceptance Criteria

- `WorkspaceFileEventService` owns `fs.watch`; `WorkspaceWatchManager` and `SearchIndexManager` no longer create raw watchers directly.
- A single active workspace can be consumed by both workspace refresh and search index without duplicate watcher trees for the same root.
- External file create/update/delete still refreshes `Mapper`.
- Adding/removing/changing `.sidekick-folder.json` still updates `Prosjekter`.
- Search index still updates or becomes stale on supported file changes and rename events.
- Search still ignores `.sidekick`, `.sidekick-folder.json`, generated context packages and unsupported/binary files.
- Watcher coverage still updates after a new folder is created.
- Switching active workspace closes the old workspace-refresh subscription without breaking any search-index state that still intentionally watches another root.
- App shutdown closes all watcher resources.
- Renderer API remains unchanged.
- Tests cover the shared event service and both consumers.

## Open Points

No open points block Build.

Resolved planning choices:

- Use a shared low-level event service, not a merged domain watcher.
- Keep separate consumer status events.
- Keep separate debounce intervals at the consumer level.
- Do not introduce `chokidar` in the first implementation.
- Keep `fs.watch` as the underlying primitive and preserve manual refresh/stale fallbacks.

Future, not part of this task:

- Consider a unified UI status that summarizes both workspace refresh and search index work.
- Consider a stronger cross-platform watcher dependency only if `fs.watch` proves unreliable in real use.

## Implementation Plan

### Phase 1: Shared Event Service

1. Add `src/main/workspace-file-events.ts`.
2. Define `WorkspaceFileEvent`, `WorkspaceFileWatchStatus` and owner/subscription types.
3. Move shared helpers into the new module:
   - path containment check;
   - POSIX relative-path conversion;
   - ignored watch-folder names;
   - recursive watch-folder collection.
4. Implement per-root watcher state:
   - `rootPath`;
   - `watchers`;
   - `owners`;
   - `refreshing` guard if needed.
5. Implement `watchWorkspace(rootPath, ownerId)` with idempotent owner registration and unsubscribe.
6. Implement `refreshWorkspaceWatchers(rootPath)` to close/rebuild the watcher set for roots that still have owners.
7. Implement `closeWorkspace(rootPath)` and `close()`.
8. Emit normalized events only after inside-root validation.
9. Emit status/error events for watcher startup and runtime failures.

### Phase 2: Refactor Workspace Refresh Consumer

1. Update `WorkspaceWatchManager` constructor to accept `WorkspaceFileEventService`.
2. Remove direct `fs.watch`, `FSWatcher`, `readdir`, `stat` and recursive watcher collection from `workspace-watch-manager.ts`.
3. Keep `shouldIgnoreWorkspaceRefreshPath` as workspace-refresh-specific filtering.
4. Subscribe to `WorkspaceFileEventService` in `watchWorkspace`.
5. Unsubscribe in `close`.
6. Keep existing `refresh` and `WorkspaceWatchStatus` behavior.
7. Replace internal watcher refresh calls with `refreshWorkspaceWatchers(rootPath)`.

### Phase 3: Refactor Search Consumer

1. Update `SearchIndexManager` constructor to accept `WorkspaceFileEventService`.
2. Replace `watchers` in `WorkspaceIndexState` with an unsubscribe function or subscription handle.
3. Remove direct `fs.watch` and `collectWatchFolders` from `search-index.ts`.
4. Subscribe to the shared event service when an index is loaded, built or refreshed.
5. Preserve `pendingPaths`, update queue, rename sentinel and stale handling.
6. Keep search-specific ignore/index rules in `shouldIndexFileName`, `shouldIgnoreFolder`, `collectDocuments` and manifest diff.
7. Ensure `deleteIndex` and `close` unsubscribe cleanly.

### Phase 4: Main Process Wiring

1. Instantiate one shared `WorkspaceFileEventService` in `src/main.ts`.
2. Pass it to `WorkspaceWatchManager`.
3. Pass it to `SearchIndexManager`.
4. Close the shared service during `before-quit` after managers close.
5. Confirm no preload or renderer API change is needed.

### Phase 5: Tests

1. Add unit tests for `WorkspaceFileEventService`:
   - emits normalized workspace-relative events;
   - ignores ignored/hidden watch folders during watcher collection;
   - rejects unsafe/outside-root event paths;
   - supports multiple owners for one root without closing watchers until the last owner unsubscribes;
   - closes watchers on `close`.
2. Update `tests/unit/workspace-watch-manager.test.ts`:
   - still ignores generated Sidekick paths but reacts to `.sidekick-folder.json`;
   - still emits one debounced refresh for file changes;
   - still refreshes watcher coverage after new folder discovery.
3. Update or extend `tests/integration/search-index.test.ts`:
   - supported file changes still become searchable;
   - removed files disappear from search after watcher-driven update or explicit refresh path;
   - rename events still trigger manifest diff or stale behavior.
4. Add a regression test that both workspace refresh and search can subscribe to the same root through the same event service.

### Phase 6: Documentation

1. Update `docs/architecture/solution-architecture.md`.
2. Replace the current observation that Sidekick has two watcher mechanisms with the new architecture:

```text
WorkspaceFileEventService
  -> WorkspaceWatchManager
  -> SearchIndexManager
```

3. Document that file events are hints and domain consumers remain responsible for validation/rescan/indexing.

## Verification Plan

### Automated Verification

Run from repository root:

```bash
cd /home/trutve/code/Sidekick
npm run test -- tests/unit/workspace-file-events.test.ts tests/unit/workspace-watch-manager.test.ts tests/integration/search-index.test.ts
npm run check
```

Also run:

```bash
git diff --check
```

Expected result:

- Targeted tests pass.
- `npm run check` passes.
- No whitespace or patch errors.

### Manual Verification

Run from repository root:

```bash
cd /home/trutve/code/Sidekick
npm start
```

Verify workspace refresh:

1. Open an existing test workspace or create a new temporary workspace in Sidekick.
2. Keep Sidekick open.
3. In a terminal or Markdown editor, create `Ekstern-test/notat.md` inside the workspace.
4. Confirm `Mapper` updates without re-opening the workspace.
5. Rename `notat.md` to `notat-2.md`.
6. Confirm `Mapper` reflects the rename.
7. Delete the file.
8. Confirm the tree and right panel do not show stale actions for the deleted file.

Verify logical view refresh:

1. Create a folder `Strategi`.
2. Tag it as `Prosjektmappe` in Sidekick.
3. Confirm it appears in `Prosjekter`.
4. Remove the tag.
5. Confirm it disappears from `Prosjekter`.
6. Confirm `.sidekick-folder.json` changes still trigger refresh.

Verify search:

1. Create `Soketest.md` with a unique term, for example `arkitektur-refaktor-0040`.
2. Wait for debounce.
3. Search for `arkitektur-refaktor-0040`.
4. Confirm the file appears.
5. Change the term or delete the file.
6. Confirm search updates after debounce, or reports stale status with manual refresh fallback.

Verify ignored paths:

1. Generate or edit files under `.sidekick/search-index/`.
2. Confirm this does not cause noisy workspace tree refresh loops.
3. Generate a context package.
4. Confirm generated `*.context-package.md` does not create repeated refresh/index loops.

## Build Log

Implemented on 2026-05-18:

- Added `src/main/workspace-file-events.ts` as the shared low-level `fs.watch` event service.
- Refactored `WorkspaceWatchManager` so it subscribes to normalized workspace file events instead of owning raw watchers.
- Refactored `SearchIndexManager` so it subscribes to the same event service while keeping search-specific debounce, manifest diff and stale handling.
- Wired one shared `WorkspaceFileEventService` instance in `src/main.ts`.
- Updated search watcher behavior so index load/build waits until watcher coverage is ready before returning.
- Added watcher coverage refresh after search manifest diff so newly created folders can become watched.
- Added unit coverage for the shared event service.
- Updated workspace-watch tests for the injected shared event service.
- Added integration coverage for search results updated by filesystem watcher events.
- Updated `docs/architecture/solution-architecture.md` to describe the new shared event layer.

## Verification Log

Automated verification:

- `npm run test -- tests/unit/workspace-file-events.test.ts tests/unit/workspace-watch-manager.test.ts tests/integration/search-index.test.ts` - passed. Because of the repository test script, this executed the existing unit/integration suite as well: 28 test files, 123 tests.
- `npm run check` - passed.
- `git diff --check` - passed, including new files after intent-to-add.

Manual verification is not run yet. Use the manual verification plan above in the running Electron app.

## Review Notes

Review ble eksplisitt avklart som ikke nødvendig av bruker.

## Documentation Notes

`docs/architecture/solution-architecture.md` is updated with the shared event layer and separate consumers.

## Closeout

Done. Felles lavnivålag for filsystemevents er implementert med separate konsumenter for workspace refresh og search index. Automatisert verifikasjon passerer. Manuell verifikasjon er ikke kjørt i denne closeouten.
