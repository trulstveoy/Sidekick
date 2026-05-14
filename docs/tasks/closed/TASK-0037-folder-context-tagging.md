# Task: Folder Context Tagging

ID: TASK-0037
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-14
Updated: 2026-05-14
Branch: task/TASK-0037-folder-context-tagging
Worktree: ../Sidekick-worktrees/TASK-0037-folder-context-tagging
Base branch: current `main`
Write scope:
- `src/main/folder-scanner.ts`
- `src/main/context-metadata.ts`
- `src/main/context-package.ts`
- `src/main/search-index.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/decisions`
- `docs/tasks/TASK-0037-folder-context-tagging.md`
- `docs/tasks/TASK-0035-read-only-context-views.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0036-create-workspace-instead-of-project.md`
Blocks:
- `TASK-0035-read-only-context-views.md`
Coordinates with:
- `docs/architecture/kontekstbasert-innholdsmodell.md`
- `docs/architecture/desktop-design-guidelines.md`
- `docs/architecture/klassifisering-med-tags.html`
- `TASK-0031-local-searchable-project-index.md`

## Summary

Add the first Sidekick metadata concept and GUI flow for tagging folders.

TASK-0035 needs a reliable way to know which folders are project folders. Guessing from folder names or structure is too weak. Sidekick should let the user tag a selected folder with `Prosjektmappe` in the GUI, persist that tag as folder metadata, and read it back later.

This task should introduce the smallest useful writable metadata editor for folders. The UI should treat all folder classifications as tags. There should be no visible distinction between "roles" and "free-text tags"; a tag is a tag. It should not implement the full context-based content model.

## Current Phase

Close

Specification, planning, build, verification, human review, documentation, and closeout are complete.

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
- `../architecture/kontekstbasert-innholdsmodell.md`
- `TASK-0035-read-only-context-views.md`
- `closed/TASK-0036-create-workspace-instead-of-project.md`

## Explore Notes

Current baseline:

- Sidekick can create and open an `arbeidsområde`.
- The created workspace currently contains:
  - `00. Forutsetninger`
  - `01. Notater`
  - `02. Transkripsjoner`
- There is no `Prosjekter/` folder contract yet.
- There is no editable metadata concept for tagging a folder as `Prosjektmappe`.
- `docs/architecture/kontekstbasert-innholdsmodell.md` recommends `.sidekick/content-index.yml` as the future place for Sidekick-controlled metadata.
- `docs/architecture/desktop-design-guidelines.md` defines the visual tagging pattern:
  - tags are edited in the right context surface;
  - system-effect tags use blue chips;
  - free-form tags use gray chips;
  - tagged folders show up to three tag pills in the tree plus `+N`;
  - tagging may autosave because adding/removing a chip is the explicit user action.
- `docs/architecture/klassifisering-med-tags.html` is the visual reference for the tagging interaction.
- The architecture document has concepts for `contexts`, `artifacts`, and `artifact_contexts`.
- The context model document does not yet make folder tagging explicit enough for the first implementation.
- TASK-0035 cannot safely build `Prosjekter` view until Sidekick can know which folders are project roots.
- A path-only metadata model is too fragile when users rename or move folders outside Sidekick.
- The accepted direction is to write a small Sidekick marker file inside the tagged folder:

  ```text
  Strategi/.sidekick-folder.json
  ```

  This marker can be hidden in editors such as Obsidian and follows the folder when it is renamed or moved inside the workspace.

## Task Spec

### Problem

TASK-0035 needs to show a read-only `Prosjekter` context view.

That requires Sidekick to know which folders represent project contexts. The current workspace structure does not guarantee that project folders live under a fixed `Prosjekter/` directory, and deriving project membership only from folder names would be brittle.

Sidekick needs a first metadata mechanism where the user can explicitly tag a folder from the GUI. Some tags should have system effect. `Prosjektmappe` should be the first system-effect tag and should later make the folder appear in the `Prosjekter` view.

### Goal

Build a minimal folder tagging capability:

```text
folder marker + stable folder id + tags + tag kind + optional system effect
```

The first required user-facing capability is:

```text
Add tag "Prosjektmappe" to selected folder
```

The result should be persisted in `.sidekick-folder.json` inside the tagged folder and available to later context-view derivation.

A workspace-level `.sidekick/` index may be used as a derived cache or overview, but it should not be the only source of truth for a tagged folder in the first version.

The implementation may keep typed system semantics internally, but the visible UI should not ask the user to choose between "role", "classifier", and "tag". The interface should say `Tagger`.

### Scope

- Add a first metadata model for folder tags.
- Support at least this system-effect tag:
  - `Prosjektmappe`: internally maps to a project-root/project context effect.
- Support free-form folder tags with no system effect.
- Consider, but do not necessarily implement in the first build, these future system-effect tags:
  - `Prosjektcontainer`
  - `Applikasjonsmappe`
  - `Applikasjonscontainer`
  - `Bibliotek`
- Add typed main/preload APIs to read, add, and remove folder tags.
- Add a GUI tag editor in Sidekick:
  - select a folder in `Mapper`;
  - show current tags in the right context surface as chips;
  - allow the user to add `Prosjektmappe`;
  - allow the user to add free-form tags, for example `Follow up` or `Q2`;
  - suggest both system-effect tags and tags used elsewhere in the workspace;
  - allow removing a tag by clicking `x` on the chip;
  - show that tags are saved as Sidekick metadata.
- Persist the authoritative tag metadata in `.sidekick-folder.json` inside the tagged folder.
- Exclude `.sidekick-folder.json` from normal visible scans, context packages, summaries, and search indexes unless a diagnostic metadata mode is explicitly introduced later.
- Read folder marker files when a workspace is opened or refreshed.
- Use file watching as a helper while Sidekick is running, but do not depend on watcher events as the only way to detect changes.
- Show tagged folder state in the UI:
  - chips in the right context surface;
  - up to three tag pills after the folder name in the tree;
  - `+N` when the folder has more than three tags.
- Ensure TASK-0035 can later consume the metadata instead of guessing project roots.

### Non-goals

- Do not implement TASK-0035 context views in this task.
- Do not implement a full `.sidekick/content-index.yml` editor.
- Do not implement artifact-to-context linking for files.
- Do not implement `Applikasjoner` view.
- Do not require the user to reorganize existing folders.
- Do not move, rename, or duplicate user files.
- Do not write metadata into user Markdown files.
- Do not make renderer-side state authoritative for filesystem writes.
- Do not hide the fact that Sidekick writes a marker file inside tagged folders.

### First Metadata Shape

Planning should decide exact field names, but the marker file should be close to:

```json
{
  "sidekickSchema": "folder-metadata.v1",
  "folderId": "folder-strategy-7f3b",
  "createdAt": "2026-05-14T00:00:00.000Z",
  "updatedAt": "2026-05-14T00:00:00.000Z",
  "tags": [
    {
      "label": "Prosjektmappe",
      "kind": "system",
      "systemEffect": "project-root",
      "context": {
        "id": "project-strategy",
        "type": "project",
        "name": "Strategi"
      },
      "source": "explicit",
      "updatedAt": "2026-05-14T00:00:00.000Z"
    },
    {
      "label": "Q2",
      "kind": "free",
      "source": "explicit",
      "updatedAt": "2026-05-14T00:00:00.000Z"
    }
  ]
}
```

The marker file should be named:

```text
.sidekick-folder.json
```

The workspace-level `content-index` concept in `docs/architecture/kontekstbasert-innholdsmodell.md` can later reference or cache these folder markers. The marker file is the first-version source of truth for folder tags.

User-facing labels are canonical for display, but implementation should store enough normalized data to identify system-effect tags safely. Do not infer system effect from arbitrary free-text labels without normalization and allow-listing.

### Resolved Planning Decisions

- V1 should scan `.sidekick-folder.json` marker files directly. Do not build a workspace-level `.sidekick/content-index.json` cache in this task.
- Generate `folderId` when the marker file is first created. Use a stable random ID, not a path-derived ID.
- Generate `context.id` when `Prosjektmappe` is first added. Use a stable random or slug-plus-random ID, and store it in the marker file.
- Keep `folderId` and `context.id` stable when a folder is renamed or moved inside the workspace.
- If the last tag is removed, keep `.sidekick-folder.json` with `tags: []` so the folder identity remains stable.
- If a marker file is corrupt or has an unsupported schema, show a metadata error and do not apply system effects from that file.
- If duplicate `folderId` values are found, mark the affected folders as metadata conflicts and do not apply system effects from those duplicate markers until the conflict is resolved.
- Show autosave status as a compact status line near the tag field:
  - `Lagrer...`
  - `Lagret`
  - `Kunne ikke lagre tagger`
- V1 should expose only implemented system-effect tags as suggestions. Free-form tags remain allowed.
- V1 tag editing belongs in the right context surface. Context menu support is deferred.
- System tags are recognized only by exact normalized match against an allow-list.
- Normalization rule:
  - trim leading/trailing whitespace;
  - collapse repeated internal whitespace to one space;
  - compare case-insensitively with the system tag's normalized label.
- No fuzzy matching. Near matches such as `Prosjektmape`, `Prosjekt mappe`, or `Prosjektmappe!` are free-form tags, not system tags.
- When a tag matches a system tag, store the canonical label and system effect. For example ` prosjektmappe ` becomes `Prosjektmappe` with `systemEffect: project-root`.
- When a tag does not match a system tag, store it as a free-form tag.

### User Workflow

1. User opens or creates a workspace.
2. User selects a folder in the physical `Mapper` view.
3. The right context surface shows folder details and a `Tagger` section.
4. Existing tags are shown as chips.
5. User clicks the tag field.
6. Sidekick opens a small dropdown with system-effect tags and tags already used in the workspace.
7. User selects `Prosjektmappe`, or types a free-form tag and presses Enter.
8. The tag is added immediately as a chip and saved to `.sidekick-folder.json` inside the selected folder.
9. The selected folder shows the tag in the right context surface and in the tree.
10. User can remove the tag later by clicking `x` on the chip.

### UI Requirements

- Use `docs/architecture/klassifisering-med-tags.html` as the visual reference.
- The tag editor should live in the right context surface for the selected folder.
- Use clear Norwegian labels:
  - `Tagger`
  - `Prosjektmappe`
  - `Legg til tag...`
  - `Lagres som skjult Sidekick-metadata i mappen - ikke i dokumentene dine`
- Use a compact token input with chips and dropdown suggestions.
- Do not use a separate "role" selector, segmented control, or explicit `Klassifiser mappe` form unless planning finds a strong reason.
- Adding a chip or removing a chip is the explicit user action. The change may autosave immediately.
- Show saving/saved/error state near the tag field.
- Show system-effect tags as blue chips and free-form tags as gray chips.
- The folder tree should show up to three tag pills after the folder name, with `+N` for additional tags.
- Do not use marketing or explanatory hero copy.
- The UI must show when no folder is selected.
- The UI must show when a selected item is a file and cannot be tagged as a folder.
- The UI must show write errors without losing the current selection.
- The UI must be keyboard accessible.

### Security Requirements

- Keep filesystem writes in the main process.
- Expose only typed APIs through preload.
- Do not expose raw filesystem, IPC, shell, process, or path APIs to the renderer.
- Validate every folder path against the selected workspace root.
- Reject tagging of files, missing paths, `.sidekick/`, `.sidekick-folder.json`, and paths outside the workspace.
- Treat metadata as user-confirmed workspace state, not as authority for arbitrary file access.
- Only allow system effects from allow-listed system tags. A free-form tag with the same text as a system tag should be normalized or rejected according to the planned rule, not silently treated as a new authority path.
- Use atomic or safe write behavior for metadata where practical.
- Detect duplicate `folderId` values if a tagged folder is copied. Do not silently merge copied folders into one context.
- Do not apply system effects from corrupt, unsupported, or duplicate marker files.
- Preserve Electron security settings: no renderer `nodeIntegration`, keep `contextIsolation` and sandbox enabled.

### Acceptance Criteria

- [x] Selecting a folder shows its current tags in the right context surface.
- [x] User can add `Prosjektmappe` to a selected folder from the GUI.
- [x] User can add a free-form tag to a selected folder from the GUI.
- [x] User can remove a tag from a selected folder from the GUI.
- [x] Tags persist in `.sidekick-folder.json` inside the tagged folder and survive app reload/reopen.
- [x] A tagged folder still has its tags if it is renamed inside the workspace and Sidekick rescans the workspace.
- [x] A tagged folder still has its tags if it is moved to another location inside the same workspace and Sidekick rescans the workspace.
- [x] `.sidekick-folder.json` is created only after the user adds a tag that requires persistence.
- [x] Removing the last tag leaves `.sidekick-folder.json` in place with `tags: []`.
- [x] `.sidekick-folder.json` is excluded from normal visible tree content, context packages, summaries, and search indexes.
- [x] Renderer uses typed APIs and cannot write arbitrary metadata files directly.
- [x] Main process validates selected folder path before writing tag metadata.
- [x] Metadata can represent at least `Prosjektmappe` as an allow-listed system-effect tag with stable context id, context type, name, path, and source.
- [x] Metadata can represent free-form tags without system effect.
- [x] Folder scan or a related read model exposes folder tags to the renderer.
- [x] TASK-0035 can later derive project roots from the `Prosjektmappe` system-effect tag.
- [x] Tagged folders show up to three tag pills in the tree and `+N` for additional tags.
- [x] Corrupt or unsupported marker files show a metadata error and do not apply system effects.
- [x] Duplicate `folderId` values show a metadata conflict and do not apply system effects for affected folders.
- [x] Autosave status near the tag field shows saving, saved, and failed states.
- [x] Tests cover marker-file parsing/writing, path safety, rename/move rescan behavior, duplicate marker IDs, system-tag allow-listing, free-form tags, GUI tagging, removal, reload, and error states.

## Planning Decisions

- Resolved direction: authoritative folder tags should be stored in `.sidekick-folder.json` inside the tagged folder.
- Resolved: v1 should scan marker files directly and should not build a workspace-level cache.
- Resolved: `context.id` should be generated when `Prosjektmappe` is first added and stored in the marker file.
- Resolved direction: folder identity should not be tied only to path. Use a stable `folderId` in the marker file.
- Resolved: system-effect tags are recognized only by exact normalized match against an allow-list. No fuzzy matching.
- Resolved: `Prosjektcontainer` is deferred.
- Resolved: the GUI should expose only implemented system-effect tags as suggestions, while allowing free-form tags.
- Resolved: tag editing appears only in the right context surface in v1.
- Resolved: removing `Prosjektmappe` removes the system-effect tag, but keeps the marker file if no tags remain.
- Resolved: autosave status should be compact and local to the tag field.
- Resolved: corrupt, unsupported, or duplicate marker files should show metadata errors/conflicts and should not apply system effects.

## Implementation Plan

### Files Or Areas

- Shared renderer contract and scan model:
  - `src/shared/sidekick-api.ts`
  - `src/preload.ts`
- Main-process metadata and validation:
  - `src/main/context-metadata.ts`
  - `src/main/folder-scanner.ts`
  - `src/main/context-package.ts`
  - `src/main/search-index.ts`
  - `src/main.ts`
- Renderer UI:
  - `index.html`
  - `src/renderer.ts`
  - `src/index.css`
- Tests:
  - `tests/unit`
  - `tests/integration`
  - `tests/e2e/renderer-smoke.spec.ts`
- Documentation:
  - `docs/tasks/TASK-0037-folder-context-tagging.md`
  - `docs/tasks/TASK-0035-read-only-context-views.md`
  - `docs/decisions`

### Steps

1. Create or reuse the task worktree from the current `main`, then run a baseline check from that worktree.
   - Record worktree status and baseline result in this task before code changes.
   - Do not build in the main checkout while this task is active.

2. Add the shared metadata contract in `src/shared/sidekick-api.ts`.
   - Add types for folder tags, system effects, folder metadata status, folder metadata summaries, tag edit requests, tag edit results, and tag suggestions.
   - Extend `FolderTreeNode` with optional folder metadata for folder nodes.
   - Extend scan warnings with metadata-related warning types for corrupt/unsupported markers and duplicate folder ids.
   - Keep renderer-visible data descriptive; do not expose raw filesystem write capability.

3. Implement `src/main/context-metadata.ts` as the authoritative marker-file module.
   - Define `.sidekick-folder.json` and schema `folder-metadata.v1`.
   - Implement tag normalization:
     - trim leading/trailing whitespace;
     - collapse repeated internal whitespace to one space;
     - compare case-insensitively against the allow-list.
   - Implement the first allow-listed system tag:
     - canonical label: `Prosjektmappe`;
     - kind: `system`;
     - system effect: `project-root`.
   - Generate stable random `folderId` on first marker creation.
   - Generate stable `context.id` when `Prosjektmappe` is first added.
   - Preserve `folderId` and `context.id` when tags are edited.
   - Keep the marker file with `tags: []` when the last tag is removed.
   - Use safe write behavior: write a temporary JSON file in the same folder, then rename it into place.
   - Return structured errors for corrupt JSON, unsupported schema, invalid tag data, invalid target folder, and duplicate ids.

4. Integrate metadata reading into `src/main/folder-scanner.ts`.
   - Read `.sidekick-folder.json` for each scanned directory.
   - Do not show `.sidekick-folder.json` as a file in the visible tree, even when it would otherwise be a supported `.json` file.
   - Attach valid tag metadata to the folder node.
   - Add metadata warnings to scan results for corrupt or unsupported markers.
   - Detect duplicate `folderId` values after scanning and mark all affected folders as metadata conflicts.
   - Do not apply system effects from corrupt, unsupported, or duplicate marker files.
   - Keep filesystem watchers out of this task; v1 relies on scan/open/refresh as source of truth.

5. Add typed IPC and preload APIs.
   - Add narrow APIs for adding and removing a folder tag.
   - Return a fresh `WorkspaceScan` or edit result containing the updated scan after a successful metadata write.
   - In `main.ts`, validate:
     - `rootPath` is a selected workspace root;
     - `folderRelativePath` is workspace-relative and not absolute;
     - no empty, `.`, `..`, or escaped path segments;
     - target is an existing folder;
     - target is not `.sidekick`, `.sidekick-folder.json`, or outside the workspace;
     - workspace root itself is not taggable in v1.
   - Keep all filesystem writes in the main process.

6. Build the right-panel tagging UI in `src/renderer.ts`.
   - Add a `Tagger` section for selected folder nodes below the selection details and before folder contents/actions.
   - Show current tags as chips:
     - blue for system-effect tags;
     - gray for free-form tags.
   - Add a compact tag input with dropdown suggestions:
     - `Prosjektmappe`;
     - tags already used elsewhere in the current scan.
   - Add with Enter or suggestion click.
   - Remove with chip `x`.
   - Show local autosave state:
     - `Lagrer...`;
     - `Lagret`;
     - `Kunne ikke lagre tagger`.
   - Keep selection stable after a save by selecting the same relative path in the returned scan when it still exists.
   - For files, show that files cannot be tagged in v1.
   - For workspace root, show that the workspace itself is not taggable in v1.
   - Preserve keyboard navigation in the tree and make the tag input/chips keyboard accessible.

7. Show tags in the tree.
   - Render up to three tag pills after the folder name or metadata area.
   - Show `+N` when there are more than three tags.
   - Keep long folder names and tags from breaking the tree layout on narrow widths.

8. Exclude marker files from generated outputs and search.
   - Add `.sidekick-folder.json` and `**/.sidekick-folder.json` to context-package ignore handling.
   - Ensure search indexing skips `.sidekick-folder.json` during full rebuild, incremental update, and manifest diff.
   - Ensure marker files do not appear as searchable JSON documents or visible scan entries.

9. Add tests at the right levels.
   - Unit tests for:
     - tag normalization and allow-list matching;
     - free-form tag handling;
     - marker-file validation;
     - ID preservation across tag edits.
   - Integration tests for:
     - writing marker files;
     - removing the last tag while keeping `tags: []`;
     - scanner reading valid markers;
     - scanner hiding `.sidekick-folder.json`;
     - scanner reporting corrupt/unsupported markers;
     - scanner detecting duplicate `folderId`;
     - rename/move behavior by moving a folder with its marker and rescanning;
     - context-package exclusion;
     - search-index exclusion.
   - E2E renderer tests for:
     - folder selection shows `Tagger`;
     - adding `Prosjektmappe`;
     - adding a free-form tag;
     - removing a tag;
     - tree pills and `+N`;
     - save error state.

10. Update documentation and dependent task state.
    - Add a decision record for marker-based folder metadata because this is a durable persistence model.
    - Keep `docs/architecture/kontekstbasert-innholdsmodell.md` aligned if implementation details differ from the current concept.
    - Keep `docs/architecture/desktop-design-guidelines.md` aligned if UI behavior differs from the design proposal.
    - Keep `TASK-0035` blocked until this task is built and reviewed; after review, update TASK-0035 to depend on the delivered folder metadata API.

### Verification

Automated checks from the task worktree:

- `npm run check`
- `npm run test`
- `npm run test:ui -- tests/e2e/renderer-smoke.spec.ts`

Manual verification after Build, from the task worktree:

1. Start Sidekick:

   ```bash
   cd /home/trutve/code/Sidekick-worktrees/TASK-0037-folder-context-tagging
   npm start
   ```

2. Create or open a disposable workspace.
3. Select a normal folder under the workspace root.
4. Verify the right panel shows `Tagger`.
5. Add `Prosjektmappe`.
6. Verify:
   - the chip appears in blue;
   - the folder tree shows the tag pill;
   - `<folder>/.sidekick-folder.json` exists;
   - the marker contains schema `folder-metadata.v1`, stable `folderId`, and `systemEffect: project-root`.
7. Add a free-form tag, for example `Q2`.
8. Verify the free-form chip appears in gray and persists after app reload.
9. Remove all tags.
10. Verify `.sidekick-folder.json` remains and contains `tags: []`.
11. Rename the tagged folder inside the workspace, reopen or refresh the workspace, and verify the tags still follow the folder.
12. Move the tagged folder to another location inside the same workspace, reopen or refresh the workspace, and verify the tags still follow the folder.
13. Search for a string that exists only in `.sidekick-folder.json` and verify the marker is not returned as a search result.
14. Generate a context package for the folder or workspace and verify `.sidekick-folder.json` is not included in processed files.

### Security And Risk Review

- This task introduces a new write path. Keep writes in main-process code only.
- Renderer APIs must remain typed and task-specific.
- Path validation is mandatory before every metadata read or write.
- Marker files may be user-edited. Treat marker contents as untrusted input.
- Corrupt, unsupported, or duplicate marker files must show errors/conflicts and must not create system effects.
- System effects must come only from allow-listed normalized system tags.
- Search indexing and context-package generation must not leak marker metadata into user-facing generated artifacts.
- Do not rely on file watcher events for correctness in v1; rescanning marker files is the reliable path.

### Docs

- Add a decision record under `docs/decisions/` for `.sidekick-folder.json` as the first folder metadata source of truth.
- Update task documentation with Build Log, Verification Log, Review Notes, and Closeout during later phases.
- Update `TASK-0035` after this task is reviewed so its project view plan consumes `Prosjektmappe` metadata instead of guessing.

### Human Gates

- Required: Yes. This is a Major task because it introduces persistent metadata, filesystem writes, IPC APIs, and user-facing UI behavior.
- Approval status: Approved by user request `bygg task 37`.
- Build may proceed in the task worktree.

## Build Log

- Worktree created:
  - `/home/trutve/code/Sidekick-worktrees/TASK-0037-folder-context-tagging`
  - branch `task/TASK-0037-folder-context-tagging`
- Baseline:
  - Initial `npm run check` failed because the new worktree had no `node_modules` and `eslint` was not installed.
  - Ran `npm ci` in the worktree.
  - Re-ran `npm run check`: passed.
- Implemented shared folder tag and metadata types in `src/shared/sidekick-api.ts`.
- Added `src/main/context-metadata.ts` for `.sidekick-folder.json` marker parsing, validation, safe write, tag normalization, and add/remove operations.
- Integrated marker reading into `src/main/folder-scanner.ts`.
  - Valid markers attach metadata to folder nodes.
  - Marker files are hidden from the visible tree.
  - Corrupt, unsupported, and duplicate marker files create scan warnings and do not apply system effects.
- Added typed IPC/preload methods:
  - `folder-tags:add`
  - `folder-tags:remove`
- Added main-process path validation for folder tag writes.
- Added right-panel `Tagger` UI for selected folders.
  - Supports `Prosjektmappe`.
  - Supports free-form tags.
  - Supports chip removal.
  - Shows local save state.
- Added tree tag pills with up to three visible tags and `+N` overflow.
- Excluded `.sidekick-folder.json` from context-package generation and search indexing.
- Added decision record:
  - `docs/decisions/2026-05-14-folder-metadata-marker.md`
- Added and updated tests for metadata, scanner, search exclusion, context-package exclusion, and renderer tagging.

## Verification Log

Passed:
- `npm run check`
- `npm run test`
  - 25 test files passed.
  - 111 tests passed.
- `npm run test:ui -- tests/e2e/renderer-smoke.spec.ts`
  - 33 Playwright tests passed.

Manual checks:
- Not run manually in the Electron app. The equivalent UI flow is covered by the new renderer smoke test, but human review should still run the manual flow below.

Notes:
- A first isolated e2e run failed because the test used broad text locators for `Tagger` and `Prosjektmappe`. The UI behavior was present. The test was fixed to target the tag title, chip, and tree pill specifically, then the isolated test and full renderer smoke suite passed.

## Review Notes

- Self-review completed.
- Human review accepted on 2026-05-14.
- Confirmed privileged filesystem writes stay in main-process code.
- Confirmed renderer receives only typed tag add/remove APIs through preload.
- Confirmed marker file contents are parsed as untrusted input and invalid markers do not produce system effects.
- Confirmed `.sidekick-folder.json` is hidden from scanner output, context packages, and search index documents.
- Residual review focus for human testing:
  - actual Electron manual flow with a disposable workspace;
  - visual fit of the tag editor in the right context surface;
  - whether the marker file name is acceptable in real user folders.

## Documentation Notes

- Updated TASK-0037 with build and verification evidence.
- Added `docs/decisions/2026-05-14-folder-metadata-marker.md`.
- Existing architecture/design documentation changes from the specification phase are included in the worktree:
  - `docs/architecture/kontekstbasert-innholdsmodell.md`
  - `docs/architecture/desktop-design-guidelines.md`
  - `docs/architecture/klassifisering-med-tags.html`

## Closeout

TASK-0037 added Sidekick's first explicit folder metadata and tagging capability.

Final behavior:

- Users can tag selected folders from the right context surface.
- `Prosjektmappe` is recognized as the first allow-listed system-effect tag and maps to `project-root`.
- Free-form tags are supported without system effect.
- Tags are persisted in `.sidekick-folder.json` inside the tagged folder.
- The marker file keeps a stable `folderId`, and `Prosjektmappe` keeps a stable generated project context id.
- Removing the last tag leaves the marker file in place with `tags: []`.
- Metadata follows a folder when it is renamed or moved inside the same workspace because the marker file lives inside the folder.
- `.sidekick-folder.json` is hidden from the visible tree, context packages, summaries, and search index documents.
- Corrupt, unsupported, or duplicate marker files create metadata warnings/conflicts and do not produce system effects.

Final verification:

- `npm run check` passed.
- `npm run test` passed: 25 unit/integration test files, 111 tests.
- `npm run test:ui -- tests/e2e/renderer-smoke.spec.ts` passed: 33 UI tests.

Documentation:

- Added `docs/decisions/2026-05-14-folder-metadata-marker.md`.
- Updated context-model and desktop design documentation for marker-based folder tags.
- Included `docs/architecture/klassifisering-med-tags.html` as the visual reference for folder tagging.

Integration:

- Task branch: `task/TASK-0037-folder-context-tagging`.
- Task worktree: `/home/trutve/code/Sidekick-worktrees/TASK-0037-folder-context-tagging`.
- Ready to merge into `main` and remove the task worktree.
