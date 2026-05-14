# Task: Generate Thematic Context Packages

ID: TASK-0030
Status: Canceled
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-14
Branch: task/TASK-0030-generate-thematic-context-packages
Worktree: ../Sidekick-worktrees/TASK-0030-generate-thematic-context-packages
Base branch: origin/main
Write scope:
- `src/main/context-package.ts`
- `src/main/thematic-context-package.ts`
- `src/main/prompts/thematic-file-selection.nb.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0030-generate-thematic-context-packages.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0004-context-package-workflow.md`
- `closed/TASK-0020-context-package-workflow-refresh.md`
- `closed/TASK-0033-revised-navigation-model.md`
Coordinates with:
- `closed/TASK-0021-controlled-codex-assistant-refresh.md`
- `TASK-0029-find-relationships-across-documents.md`
- `TASK-0031-local-searchable-project-index.md`
- `TASK-0034-folder-scoped-context-package.md`
- `BACKLOG.md` (`BL-0008`)

## Summary

Create context packages that contain only files relevant to a user-specified theme.

The first version should be an explicit selected-project workflow: the user describes a theme, Sidekick identifies relevant files by an approved selection method, previews the selected files and evidence, then writes a Markdown context package for that thematic scope.

## Current Phase

Close

Task canceled by human decision before planning or implementation.

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [ ] Plan complete
- [ ] Worktree created or reused, if required
- [ ] Human approval received, if required
- [ ] Build complete
- [ ] Verification complete
- [ ] Review complete
- [x] Documentation complete
- [x] Closeout complete

## Backlog Source

Promoted from `BL-0004`.

## Links

Related docs:
- `../architecture/desktop-design-guidelines.md`
- `../architecture/product-vision.md`
- `../architecture/prosjektuavhengig-innholdsmodell.md`

Related tasks:
- `closed/TASK-0020-context-package-workflow-refresh.md`
- `closed/TASK-0033-revised-navigation-model.md`
- `TASK-0031-local-searchable-project-index.md`
- `TASK-0034-folder-scoped-context-package.md`

## Explore Notes

Current baseline:

- Full-project context-package generation exists and writes to the project root.
- `TASK-0034` separately scopes selected-folder context-package generation and should not be duplicated here.
- The revised navigation model says global project workflows start from the action bar or approved overflow and run in the primary workspace.
- Folder-scoped actions belong in selected-folder context; thematic packages are theme/query-based and should not be presented as a selected-folder action.
- Generated context-package files are ignored during context-package generation.
- `TASK-0031` may provide a local searchable index, but it is not built yet.
- The project-independent content model is only a draft. This task should not implement logical projects, but it should model thematic package scope explicitly so future logical contexts can be added later.

## Task Spec

### Problem

The current full-project context package can be too broad for focused work. A selected-folder package helps when the folder is the right boundary, but users may also need context for a theme that crosses folders.

For focused agent work, the user may need a smaller package about one topic, decision, participant, risk, or workstream.

### Goal

Let the user specify a theme and generate a context package containing only files Sidekick considers relevant to that theme.

The user should understand why each file was included before Sidekick writes the package.

### Scope

- Add a thematic context-package workflow for the selected project.
- Let the user enter a theme or topic in free text.
- Identify candidate files relevant to the theme.
- Show a preview before writing:
  - theme text;
  - source scope;
  - selected files;
  - reason or match evidence for each file;
  - files excluded because they are unsupported, generated, outside scope, or too large.
- Let the user confirm generation.
- Generate a Markdown context package from selected files only.
- Store a selection report so the user can understand why files were included.
- Preserve existing full-project context-package behavior.
- Do not overlap with selected-folder generation from `TASK-0034`.
- Exclude `.sidekick/` and generated context packages from thematic package input.

### Recommended Output

Thematic context package:

```text
<project-root>/<project-name>.theme-<safe-theme-slug>.context-package.md
```

Selection report:

```text
<project-root>/.sidekick/thematic-context-packages/<safe-theme-slug>.selection.md
```

Recommended selection report metadata:

```markdown
---
sidekick_schema: thematic-context-selection.v1
generated_at: 2026-05-13T12:00:00.000Z
source_scope: full-project
theme: <user theme>
theme_slug: <safe-theme-slug>
output_path: ./<project-name>.theme-<safe-theme-slug>.context-package.md
selection_method: <local-search | codex | hybrid>
---
```

### Non-goals

- Replacing the full-project context package.
- Replacing folder-scoped context packages from `TASK-0034`.
- Editing source files.
- Persisting user tags.
- A full search/index system unless `TASK-0031` is explicitly included in planning.
- Fully automatic generation without preview.
- Cross-project thematic packages.
- Logical-project thematic packages or shared-library package generation.

### Selection Methods

The task should support at least one selection method in the first build:

- indexed/local search;
- simple text search over supported files;
- Codex-based file selection from a full context package or scan summary;
- hybrid search first, Codex refinement second.

The final method should be chosen during planning. If Codex is used, it must follow the existing controlled Codex boundary and must not write files directly.

### UI Requirements

- The workflow runs in the primary workspace.
- The right context surface should not become the workflow progress surface.
- The action should be presented as theme-based project context generation, not as a selected-folder action.
- Preview must make source scope, selected files, and inclusion reasons visible before confirmation.
- Result should show output path, selection report path, included file count, skipped file count, and warnings.
- User-facing text should be Norwegian.

### Security Requirements

- Keep filesystem reads and writes in the main process.
- Keep Codex execution in the main process if Codex is used for selection.
- Do not expose raw filesystem, shell, process, or IPC APIs to the renderer.
- Validate selected files are inside the selected project root.
- Do not let the renderer submit arbitrary file paths for packaging without main-process validation.
- Exclude `.sidekick/`, generated context packages, `.git`, `node_modules`, build output, and cache folders from thematic package input.
- Selection reports are generated metadata and should not be fed back into future packages.

### Acceptance Criteria

- [ ] User can enter a theme.
- [ ] Sidekick identifies candidate files relevant to the theme.
- [ ] User can preview selected files and inclusion reasons before generation.
- [ ] Preview shows source scope and files excluded from selection.
- [ ] Thematic context package includes only selected files.
- [ ] Existing full-project context package behavior still works.
- [ ] Selected-folder context package behavior from `TASK-0034` is not replaced or duplicated.
- [ ] Generated thematic package has a safe, predictable filename.
- [ ] Selection report is stored under `.sidekick/`.
- [ ] `.sidekick/` and generated context packages are excluded from thematic input.
- [ ] Tests cover safe slug generation, path validation, file selection, report writing, and package output.
- [ ] UI smoke coverage covers theme entry, preview, confirmation, success, and no-match/error state.

## Open Points For Future Planning

- Should first version use local search, Codex, or a hybrid approach?
- Should `TASK-0031` local index be required before this task, or can first version use direct file scanning/search?
- How should users edit the selected file list before generation?
- Should thematic packages be overwritten by theme slug, or should they include timestamps?
- How should relevance be explained when Codex is used?
- What should happen if no files match the theme?
- Should thematic packages later support logical projects or shared content libraries?

## Implementation Plan

Canceled before planning. Do not implement.

## Build Log

Not started. No product code was changed.

## Verification Log

Not run. No implementation was performed.

## Review Notes

Not applicable. The task was canceled before build.

## Documentation Notes

Task record updated to record cancellation.

## Closeout

TASK-0030 is canceled.

Reason:
- 2026-05-14: Human decided the thematic context-package workflow should not be implemented.

Outcome:
- No implementation was started.
- No source, test, IPC, UI, or persistence behavior was changed for this task.
- Existing full-project and folder-scoped context-package workflows remain the supported package-generation modes.
