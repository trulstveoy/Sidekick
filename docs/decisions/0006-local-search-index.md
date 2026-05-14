# Decision: Local Workspace Search Index

Date: 2026-05-14

## Status

Accepted

## Context

Sidekick needs fast local search for supported files in a selected workspace. Search must not depend on Codex, cloud services, raw renderer filesystem access, or native dependencies that complicate Electron packaging.

## Decision

Use MiniSearch in the main process for the first local search index.

Generated index files are stored under:

```text
<workspace-root>/.sidekick/search-index/
```

The first index is created as part of workspace establishment. Sidekick starts indexing after a workspace is selected, created, or initialized, while returning the workspace scan without waiting for the index build.

After an index exists, the main process keeps it current for the selected workspace using debounced file watcher events and per-file updates where paths can be validated safely. Full rebuild is reserved for initial creation, explicit refresh/recovery, schema mismatch, and stale states that cannot be reconciled safely.

## Rationale

- MiniSearch is local, deterministic, serializable, and has no native build step.
- Workspace-local `.sidekick/search-index/` storage keeps the index rebuildable and naturally scoped to the selected workspace.
- Main-process ownership keeps filesystem reads, snippets, manifest writes, watcher events, and path validation out of the renderer.
- A typed preload API preserves Electron isolation and avoids exposing generic filesystem or IPC primitives.

## Consequences

- The first version supports simple free-text search, not semantic search, regex, boolean syntax, or cross-workspace search.
- Supported text files over 1 MiB are skipped instead of chunked.
- Unsupported and binary files are reported as skipped metadata.
- `.sidekick/`, generated context packages, hidden folders, dependencies, build output, and cache folders remain excluded.
- Later semantic or cross-workspace search can reuse the manifest model but should be handled as a separate decision.
