# Task: Folder-Scoped Context Package

ID: TASK-0034
Status: Specified
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

## Open Points

- Should folder-scoped generation depend on `TASK-0033` being built first, or can the backend/API work be implemented before the navigation refresh?
- Should the output filename remove numeric prefixes exactly as transcript import does, or use a separate folder slug rule?
- Should Norwegian characters be preserved in filenames or normalized to ASCII slugs?
- Should an existing folder-scoped context package be overwritten after confirmation, or should Sidekick create the next available filename?
- Should generated context packages be excluded from all future context packages, or only the exact output file for the current operation?
- Should the selected folder's parent path be included in the package title/metadata so the package is identifiable outside the folder?
- Should the UI show folder-scoped package status in the right panel after generation?
- Should users be able to open the generated package from the success state?
- Should folder-scoped generation be allowed for the project root, or should the global full-project action remain the only root-level path?
- How should very large selected folders communicate skipped files or partial generation?

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
