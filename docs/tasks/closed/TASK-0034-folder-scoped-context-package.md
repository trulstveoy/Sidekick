# Task: Folder-Scoped Context Package

ID: TASK-0034
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-13
Updated: 2026-05-13
Branch: task/TASK-0034-folder-scoped-context-package
Worktree: ../Sidekick-worktrees/TASK-0034-folder-scoped-context-package
Base branch: origin/main
Write scope:
- `src/main/context-package.ts`
- `src/main/repomix-runner.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0034-folder-scoped-context-package.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0004-context-package-workflow.md`
- `closed/TASK-0020-context-package-workflow-refresh.md`
- `closed/TASK-0033-revised-navigation-model.md`
Coordinates with:
- `TASK-0030-generate-thematic-context-packages.md`

## Summary

Add a contextual action that generates a context package for the selected folder instead of the whole project.

The generated Markdown file should be stored in the selected folder and should include only that folder's contents, while preserving the current Repomix-based output structure and Sidekick's write-operation preview pattern.

## Current Phase

Close

Build, verification, human review, and closeout are complete.

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
- `../architecture/revidert-navigasjonsmodell.html`
- `../architecture/desktop-design-guidelines.md`

Related tasks:
- `closed/TASK-0033-revised-navigation-model.md`
- `TASK-0030-generate-thematic-context-packages.md`

## Explore Notes

Current behavior:

- Sidekick can generate one full-project context package.
- The full-project package is written to the selected project root.
- The filename is based on the project folder name.
- The generated file ignores itself on repeated generation.
- Generation uses Repomix output structure and security checks.
- The current GUI already has preview, confirmation, generation, success, and error states for full-project context generation.

The revised navigation model introduces a new contextual action:

- When a folder is selected, the right context panel may offer `Generer kontekstpakke for denne mappen`.
- The action applies to the selected folder only.
- The generated file is written into the selected folder, not the project root.
- The workflow still appears as a write operation with preview and confirmation.

This is a functional change, not just a GUI placement change. It affects filesystem write behavior, context-package scoping, output naming, self-ignore rules, and tests.

## Task Spec

### Problem

Users sometimes need context for one part of a project rather than the whole project.

The current context-package workflow only creates a package for the full selected project root. For projects with many folders and mixed material, this can produce too much context and make it harder to work with focused material such as a transcription folder, architecture folder, or background folder.

### Goal

Let the user generate a context package for the currently selected folder.

The user should understand:

- which folder is being packaged;
- where the generated file will be written;
- what filename will be used;
- whether an existing folder-scoped package will be replaced;
- that the operation writes to disk.

### Scope

- Add a context-package mode that targets a selected folder inside the active project.
- Offer the action from selected-folder context, not as a global action.
- Preview the folder-scoped package before writing.
- Generate the package as Markdown using the existing Repomix-based structure.
- Store the generated package in the selected folder.
- Include only files under the selected folder.
- Exclude the generated folder-scoped context package itself if it already exists.
- Preserve the existing full-project context-package workflow.
- Report result details such as output path, included files, skipped files, token count, character count, output size, and warnings when available.
- Rescan or refresh project information after successful generation so the new file appears in the tree.
- Add tests for path safety, output naming, self-ignore behavior, preview behavior, write behavior, and UI flow.

### Non-goals

- Do not replace the full-project context-package workflow.
- Do not generate thematic or query-based packages. That belongs to `TASK-0030`.
- Do not require Codex.
- Do not summarize the package.
- Do not add search or semantic file selection.
- Do not package files outside the selected project root.
- Do not allow arbitrary output locations.
- Do not add folder-scoped packages for files; this action applies to folders only.
- Do not add batch generation for multiple folders.

### User Workflow

1. User selects a folder in the folder tree.
2. Right context panel shows folder metadata and a contextual action for generating a context package for that folder.
3. User starts the contextual action.
4. Sidekick shows a preview workflow:
   - selected folder;
   - output filename;
   - output location;
   - included scope;
   - replacement status;
   - warnings.
5. User confirms generation.
6. Sidekick generates the Markdown context package for the selected folder.
7. Sidekick reports success or failure.
8. Sidekick refreshes the project scan so the generated file appears in the selected folder.

### Naming Recommendation

Use the selected folder name as the basis for the filename and append `.context-package.md`.

Recommended first-version normalization:

- remove a leading numeric folder prefix such as `01. `;
- normalize whitespace to hyphens or a stable slug;
- use lowercase for the generated base name;
- keep Norwegian letters only if the existing filename rules already handle them safely;
- append `.context-package.md`.

Example:

```text
01. Transkripsjoner/
  -> transkripsjoner.context-package.md
```

Final filename rules should be confirmed during planning.

### Security Requirements

- Validate that the selected folder is inside the active project root.
- Validate that the output path remains inside the selected folder.
- Do not accept renderer-provided absolute output paths.
- Keep filesystem reads and writes in the main process.
- Keep Repomix invocation constrained to the selected folder.
- Exclude `.git`, `node_modules`, build output, `.sidekick`, generated context packages, and the current output file.
- Preserve Repomix security checks.
- Do not expose raw filesystem, shell, process, or IPC APIs to the renderer.

### Acceptance Criteria

- [ ] User can select a folder and start `Generer kontekstpakke for denne mappen` from folder context.
- [ ] Action is not shown for files.
- [ ] Preview clearly shows selected folder, output filename, output location, replacement status, and write warning.
- [ ] Generated package is written inside the selected folder.
- [ ] Generated package includes only files under the selected folder.
- [ ] Repeated generation does not recursively include the previous folder-scoped context package.
- [ ] Full-project context-package generation still works as before.
- [ ] Path validation rejects folders outside the selected project root.
- [ ] UI reports success with the resulting output path and relevant generation stats.
- [ ] UI reports actionable errors when preview or generation fails.
- [ ] Project tree refreshes after success and shows the generated package.
- [ ] Tests cover preview, generation, self-ignore, path safety, existing output replacement status, and GUI behavior.

## Resolved Planning Decisions

- `TASK-0033` is complete, so this task builds on the revised navigation model where workflows run in the primary workspace and the right context panel stays stable.
- Folder-scoped generation uses a separate folder filename rule: remove a leading numeric folder prefix, normalize whitespace to hyphens, lowercase the base name, preserve Norwegian letters, replace Windows-unsafe characters with hyphens, trim unsafe trailing characters, and fall back to `folder.context-package.md`.
- Existing folder-scoped context packages are overwritten after explicit confirmation, matching the current full-project context-package behavior.
- Generated context packages remain excluded from all context-package generation, not only the exact current output file. This means a folder-scoped package must also ignore context packages already generated in its subfolders. This preserves the current self-ignore safety rule and prevents recursive package growth.
- The generated Markdown should preserve the Repomix output structure. Do not inject custom parent-path metadata into the Markdown in this task; show scope and relative folder path in the UI preview/result instead.
- The right context panel should not receive a separate persistent folder-package status in this task. The generated file should appear in the refreshed tree, and the selected folder context should show updated counts.
- Do not add an open-file action from the success state.
- Folder-scoped generation is not offered for the project root. The global full-project action remains the root-level path.
- Large-folder behavior uses the existing skipped-file, warning, token, character, and output-size result details. Do not add a new partial-generation model in this task.

## Implementation Plan

Files or areas:

- `src/main/context-package.ts`
- `src/main/repomix-runner.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0034-folder-scoped-context-package.md`

Build setup:

1. Before build, create or reuse `../Sidekick-worktrees/TASK-0034-folder-scoped-context-package` from the latest intended integration base.
2. Use `origin/main` as the base if it still includes all committed planning work. If local `main` has required unpushed commits, push them first or explicitly record local `main` as the base.
3. Do not absorb unrelated local changes such as backlog edits or unrelated architecture documents into this task.
4. Run a baseline check from the task worktree when practical.

Steps:

1. Backend scope model and filename helpers
   - Add a folder-scoped context-package request model that accepts project root plus selected folder relative path.
   - Keep the existing full-project preview/generate functions working.
   - Add helper functions for folder-scoped filenames and output paths.
   - Add path validation that rejects absolute folder paths, `..` traversal, project-root-as-folder-scope, non-directory targets, and targets outside the selected project root.

2. Repomix generation behavior
   - Reuse the existing Repomix runner with the selected folder as the pack root.
   - Write the generated file to the selected folder.
   - Keep Markdown output, current Repomix security checks, and current generated-package ignore patterns.
   - Exclude every generated context package below the selected folder, including context packages in nested subfolders.
   - Scan the full project root after successful generation so the refreshed tree includes the new file.

3. Typed API and IPC
   - Extend `ContextPackagePreview` and `ContextPackageResult` with scope information needed by the renderer, such as `scope`, target folder path, and target folder relative path.
   - Add typed preload/main APIs for folder preview and folder generation.
   - Keep renderer requests narrow: pass project root and selected folder relative path only, never an absolute output path.

4. Context-panel action
   - Show `Generer kontekstpakke for denne mappen` only when a non-root folder is selected.
   - Do not show the action for files or project root.
   - Disable the contextual action while an exclusive workflow is active.
   - Start the existing context-package workflow in the primary workspace when the contextual action is clicked.

5. Shared workflow rendering
   - Reuse the current context-package workflow surface for both full-project and folder-scoped packages.
   - Adapt title, message, details, write warning, generating state, and result copy based on scope.
   - Preview must show selected folder, output filename, output location, replacement status, and write warning.
   - Full-project generation must continue to show project-root wording and must still update the full-project context-package status.

6. Refresh and selection behavior
   - After folder-scoped generation succeeds, update application state with the returned scan.
   - Preserve the selected folder when it still exists.
   - Expand the selected folder and its ancestors so the generated file is visible in the tree after success.
   - Do not change full-project context-package status when only a folder-scoped package was generated.

7. Tests
   - Add unit tests for folder filename normalization and output path helpers.
   - Add integration tests for folder preview, overwrite detection, generation, self-ignore, nested context-package exclusion, sibling-folder exclusion, and path safety.
   - Add UI smoke tests for contextual action visibility, folder preview, folder generation success, tree refresh, action absence for files/root, and full-project regression.
   - Keep existing full-project context-package tests passing.

8. Documentation and closeout
   - Update this task record with build notes, verification results, review notes, and closeout.
   - No new decision record is expected unless implementation reveals a durable architecture/security decision beyond this plan.

Suggested build checkpoints:

1. Commit backend/API helpers and unit/integration tests.
2. Commit renderer UI and UI smoke tests.
3. Commit task-record closeout after verification and review.

Verification:

- `npm run check`
- `npm test`
- `npm run test:ui`
- Manual verification with `npm start`:
  - select a non-root folder;
  - confirm the right panel shows `Generer kontekstpakke for denne mappen`;
  - preview the folder-scoped package and verify folder, filename, location, overwrite status, and write warning;
  - generate the package and verify the Markdown file appears inside the selected folder in the tree;
  - confirm the global `Generer kontekstpakke` action still generates a package in the project root;
  - select a file and the project root and confirm the folder-scoped action is not shown.

Security and risk review:

- Validate folder scope in the main process before reading or writing.
- Do not trust renderer-provided output paths.
- Keep filesystem writes behind typed preload/main APIs.
- Confirm path checks work on Windows-style and POSIX-style separators where practical.
- Preserve Repomix security checks and generated-package ignore behavior.
- Ensure folder-scoped generation cannot package files outside the selected project root.

Docs:

- `docs/architecture/desktop-design-guidelines.md` already contains the design rule for folder-scoped context packages.
- This task record is the only documentation expected during build unless behavior changes.

Human gates:

- Required.
- Approval status: Approved.

## Build Log

- Created worktree `../Sidekick-worktrees/TASK-0034-folder-scoped-context-package` from updated `origin/main`.
- Installed dependencies in the worktree because the new worktree did not have `node_modules`.
- Added backend support for folder-scoped context-package preview and generation:
  - validates selected folder relative paths in the main process;
  - rejects root, absolute paths, traversal, and folders outside the selected project root;
  - writes folder packages into the selected folder;
  - scans the full project after generation.
- Tightened generated-package ignore patterns so both full-project and folder-scoped generation ignore context packages in nested subfolders.
- Added typed preload/main APIs for folder-scoped preview and generation.
- Added contextual folder action in the right context panel for non-root folders only.
- Reused the existing context-package workflow surface for both project and folder scopes.
- Preserved full-project context-package behavior and status handling.
- Added UI behavior to keep the selected folder visible and expanded after folder-scoped generation.
- Fixed runtime visibility for the folder contextual action when Electron/Vite serves a stale shell HTML without the dedicated `data-selection-actions` container. The renderer now falls back to rendering the action inside the existing selection content area.
- Commit checkpoints:
  - `da868c3 feat: add folder-scoped context package backend`
  - `d17b43b feat: add folder-scoped context package UI`
  - `5feca29 fix: show folder context action with stale shell html`

## Verification Log

- Baseline:
  - Initial `npm run check` failed before install because the new worktree lacked `node_modules`.
  - `npm install` completed in the worktree.
  - Baseline `npm run check` passed after dependency install.
- Targeted backend verification:
  - `npm test -- tests/unit/context-package.test.ts tests/integration/context-package.test.ts` initially failed because nested generated context packages were not ignored.
  - Added recursive context-package ignore patterns.
  - `npm test -- tests/unit/context-package.test.ts tests/integration/context-package.test.ts` passed.
- Full verification:
  - `npm run check` passed.
  - `npm test` passed: 16 test files, 69 tests.
  - First `npm run test:ui` used a stale existing Vite server on port 5173 and failed to see the new HTML.
  - Stopped the stale Vite server and reran UI tests.
  - `npm run test:ui` passed: 27 UI tests.
- Follow-up fix verification:
  - `npm run check` passed.
  - `npm run test:ui -- --grep "folder-scoped context package"` passed: 2 UI tests.

## Review Notes

Human review completed. The folder-scoped context-package action was tested manually and accepted after the runtime visibility fix.

Suggested manual verification:

1. Start the app from this worktree:
   ```text
   cd /home/trutve/code/Sidekick-worktrees/TASK-0034-folder-scoped-context-package
   npm start
   ```
2. Select a project folder that has at least one subfolder with files.
3. Select a non-root folder in the tree.
4. Confirm the right panel shows `Generer kontekstpakke for denne mappen`.
5. Click it and verify the context-package workflow opens in the middle panel while the right panel stays on the selected folder.
6. Preview the package and verify:
   - selected folder is shown as scope;
   - output filename is based on the folder name;
   - output location is the selected folder;
   - overwrite status is shown;
   - write warning is shown.
7. Generate the package and verify the new `.context-package.md` file appears inside the selected folder in the tree after success.
8. Generate a package for a parent folder that contains a subfolder with its own `.context-package.md` file. Verify the subfolder package is not included in the generated output.
9. Select a file and the project root. Confirm the folder-scoped action is not shown.
10. Use the global `Generer kontekstpakke` action and confirm it still writes to the project root.

## Documentation Notes

- `docs/architecture/desktop-design-guidelines.md` already contains the design rule for folder-scoped context packages.
- This task record was updated with build, verification, and review instructions.

## Closeout

TASK-0034 added folder-scoped context packages without replacing the existing full-project workflow.

Final behavior:

- A non-root folder selection exposes `Generer kontekstpakke for denne mappen`.
- The workflow runs in the primary workspace.
- The right context panel remains tied to the selected folder.
- Folder-scoped packages are written into the selected folder.
- Full-project packages still write to the project root.
- Generated context packages are ignored by both full-project and folder-scoped generation, including generated packages in nested subfolders.
- The project tree refreshes after success so the generated file appears.

Final verification:

- `npm run check` passed.
- `npm test` passed: 16 test files, 69 tests.
- `npm run test:ui` passed: 27 UI tests.
- Follow-up visibility fix: `npm run test:ui -- --grep "folder-scoped context package"` passed: 2 UI tests.

Integration:

- Ready to merge from `task/TASK-0034-folder-scoped-context-package` into `main`.
