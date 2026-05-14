# Decision: Workspace Creation Folder Structure

Status: Accepted
Date: 2026-05-14

## Context

Sidekick originally created a local project folder with required project subfolders.

The product model is moving toward an arbeidsområde as the root object Sidekick creates. This gives later context views, shared content, and metadata a clearer workspace-level base without implementing the full context-based model immediately.

## Decision

When Sidekick creates a new workspace, it creates one workspace root folder and these required subfolders:

- `00. Forutsetninger`
- `01. Notater`
- `02. Transkripsjoner`

The user chooses a parent folder and enters an arbeidsområdenavn. Sidekick creates the workspace root inside the selected parent folder.

This decision replaces the old first project-folder structure from `0004-project-folder-structure.md`.

## Consequences

- Workspace creation remains a filesystem-write workflow and must stay in the Electron main process.
- The renderer receives only typed creation APIs, not raw filesystem access.
- Required folder names remain product contract values and should stay centralized in code.
- Existing workflows that find transcriptions must keep working when the transcription folder is now `02. Transkripsjoner`.
- This decision does not introduce `Prosjekter/`, `Bibliotek/`, `Applikasjoner/`, `.sidekick/content-index.yml`, or context views yet.
- Existing user folders are not migrated by this decision.

## Related

Related decisions:
- `0004-project-folder-structure.md`

Related tasks:
- `../tasks/TASK-0036-create-workspace-instead-of-project.md`
- `../tasks/TASK-0035-read-only-context-views.md`
