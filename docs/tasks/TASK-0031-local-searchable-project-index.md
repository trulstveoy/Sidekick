# Task: Local Searchable Workspace Index

ID: TASK-0031
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-14
Branch: task/TASK-0031-local-searchable-workspace-index
Worktree: ../Sidekick-worktrees/TASK-0031-local-searchable-workspace-index
Base branch: current `main`
Write scope:
- `src/main/search-index.ts`
- `src/main/folder-scanner.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `package.json`
- `package-lock.json`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0031-local-searchable-project-index.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0001-inspect-local-folder.md`
- `closed/TASK-0018-folder-hierarchy-artifact-detail.md`
- `closed/TASK-0033-revised-navigation-model.md`
Coordinates with:
- `closed/TASK-0028-generate-summaries-for-existing-transcriptions.md`
- `closed/TASK-0030-generate-thematic-context-packages.md` (canceled)
- `BACKLOG.md` (`BL-0008`)

## Summary

Add a local searchable index for selected workspace files.

The index should make supported local content searchable without Codex. The first implementation should use MiniSearch so search behavior remains deterministic, local-first, and behind typed main/preload APIs without native packaging risk.

## Current Phase

Close

Build, automated verification, human verification, and closeout are complete.

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

## Backlog Source

Promoted from `BL-0005`.

## Links

Related docs:
- `../architecture/desktop-design-guidelines.md`
- `../architecture/product-vision.md`
- `../architecture/kontekstbasert-innholdsmodell.md`
- `../architecture/søk-designforslag.html`

Related tasks:
- `closed/TASK-0028-generate-summaries-for-existing-transcriptions.md`
- `closed/TASK-0030-generate-thematic-context-packages.md` (canceled)

Related decisions:
- `../decisions/0006-local-search-index.md`

## Explore Notes

Current baseline:

- Sidekick scans selected workspace folders and returns file/folder metadata, but it does not index file content for querying.
- The scanner already excludes noisy folders such as `.git`, `node_modules`, `out`, `dist`, `.vite`, `.cache`, and hidden folders by default.
- Context-package generation has a separate ignore list for generated package files and noisy folders.
- Future `.sidekick/` metadata must be excluded from indexing unless a specific metadata search surface is approved later.
- The revised navigation model gives search two likely surfaces: index build/refresh as a primary-workspace workflow, and search results as a primary-workspace or workspace-level work surface that updates selection/context.
- `TASK-0030` was canceled, so this task has no thematic context-package dependency.
- The context-based content model is only an exploration. The first version should index the selected physical workspace root, while avoiding design choices that make later workspace/library search impossible.

## Resolved Decisions

- Use MiniSearch for the first implementation because it is a JavaScript full-text index with JSON serialization and no native build requirement.
- Store the generated index under `<workspace-root>/.sidekick/search-index/`.
- Create the initial search index as part of workspace establishment, not as a separate first-use action in the search surface.
- Initial index creation is triggered when Sidekick creates a new workspace, confirms initialization of an existing folder, or the user selects an existing folder as the active workspace.
- After initial index creation, keep the selected workspace's index current with incremental main-process updates for supported file changes while the workspace is open.
- Use scan/open-time stale detection as the fallback for changes made while Sidekick was not running or while a watcher was unavailable.
- Keep `Oppdater indeks` available as a manual resync action and full rebuild fallback.
- Initial indexing should run asynchronously after the selected workspace scan returns so opening or creating a workspace is not blocked by indexing.
- Add a main-process search index manager that owns indexing jobs, status, watchers, stale detection, and serialized writes per workspace root.
- Support simple free-text query syntax in the first version.
- Do not support boolean operators, regular expressions, query DSL, or advanced field syntax in the first version.
- Do not add result filters in the first version, but include result metadata that can support filters later.
- Skip large text files in the first version instead of chunking them. The implementation plan should set the exact size limit.
- Skip unsupported and binary files with visible counts and reasons.
- Keep the first implementation workspace-local, but write an index manifest with schema and source metadata so a later workspace or library index can reuse the model.

## Task Spec

### Problem

Sidekick can scan workspace structure, but users cannot search all supported workspace file content through a fast local index.

Codex-based analysis is useful for reasoning, but search should not require Codex.

### Goal

Build a local workspace search index that lets users search supported workspace files quickly and deterministically.

### Scope

- Choose and integrate a local indexing approach.
- Index supported text-based workspace files under the selected workspace root.
- Store the index locally as rebuildable generated metadata.
- Create the first index during workspace establishment:
  - when Sidekick creates a new workspace;
  - when Sidekick initializes an existing folder;
  - when the user selects an existing folder as the active workspace.
- Resync or rebuild the index when the user requests it.
- After the initial index has been created for a workspace, keep it up to date with incremental updates when Sidekick detects supported file changes in that selected workspace.
- Provide typed search and index-refresh APIs.
- Show search results in the GUI with file path, match snippet, and relevance score or rank.
- Let selecting a search result update the normal selected file/folder context when practical.
- Keep the search workflow independent of Codex.
- Exclude generated metadata, generated context packages, and noisy folders from indexing.

### Recommended Indexing Approach

Use MiniSearch in the main process.

Rationale:

- MiniSearch is local and deterministic.
- It has no native build requirement.
- It can serialize and load an index as JSON.
- It supports ranked results, prefix matching, fuzzy matching, and stored fields.
- It keeps Electron packaging simpler than SQLite FTS, Lucene-style tooling, or Tantivy bindings.

### Recommended Storage

Preferred workspace-local storage:

```text
<workspace-root>/.sidekick/search-index/
```

Rationale:

- The index is workspace-specific.
- It can be rebuilt from source files.
- It should not be included in scans, context packages, or thematic package input by default.
- Workspace-local storage is simpler than a global app index for the first version.
- A later context-based content model may need a workspace-level index, but that is out of scope here.

### Index Lifecycle

- Sidekick creates `.sidekick/search-index/` as part of establishing a workspace.
- For a newly created workspace, initial indexing starts after the workspace structure is created and the workspace is selected.
- For an existing folder, initial indexing starts after the folder is selected or after existing-folder initialization is confirmed.
- Initial indexing may run after the workspace scan has returned so folder selection does not feel blocked by indexing work.
- The main process should start the initial indexing job after scan completion for `workspace:choose-and-scan`, `workspace:create`, and `workspace:confirm-initialization`.
- The search surface should show initializing/building status when initial indexing is in progress; it should not ask the user to start a manual first build with `Bygg søkeindeks`.
- If initial indexing fails, the search surface should show the failure and offer `Oppdater indeks` or a recovery action.
- After an index exists, Sidekick may load the last completed index for search when the workspace is selected or when the search surface opens.
- After initial index creation, Sidekick should maintain the index for that workspace when it detects file creation, modification, deletion, or rename events for supported files.
- Create and modify events should update only the affected file document when the path can be validated safely.
- Delete events should remove only the affected file document when the path can be reconciled with the manifest.
- Rename events should be handled as remove old path plus add new path when both sides can be reconciled safely; otherwise mark the index stale.
- Ongoing updates must be serialized in the main process so only one index write job runs for a workspace at a time.
- Ongoing updates should be visible as a compact status such as updating, ready, stale, or failed; the right context surface must not become the update progress surface.
- If files changed while Sidekick was not running, Sidekick should detect that the index may be stale on the next workspace scan or search open and offer or start a visible refresh according to the implementation plan.
- A manual `Oppdater indeks` action must remain available even if automatic maintenance exists.
- A full rebuild should be used only for initial index creation, explicit rebuild/recovery, schema changes, or stale states that cannot be resolved incrementally.

Recommended update model:

- Use a main-process watcher set for the selected workspace after an index exists.
- Watch the workspace root and known scanned subdirectories as needed for cross-platform behavior; do not rely on one recursive watcher being available everywhere.
- Coalesce rapid file events before applying incremental updates.
- Treat watcher events as hints. Normalize every event to a workspace-relative candidate path, then validate it against the root and ignore rules before use.
- For create/modify/delete, apply per-file index mutations when the candidate path maps safely to one manifest record or one supported current file.
- For rename-like events, run a cheap manifest-versus-scan diff and apply the resulting per-file add/remove/update operations. If the diff cannot be reconciled safely, mark the index stale.
- Treat workspace scan and search-open checks as fallback stale detection.
- If the watcher fails or a path cannot be reconciled safely, mark the index stale and ask the user to refresh.

### Supported Content

First version should focus on:

- `.txt`
- `.md`
- `.markdown`
- other plain text files already classified as searchable by Sidekick

Binary formats should not be indexed as text unless a later task adds extraction.

Large supported text files should be skipped in the first version rather than chunked. The exact size threshold belongs in the implementation plan.

### Query Behavior

- Support simple free-text search only.
- Use case-insensitive token matching.
- Support prefix matching for ordinary word searches when practical.
- Support conservative fuzzy matching for longer words when practical.
- Do not support boolean operators, regular expressions, query DSL, or advanced field syntax in the first version.
- Return result metadata such as relative path, artifact type, extension, modified time, and rank/score so filters can be added later without changing the index model.

### Non-goals

- Codex semantic search.
- Cloud search.
- Cross-workspace search.
- Shared-library or workspace-level indexing.
- OCR.
- PDF/DOCX parsing unless separately scoped.
- File editing from search results.
- Boolean search, regex search, query DSL, and advanced field syntax.
- User-facing result filters in the first version.
- Chunk-level search results for very large files.
- Always-on background indexing for unopened workspaces.
- Perfect real-time indexing guarantees for changes made while Sidekick is not running.
- Replacing folder scanning or context-package generation.

### UI Requirements

- Use `docs/architecture/søk-designforslag.html` as the first visual reference for the search surface.
- Adapt the design proposal's missing-index state so normal first use shows automatic indexing or recovery, not a primary `Bygg søkeindeks` action.
- Search should live in the main work surface as a workspace-level search view, not in the right context surface.
- Initial index creation should be visible as a workspace establishment status, not as a separate first-use search action.
- Index refresh/recovery should be an explicit workflow in the primary workspace or another approved search surface.
- The right context surface should not become the index build progress surface.
- Before a query is active, the normal workspace tree can remain visible below the search field.
- When a query is active, search results can replace the tree in the main work surface.
- Search results should be dense and scannable, with file path, snippet, and rank/score.
- Selecting a search result should show normal file or folder context when the result maps to a current scan node.
- Unsupported/skipped file counts should be visible without overwhelming the search results.
- Search UI should cover indexing, ready, updating, stale, failed, empty-result, and result-selected states.
- User-facing text should be Norwegian.

### Security Requirements

- Keep filesystem reads and index writes in the main process.
- Do not expose raw filesystem APIs to the renderer.
- Validate all indexed and searched paths are inside the selected workspace root.
- Exclude `.sidekick/`, generated context packages, `node_modules`, `.git`, build output, and cache folders.
- Treat the index as rebuildable generated metadata.
- New dependencies require review for license, native build requirements, package size, Electron packaging behavior, and offline/local behavior.
- Do not allow query syntax that can escape into filesystem, shell, SQL, or process execution.

### Acceptance Criteria

- [ ] Sidekick creates the initial local search index when the workspace is established.
- [ ] Initial index creation starts when a new workspace is created, an existing folder is initialized, or an existing folder is selected as the active workspace.
- [ ] User can search indexed content without Codex.
- [ ] Search returns ranked file results with path and snippet.
- [ ] Selecting a result can update selected file/folder context when the path exists in the current scan.
- [ ] Search does not include `.sidekick/` or generated artifacts.
- [ ] Index is stored locally and can be rebuilt.
- [ ] Existing indexes are refreshed or marked stale when Sidekick detects supported file changes.
- [ ] Supported file create, modify, delete, and safe rename events update the existing index incrementally without a full rebuild.
- [ ] First-version query syntax is simple free text without boolean operators, regex, or query DSL.
- [ ] Large supported text files over the planned size limit are skipped with clear counts or warnings.
- [ ] Unsupported/binary files are skipped with clear counts or warnings.
- [ ] Renderer receives only typed search APIs.
- [ ] Tests cover indexing, query behavior, path safety, skipped files, dependency-independent result formatting, and index rebuild behavior.
- [ ] UI smoke coverage covers initial indexing from workspace establishment, index refresh, update/stale status, search results, empty results, and result selection.

## Planning Details Resolved In Plan

- First-version text indexing skips files over 1 MiB.
- File watcher updates use a 1 second debounce and apply incremental per-file index mutations when the changed path can be validated safely.
- Full rebuild is reserved for initial index creation, explicit recovery, schema changes, and stale states that cannot be reconciled incrementally.
- Index metadata uses `search-index-manifest.v1`.
- MiniSearch indexes `name`, `relativePath`, and `content`, but stores only result metadata. Snippets are built by re-reading safe result files in the main process.
- Manifest file records must be keyed by stable workspace-relative path so incremental update and removal can find existing MiniSearch document ids.
- MiniSearch should boost `name` and `relativePath`, use `AND` term combination, support prefix matching for terms with at least 3 characters, and use conservative fuzzy matching for terms with at least 5 characters.
- Search status and manual refresh controls live in the main search surface, not in the right context surface.
- The search surface must not present `Bygg søkeindeks` as the normal first-use action.
- Initial indexing is attached to `workspace:choose-and-scan`, `workspace:create`, and `workspace:confirm-initialization`.
- Initial indexing starts asynchronously after the workspace scan is available; scan results should return without waiting for indexing to finish.
- The main process owns a per-root `SearchIndexManager` state with one active job at a time.
- The manifest uses normalized POSIX-style workspace-relative paths as MiniSearch document ids.
- Manifest records include enough stat metadata for cheap stale detection without reading file contents.
- Watcher events are normalized into candidate workspace-relative paths, but rename handling is confirmed by a manifest-versus-scan diff.
- Stale detection compares scan/stat metadata with manifest records and only reads file contents when applying an update or building snippets.
- Search status appears as a compact status row/pill in the main search surface with manual `Oppdater indeks` for stale, failed, or recovery states.
- The design proposal's missing-index screen is a recovery state for missing/deleted/corrupt index metadata, not the normal first-use state.

## Implementation Plan

### Plan Status

Planned. Stop before build until human approval is explicitly received.

### Base And Worktree

- Worktree: `../Sidekick-worktrees/TASK-0031-local-searchable-workspace-index`
- Branch: `task/TASK-0031-local-searchable-workspace-index`
- Base: current `main` after task-document updates are preserved.

### Files Or Areas

- `package.json`
- `package-lock.json`
- `src/main/search-index.ts`
- `src/main/folder-scanner.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/decisions/0006-local-search-index.md`
- `docs/tasks/TASK-0031-local-searchable-project-index.md`

### Dependency Plan

- Add `minisearch`.
- Dependency review:
  - Current npm package checked 2026-05-14: `minisearch@7.2.0`.
  - License: MIT.
  - Runtime dependencies: none.
  - Unpacked size: about 827 KB.
  - Native build requirement: none.
  - Packaging risk: low compared with SQLite FTS, Lucene-style tooling, or Tantivy bindings.

### Implementation Steps

1. Create task worktree and install dependency
   - Create or reuse the TASK-0031 worktree and branch.
   - Add `minisearch` to dependencies.
   - Run the baseline check before product changes when practical.

2. Add shared search contracts
   - Add typed request/result/status types to `src/shared/sidekick-api.ts`.
   - Include:
     - index status;
     - initial indexing and refresh result;
     - search request;
     - search result item;
     - skipped-file counts and reasons;
     - stale/update state.
   - Keep renderer APIs narrow:
     - `getSearchIndexStatus(rootPath)`
     - `refreshSearchIndex(rootPath)`
     - `searchWorkspace(request)`
     - `onSearchIndexStatus(listener)`

3. Implement main-process index module
   - Add `src/main/search-index.ts`.
   - Implement a `SearchIndexManager` for per-root status, active job serialization, watchers, manifest loading, stale checks, and status events.
   - Validate root paths and all resolved file paths stay inside the selected workspace root.
   - Reuse scan classification and ignore conventions where practical.
   - Index supported text files: `.txt`, `.md`, `.markdown`, and other locally classified searchable plain-text files.
   - Exclude `.sidekick/`, generated context packages, `.git`, `node_modules`, build output, cache folders, hidden excluded folders, and unsupported binary formats.
   - Skip text files over 1 MiB with a clear skipped reason.
   - Store generated files under `.sidekick/search-index/`.
   - Write:
     - serialized MiniSearch index JSON;
     - `manifest.json` using `search-index-manifest.v1`;
     - skipped-file/report metadata needed by status UI.
   - Manifest should include schema version, engine/version, root path, generated time, source model, indexed files, skipped counts/reasons, index options, and file fingerprints.
   - Manifest fields:
     - `sidekick_schema: search-index-manifest.v1`;
     - `source_model: physical-workspace-root`;
     - `root_path`;
     - `root_name`;
     - `created_at`;
     - `updated_at`;
     - `engine: { name, version }`;
     - `options: { max_file_bytes, indexed_extensions, ignored_folders, query }`;
     - `index_file`;
     - `document_count`;
     - `skipped_counts`;
     - `skipped_files`;
     - `files` keyed by normalized workspace-relative path.
   - Each manifest file record should include:
     - `id`;
     - `relative_path`;
     - `name`;
     - `extension`;
     - `artifact_type`;
     - `size`;
     - `modified_at`;
     - `mtime_ms`;
     - `content_sha256` from the last time content was indexed.

4. Implement search behavior
   - Load the existing index when needed.
   - Query MiniSearch with simple free-text only.
   - Use `combineWith: 'AND'`, boosted `name` and `relativePath`, prefix matching for terms with at least 3 characters, and conservative fuzzy matching for terms with at least 5 characters.
   - Return ranked result items with file name, relative path, artifact type, extension, size, modified time, score/rank, and snippet.
   - Build snippets in the main process by re-reading safe result files, not by exposing file reads to the renderer.
   - If a result file no longer exists or changed unexpectedly, mark the index stale and return clear status.

5. Add index lifecycle and update handling
   - Initial index creation starts from workspace establishment flows:
     - after workspace creation succeeds;
     - after existing-folder initialization is confirmed;
     - after an existing folder is selected as the active workspace.
   - Selection and creation workflows may return the workspace scan before indexing is finished, but the search surface must show indexing status while the initial index job runs.
   - Wire initial indexing through `workspace:choose-and-scan`, `workspace:create`, and `workspace:confirm-initialization` after scan completion.
   - Use status events so the renderer can update from indexing to ready/failed without polling.
   - After an index exists, set up main-process watch/update behavior for the selected workspace when practical.
   - Use built-in filesystem watching with a watcher set for the root and scanned subdirectories rather than assuming recursive watching works on every platform.
   - Coalesce file watcher events with a 1 second debounce.
   - Apply incremental mutations for create, modify, delete, and safe rename events:
     - create or modify: validate path, classify support, read content, remove any old document for that relative path, add updated document, update manifest record;
     - delete: remove the document for that relative path and remove its manifest record;
     - rename-like event: compare current scan/stat paths against manifest records, then apply per-file adds/removes/updates when the diff is safe;
     - unsupported or oversized file change: ensure any old document is removed and keep skipped metadata current.
   - Serialize write jobs so one build/refresh/update runs per workspace at a time.
   - On watcher failure or ambiguous file events, mark the index stale and require visible refresh.
   - Detect possible stale indexes on workspace scan or search-open by comparing manifest fingerprints with current scan/stat data.
   - Use full rebuild only for initial index creation, explicit user recovery, schema changes, or stale states that cannot be reconciled safely.

6. Wire IPC and preload
   - Add main-process handlers in `src/main.ts`.
   - Use `assertKnownWorkspaceRoot` for every search/index operation.
   - Add typed preload methods in `src/preload.ts`.
   - Do not expose raw filesystem paths beyond the existing selected-workspace root and workspace-relative result paths.

7. Build the renderer search surface
   - Use `docs/architecture/søk-designforslag.html` as the visual reference.
   - Add a workspace-level search surface in the main workspace.
   - Before a query, keep the normal workspace tree visible below the search field.
   - When a query is active, replace the tree with dense search results.
   - Cover indexing, ready, updating, stale, failed, empty-result, and selected-result states.
   - Show a compact index status row or pill near the search field.
   - Use `Oppdater indeks` for manual refresh/recovery when status is stale, failed, or missing because metadata was deleted or corrupted.
   - Keep index progress and status in the main surface.
   - Keep the right context surface tied to the selected workspace/file/folder.
   - Clicking a result should select the corresponding scan node when it still exists.
   - Keep all user-facing text Norwegian.

8. Preserve existing workflows
   - Do not change context-package generation behavior.
   - Do not change transcription import or transcription summary workflows.
   - Do not change Codex behavior.
   - Do not include `.sidekick/search-index/` in scans, context packages, or future generated package input.

9. Add tests
   - Unit tests for:
     - path validation;
     - supported/skipped file classification;
     - manifest shape;
     - result formatting;
     - query option behavior where practical without coupling tests to MiniSearch internals.
   - Integration tests for:
     - workspace creation or existing-folder selection starts initial indexing and writes index plus manifest;
     - initial indexing status event is emitted after scan-return-triggered indexing;
     - search returns ranked path/snippet results;
     - `.sidekick/` and generated context packages are excluded;
     - unsupported/binary files and files over 1 MiB are skipped with counts;
     - refresh/resync updates the index;
     - create, modify, delete, and safe rename events update the index incrementally;
     - rename-like watcher events reconcile via manifest-versus-scan diff;
     - stale detection after file changes/deletes;
     - stale detection uses scan/stat metadata and does not read every indexed file;
     - unsafe paths are rejected.
   - UI smoke tests for:
     - initial indexing state after workspace establishment;
     - successful index-ready state;
     - search results;
     - empty results;
     - stale/update status;
     - result selection updating normal context.

10. Add decision record
    - Add `docs/decisions/0006-local-search-index.md`.
    - Record MiniSearch, workspace-local `.sidekick/search-index/` storage, index-on-establishment behavior, and first-version update model.

### Verification

- `npm run check`
- `npm test`
- `npm run test:ui`
- Manual smoke:
  1. Start Sidekick.
  2. Select a workspace with Markdown/text files and unsupported files.
  3. Confirm the search surface shows indexing or ready status without asking for `Bygg søkeindeks`.
  4. Search for text known to exist after the index is ready.
  5. Select a result and confirm normal file context appears.
  6. Add or edit a supported file and confirm incremental update/stale behavior.
  7. Confirm `.sidekick/` and generated context packages do not appear in results.

### Security And Risk Review

- All filesystem reads, watcher setup, index writes, and snippet reads stay in the main process.
- Renderer gets only typed task-specific APIs.
- All root paths must be selected in Sidekick and validated with `assertKnownWorkspaceRoot`.
- All indexed and result paths must be resolved and checked against the workspace root.
- Query text is treated as plain text only; no regex, SQL, shell, or custom query execution.
- Index output is generated metadata and must be excluded from future scans/context inputs.
- Watcher events are untrusted hints; unsafe or ambiguous events mark the index stale instead of applying unchecked paths.
- Main-process job serialization prevents overlapping writes to `.sidekick/search-index/`.

### Documentation Impact

- Add a decision record because the task introduces a dependency, generated persistent metadata, and workspace-local index storage.
- Keep TASK-0031 updated during build and verification.
- No README change is required unless manual search-index behavior needs user-facing setup notes after implementation.

### Human Gate

- Required.
- Approval status: Approved 2026-05-14.
- Approval source: human said “gjør build for 31”.

## Build Log

- Created worktree `../Sidekick-worktrees/TASK-0031-local-searchable-workspace-index` on branch `task/TASK-0031-local-searchable-workspace-index`.
- Added `minisearch@7.2.0`.
- Added main-process `SearchIndexManager` in `src/main/search-index.ts`.
- Added workspace-local index storage under `.sidekick/search-index/` with `index.json` and `manifest.json`.
- Wired initial indexing from `workspace:choose-and-scan`, `workspace:create`, and `workspace:confirm-initialization`.
- Added typed IPC/preload APIs for status, refresh, search, and status events.
- Added renderer search field, compact index status, manual `Oppdater indeks`, dense result list, empty/error states, and result selection back into normal workspace context.
- Added tests for index build/search, skip reporting, refresh behavior, and unsafe path rejection.
- Added UI smoke coverage for search status, search results, empty results, stale status, refresh, and result selection.
- Added decision record `docs/decisions/0006-local-search-index.md`.

## Verification Log

- `npm run typecheck` passed after initial implementation fixes.
- `npm test` passed: 24 files, 104 tests.
- `npm run test:ui` passed: 32 tests.
- `npm run check` passed.
- `npm test -- --runInBand` was attempted first, but Vitest does not support `--runInBand`; reran with `npm test`.

## Review Notes

- Human verified the implemented search workflow on 2026-05-14 and reported that it works.

### Human Verification Instructions

1. Start Sidekick from the task worktree with `npm start`.
2. Select an existing workspace with at least one `.md` or `.txt` file.
3. Confirm that the search status becomes `Indeks klar` without pressing a first-time build button.
4. Search for text that exists in one of the supported files.
5. Confirm that results show path, snippet, and rank/score metadata.
6. Click a result and confirm the normal file context opens in the right context surface.
7. Add or edit a supported text file while the workspace is open, wait briefly, and search for the new text.
8. Press `Oppdater indeks` and confirm search still works after refresh.
9. Confirm that `.sidekick/` and `*.context-package.md` content do not appear in search results.

## Documentation Notes

- Added `docs/decisions/0006-local-search-index.md`.
- Updated this task record with approval, build, and verification notes.

## Closeout

- Completed local searchable workspace index for supported text files.
- Initial indexing is connected to workspace establishment.
- Search index refresh and selected-workspace search are exposed through typed APIs only.
- Search results can select normal workspace file context.
- Index metadata is stored as generated workspace-local data under `.sidekick/search-index/`.
- Verification passed: `npm run check`, `npm test`, and `npm run test:ui`.
