# Task: Create Workspace Instead Of Project

ID: TASK-0036
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-14
Updated: 2026-05-14
Branch: task/TASK-0036-create-workspace-instead-of-project
Worktree: ../Sidekick-worktrees/TASK-0036-create-workspace-instead-of-project
Base branch: origin/main
Write scope:
- `src/main/workspace-creator.ts`
- `src/main/workspace-initializer.ts`
- `src/main/workspace-info.ts`
- `src/main/workspace-summary.ts`
- `src/main/folder-scanner.ts`
- `src/main/context-package.ts`
- `src/main/document-relationships.ts`
- `src/main/transcription-importer.ts`
- `src/main/transcription-summary-batch.ts`
- `src/shared/sidekick-api.ts`
- `src/main.ts`
- `src/preload.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/integration/workspace-creator.test.ts`
- `tests/integration/workspace-initializer.test.ts`
- `tests/integration/workspace-summary.test.ts`
- `tests/unit/workspace-info.test.ts`
- `tests/unit/workspace-summary.test.ts`
- `tests/e2e/renderer-smoke.spec.ts`
- `docs/decisions/0004-project-folder-structure.md`
- `docs/decisions/0005-workspace-creation-folder-structure.md`
- `docs/tasks/closed/TASK-0036-create-workspace-instead-of-project.md`
- `docs/tasks/TASK-0035-read-only-context-views.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0011-create-project-folder-structure.md`
- `closed/TASK-0027-initialize-existing-folder-as-project.md`
- `TASK-0035-read-only-context-views.md` only as background context; this task unblocks its later planning
Coordinates with:
- `TASK-0031-local-searchable-project-index.md`
- `BACKLOG.md` (`BL-0008`)

## Summary

Change Sidekick's creation workflow and internal workspace-root naming from "project folder" to "workspace".

Today, the creation dialog says Sidekick creates a project folder with these folders:

```text
<Project>/
  00. Forutsetninger/
  01. Transkripsjoner/
```

That is no longer the right product concept. Sidekick should create an arbeidsområde with this first workspace structure:

```text
<Arbeidsområde>/
  00. Forutsetninger/
  01. Notater/
  02. Transkripsjoner/
```

The first implementation changed the creation workflow. Human review then clarified that internal code names should also stop using `project` where the concept is the Sidekick workspace root. The task therefore also renames the relevant TypeScript types, IPC channels, preload API methods, main-process modules, renderer variables, tests, and fixtures to `workspace`.

This task still does not implement full workspace metadata, `Prosjekter/`, `Bibliotek/`, `Applikasjoner/`, or context-view navigation.

## Current Phase

Close

Specification, planning, build, verification, human review, documentation, and closeout are complete.

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
- [x] Closeout complete

## Links

Related docs:
- `../architecture/kontekstbasert-innholdsmodell.md`
- `../decisions/0004-project-folder-structure.md`
- `../decisions/0005-workspace-creation-folder-structure.md`
- `TASK-0035-read-only-context-views.md`

Related tasks:
- `closed/TASK-0011-create-project-folder-structure.md`
- `closed/TASK-0027-initialize-existing-folder-as-project.md`
- `TASK-0035-read-only-context-views.md`

## Explore Notes

Original implementation:

- `src/main/project-creator.ts` created one root folder and required folders.
- Required folders are currently:
  - `00. Forutsetninger`
  - `01. Transkripsjoner`
- `src/main/project-initializer.ts` reused the same required-folder logic.
- `index.html` and `src/renderer.ts` use project creation language:
  - `Opprett ny prosjektmappe`
  - `Prosjektnavn`
  - `En ny mappe opprettes med standard undermapper for Sidekick-prosjekter.`
  - `En tom prosjektmappe og undermappene ... opprettes på valgt sted.`
- E2E and integration tests assert the old folder names and project-copy.

Relevant product clarification:

- Sidekick should not describe this write operation as creating a project.
- The created root should be treated as an arbeidsområde in the creation flow.
- The immediate structure under the created root should be:
  - `00. Forutsetninger`
  - `01. Notater`
  - `02. Transkripsjoner`
- After the first build pass, the human clarified that internal names should also be changed: if code says `project` for this concept, it should become `workspace` or an equivalent workspace name.

## Task Spec

### Problem

Sidekick's creation workflow currently says it creates a project folder. It also creates only two required folders.

That conflicts with the direction of the context-based content model. The first object Sidekick creates should be an arbeidsområde, not a prosjekt. This is important because later context views, shared content, and metadata need a workspace-level root.

### Goal

Update the creation workflow so the user creates an arbeidsområde with the agreed first workspace folders:

```text
00. Forutsetninger/
01. Notater/
02. Transkripsjoner/
```

The change should be visible in filesystem behavior, UI text, IPC/API names, module names, shared types, renderer state names, tests, and fixtures.

### Scope

- Change required created folders to:
  - `00. Forutsetninger`
  - `01. Notater`
  - `02. Transkripsjoner`
- Update creation dialog labels and copy:
  - `Opprett ny prosjektmappe` -> `Opprett nytt arbeidsområde`
  - `Prosjektnavn` -> `Arbeidsområdenavn`
  - project-folder copy -> workspace copy
  - creation status/error text where it belongs to this workflow
- Update validation text tied to the create workflow, for example required name and invalid path/name copy.
- Rename backend type names, IPC channels, preload API methods, renderer variables, tests, and fixtures where `project` referred to the Sidekick workspace root.
- Keep the selected root scan behavior after creation.
- Rename the existing-folder initialization workflow to workspace initialization and reuse the new required-folder contract.
- Update tests that assert created folders and creation UI text.
- Update `TASK-0035` so its blocker references this concrete task instead of a generic future task.

### Non-goals

- Do not implement full workspace setup with `Prosjekter/`, `Bibliotek/`, `Applikasjoner/`, or `.sidekick/content-index.yml`.
- Do not add context views.
- Do not change context-package generation.
- Do not change import behavior except where folder numbering affects transcriptions.
- Do not create workspace metadata files.
- Do not migrate existing user folders.

### User Workflow

1. User chooses to create a new workspace.
2. Sidekick asks for workspace name and parent location.
3. Sidekick previews the folders it will create:
   - `00. Forutsetninger`
   - `01. Notater`
   - `02. Transkripsjoner`
4. User confirms.
5. Sidekick creates the workspace root and required folders.
6. Sidekick selects and scans the created workspace root.
7. The folder tree shows the three workspace folders.

### UI Requirements

- Creation dialog should use `arbeidsområde`, not `prosjektmappe`.
- The name field should be `Arbeidsområdenavn`.
- The explanatory text should say that Sidekick creates a workspace with standard folders.
- The preview text should list all three folders.
- Existing "choose/open project folder" language should move to `arbeidsområde` where it refers to the selected Sidekick root.

### Security Requirements

- Preserve the existing parent-path selection guard.
- Keep root creation limited to one direct child of the chosen parent folder.
- Continue rejecting path traversal, absolute paths, empty names, and names containing path separators or null bytes.
- Do not expose new filesystem capabilities to the renderer.
- Keep all filesystem writes in the main process.

### Acceptance Criteria

- [x] Creating a new workspace creates exactly these required folders:
  - `00. Forutsetninger`
  - `01. Notater`
  - `02. Transkripsjoner`
- [x] The creation dialog says `Opprett nytt arbeidsområde`.
- [x] The name field says `Arbeidsområdenavn`.
- [x] The preview copy describes an arbeidsområde, not a prosjektmappe.
- [x] The created workspace is selected and scanned after creation.
- [x] Existing validation still rejects unsafe names and paths.
- [x] Existing initialization behavior is updated consistently with the new required folder contract.
- [x] Tests cover the new folder contract and visible creation copy.
- [x] `TASK-0035` names this task as the blocker for context-view planning.
- [x] Internal code names use `workspace` instead of `project` where they refer to the Sidekick workspace root.
- [x] `rg` finds no remaining `project`/`prosjekt` references in `src`, `index.html`, `tests`, or `package.json`.

## Open Points For Future Planning

- Resolved in this task: internal TypeScript names, IPC names, preload API names, renderer names, tests, and fixtures now use workspace names for this concept.
- Resolved in this task: the existing-folder initialization workflow now uses workspace language.
- Resolved in this task: top-level app copy now says `arbeidsområde` where it refers to the selected Sidekick root.
- Should transcription import rely on folder signal detection only, or should it explicitly know that transcriptions now live in `02. Transkripsjoner`?
- Resolved in this task: a decision record was added for the first workspace folder contract.

## Implementation Plan

Approved by user request: "planlegg og build".

Plan:

1. Change the required folder contract to:
   - `00. Forutsetninger`
   - `01. Notater`
   - `02. Transkripsjoner`
2. Update creation, selected-root, and initialization UI from project-folder language to workspace language.
3. Rename internal Sidekick workspace-root concepts from project to workspace:
   - module names
   - shared types
   - IPC channels
   - preload API
   - renderer variables and selectors
   - tests and fixtures
4. Keep context views and the larger hybrid content model out of this task.
5. Update integration and e2e tests that assert the old required folders or old visible copy.
6. Run `npm run check`, unit/integration tests, renderer smoke tests, and a source search for remaining project/prosjekt names in code.

## Build Log

2026-05-14: Build started in the main working tree because existing task and architecture documents are already being edited there.

2026-05-14: Updated required folder contract from:

```text
00. Forutsetninger
01. Transkripsjoner
```

to:

```text
00. Forutsetninger
01. Notater
02. Transkripsjoner
```

2026-05-14: Updated creation dialog copy from project-folder language to workspace language:

- `Opprett nytt arbeidsområde`
- `Arbeidsområdenavn`
- `Opprett arbeidsområde`
- workspace preview listing all three required folders.

2026-05-14: Updated project initialization to reuse the new required folder contract and detect note-like similar folder names.

2026-05-14: Updated integration and renderer smoke tests for the new folder contract and visible creation copy.

2026-05-14: Updated `TASK-0035` to name this task as its concrete blocker.

2026-05-14: Added `docs/decisions/0005-workspace-creation-folder-structure.md` and marked `docs/decisions/0004-project-folder-structure.md` as superseded.

2026-05-14: After human review, expanded the task from visible creation copy to internal naming as well. Renamed workspace-root concepts across source and tests:

- `project-creator.ts` -> `workspace-creator.ts`
- `project-initializer.ts` -> `workspace-initializer.ts`
- `project-info.ts` -> `workspace-info.ts`
- `project-summary.ts` -> `workspace-summary.ts`
- `project-summary.nb.ts` -> `workspace-summary.nb.ts`
- `Project*` shared types and renderer/main imports -> `Workspace*`
- `project-folder` IPC/preload naming -> `workspace`
- `project-folder-basic` fixture -> `workspace-basic`

2026-05-14: Updated visible app shell copy that referred to the selected root, for example `Ingen prosjektmappe valgt`, `Velg en prosjektmappe`, and `Prosjektoversikt`, to workspace language.

## Verification Log

- `npm run check` passed: ESLint and TypeScript typecheck.
- `npm run test` passed: 23 unit/integration test files, 100 tests.
- `npm run test:ui -- tests/e2e/renderer-smoke.spec.ts` passed: 30 UI tests.
- `rg -n "\bproject[A-Z]|\bProject[A-Z]|\bproject\b|\bProject\b|prosjekt|Prosjekt" src index.html tests package.json` returned no matches.

## Review Notes

Human review accepted on 2026-05-14.

Review focus:

- Confirm the creation and selected-root workflows now consistently say `arbeidsområde`.
- Confirm internal `workspace` naming is the right term for this root-level concept.
- Confirm the old decision record being superseded by the new workspace decision is acceptable.

Manual verification instructions:

1. Start the app from the main working tree:

   ```text
   cd /home/trutve/code/Sidekick
   npm start
   ```

2. In the first screen, click `Opprett nytt arbeidsområde...`.
3. Verify the dialog title is `Opprett nytt arbeidsområde`.
4. Verify the name field label is `Arbeidsområdenavn`.
5. Enter a test name, for example `test-arbeidsomrade`.
6. Click `Velg...` and choose a temporary parent folder where it is safe to create a test folder.
7. Verify the preview shows the target path and these folders:
   - `00. Forutsetninger`
   - `01. Notater`
   - `02. Transkripsjoner`
8. Click `Opprett arbeidsområde`.
9. Verify the app selects the new root and the folder tree contains:
   - `00. Forutsetninger`
   - `01. Notater`
   - `02. Transkripsjoner`
10. Verify on disk that the same folders were actually created under the workspace root.
11. Optional validation check: open the create dialog again, enter `../outside`, and verify the app shows `Arbeidsområdenavnet må være et mappenavn, ikke en sti.` and keeps `Opprett arbeidsområde` disabled.

Expected result:

- The creation workflow uses arbeidsområde language.
- The selected-root shell uses arbeidsområde language.
- No `01. Transkripsjoner` folder is created by the new workflow.
- `02. Transkripsjoner` is the transcription folder in newly created workspaces.
- Source code and tests no longer use `project`/`prosjekt` for the Sidekick workspace-root concept.

## Documentation Notes

- Added decision record `docs/decisions/0005-workspace-creation-folder-structure.md`.
- Marked `docs/decisions/0004-project-folder-structure.md` as superseded.
- Updated this task record and the blocker reference in `TASK-0035`.

## Closeout

TASK-0036 changed Sidekick's root creation concept from project folder to workspace.

Final behavior:

- New root creation is `Opprett nytt arbeidsområde`.
- Newly created workspaces contain:
  - `00. Forutsetninger`
  - `01. Notater`
  - `02. Transkripsjoner`
- Existing-folder initialization uses the same required workspace folders.
- The selected-root shell uses `arbeidsområde` language.
- Main-process modules, shared types, IPC channels, preload API, renderer state, tests, and fixtures use workspace naming where the concept is the Sidekick workspace root.

Final verification:

- `npm run check` passed.
- `npm run test` passed: 23 unit/integration test files, 100 tests.
- `npm run test:ui -- tests/e2e/renderer-smoke.spec.ts` passed: 30 UI tests.
- Source search found no remaining `project`/`prosjekt` references in `src`, `index.html`, `tests`, or `package.json`.

Integration:

- Ready to commit and merge into `main` when requested.
