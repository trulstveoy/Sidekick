# Task: Folder Context Tagging

ID: TASK-0037
Status: Specified
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
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0037-folder-context-tagging.md`
- `docs/tasks/TASK-0035-read-only-context-views.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0036-create-workspace-instead-of-project.md`
Blocks:
- `TASK-0035-read-only-context-views.md`
Coordinates with:
- `docs/architecture/kontekstbasert-innholdsmodell.md`
- `TASK-0031-local-searchable-project-index.md`

## Summary

Add the first Sidekick metadata concept and GUI flow for tagging folders as context roots.

TASK-0035 needs a reliable way to know which folders are project folders. Guessing from folder names or structure is too weak. Sidekick should let the user tag a selected folder as a `Prosjektmappe` in the GUI, persist that classification as workspace metadata, and read it back later.

This task should introduce the smallest useful writable metadata editor for folders. It should not implement the full context-based content model.

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
- There is no editable metadata concept for saying that a folder is a project folder.
- `docs/architecture/kontekstbasert-innholdsmodell.md` recommends `.sidekick/content-index.yml` as the future place for Sidekick-controlled metadata.
- The architecture document has concepts for `contexts`, `artifacts`, and `artifact_contexts`.
- The document does not yet make folder tagging explicit enough for the first implementation.
- TASK-0035 cannot safely build `Prosjekter` view until Sidekick can know which folders are project roots.

## Task Spec

### Problem

TASK-0035 needs to show a read-only `Prosjekter` context view.

That requires Sidekick to know which folders represent project contexts. The current workspace structure does not guarantee that project folders live under a fixed `Prosjekter/` directory, and deriving project membership only from folder names would be brittle.

Sidekick needs a first metadata mechanism where the user can explicitly tag a folder as a project folder from the GUI.

### Goal

Build a minimal folder metadata/tagging capability:

```text
folder path + folder role + context type + context id/name + source
```

The first required user-facing capability is:

```text
Tag selected folder as Prosjektmappe
```

The result should be persisted under `.sidekick/` and available to later context-view derivation.

### Scope

- Add a first metadata model for folder classification.
- Support at least this folder role:
  - `project-root`: the folder is a project context root.
- Consider, but do not necessarily implement in the first build, these future roles:
  - `project-container`: folder contains project roots.
  - `application-root`: folder is an application context root.
  - `application-container`: folder contains application roots.
  - `library-root`: folder is shared library content.
- Add typed main/preload APIs to read, write, and remove folder classification.
- Add a GUI metadata editor in Sidekick:
  - select a folder in `Mapper`;
  - show current folder classification in the right context surface;
  - allow the user to tag the folder as `Prosjektmappe`;
  - allow the user to remove or change the classification;
  - show that the operation writes Sidekick metadata.
- Persist metadata under `.sidekick/`.
- Create `.sidekick/` only when the user confirms a metadata write.
- Read metadata when a workspace is opened or refreshed.
- Show tagged folder state in the UI, for example with a compact badge or detail row.
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

### First Metadata Shape

Planning should decide the exact storage format, but the conceptual model should be close to:

```yaml
sidekick_schema: content-index.v1
folder_contexts:
  - path: "Strategi"
    role: project-root
    context:
      id: project-strategy
      type: project
      name: Strategi
    source: explicit
    updated_at: "2026-05-14T00:00:00.000Z"
```

If planning chooses to store this in JSON for implementation simplicity, the conceptual fields should remain compatible with the future `content-index` model in `docs/architecture/kontekstbasert-innholdsmodell.md`.

### User Workflow

1. User opens or creates a workspace.
2. User selects a folder in the physical `Mapper` view.
3. The right context surface shows folder details and metadata status.
4. User opens the folder metadata editor.
5. User chooses `Prosjektmappe`.
6. Sidekick previews that it will write workspace metadata under `.sidekick/`.
7. User confirms.
8. Sidekick writes the metadata.
9. The selected folder shows it is tagged as `Prosjektmappe`.
10. User can remove the tag later.

### UI Requirements

- The editor should live in the existing Sidekick work surface, preferably in the right context surface for the selected folder.
- Use clear Norwegian labels:
  - `Klassifiser mappe`
  - `Prosjektmappe`
  - `Fjern klassifisering`
  - `Skriver Sidekick-metadata`
- Use controls appropriate for the action:
  - segmented control or select for folder role;
  - explicit save/apply button;
  - remove/reset action when a classification exists.
- Do not use marketing or explanatory hero copy.
- The UI must show when no folder is selected.
- The UI must show when a selected item is a file and cannot be classified as a folder.
- The UI must show write errors without losing the current selection.
- The UI must be keyboard accessible.

### Security Requirements

- Keep filesystem writes in the main process.
- Expose only typed APIs through preload.
- Do not expose raw filesystem, IPC, shell, process, or path APIs to the renderer.
- Validate every folder path against the selected workspace root.
- Reject classification of files, missing paths, `.sidekick/`, and paths outside the workspace.
- Treat metadata as user-confirmed workspace state, not as authority for arbitrary file access.
- Use atomic or safe write behavior for metadata where practical.
- Preserve Electron security settings: no renderer `nodeIntegration`, keep `contextIsolation` and sandbox enabled.

### Acceptance Criteria

- [ ] Selecting a folder shows whether it has a Sidekick folder classification.
- [ ] User can tag a selected folder as `Prosjektmappe` from the GUI.
- [ ] User can remove the folder classification from the GUI.
- [ ] Classification persists under `.sidekick/` and survives app reload/reopen.
- [ ] `.sidekick/` is created only after explicit user confirmation.
- [ ] Renderer uses typed APIs and cannot write arbitrary metadata files directly.
- [ ] Main process validates selected folder path before writing metadata.
- [ ] Metadata can represent at least `project-root` with stable context id, context type, name, path, and source.
- [ ] Folder scan or a related read model exposes folder classification to the renderer.
- [ ] TASK-0035 can later derive project roots from this metadata.
- [ ] Tests cover metadata parsing/writing, path safety, GUI tagging, removal, reload, and error states.

## Open Points For Planning

- Should the first implementation store metadata as `.sidekick/content-index.yml`, `.sidekick/content-index.json`, or another file?
- Should Sidekick add a YAML dependency now, or use JSON first while preserving the conceptual model?
- How should `context_id` be generated and kept stable when a folder is renamed?
- Should a folder classification be tied only to path in the first version, or also to folder name/hash metadata?
- Should `project-container` be implemented now or deferred until a workspace has a `Prosjekter/` folder contract?
- Should the GUI support only `Prosjektmappe` now, or expose future role choices as disabled/hidden options?
- Should metadata editor actions be placed only in the right context surface, or also in a contextual action menu?
- Should removing a folder classification delete the context if no artifacts reference it, or keep an inactive context record?

## Implementation Plan

Not started. Stop after Specify until this task is explicitly approved for planning.

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
