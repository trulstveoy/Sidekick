# Decision: Folder Metadata Marker Files

Status: Superseded by `0007-workspace-local-metadata-database.md`
Date: 2026-05-14

Superseded: 2026-05-18

## Context

Sidekick needs to know when a folder has a conceptual role, for example when a folder should be treated as a `Prosjektmappe`.

The physical workspace does not guarantee that project folders live under a fixed parent folder. Users may also rename or move folders outside Sidekick. A workspace-level path-only index would therefore be fragile because the metadata could lose contact with the folder it describes.

## Decision

Sidekick stores first-version folder metadata in a marker file inside the tagged folder:

```text
.sidekick-folder.json
```

The marker is the source of truth for folder tags in v1. It contains a stable `folderId`, timestamps, and explicit tags. The first system-effect tag is `Prosjektmappe`, which maps internally to `project-root`.

Sidekick scans marker files when a workspace is opened or refreshed. File watching may help later, but correctness must not depend on watcher events.

## Consequences

- Metadata follows the folder when it is renamed or moved inside the same workspace.
- Users can hide the marker file in tools such as Obsidian without changing their document files.
- Sidekick must hide `.sidekick-folder.json` from the visible tree, search results, context packages, summaries, and generated context artifacts.
- Marker files are user-editable and must be treated as untrusted input.
- Corrupt, unsupported, or duplicate marker files must not create system effects.
- A future workspace-level index may cache or summarize marker files, but it should not replace the marker as source of truth until a separate decision is made.
