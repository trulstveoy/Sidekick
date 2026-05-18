# Task: Workspace-local Metadata Database

ID: TASK-0041
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-18
Updated: 2026-05-18
Branch: task/TASK-0041-workspace-local-metadata-database
Worktree: `/home/trutve/code/Sidekick`
Base branch: origin/main
Write scope:
- `package.json`
- `package-lock.json`
- `src/main`
- `src/shared`
- `src/preload.ts`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/architecture`
- `docs/decisions`
- `docs/tasks/TASK-0041-workspace-local-metadata-database.md`
Parallel safety: Exclusive
Depends on:
- `closed/TASK-0040-shared-filesystem-event-layer.md`
- `closed/TASK-0035-read-only-context-views.md`
- `closed/TASK-0037-folder-context-tagging.md`
- `closed/TASK-0038-live-workspace-filesystem-refresh.md`

## Summary

Sidekick skal innføre en workspace-lokal database for Sidekick-eid metadata:

```text
<workspace>/.sidekick/sidekick.db
```

Filsystemet forblir master for fysisk struktur og brukerinnhold:

- mapper;
- filer;
- filnavn;
- fysisk plassering;
- Markdown-/tekstinnhold og andre brukerfiler.

Databasen blir master for Sidekick-spesifikk metadata og konseptuell modell:

- workspace-identitet;
- fysisk struktur slik Sidekick sist har observert den;
- folder/file records;
- tags og systemtagger;
- konseptuelle kontekster som `Prosjekt` og senere `Applikasjon`;
- relasjoner mellom artefakter og kontekster;
- metadata/status om genererte analyser og jobber;
- persistert workspace-state som Sidekick trenger for å åpne samme arbeidsflate igjen.

`.sidekick-folder.json` skal bort som metadata-konsept. Sidekick trenger ikke bakoverkompatibel import fra eksisterende markerfiler fordi applikasjonen fortsatt er under utvikling.

## Current Phase

Close

Build, automatisert verifikasjon og manuell brukeraksept er fullført. Tasken lukkes.

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
- `../../src/main/context-metadata.ts`
- `../../src/main/workspace-database.ts`
- `../../src/main/folder-scanner.ts`
- `../../src/shared/context-views.ts`
- `../../src/main/workspace-file-events.ts`
- `../../src/main/workspace-watch-manager.ts`
- `../../src/main/search-index.ts`
- `../../src/main/workspace-info.ts`
- `../../src/main/document-relationships.ts`
- `../../src/shared/sidekick-api.ts`
- `../../src/renderer.ts`

Related docs:
- `../architecture/kontekstbasert-innholdsmodell.md`
- `../architecture/solution-architecture.md`
- `closed/TASK-0035-read-only-context-views.md`
- `closed/TASK-0037-folder-context-tagging.md`
- `closed/TASK-0038-live-workspace-filesystem-refresh.md`
- `closed/TASK-0040-shared-filesystem-event-layer.md`

Planned decision record:
- `../decisions/0007-workspace-local-metadata-database.md`

## Explore Notes

### Current Model

Current Sidekick metadata is file-based:

- Folder tags are stored in `.sidekick-folder.json` inside tagged folders.
- `folder-scanner.ts` reads those marker files while scanning physical folders.
- `shared/context-views.ts` derives `Prosjekter` from folder metadata with system tag `Prosjektmappe`.
- `workspace-info.ts` writes `.sidekick/workspace-info.md`.
- `document-relationships.ts` writes `.sidekick/document-relationships.md`.
- `search-index.ts` writes rebuildable MiniSearch files under `.sidekick/search-index/`.
- Renderer and preload rely on `WorkspaceScan` and `ContextViewsSnapshot` DTOs from `sidekick-api.ts`.

The current model made sense as a quick local-first path, but it spreads Sidekick-owned metadata across hidden marker files, generated Markdown files, in-memory process state and scan-derived views.

### New Direction

The new architecture should separate ownership clearly:

```text
Filesystem
  owns physical structure and user content

Workspace-local DB
  owns Sidekick metadata, concepts and app/workspace state
```

This means:

- Sidekick does not store metadata in user folders through marker files.
- Sidekick does not write metadata back to user files.
- Sidekick does not need to project DB metadata to filesystem in V1.
- `.sidekick/sidekick.db` is Sidekick's internal metadata store for the workspace.
- `.sidekick/search-index/` can remain a rebuildable cache outside the metadata DB in V1.
- Generated Markdown reports may remain files in V1, but DB should know their metadata/status.

### Important Consequence: Folder Identity

Removing `.sidekick-folder.json` removes the mechanism that made metadata follow a folder when a user moved or renamed it outside Sidekick.

Without marker files, Sidekick cannot always know whether this:

```text
Strategi/ deleted
Strategy/ created
```

means:

- the same folder was renamed;
- one folder was deleted and another unrelated folder was created;
- a folder was moved from elsewhere;
- the watcher missed events while Sidekick was closed.

The recommended V1 rule is:

- Use workspace-relative path as the primary physical identity anchor.
- Preserve metadata automatically only when Sidekick observes a safe rename/move in the same live event window and can correlate it confidently.
- Otherwise mark previous metadata as `missing` or `orphaned` and let the user relink/re-tag explicitly later.
- Do not reintroduce marker files solely to solve external rename.

This is a product tradeoff. It preserves the clean DB model and avoids writing hidden metadata into user folders.

## Task Spec

### Problem

Sidekick currently treats hidden filesystem metadata as the source of truth for folder tags and context derivation. This creates a mixed persistence model:

- physical files and folders are in the filesystem;
- Sidekick metadata is partly in marker files;
- generated Sidekick reports are Markdown files;
- app/session state is in memory;
- search state is in a generated index folder.

The result is harder to evolve toward generic context concepts such as `Prosjekt`, `Applikasjon`, `Tema` and other future views.

### Goal

Introduce a workspace-local metadata database:

```text
<workspace>/.sidekick/sidekick.db
```

The database should become the primary persistence layer for Sidekick-eid metadata and conceptual state, while the filesystem remains the primary source of truth for physical structure and user content.

### Architecture Principle

Use this rule as the architecture contract:

```text
Filsystemet svarer på: Hva finnes fysisk?
Databasen svarer på: Hva betyr det for Sidekick?
```

### Scope

This task frames the whole concept and should deliver the first useful database-backed version.

In scope for V1:

- Add a local SQLite database per workspace under `.sidekick/sidekick.db`.
- Add schema and migration infrastructure.
- Open/create the workspace DB when a workspace is selected, created or initialized.
- Persist observed physical folder/file records in the DB from scan/watch.
- Move folder tags from `.sidekick-folder.json` to DB tables.
- Derive `Prosjekter` from DB metadata, not marker files.
- Keep physical tree scanning from filesystem.
- Update existing tag APIs so add/remove tag writes DB transactions.
- Remove `.sidekick-folder.json` as source of truth.
- Do not import old `.sidekick-folder.json` files.
- Hide/ignore old `.sidekick-folder.json` files as ordinary legacy junk if they happen to exist, or delete handling can be deferred.
- Store DB metadata/status for generated artifacts such as workspace summaries and document relationships.
- Keep generated Markdown report files as files in V1 unless moving them is required by implementation.
- Keep MiniSearch index files under `.sidekick/search-index/` in V1.
- Add tests for DB schema, scan synchronization, tagging and context views.
- Record the durable decision in `docs/decisions/0007-workspace-local-metadata-database.md`.
- Update architecture/design documentation that currently names `.sidekick-folder.json` as authoritative.

Out of scope for V1:

- No cloud sync.
- No multi-user concurrency.
- No automatic metadata projection from DB back to marker files.
- No requirement to preserve metadata from old `.sidekick-folder.json`.
- No full-text search migration into SQLite FTS.
- No semantic/vector search.
- No DB ownership of user Markdown content.
- No automatic rename/move inference when Sidekick cannot safely correlate the physical change.
- No cross-workspace global database.

### Proposed Storage Layout

```text
Arbeidsområde/
  00. Forutsetninger/
  01. Notater/
  02. Transkripsjoner/
  .sidekick/
    sidekick.db
    search-index/
      index.json
      manifest.json
```

The database is internal Sidekick state. It should not be edited by users directly.

### Database Technology

Use SQLite as the database file format.

The implementation phase must make an explicit driver choice before adding code. The choice should consider:

- Electron 42 runtime support;
- packaging behavior with Electron Forge;
- native dependency rebuild/signing risk;
- testability in Vitest;
- transaction support;
- ability to run migrations deterministically.

Candidate approaches to evaluate during Build:

- built-in `node:sqlite` if viable in the Electron runtime used by the app;
- a native SQLite package if packaging risk is acceptable;
- a WASM/JS SQLite option only if filesystem durability and performance remain acceptable.

The result must be captured in the decision record.

### Draft Data Model

This is a planning schema, not final SQL.

#### `schema_migrations`

Tracks applied migrations.

Fields:

- `version`
- `name`
- `applied_at`

#### `workspace`

One row for the current workspace DB.

Fields:

- `id`
- `root_path`
- `root_name`
- `created_at`
- `updated_at`
- `last_scanned_at`
- `schema_version`

#### `filesystem_entry`

Observed folders and files from the physical workspace.

Fields:

- `id`
- `relative_path`
- `parent_id`
- `kind` (`folder` or `file`)
- `name`
- `extension`
- `artifact_type`
- `size`
- `mtime_ms`
- `last_seen_at`
- `status` (`active`, `missing`, `orphaned`)

Rules:

- Physical structure is still read from disk.
- DB rows reflect Sidekick's last observed state.
- `relative_path` is unique while `status = active`.
- Entries not seen in a scan are marked `missing`, not immediately deleted.

#### `tag`

Canonical tag definitions.

Fields:

- `id`
- `label`
- `normalized_label`
- `kind` (`system` or `free`)
- `system_effect`
- `created_at`
- `updated_at`

Initial system tag:

- `Prosjektmappe` with `system_effect = project-root`.

#### `filesystem_entry_tag`

Tags attached to folders or files.

Fields:

- `entry_id`
- `tag_id`
- `source` (`explicit`)
- `created_at`
- `updated_at`

V1 can limit tagging to folders.

#### `context`

Conceptual contexts derived from metadata.

Fields:

- `id`
- `type` (`project`, later `application`, `theme`, etc.)
- `label`
- `root_entry_id`
- `status`
- `created_at`
- `updated_at`

V1:

- A folder tagged with `Prosjektmappe` creates or updates a `project` context.

#### `context_entry`

Relates content to contexts.

Fields:

- `context_id`
- `entry_id`
- `relation_type` (`root`, `physical-child`, `linked`)
- `source` (`derived`, `explicit`)
- `created_at`

V1 can derive project rows from the project root folder and its physical children. Explicit cross-context links can be deferred.

#### `generated_artifact`

Metadata for generated Sidekick artifacts.

Fields:

- `id`
- `artifact_type` (`workspace-info`, `document-relationships`, `transcription-summary`, `context-package`)
- `scope`
- `entry_id`
- `relative_path`
- `status`
- `source_hash`
- `generated_at`
- `updated_at`

V1 may keep generated Markdown content in files, while DB tracks metadata and status.

#### `workspace_state`

Persisted workspace UI/app state that should survive restart.

Fields:

- `key`
- `value_json`
- `updated_at`

Examples:

- selected context view;
- last selected relative path;
- last search query if useful;
- panel state if product wants it.

### Data Flow

#### Opening a Workspace

```text
User chooses workspace
  -> main validates path
  -> ensure .sidekick/
  -> open/create .sidekick/sidekick.db
  -> run migrations
  -> scan filesystem
  -> upsert filesystem_entry rows
  -> derive context views from DB + physical tree
  -> return WorkspaceScan/ContextViews to renderer
```

#### Filesystem Change

```text
WorkspaceFileEventService
  -> scan changed area or full workspace
  -> upsert filesystem_entry rows
  -> mark missing entries
  -> derive context views from DB metadata
  -> renderer receives updated workspace state
```

#### Tag Folder

```text
Renderer addFolderTag
  -> preload typed API
  -> main validates selected root and relative folder path
  -> DB transaction:
       ensure filesystem_entry exists and is active
       ensure tag exists
       upsert filesystem_entry_tag
       upsert derived context if system tag
  -> refresh derived views
  -> return updated scan/view state
```

#### Remove Folder Tag

```text
Renderer removeFolderTag
  -> DB transaction:
       remove filesystem_entry_tag
       update/remove derived context if system effect no longer applies
  -> refresh derived views
  -> return updated scan/view state
```

### API Impact

Prefer keeping renderer-facing APIs stable in V1:

- `WorkspaceScan` can still include tree, summary, warnings and `contextViews`.
- `FolderMetadataSummary` can remain as renderer DTO, but its source becomes DB metadata rather than `.sidekick-folder.json`.
- `addFolderTag` and `removeFolderTag` can keep the same request shape.

Internal API changes are expected:

- `scanWorkspaceFolder` may need DB access or a companion sync service.
- `deriveContextViews` may need DB-backed context rows or a richer input model.
- `context-metadata.ts` should be replaced or converted into a DB-backed metadata service.

### Security Requirements

- DB access must stay in main process.
- Renderer must not receive raw SQL, DB path access or generic query APIs.
- IPC handlers must keep validating workspace roots and relative paths.
- Database path must be resolved under the selected workspace's `.sidekick/` directory.
- SQL must be parameterized.
- DB migrations must be deterministic and versioned.
- DB open/write failures must not corrupt user files.
- Watcher events remain hints; physical state must be validated before DB writes.
- Search/context-package generation must continue to ignore `.sidekick/sidekick.db`, WAL files and other `.sidekick` internals.

### Acceptance Criteria

- Selecting or creating a workspace creates/opens `.sidekick/sidekick.db`.
- Migrations run exactly once and are recorded.
- Filesystem scan persists active folders/files to DB.
- Deleted/missing filesystem entries are marked missing instead of silently deleting metadata.
- Folder tagging writes to DB, not `.sidekick-folder.json`.
- `Prosjekter` is derived from DB-backed `Prosjektmappe` metadata.
- No new `.sidekick-folder.json` files are created.
- Existing `.sidekick-folder.json` files are not required and are not treated as authoritative.
- Renderer still shows tag chips and tree pills for tagged folders.
- Live filesystem refresh updates DB-observed physical entries.
- Context views update after both DB metadata changes and filesystem changes.
- Search index continues to work and ignore `.sidekick/`.
- Context package generation does not include `sidekick.db`, WAL/shm files, search index files or other Sidekick internals.
- Workspace summary/document relationship flows still work, even if generated Markdown remains file-backed in V1.
- Automated tests cover schema migration, scan sync, tagging, context view derivation, missing entries and IPC validation.
- A decision record documents the DB architecture and driver choice.

## Open Points

No product decision blocks the task concept. These implementation details must be resolved during Build and recorded in the decision record:

- Exact SQLite driver/package.
- Whether V1 persists only folder/file records and tags, or also generated report content.
- Whether external folder rename should attempt safe same-session correlation or simply mark previous metadata missing.
- Whether old `.sidekick-folder.json` files should be ignored, hidden, or actively warned about in diagnostics.

Recommended defaults:

- Use SQLite file format.
- Keep generated report bodies as Markdown files in V1; store metadata/status in DB.
- Use path-based physical identity in V1, with missing/orphaned state and later relink UX.
- Ignore old `.sidekick-folder.json` as legacy, non-authoritative files.

## Implementation Plan

### Phase 0: Technical Decision

1. Verify viable SQLite driver options in the current Electron 42 + Electron Forge setup.
2. Choose the driver with the lowest practical packaging risk.
3. Add required dependency only after the decision is made.
4. Create `docs/decisions/0007-workspace-local-metadata-database.md`.
5. Record:
   - DB file location;
   - metadata ownership boundary;
   - driver choice;
   - no `.sidekick-folder.json` compatibility;
   - folder identity tradeoff.

### Phase 1: Database Foundation

1. Add a main-process DB module, for example `src/main/workspace-database.ts`.
2. Add DB path resolution:

```text
<workspace>/.sidekick/sidekick.db
```

3. Ensure `.sidekick/` exists before opening the DB.
4. Add migration runner.
5. Add first schema migration.
6. Add transaction helper.
7. Add unit tests for:
   - DB path stays inside workspace;
   - migrations run once;
   - schema version is recorded;
   - DB open errors produce controlled errors.

### Phase 2: Physical Structure Sync

1. Add a service, for example `src/main/workspace-structure-store.ts`.
2. Convert scanner output into DB `filesystem_entry` upserts.
3. Mark missing entries after full scan.
4. Preserve user metadata on missing entries.
5. Keep physical tree source from filesystem, but annotate it with DB metadata.
6. Update workspace open/create/initialize flows to open DB and sync after scan.
7. Add integration tests:
   - new folders/files appear in DB;
   - removed files become missing;
   - repeated scans are idempotent.

### Phase 3: DB-backed Tags

1. Replace `.sidekick-folder.json` writes in `context-metadata.ts` with DB-backed operations.
2. Keep or rename the module based on final code shape:
   - candidate: `workspace-metadata-store.ts`.
3. Implement:
   - normalize tag label;
   - ensure system tag definitions;
   - add folder tag;
   - remove folder tag;
   - read folder metadata summary for renderer.
4. Update main IPC handlers `folder-tags:add` and `folder-tags:remove`.
5. Remove marker-file creation behavior.
6. Add tests for:
   - adding `Prosjektmappe`;
   - free-form tags;
   - duplicate tag normalization;
   - removing tags;
   - no `.sidekick-folder.json` file created.

### Phase 4: DB-backed Context Views

1. Change context-view derivation so `Prosjekter` uses DB-backed contexts/tags.
2. Keep `Mapper` physical.
3. Preserve renderer DTO shape if practical.
4. Ensure project context rows still include:
   - root folder;
   - physical child files;
   - reason/source labels.
5. Add tests for:
   - no project contexts without DB tag;
   - folder tagged `Prosjektmappe` appears in `Prosjekter`;
   - missing tagged root does not create an active project context;
   - tag removal removes project context.

### Phase 5: Remove Marker-file Authority

1. Stop reading `.sidekick-folder.json` from `folder-scanner.ts`.
2. Stop treating marker-file conflicts as scan warnings.
3. Keep marker files hidden/ignored if they exist:
   - visible tree should not show them;
   - search should not index them;
   - context packages should not include them.
4. Remove or rewrite tests that assert marker files are authoritative.
5. Update e2e fixtures that currently include marker metadata.

### Phase 6: Generated Artifact Metadata

1. Add DB metadata writes when generating:
   - workspace info;
   - document relationships;
   - transcription summaries;
   - context packages.
2. Keep generated Markdown files where they are unless implementation proves it should move.
3. Store output path, status, source hash and generated timestamp in DB.
4. Add tests that artifact metadata is recorded after generation.

### Phase 7: Live Refresh Integration

1. Ensure `WorkspaceFileEventService` events trigger DB physical-structure sync.
2. Ensure `.sidekick/sidekick.db`, WAL/shm files and `.sidekick/search-index/` do not cause refresh loops.
3. Ensure DB-backed context views update after external file changes.
4. Add tests for:
   - external folder create -> DB entry;
   - external file create -> DB entry;
   - external delete -> missing state;
   - tagged folder missing -> project context inactive or clearly missing.

### Phase 8: UI and UX Adjustments

1. Keep visible tagging interaction unchanged unless DB state needs new feedback.
2. Update any UI text that implies tags are saved to `.sidekick-folder.json`.
3. If metadata can become missing/orphaned, add a restrained UI state or warning.
4. Update design docs that currently mention marker files.

### Phase 9: Documentation

1. Update `docs/architecture/solution-architecture.md`.
2. Update `docs/architecture/kontekstbasert-innholdsmodell.md`.
3. Update `docs/architecture/desktop-design-guidelines.md`.
4. Add decision record.
5. Update task closeout with final schema and known limitations.

## Verification Plan

### Automated Verification

Run from repository root:

```bash
cd /home/trutve/code/Sidekick
npm run test -- tests/unit tests/integration
npm run check
```

Run e2e after renderer fixtures are updated:

```bash
cd /home/trutve/code/Sidekick
npm run test:ui
```

Run patch hygiene:

```bash
git diff --check
```

Expected result:

- Unit and integration tests pass.
- Typecheck and lint pass.
- E2E smoke tests pass after UI fixtures are updated.
- No generated `.sidekick-folder.json` files are created during tests.

### Manual Verification

Run from repository root:

```bash
cd /home/trutve/code/Sidekick
npm start
```

Verify workspace DB:

1. Create or open a workspace.
2. Confirm `.sidekick/sidekick.db` is created.
3. Confirm no `.sidekick-folder.json` is created when selecting folders.

Verify physical sync:

1. Create `Strategi/` and `Strategi/notat.md` in an external editor or terminal.
2. Confirm Sidekick shows the new folder/file.
3. Confirm a DB entry exists for the folder/file using a developer DB inspection command or test helper.

Verify tagging:

1. Select `Strategi/`.
2. Add `Prosjektmappe`.
3. Confirm the tag chip and tree pill appear.
4. Confirm `Prosjekter` shows `Strategi`.
5. Confirm no `.sidekick-folder.json` exists in `Strategi/`.
6. Close and reopen Sidekick.
7. Confirm the tag and `Prosjekter` view persist from DB.

Verify external delete/missing state:

1. Delete or rename the tagged folder outside Sidekick.
2. Confirm Sidekick does not crash.
3. Confirm the old metadata is not silently applied to an unrelated new folder.
4. Confirm the UI either removes the active project view or shows a missing/recovery state, depending on final UX.

Verify existing workflows:

1. Search still indexes normal files and ignores `.sidekick/`.
2. Context package generation still works.
3. Workspace summary still works.
4. Document relationship generation still works.
5. Transcription import and summaries still work.

## Build Log

Built on 2026-05-18:

- Added `src/main/workspace-database.ts` with per-workspace SQLite storage at `.sidekick/sidekick.db`.
- Moved folder tag persistence out of `.sidekick-folder.json` and into DB tables.
- Kept `context-metadata.ts` as normalization/system-tag logic only.
- Updated `folder-scanner.ts` so it scans physical files, syncs observed entries to DB, annotates folders from DB metadata and ignores legacy marker files.
- Updated folder-tag IPC flow so add/remove writes to DB and then returns a refreshed scan.
- Updated watcher filtering so legacy marker files do not trigger workspace refresh.
- Updated unit, integration and e2e fixtures for DB-backed metadata.

## Verification Log

Automated verification passed on 2026-05-18:

- `npm run check` - passed.
- `npm run test` - passed, 28 files and 123 tests.
- `npm run test:ui` - passed, 35 Playwright smoke tests.
- `npm run package` - passed.
- `git diff --check` - passed.

Known verification note:

- Vitest prints Node/Electron `node:sqlite` experimental warnings. The warnings are expected with the current driver choice and are documented in the decision record.

## Review Notes

Self-review completed:

- Renderer still talks through typed preload IPC.
- DB access is main-process only.
- `.sidekick-folder.json` is no longer exposed as a DTO field or authoritative metadata source.
- External rename/move outside Sidekick intentionally does not preserve metadata in V1; metadata remains attached to the old path and missing entries can be handled by later relinking UX.

## Documentation Notes

Updated documentation:

- `docs/decisions/0007-workspace-local-metadata-database.md`
- `docs/decisions/2026-05-14-folder-metadata-marker.md`
- `docs/architecture/solution-architecture.md`
- `docs/architecture/desktop-design-guidelines.md`
- `docs/architecture/kontekstbasert-innholdsmodell.md`

This task supersedes the marker-file direction from TASK-0037 for folder metadata persistence.

## Closeout

Closed on 2026-05-18 after user verification.

Concrete output:

- Workspace-local metadata database implemented at `.sidekick/sidekick.db`.
- Folder tags are DB-backed and no longer written to `.sidekick-folder.json`.
- Physical filesystem scan remains source of truth for folders and files.
- DB metadata drives folder tags and `Prosjekter` context view.
- Architecture, design and decision documentation updated.

No open blockers remain for this task. Future work can add richer relinking UX for externally moved/renamed tagged folders and can revisit the `node:sqlite` driver if Electron support changes.
