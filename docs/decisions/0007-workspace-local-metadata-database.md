# Workspace-Lokal Metadatadatabase

Status: Accepted
Date: 2026-05-18

## Context

Sidekick needs a cleaner persistence model for metadata than hidden marker files in user folders. The filesystem remains the source of truth for physical folders, files and user-authored content. Sidekick-owned metadata, such as folder tags and conceptual context state, should be local, queryable and independent from the user's Markdown files.

The earlier `.sidekick-folder.json` direction is no longer required because the app is still under development and does not need backward compatibility.

## Decision

Sidekick will create one SQLite database per workspace:

```text
<workspace>/.sidekick/sidekick.db
```

The database is the source of truth for Sidekick-owned metadata:

- folder tags;
- system-effect tags such as `Prosjektmappe`;
- conceptual contexts such as projects;
- last known physical scan entries;
- future generated-artifact metadata.

The filesystem remains the source of truth for:

- folder existence;
- file existence;
- user-authored content;
- generated Markdown artefacts that users should be able to read outside Sidekick.

Sidekick will not create new `.sidekick-folder.json` files. Existing marker files are treated as legacy, non-authoritative files and should be hidden or ignored by normal Sidekick views.

## Implementation Notes

The first implementation uses Electron's runtime support for `node:sqlite` through the main process. This avoids adding a native SQLite dependency to the Electron Forge package in this step.

The first schema includes:

- `workspace`
- `workspace_state`
- `filesystem_entry`
- `tag`
- `filesystem_entry_tag`
- `context`
- `context_entry`
- `generated_artifact`
- `schema_migrations`

`folder-scanner.ts` scans the physical filesystem, writes the latest tree to `filesystem_entry`, then annotates folder nodes with metadata read from the database before deriving context views.

`context-metadata.ts` is no longer a persistence module. It only owns tag normalization and system-tag definitions.

## Consequences

This gives Sidekick one coherent metadata store per workspace and keeps user folders cleaner. It also gives future context views a more natural place to store state than ad hoc marker files or generated Markdown.

The tradeoff is folder rename and move handling outside Sidekick. Without a marker inside the folder, Sidekick cannot safely know whether a new path is the same conceptual folder or a new folder with similar content. V1 therefore keeps metadata attached to the old path and marks entries missing after scan. Future work can add explicit relinking, user-confirmed matching or another identity mechanism if needed.

`node:sqlite` is still experimental in the Node/Electron runtime. If packaging, stability or long-term support becomes a problem, replace the driver behind `workspace-database.ts` without changing the renderer API.
