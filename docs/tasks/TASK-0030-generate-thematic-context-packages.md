# Task: Generate Thematic Context Packages

ID: TASK-0030
Status: Specified
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
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
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0030-generate-thematic-context-packages.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0004-context-package-workflow.md`
- `TASK-0020-context-package-workflow-refresh.md`
Coordinates with:
- `TASK-0029-find-relationships-across-documents.md`
- `TASK-0031-local-searchable-project-index.md`

## Summary

Create context packages that contain only files relevant to a user-specified theme.

The user describes a theme, Sidekick identifies relevant project files through search, Codex, or both, then generates a smaller context package from those files.

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

## Backlog Source

Promoted from `BL-0004`.

## Task Spec

### Problem

The current context package represents the whole project. For focused work, the user may need a smaller context package about one specific theme.

### Goal

Let the user specify a theme and generate a context package containing only files Sidekick considers relevant to that theme.

### Scope

- Add a thematic context-package workflow.
- Let the user enter a theme or topic in free text.
- Identify candidate files relevant to the theme.
- Show a preview before writing:
  - theme text;
  - selected files;
  - reason or match evidence for each file;
  - files excluded because they are unsupported or too large.
- Let the user confirm generation.
- Generate a Markdown context package from selected files only.
- Store a selection report so the user can understand why files were included.
- Preserve the existing full-project context package workflow.

### Recommended Output

Thematic context package:

```text
<project-root>/<project-name>.theme-<safe-theme-slug>.context-package.md
```

Selection report:

```text
<project-root>/.sidekick/thematic-context-packages/<safe-theme-slug>.selection.md
```

### Non-goals

- Replacing the full-project context package.
- Editing source files.
- Persisting user tags.
- A full search/index system unless `TASK-0031` is in scope.
- Fully automatic generation without preview.
- Cross-project thematic packages.

### Selection Methods

The task should support at least one selection method in the first build:

- indexed/local search;
- simple text search over supported files;
- Codex-based file selection from a full context package or scan summary;
- hybrid search first, Codex refinement second.

The final method should be chosen during planning.

### Security Requirements

- Keep filesystem reads and writes in the main process.
- Do not expose raw filesystem, shell, process, or IPC APIs to the renderer.
- Validate selected files are inside the selected project root.
- Do not let the renderer submit arbitrary file paths for packaging without main-process validation.
- Exclude `.sidekick/` and generated context packages from thematic package input.

### Acceptance Criteria

- [ ] User can enter a theme.
- [ ] Sidekick identifies candidate files relevant to the theme.
- [ ] User can preview selected files and inclusion reasons before generation.
- [ ] Thematic context package includes only selected files.
- [ ] Existing full-project context package behavior still works.
- [ ] Generated thematic package has a safe, predictable filename.
- [ ] Selection report is stored under `.sidekick/`.
- [ ] Tests cover safe slug generation, path validation, file selection, and package output.

## Open Points

- Should first version use local search, Codex, or a hybrid approach?
- Should `TASK-0031` local index be required before this task, or can first version use direct file scanning/search?
- How should users edit the selected file list before generation?
- Should thematic packages be overwritten by theme slug, or should they include timestamps?
- How should relevance be explained when Codex is used?
- What should happen if no files match the theme?

## Implementation Plan

Not started. Stop after Specify until this task is explicitly approved for planning/build.

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
