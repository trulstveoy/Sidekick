# Task: Read-Only Context Views

ID: TASK-0035
Status: Blocked
Class: Major
Owner: Pair
Created: 2026-05-14
Updated: 2026-05-14
Branch: task/TASK-0035-read-only-context-views
Worktree: ../Sidekick-worktrees/TASK-0035-read-only-context-views
Base branch: origin/main
Write scope:
- `src/main/folder-scanner.ts`
- `src/main/context-views.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0035-read-only-context-views.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0018-folder-hierarchy-artifact-detail.md`
- `closed/TASK-0033-revised-navigation-model.md`
- `closed/TASK-0036-create-workspace-instead-of-project.md`
- `TASK-0037-folder-context-tagging.md`
Coordinates with:
- `TASK-0031-local-searchable-project-index.md`
- `BACKLOG.md` (`BL-0008`)

## Summary

Add the first read-only implementation slice of Sidekick's context-based content model.

The first build should let users switch between:

- `Mapper`: the current physical folder/file structure;
- `Prosjekter`: a derived project context view that groups files by project-like folders and shows shared library files under the contexts they are linked to by deterministic first-version rules.

This task should prove the context-view model in the product without implementing the full workspace, application, library, or editable metadata model.

## Current Phase

Blocked after Specify

Specification is complete, but planning must wait.

This task was blocked because Sidekick project creation did not create a workspace structure. `closed/TASK-0036-create-workspace-instead-of-project.md` resolved the first concrete blocker by changing creation from project folder to workspace and updating the first required workspace folders:

```text
<Arbeidsområde>/
  00. Forutsetninger/
  01. Notater/
  02. Transkripsjoner/
```

Planning should revisit this specification against the closed workspace-creation decision before implementation starts.

This task has a new blocker: Sidekick needs a way to explicitly tag or classify folders as project folders before the `Prosjekter` view can be derived reliably. `TASK-0037-folder-context-tagging.md` should define and build the first folder metadata editor and persistence model before TASK-0035 is planned.

Do not plan or build this task until `TASK-0037-folder-context-tagging.md` is planned, built, and closed or explicitly superseded.

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
- `../architecture/kontekstvisninger-mapper-og-prosjekter.html`
- `../architecture/revidert-navigasjonsmodell.html`
- `../architecture/desktop-design-guidelines.md`

Related tasks:
- `closed/TASK-0018-folder-hierarchy-artifact-detail.md`
- `closed/TASK-0033-revised-navigation-model.md`
- `closed/TASK-0036-create-workspace-instead-of-project.md`
- `TASK-0037-folder-context-tagging.md`
- `TASK-0031-local-searchable-project-index.md`

## Backlog Source

Related to `BL-0008`, but this task is only the first implementation slice. It does not complete the full project-independent content model.

## Explore Notes

Current baseline:

- Sidekick scans one selected workspace root and shows a physical file/folder tree.
- Sidekick now creates a workspace root with `<Arbeidsområde>/00. Forutsetninger/`, `<Arbeidsområde>/01. Notater/`, and `<Arbeidsområde>/02. Transkripsjoner/`.
- The revised navigation model already separates primary workspace workflows from the right context surface.
- The context surface can show selected folder/file details and contextual actions.
- Generated `.sidekick/` metadata is intended to stay out of normal scans and context packages.
- The new architecture document defines the concept as `Kontekstbasert innholdsmodell`.
- The HTML prototype `kontekstvisninger-mapper-og-prosjekter.html` shows two read-only context views over the same files:
  - `Mapper` for physical placement;
  - `Prosjekter` for project membership.
- The first implementation originally aimed to prove the read model and UI concept before adding editable metadata or full workspace setup.
- That scope was deferred until Sidekick's workspace creation model was clarified. Planning should now revisit the specification before build.
- A second blocker was identified after TASK-0036: a project context view cannot rely only on folder-name guessing. Sidekick needs explicit folder classification metadata and a GUI editor for tagging a folder as `Prosjektmappe`.

## Task Spec

### Problem

Sidekick currently treats the selected folder tree as the primary way to understand project content.

That is simple and useful, but it does not show the key idea in the context-based content model: the same artifact can be physically stored in one place and still appear in one or more logical context views.

Users need a first read-only way to switch between physical folder structure and a project-oriented context view without duplicating files or introducing a full metadata editor.

### Goal

Add a read-only context-view surface that proves this model:

```text
artifact + context_view + context + view_reason
```

The renderer should show context views, but the membership and `view_reason` should be produced by main process or a shared deterministic domain model, not invented ad hoc in the renderer.

This goal is provisional. It should be revisited after the workspace creation/model task defines the physical structure Sidekick should create and open.

### Scope

- Keep the current physical tree as the `Mapper` context view.
- Add a `Prosjekter` context view in the primary workspace.
- Derive first-version project contexts from the selected physical project scan.
- Derive first-version shared/library rows from project-local folder signals that already exist, especially transcription/library-like folders where practical.
- Add a typed read model for context-view rows:
  - artifact identity;
  - physical path;
  - selected context view;
  - context id and label when applicable;
  - artifact type;
  - display label;
  - display group;
  - `view_reason`;
  - source kind such as physical project file or linked library artifact.
- Update selection state so selecting a row carries:
  - selected artifact;
  - selected context view;
  - selected context id when applicable;
  - `view_reason`.
- Update the right context surface so it can explain:
  - physical location;
  - linked contexts;
  - why the artifact is shown in the current view.
- Use Norwegian user-facing labels.
- Preserve existing folder/file selection behavior.
- Preserve existing workflows and contextual actions where they already make sense.
- Add tests for the context-view read model and UI switching.

### First-Version Derivation Rules

Planning may refine these rules, but the first build should stay deterministic and local:

- `Mapper` uses the existing folder scan structure.
- `Prosjekter` uses top-level project-like folders when the selected root is a workspace-like folder.
- If the selected root is already a single project folder, `Prosjekter` may show one derived project context for that selected folder.
- Files physically inside a derived project context get `view_reason: physical-project-file`.
- Files in known shared/library-like folders may appear under derived project contexts only when Sidekick can infer the link deterministically from current scan signals.
- If a link cannot be inferred safely, the file should remain visible in `Mapper` but should not be invented into `Prosjekter`.
- `.sidekick/` must not become ordinary content in the context views.

If these rules prove too ambiguous during planning, planning should narrow the first build rather than adding manual metadata editing.

### Non-goals

- Do not implement full workspace setup.
- Do not implement `.sidekick/content-index.yml`.
- Do not add editable context links.
- Do not add `Applikasjoner` as a visible context view in the first build.
- Do not add `Tema`, `Beslutninger`, people, process, or other context views.
- Do not move or duplicate files.
- Do not change import behavior.
- Do not change context-package generation behavior except where the selected context state must remain compatible.
- Do not create a new search/index feature.
- Do not add cross-workspace or global library support.
- Do not require users to reorganize existing project folders.

### User Workflow

1. User opens a folder as today.
2. Sidekick shows the normal `Mapper` view by default.
3. User switches to `Prosjekter`.
4. Sidekick shows derived project contexts.
5. Each context groups rows by source:
   - project files;
   - linked library/shared files, if any can be inferred safely.
6. User selects a file in either view.
7. The right context surface shows:
   - file details;
   - physical location;
   - linked contexts;
   - why the file appears in the current context view.
8. User can switch back to `Mapper` without changing selection semantics or duplicating content.

### UI Requirements

- The context-view switch should be visible in the primary workspace, similar to the prototype's `Mapper` / `Prosjekter` toggle.
- `Mapper` should remain recognizable as the existing physical tree.
- `Prosjekter` should group files clearly by context and source.
- Library/shared rows should be visually distinguishable from physical project files.
- The right context surface should explain `Vises her fordi`.
- The right context surface should show physical location even when the selected row comes from a logical view.
- Empty, unsupported, or ambiguous derived contexts should have clear compact states.
- User-facing text should be Norwegian.
- The UI should remain dense and work-surface oriented, not explanatory marketing copy.

### Security Requirements

- Keep filesystem scanning and context-view derivation in the main process or shared non-privileged domain code called by the main process.
- Do not expose raw filesystem, IPC, shell, process, or arbitrary path APIs to the renderer.
- Validate all artifact paths against the selected root.
- Do not let the renderer invent context membership for privileged operations.
- Do not let `context_view`, `context_id`, or `view_reason` become authority for filesystem writes.
- Preserve Electron security settings: no renderer `nodeIntegration`, keep `contextIsolation` and sandbox enabled.
- Treat context-view rows as read-only derived state.

### Acceptance Criteria

- [ ] `Mapper` remains available and preserves current physical tree behavior.
- [ ] `Prosjekter` is available as a read-only context view.
- [ ] Context-view rows are derived from main/shared domain logic, not hardcoded in the renderer.
- [ ] Selecting a row preserves artifact identity, physical path, selected context view, selected context, and `view_reason`.
- [ ] Right context surface shows physical location for selected files in both `Mapper` and `Prosjekter`.
- [ ] Right context surface explains why a file is shown in the selected context view.
- [ ] The same artifact can appear in multiple context views without file duplication.
- [ ] `.sidekick/` is not treated as ordinary user content in context views.
- [ ] Existing project scan, folder/file context, import, Codex, and context-package workflows still work.
- [ ] Tests cover context-view derivation, selection state, ambiguous/no-context cases, and renderer smoke for switching views.

## Open Points For Future Planning

- What should Sidekick create: a project root, a workspace root, or both?
- Should workspace creation introduce `Prosjekter/`, `Bibliotek/`, `.sidekick/`, and later `Applikasjoner/` as first-class physical areas?
- Should this task be respecified after the workspace task, rather than planned from the current provisional scope?
- What exact first-version folder rules should derive multiple project contexts?
- Should `Prosjekter` derive only from folders tagged by TASK-0037, or also from fallback folder heuristics when metadata is missing?
- Should first build support only a workspace-like root, only a selected-project root, or both?
- How should the UI represent a single selected-project root in `Prosjekter`?
- Which existing scanner signals are reliable enough for shared/library rows in the first build?
- Should context-view derivation live in `src/main/context-views.ts` or a shared pure module?
- Should `view_reason` be an enum in `src/shared/sidekick-api.ts`?
- How much of the prototype visual treatment should be copied into the production UI?
- Should `TASK-0031` search results later select an artifact in a context view or only in `Mapper`?

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
