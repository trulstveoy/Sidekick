# Task: Create Project Folder Structure

ID: TASK-0011
Status: Planned - Pending Human Approval
Class: Major
Owner: Pair
Created: 2026-05-11
Updated: 2026-05-11

## Summary

Add a controlled project-creation workflow.

When a new project is created, Sidekick should create one project folder and always create two required subfolders inside it:

- `00. Forutsetninger`
- `01. Transkripsjoner`

These folders are part of the project contract. They should exist immediately after project creation and should not depend on later scanning or import actions.

## Current Phase

Plan

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [ ] Human approval received, if required
- [ ] Build complete
- [ ] Verification complete
- [ ] Review complete
- [ ] Documentation complete
- [ ] Closeout complete

## Links

Related files:
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `src/renderer.ts`
- `src/main/folder-scanner.ts`
- `tests/integration`
- `tests/e2e`

Related tasks:
- `docs/tasks/closed/TASK-0001-inspect-local-folder.md`
- `docs/tasks/closed/TASK-0007-add-transcription-import.md`

Related backlog items:
- `docs/tasks/BACKLOG.md#items` (`BL-0001`)

Related workflows:
- `docs/workflows/agentic-development.md`

## Explore Notes

Current behavior:
- Sidekick can inspect an existing local folder selected by the user.
- Sidekick already has controlled file-write workflows, such as context package generation and transcription import.
- Existing write-capable workflows keep filesystem access in the main process and expose typed APIs through preload.

Relevant constraints:
- The renderer must not get direct filesystem access.
- Project creation must be a controlled main-process operation.
- The main process must validate user input before creating folders.
- Existing Electron security boundaries must stay unchanged.

Important product rule:
- A newly created project must always contain these subfolders:
  - `00. Forutsetninger`
  - `01. Transkripsjoner`

Resolved policy before build:
- Let the user choose a parent folder and enter a project name.
- Create the project folder under the chosen parent folder.
- If the project folder already exists, stop with a clear error.
- Create the two required subfolders inside the new project folder.
- After successful creation, select and scan the new project folder.

Deferred follow-up:
- Initializing an existing folder as a project is out of scope for this task.
- That follow-up is captured as `BL-0001` in `docs/tasks/BACKLOG.md`.

## Task Spec

Goal:
- Add a workflow for creating a new project with the required folder structure.

Primary outcome:
- A user can create a new project from Sidekick and immediately get a project folder containing the required subfolders.

Acceptance criteria:
- The user can start a "create project" workflow from the app.
- The user can provide or choose where the project should be created.
- The user can provide a project folder name if the workflow uses a parent-folder plus project-name model.
- Sidekick creates the project root folder.
- Sidekick creates `00. Forutsetninger` inside the project root folder.
- Sidekick creates `01. Transkripsjoner` inside the project root folder.
- Folder names must match exactly, including numbering, punctuation, spacing, and Norwegian characters.
- If the target project folder already exists, Sidekick stops and shows a clear error.
- Folder creation happens in the main process.
- Renderer code does not receive raw filesystem access.
- Main process validates the target path before creating folders.
- Path validation prevents empty names, path traversal, and creating outside the selected parent folder.
- If a required subfolder already exists during a retry or partial creation recovery, it is treated as already satisfied.
- Unexpected filesystem errors are shown to the user with clear messages.
- After successful project creation, Sidekick selects the new project folder and refreshes the folder scan.
- Tests cover successful creation, existing target-folder rejection, retry-safe required subfolder handling, invalid project names or paths, and error reporting.

Non-goals:
- Project templates beyond the two required subfolders.
- Editing project metadata.
- Moving or renaming existing projects.
- Deleting projects.
- Migrating existing folders into the new structure.
- Initializing an existing folder as a project.
- Multi-project workspace management.
- Cloud sync or remote project creation.

Constraints:
- Preserve Electron security settings: `contextIsolation`, `sandbox`, and `nodeIntegration: false`.
- Keep all filesystem writes in the main process.
- Expose only typed, task-specific APIs through preload.
- Do not expose raw `ipcRenderer`, filesystem, shell, process, or generic command execution to the renderer.
- Do not create folders without a clear user action.
- Do not silently overwrite files or folders.

Risks:
- Folder creation writes to the user's filesystem.
- Incorrect path validation could create folders in the wrong location.
- Existing folders may contain user data and must not be overwritten, reused, or deleted by this workflow.
- Packaged app behavior may differ across operating systems for folder selection and path permissions.

## Implementation Plan

### D1: Define Project Creation Contract

Purpose:
- Make the folder-creation behavior explicit in shared types and main-process helpers.

Expected output:
- A shared request/result type for project creation.
- A main-process helper that validates the requested parent folder and project name.
- A single source of truth for required subfolder names.

Steps:
1. Add project-creation types to `src/shared/sidekick-api.ts`.
2. Add a required-folder constant or helper in the main process.
3. Add validation rules for project name and target path.
4. Add unit or integration tests for validation.

Verification:
- `npm run check`
- Targeted tests for validation.

### D2: Implement Main-Process Folder Creation

Purpose:
- Create the project root and required subfolders safely.

Expected output:
- A main-process project creation function.
- IPC handler exposed through preload as a typed task-specific API.
- Tests for successful creation, existing target-folder rejection, and retry-safe required subfolder handling.

Steps:
1. Implement project root folder creation.
2. Implement required subfolder creation.
3. Reject an already existing target project folder with a clear error.
4. Treat already existing required subfolders as success only for retry or partial creation recovery.
5. Return the created project root path and created/existing folder status.
6. Add tests for success and expected filesystem edge cases.

Verification:
- `npm run check`
- `npm run test`

### D3: Add Renderer Workflow

Purpose:
- Let the user create a project without exposing filesystem details or raw commands.

Expected output:
- UI control for creating a project.
- User-facing states for idle, validating, creating, success, and error.
- Successful creation selects and scans the new project folder.

Steps:
1. Add a create-project action to the existing work surface.
2. Collect the required user input.
3. Call the typed preload API.
4. Show clear success and error messages.
5. Refresh the folder scan after successful creation.

Verification:
- `npm run check`
- `npm run test`
- `npm run test:ui` when practical.

### D4: Closeout

Purpose:
- Record what was built, verified, and left open.

Expected output:
- Updated task build log, verification log, review notes, and closeout.
- Task moved to `docs/tasks/closed/` with `Status: Done` after closeout.

Verification:
- Final `npm run check`.

## Human Gates

Human approval is required before build because this task creates folders on the user's filesystem.

Additional approval should be requested before:
- changing the required folder names;
- adding more required folders;
- changing existing folder scanner behavior;
- creating project metadata files;
- overwriting, renaming, moving, or deleting existing folders.

## Verification Plan

Minimum verification before closeout:
- `npm run check`
- `npm run test`
- `npm run test:ui` when practical.

Focused verification:
- Project creation succeeds in an empty temporary parent folder.
- Required subfolders that already exist during retry or partial creation recovery are accepted.
- Existing target project folder is rejected.
- Invalid project names are rejected.
- Path traversal attempts are rejected.
- Filesystem errors are reported clearly.
- After successful creation, the new project is selected and scanned.

## Review Notes

Initial review judgment:
- The main risk is filesystem safety, not UI complexity.
- The folder names are part of the product contract and should be centralized in one place.
- Existing scanner and transcription-import behavior should not be changed unless implementation reveals a direct dependency.

## Documentation Notes

Expected documentation updates:
- Update this task as implementation progresses.
- Add user-facing documentation only if the project-creation workflow needs explanation outside the UI.
- Add a decision record only if the project folder contract becomes a broader durable product policy.

## Build Log

Pending.

## Verification Log

Pending.

## Closeout

Pending.
