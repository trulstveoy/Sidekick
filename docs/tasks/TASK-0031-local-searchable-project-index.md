# Task: Local Searchable Project Index

ID: TASK-0031
Status: Specified
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-13
Branch: task/TASK-0031-local-searchable-project-index
Worktree: ../Sidekick-worktrees/TASK-0031-local-searchable-project-index
Base branch: origin/main
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
- `TASK-0028-generate-summaries-for-existing-transcriptions.md`
- `TASK-0030-generate-thematic-context-packages.md`
- `BACKLOG.md` (`BL-0008`)

## Summary

Add a local searchable index for selected-project files.

The index should make supported local content searchable without Codex. It may use MiniSearch, FlexSearch, SQLite FTS, Lucene/Tantivy-style tooling, or another local indexing approach, but search behavior must remain deterministic, local-first, and behind typed main/preload APIs.

## Current Phase

Specify

Specification is updated. Planning has not started.

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

Promoted from `BL-0005`.

## Links

Related docs:
- `../architecture/desktop-design-guidelines.md`
- `../architecture/product-vision.md`
- `../architecture/prosjektuavhengig-innholdsmodell.md`

Related tasks:
- `TASK-0028-generate-summaries-for-existing-transcriptions.md`
- `TASK-0030-generate-thematic-context-packages.md`

## Explore Notes

Current baseline:

- Sidekick scans selected project folders and returns file/folder metadata, but it does not index file content for querying.
- The scanner already excludes noisy folders such as `.git`, `node_modules`, `out`, `dist`, `.vite`, `.cache`, and hidden folders by default.
- Context-package generation has a separate ignore list for generated package files and noisy folders.
- Future `.sidekick/` metadata must be excluded from indexing unless a specific metadata search surface is approved later.
- The revised navigation model gives search two likely surfaces: index build/refresh as a primary-workspace workflow, and search results as a primary-workspace or project-level work surface that updates selection/context.
- `TASK-0030` may use search results for thematic context-package selection, but this task should not require thematic package work.
- The project-independent content model is only an exploration. The first version should index the selected physical project root, while avoiding design choices that make later workspace/library search impossible.

## Task Spec

### Problem

Sidekick can scan project structure, but users cannot search all supported project file content through a fast local index.

Codex-based analysis is useful for reasoning, but search should not require Codex.

### Goal

Build a local project search index that lets users search supported project files quickly and deterministically.

### Scope

- Choose and integrate a local indexing approach.
- Index supported text-based project files under the selected project root.
- Store the index locally as rebuildable generated metadata.
- Rebuild or refresh the index when the user requests it.
- Provide typed search and index-refresh APIs.
- Show search results in the GUI with file path, match snippet, and relevance score or rank.
- Let selecting a search result update the normal selected file/folder context when practical.
- Keep the search workflow independent of Codex.
- Exclude generated metadata, generated context packages, and noisy folders from indexing.

### Recommended Storage

Preferred project-local storage:

```text
<project-root>/.sidekick/search-index/
```

Rationale:

- The index is project-specific.
- It can be rebuilt from source files.
- It should not be included in scans, context packages, or thematic package input by default.
- Project-local storage is simpler than a global app index for the first version.
- A later project-independent content model may need a workspace-level index, but that is out of scope here.

### Supported Content

First version should focus on:

- `.txt`
- `.md`
- `.markdown`
- other plain text files already classified as searchable by Sidekick

Binary formats should not be indexed as text unless a later task adds extraction.

### Non-goals

- Codex semantic search.
- Cloud search.
- Cross-project search.
- Shared-library or workspace-level indexing.
- OCR.
- PDF/DOCX parsing unless separately scoped.
- File editing from search results.
- Automatic background file watching in the first version unless explicitly approved.
- Replacing folder scanning or context-package generation.

### UI Requirements

- Index build/refresh should be an explicit workflow in the primary workspace or another approved search surface.
- The right context surface should not become the index build progress surface.
- Search results should be dense and scannable, with file path, snippet, and rank/score.
- Selecting a search result should show normal file or folder context when the result maps to a current scan node.
- Unsupported/skipped file counts should be visible without overwhelming the search results.
- User-facing text should be Norwegian.

### Security Requirements

- Keep filesystem reads and index writes in the main process.
- Do not expose raw filesystem APIs to the renderer.
- Validate all indexed and searched paths are inside the selected project root.
- Exclude `.sidekick/`, generated context packages, `node_modules`, `.git`, build output, and cache folders.
- Treat the index as rebuildable generated metadata.
- New dependencies require review for license, native build requirements, package size, Electron packaging behavior, and offline/local behavior.
- Do not allow query syntax that can escape into filesystem, shell, SQL, or process execution.

### Acceptance Criteria

- [ ] User can build or refresh a local search index for the selected project.
- [ ] User can search indexed content without Codex.
- [ ] Search returns ranked file results with path and snippet.
- [ ] Selecting a result can update selected file/folder context when the path exists in the current scan.
- [ ] Search does not include `.sidekick/` or generated artifacts.
- [ ] Index is stored locally and can be rebuilt.
- [ ] Unsupported/binary files are skipped with clear counts or warnings.
- [ ] Renderer receives only typed search APIs.
- [ ] Tests cover indexing, query behavior, path safety, skipped files, dependency-independent result formatting, and index rebuild behavior.
- [ ] UI smoke coverage covers index refresh, search results, empty results, and result selection.

## Open Points For Future Planning

- Which indexing library should be used: MiniSearch, FlexSearch, SQLite FTS, Lucene-based tooling, Tantivy binding, or another local engine?
- Should the index live in the project `.sidekick/` folder or Electron `userData`?
- Should index refresh be manual only, or triggered after scans/imports/context generation?
- Which query syntax should be supported in the first version?
- Should results support filters by artifact type, folder, date, or file extension?
- How should very large files be chunked or skipped?
- Should search results be used by `TASK-0030` for thematic context-package selection?
- How should this evolve if Sidekick later supports project-independent libraries or logical projects?

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
