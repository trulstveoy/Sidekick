# Decision: Project Folder Structure

Status: Superseded by `0005-workspace-creation-folder-structure.md`
Date: 2026-05-11

## Context

Sidekick needs a controlled workflow for creating new local project folders.

The first project-creation workflow should create a predictable folder structure that later workflows can rely on. The transcription import workflow also benefits from a known transcription folder.

## Decision

When Sidekick creates a new project, it creates one project root folder and these required subfolders:

- `00. Forutsetninger`
- `01. Transkripsjoner`

The user chooses a parent folder and enters a project name. Sidekick creates the project root inside the selected parent folder.

If the target project folder already exists, Sidekick stops and reports a clear error. Initializing an existing folder as a project is a separate future workflow.

## Consequences

- Project creation is a filesystem-write workflow and must stay in the Electron main process.
- The renderer receives only a typed project-creation API, not raw filesystem access.
- Folder names are product contract values and should be centralized in code.
- Later project workflows can rely on these required folders after project creation.
- Converting an existing folder into this structure requires a separate task and safety review.

## Related

Superseded by:
- `0005-workspace-creation-folder-structure.md`

Related task:
- `../tasks/closed/TASK-0011-create-project-folder-structure.md`

Related backlog:
- `../tasks/BACKLOG.md` (`BL-0001`)
