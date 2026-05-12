# Task: Initialize Existing Folder As Project

ID: TASK-0027
Status: Ready For Review
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0027-initialize-existing-folder-as-project
Worktree: ../Sidekick-worktrees/TASK-0027-initialize-existing-folder-as-project
Base branch: origin/main
Write scope:
- `src/main/project-creator.ts`
- `src/main/folder-scanner.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0027-initialize-existing-folder-as-project.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0011-create-project-folder-structure.md`
- `closed/TASK-0012-strict-numbering-format.md`
- `closed/TASK-0016-project-entry-creation-refresh.md`
Coordinates with:
- `TASK-0025-project-summary-from-context.md`
- `TASK-0026-transcription-summary-on-import.md`

## Summary

Allow the user to initialize an existing folder as a Sidekick project.

Initialization means Sidekick keeps the selected folder as the project root, creates any missing required project subfolders, preserves all existing content, and then selects/scans the folder.

## Current Phase

Ready For Review

Build and verification are complete. The task is ready for human review.

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [x] Worktree created or reused, if required
- [x] Human approval received, if required
- [x] Build complete
- [x] Verification complete
- [x] Review complete
- [x] Documentation complete
- [ ] Closeout complete

## Backlog Source

Promoted from `BL-0001`.

## Resolved Decisions

- Initialization always requires explicit confirmation, even if both required folders already exist.
- When both required folders already exist, confirmation should be lightweight and framed as choosing the folder as the active Sidekick project.
- This task should not create `.sidekick/`. Project metadata folders are created lazily by the features that need them.
- Sidekick should warn about similarly named folders, but must not treat them as satisfying the required-folder contract.
- If exact required folders are missing, Sidekick creates the exact required folders after confirmation.
- Initialization can be built on the existing project-entry flow because `TASK-0016` is closed.

## Task Spec

### Problem

Sidekick can create a new project folder with the required project structure, but cannot initialize a folder that already exists.

Users may already have project material in a folder and need Sidekick to make that folder conform to the project structure without moving or rewriting existing files.

### Goal

Add a controlled workflow for selecting an existing folder and initializing it as a Sidekick project.

### Required Project Folders

The initialized folder must contain:

```text
00. Forutsetninger/
01. Transkripsjoner/
```

Existing required folders are accepted as success. Missing required folders are created.

### Scope

- Add an "initialize existing folder" workflow.
- Let the user choose an existing folder as the project root.
- Preview initialization before writing:
  - selected root folder;
  - whether required folders already exist;
  - which required folders will be created;
  - whether the folder already contains other files/folders.
- Warn when similarly named folders exist, for example `1 Transcripts` or `01 Transkriberinger`.
- Require explicit user confirmation before creating missing folders.
- Create only the missing required folders.
- Preserve all existing files and folders.
- Select and scan the initialized project after success.
- Show clear success/error state.
- Use Norwegian user-facing copy.

### Non-goals

- Moving existing files into required folders.
- Renaming existing files or folders.
- Fixing existing transcription numbering.
- Creating optional folders.
- Importing/transcribing files.
- Creating summaries.
- Creating `.sidekick/` unless another approved task requires it.
- Validating full project quality.
- Migrating, renaming, or interpreting similarly named folders as required folders.

### User Workflow

1. User chooses "initialize existing folder".
2. Sidekick opens a native folder picker.
3. User selects an existing folder.
4. Sidekick previews required-folder status.
5. Sidekick shows warnings for similarly named folders, if any.
6. User confirms initialization.
7. Sidekick creates missing required folders.
8. Sidekick selects and scans the initialized project.

### Security Requirements

- Keep filesystem writes in the main process.
- Do not expose raw filesystem APIs to the renderer.
- Use typed preload APIs.
- Validate that the selected folder path is absolute and points to a directory.
- Do not delete, move, rename, or overwrite existing content.

### Acceptance Criteria

- [ ] User can select an existing folder for initialization.
- [ ] Preview shows existing and missing required folders.
- [ ] Preview warns about similarly named folders without treating them as valid required folders.
- [ ] User must explicitly confirm initialization before the folder becomes the active project.
- [ ] Existing required folders are treated as success.
- [ ] Missing required folders are created only after explicit confirmation.
- [ ] Existing non-required content is preserved.
- [ ] `.sidekick/` is not created by this workflow.
- [ ] Initialized folder is selected and scanned after success.
- [ ] Errors are shown for unreadable folders and write failures.
- [ ] Renderer receives no raw filesystem, shell, process, or IPC access.
- [ ] Tests cover already-initialized folder, missing required folders, non-empty folder, and write failure.

## Open Points

None blocking.

## Implementation Plan

Planning complete. Stop before Build until the task is explicitly approved.

Each delivery should be committed separately so the initialization workflow can be reviewed in small steps.

### Current Implementation Baseline

Existing code to reuse:
- `src/main/project-creator.ts` already defines `REQUIRED_PROJECT_FOLDERS` and `ensureRequiredProjectFolders`.
- `src/main.ts` already tracks `selectedProjectRoots` and `selectedProjectParentFolders`.
- `src/main.ts` already adds a project root after successful project creation and returns a fresh scan.
- `src/preload.ts` and `src/shared/sidekick-api.ts` already expose typed project creation APIs.
- `src/renderer.ts` already has a project-entry/create-project dialog and state flow.

Important design choice:
- Initialization should reuse the required-folder logic from project creation, but it should not call `createProjectFolder`, because the root folder already exists.

### Delivery 1: Initialization Domain Logic

Concrete output:
- Update `src/main/project-creator.ts`, or add `src/main/project-initializer.ts` if the implementation becomes clearer as a separate module.
- Add or update integration tests for initialization behavior.

What it does:
- Validates that the selected project root is an absolute path and an existing directory.
- Creates a preview for an existing folder.
- Reports exact required-folder status:
  - `existing`;
  - `missing`.
- Reports whether the folder has existing content.
- Detects similarly named folders as warnings, without treating them as valid required folders.
- Confirms initialization by creating only missing exact required folders.
- Returns final required-folder statuses:
  - `existing`;
  - `created`.
- Does not create `.sidekick/`.

Similar-folder warning guidance:
- Inspect direct child directories only in the first version.
- Warn for likely alternatives to required folders, for example names containing `transkrips`, `transkrib`, `transcript`, `forutset`, or `assumption`, when the exact required folder is missing.
- Warnings do not block initialization.
- Warnings do not rename, migrate, or reuse similar folders.

What later deliveries use:
- Delivery 2 exposes preview and confirm through typed main/preload APIs.
- Delivery 3 renders the preview and confirmation UI.

Suggested commit:
- `TASK-0027: Add existing project initialization logic`

Targeted verification:
- `npx vitest run tests/integration/project-creator.test.ts`

### Delivery 2: Typed IPC And Shared API

Concrete output:
- Update `src/shared/sidekick-api.ts`
- Update `src/preload.ts`
- Update `src/main.ts`

What it does:
- Adds shared types for initialization preview, warnings, and result.
- Adds a main-process native folder picker for initialization.
- Stores pending initialization previews by `previewId`.
- Requires confirmation by `previewId`; the renderer must not be able to pass arbitrary paths directly to confirmation.
- Revalidates the selected folder during confirmation before writing.
- Adds the initialized root to `selectedProjectRoots` only after explicit confirmation.
- Returns a fresh `ProjectFolderScan` after successful initialization.
- Deletes pending preview state after confirm/cancel/error where appropriate.

Suggested typed API shape:

```ts
export type ProjectInitializationFolderStatus = 'existing' | 'missing';

export type ProjectInitializationFolder = {
  name: RequiredProjectFolderName;
  path: string;
  status: ProjectInitializationFolderStatus;
};

export type ProjectInitializationWarning = {
  path: string;
  message: string;
};

export type ProjectInitializationPreview = {
  previewId: string;
  rootPath: string;
  rootName: string;
  requiredFolders: ProjectInitializationFolder[];
  existingEntryCount: number;
  warnings: ProjectInitializationWarning[];
};

export type ProjectInitializationResult = {
  status: 'complete';
  rootPath: string;
  rootName: string;
  requiredFolders: ProjectCreationFolder[];
  scan: ProjectFolderScan;
};
```

Suggested API methods:

```ts
chooseProjectFolderForInitialization: () => Promise<ProjectInitializationPreview | null>;
confirmProjectInitialization: (previewId: string) => Promise<ProjectInitializationResult>;
```

Security notes:
- Native folder choice happens in the main process.
- Confirmation accepts only a `previewId`.
- Main process revalidates before writing.
- No raw filesystem, shell, process, or IPC APIs are exposed.

What later deliveries use:
- Delivery 3 calls the typed APIs from the project-entry UI.

Suggested commit:
- `TASK-0027: Expose typed project initialization APIs`

Targeted verification:
- `npm run typecheck`
- targeted integration tests for confirm-by-preview-id behavior

### Delivery 3: Project Entry UI

Concrete output:
- Update `index.html`
- Update `src/renderer.ts`
- Update `src/index.css`

What it does:
- Adds an entry point for initializing an existing folder from the project-entry surface.
- Opens the native folder picker.
- Shows a preview before confirmation:
  - selected folder;
  - required folders that already exist;
  - required folders that will be created;
  - existing content count;
  - similar-folder warnings.
- Always requires explicit confirmation.
- Uses lighter confirmation copy when no folders need to be created:
  - the action means "use this folder as the active Sidekick project."
- Shows success and error state.
- After success, updates the active scan exactly like project creation does.
- Uses concise Norwegian user-facing copy.

UI behavior:
- Do not hide or weaken the existing "create new project" flow.
- Do not add long explanatory copy.
- Do not imply that Sidekick will move, rename, or migrate existing content.
- Do not create `.sidekick/` from the UI.

What later deliveries use:
- Delivery 4 adds smoke tests around the UI states.

Suggested commit:
- `TASK-0027: Add existing project initialization UI`

Targeted verification:
- `npm run test:ui`

### Delivery 4: Tests And Verification

Concrete output:
- Update unit/integration tests.
- Update `tests/e2e/renderer-smoke.spec.ts`.
- Update this task's Build Log and Verification Log during build.

What it does:
- Covers an already-initialized folder.
- Covers a folder missing both required folders.
- Covers a folder missing one required folder.
- Covers a non-empty folder with unrelated files.
- Covers similarly named folder warnings.
- Covers unreadable folder or write failure where practical.
- Covers confirm-by-preview-id behavior.
- Covers UI preview, cancel, confirm success, and error state.

Suggested commit:
- `TASK-0027: Verify existing project initialization`

Required verification before handoff:
- `npm run check`
- `npm run test`
- `npm run test:ui`

### Delivery 5: Closeout

Concrete output:
- Updated task Build Log, Verification Log, Review Notes, Documentation Notes, and Closeout.
- Move task to `docs/tasks/closed/` only after the task reaches `Done`.

What it does:
- Records exactly what changed.
- Records what verification passed.
- Records any remaining limitations.
- Confirms that no `.sidekick/` folder is created by initialization.
- Confirms that existing files are not moved, renamed, deleted, or overwritten.

Suggested commit:
- `TASK-0027: Document project initialization closeout`

## Planned Failure Behavior

- User cancels folder picker: no state change.
- Selected path is not a directory: show error, no preview.
- Required folder path exists as a file: confirmation fails with a clear error.
- Missing required folder cannot be created: show error, preserve existing content, do not mark project active unless initialization completes.
- Folder changes between preview and confirm: revalidate on confirm and use current filesystem state.
- Similar folders exist: show warnings, but allow confirmation.

## Planned Commit Boundaries

- Commit 1: initialization domain logic and direct tests.
- Commit 2: typed IPC/preload/shared API.
- Commit 3: UI workflow.
- Commit 4: tests and verification adjustments.
- Commit 5: task closeout documentation.

## Build Log

- 2026-05-12: Created task worktree at `../Sidekick-worktrees/TASK-0027-initialize-existing-folder-as-project` on branch `task/TASK-0027-initialize-existing-folder-as-project`.
- 2026-05-12: Installed worktree dependencies with `npm install` because the new worktree did not have `node_modules`; reverted incidental `package-lock.json` noise from installation.
- 2026-05-12: Added `src/main/project-initializer.ts` for previewing and confirming initialization of existing folders.
- 2026-05-12: Added typed initialization preview/result types and typed preload APIs.
- 2026-05-12: Added main-process IPC handlers:
  - `project-folder:choose-for-initialization`;
  - `project-folder:confirm-initialization`.
- 2026-05-12: Added project-entry UI for initialization preview, warnings, confirmation, cancel, success, and error states.
- 2026-05-12: Added integration tests for initialization domain behavior.
- 2026-05-12: Added UI smoke coverage for initializing an existing folder after preview confirmation.

## Verification Log

- 2026-05-12: Initial baseline `npm run check` failed before dependency install because `eslint` was not available in the fresh worktree.
- 2026-05-12: `npm run check` passed after dependency install.
- 2026-05-12: `npx vitest run tests/integration/project-initializer.test.ts` passed: 1 file, 5 tests.
- 2026-05-12: `npm run test -- tests/integration/project-initializer.test.ts tests/integration/project-creator.test.ts` passed: 16 files, 62 tests. Note: current npm script runs all configured unit/integration tests before the extra path args.
- 2026-05-12: `npm run test:ui` passed: 19 tests.
- 2026-05-12: `npm run package` passed for Linux x64 package.

## Review Notes

- Self-review complete.
- Confirmed initialization writes only missing exact required folders.
- Confirmed preview detects similarly named direct child folders as warnings only.
- Confirmed `.sidekick/` is not created by initialization.
- Confirmed renderer confirms by `previewId`; it does not send arbitrary paths back for the write operation.
- Residual product note: similar-folder heuristics are intentionally simple and tracked separately in `BL-0006`.

## Documentation Notes

- Task record updated with build and verification details.
- No separate architecture decision added. The implementation follows existing project creation and typed IPC patterns.

## Closeout

Not started.
