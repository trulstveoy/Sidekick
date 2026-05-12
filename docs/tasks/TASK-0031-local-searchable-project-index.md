# Task: Local Searchable Project Index

ID: TASK-0031
Status: Specified
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0031-local-searchable-project-index
Worktree: ../Sidekick-worktrees/TASK-0031-local-searchable-project-index
Base branch: origin/main
Write scope:
- `src/main/search-index.ts`
- `src/main/folder-scanner.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
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
Coordinates with:
- `TASK-0030-generate-thematic-context-packages.md`

## Summary

Add a local searchable index for project files.

The index should make project content searchable without Codex. It may use Lucene or an equivalent local indexing library, but the search behavior must be deterministic and local-first.

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

Promoted from `BL-0005`.

## Task Spec

### Problem

Sidekick can scan project structure, but users cannot search all project file content through a fast local index.

Codex-based analysis is useful for reasoning, but search should not require Codex.

### Goal

Build a local project search index that lets users search supported project files quickly and deterministically.

### Scope

- Choose and integrate a local indexing approach.
- Index supported text-based project files.
- Store the index locally under project metadata or app metadata.
- Rebuild or refresh the index when the user requests it.
- Provide a typed search API.
- Show search results in the GUI with file path, match snippet, and relevance score/rank.
- Keep the search workflow independent of Codex.

### Recommended Storage

Preferred project-local storage:

```text
<project-root>/.sidekick/search-index/
```

Rationale:
- The index is project-specific.
- It can be rebuilt from source files.
- It should not be included in context packages.

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
- OCR.
- PDF/DOCX parsing unless separately scoped.
- File editing from search results.
- Automatic background file watching in the first version unless explicitly approved.

### Security Requirements

- Keep filesystem reads and index writes in the main process.
- Do not expose raw filesystem APIs to the renderer.
- Validate all indexed paths are inside the selected project root.
- Exclude `.sidekick/`, generated context packages, `node_modules`, `.git`, build output, and cache folders.
- Treat the index as rebuildable generated metadata.
- New dependencies require review for license, native build requirements, package size, and Electron packaging behavior.

### Acceptance Criteria

- [ ] User can build or refresh a local search index for the selected project.
- [ ] User can search indexed content without Codex.
- [ ] Search returns ranked file results with path and snippet.
- [ ] Search does not include `.sidekick/` or generated artifacts.
- [ ] Index is stored locally and can be rebuilt.
- [ ] Unsupported/binary files are skipped with clear counts or warnings.
- [ ] Renderer receives only typed search APIs.
- [ ] Tests cover indexing, query behavior, path safety, skipped files, and result formatting.

## Open Points

- Which indexing library should be used: Lucene-based, MiniSearch, FlexSearch, SQLite FTS, Tantivy binding, or another local engine?
- Should the index live in the project `.sidekick/` folder or Electron `userData`?
- Should index refresh be manual only, or triggered after scans/imports/context generation?
- Which query syntax should be supported in the first version?
- Should results support filters by artifact type, folder, date, or file extension?
- How should very large files be chunked or skipped?
- Should search results be used by `TASK-0030` for thematic context-package selection?

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
