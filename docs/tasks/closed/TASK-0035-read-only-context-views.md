# Task: Read-Only Context Views

ID: TASK-0035
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-14
Updated: 2026-05-14
Branch: task/TASK-0035-read-only-context-views
Worktree: ../Sidekick-worktrees/TASK-0035-read-only-context-views
Base branch: origin/main
Write scope:
- `src/main/folder-scanner.ts`
- `src/shared/sidekick-api.ts`
- `src/shared/context-views.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0035-read-only-context-views.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0018-folder-hierarchy-artifact-detail.md`
- `closed/TASK-0033-revised-navigation-model.md`
- `closed/TASK-0036-create-workspace-instead-of-project.md`
- `closed/TASK-0037-folder-context-tagging.md`
Coordinates with:
- `TASK-0031-local-searchable-project-index.md`
- `BACKLOG.md` (`BL-0008`)

## Summary

Add the first read-only implementation slice of Sidekick's context-based content model.

The first build should let users switch between:

- `Mapper`: the current physical folder/file structure;
- `Prosjekter`: a derived project context view that groups files by folders explicitly tagged with `Prosjektmappe`.

This task should prove the context-view model in the product without implementing the full workspace, application, library, or artifact-to-context linking model.

## Current Phase

Close

Build and verification are complete. The user tested the feature and accepted it.

This task was blocked because Sidekick project creation did not create a workspace structure. `closed/TASK-0036-create-workspace-instead-of-project.md` resolved the first concrete blocker by changing creation from project folder to workspace and updating the first required workspace folders:

```text
<Arbeidsområde>/
  00. Forutsetninger/
  01. Notater/
  02. Transkripsjoner/
```

The specification has now been revisited against that workspace-creation decision.

The second blocker is also resolved. `closed/TASK-0037-folder-context-tagging.md` added explicit folder tags, `.sidekick-folder.json`, and the `Prosjektmappe` system-effect tag.

TASK-0035 should build against the metadata delivered by TASK-0037. It should not derive project contexts from folder names or fallback heuristics in the first build.

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
- `../architecture/kontekstvisninger-mapper-og-prosjekter.html`
- `../architecture/revidert-navigasjonsmodell.html`
- `../architecture/desktop-design-guidelines.md`

Related tasks:
- `closed/TASK-0018-folder-hierarchy-artifact-detail.md`
- `closed/TASK-0033-revised-navigation-model.md`
- `closed/TASK-0036-create-workspace-instead-of-project.md`
- `closed/TASK-0037-folder-context-tagging.md`
- `TASK-0031-local-searchable-project-index.md`

## Backlog Source

Related to `BL-0008`, but this task is only the first implementation slice. It does not complete the full project-independent content model.

## Explore Notes

Current baseline:

- Sidekick scans one selected workspace root and shows a physical file/folder tree.
- Sidekick now creates a workspace root with `<Arbeidsområde>/00. Forutsetninger/`, `<Arbeidsområde>/01. Notater/`, and `<Arbeidsområde>/02. Transkripsjoner/`.
- The revised navigation model already separates primary workspace workflows from the right context surface.
- The context surface can show selected folder/file details and contextual actions.
- Generated `.sidekick/` metadata is intended to stay out of normal scans and context packages.
- The new architecture document defines the concept as `Kontekstbasert innholdsmodell`.
- The HTML prototype `kontekstvisninger-mapper-og-prosjekter.html` shows two read-only context views over the same files:
  - `Mapper` for physical placement;
  - `Prosjekter` for project membership.
- The first implementation originally aimed to prove the read model and UI concept before adding editable metadata or full workspace setup.
- That scope was deferred until Sidekick's workspace creation model and folder metadata model were clarified.
- TASK-0036 resolved workspace creation by making Sidekick create an `arbeidsområde`.
- TASK-0037 resolved explicit folder classification by adding `.sidekick-folder.json` and `Prosjektmappe`.
- The first `Prosjekter` view should therefore use explicit `Prosjektmappe` metadata only.
- If no folder has `Prosjektmappe`, Sidekick should show an empty `Prosjekter` view rather than guessing.

## Task Spec

### Problem

Sidekick currently treats the selected folder tree as the primary way to understand project content.

That is simple and useful, but it does not show the key idea in the context-based content model: the same artifact can be physically stored in one place and still appear in one or more logical context views.

Users need a first read-only way to switch between physical folder structure and a project-oriented context view without duplicating files or introducing artifact-to-context linking.

### Goal

Add a read-only context-view surface that proves this model:

```text
artifact + context_view + context + view_reason
```

The renderer should show context views, but the membership and `view_reason` should be produced by main process or a shared deterministic domain model, not invented ad hoc in the renderer.

The first `Prosjekter` implementation should consume the folder metadata delivered by TASK-0037.

### Scope

- Keep the current physical tree as the `Mapper` context view.
- Add a `Prosjekter` context view in the primary workspace.
- Add an explicit view toggle for switching between physical and logical views:
  - `Mapper` = physical filesystem view;
  - `Prosjekter` = logical project context view.
- Keep the toggle state in renderer UI state, but derive the view contents from main/shared domain data.
- Derive first-version project contexts only from folders tagged with `Prosjektmappe`.
- Do not derive project contexts from top-level folder names, folder signals, or project-like heuristics.
- Do not include shared/library rows in the first build unless they are physically inside a tagged project folder.
- Treat artifact-to-context linking for shared/library files as a later task.
- Add a typed read model for context-view rows:
  - artifact identity;
  - physical path;
  - selected context view;
  - context id and label when applicable;
  - artifact type;
  - display label;
  - display group;
  - `view_reason`;
  - source kind such as physical project file.
- Update selection state so selecting a row carries:
  - selected artifact;
  - selected context view;
  - selected context id when applicable;
  - `view_reason`.
- Update the right context surface so it can explain:
  - physical location;
  - selected project context, when the row is shown in `Prosjekter`;
  - why the artifact is shown in the current view.
- Use Norwegian user-facing labels.
- Preserve existing folder/file selection behavior.
- Preserve existing workflows and contextual actions where they already make sense.
- Add tests for the context-view read model and UI switching.

### First-Version Derivation Rules

Planning may refine these rules, but the first build should stay deterministic and local:

- `Mapper` uses the existing folder scan structure.
- `Prosjekter` uses folders whose metadata contains a valid `Prosjektmappe` system tag with `systemEffect: project-root`.
- A tagged folder becomes one project context.
- Project context id and label should come from the folder metadata when available.
- Files physically inside a tagged project folder get `view_reason: physical-project-file`.
- The tagged project folder itself may get `view_reason: project-root-tag` or another explicit enum value chosen during planning.
- If the selected root itself is not taggable in v1, `Prosjekter` should show projects below the workspace root. It should not treat the workspace root as a project.
- If no valid `Prosjektmappe` metadata exists, `Prosjekter` should show an empty state explaining that project folders must be tagged.
- Files outside tagged project folders remain visible in `Mapper` but do not appear in `Prosjekter`.
- Corrupt, unsupported, or duplicate folder metadata must not create project contexts.
- `.sidekick/` must not become ordinary content in the context views.
- `.sidekick-folder.json` must not become ordinary content in the context views.

If these rules prove too broad during planning, planning should narrow the first build rather than reintroducing heuristics.

### Non-goals

- Do not implement full workspace setup.
- Do not implement `.sidekick/content-index.yml`.
- Do not add editable context links.
- Do not add new metadata editing beyond consuming the folder tags from TASK-0037.
- Do not add `Applikasjoner` as a visible context view in the first build.
- Do not add `Tema`, `Beslutninger`, people, process, or other context views.
- Do not infer projects from folder names.
- Do not infer shared/library links from folder names or scanner signals.
- Do not move or duplicate files.
- Do not change import behavior.
- Do not change context-package generation behavior except where the selected context state must remain compatible.
- Do not create a new search/index feature.
- Do not add cross-workspace or global library support.
- Do not require users to reorganize existing project folders.

### User Workflow

1. User opens a folder as today.
2. Sidekick shows the normal `Mapper` view by default.
3. User switches to `Prosjekter`.
4. Sidekick shows contexts for folders tagged with `Prosjektmappe`.
5. Each context groups rows by source:
   - project files physically inside the tagged folder.
6. User selects a file in either view.
7. The right context surface shows:
   - file details;
   - physical location;
   - selected project context when relevant;
   - why the file appears in the current context view.
8. User can switch back to `Mapper` without changing selection semantics or duplicating content.

### UI Requirements

- The context-view switch should be visible in the primary workspace, similar to the prototype's `Mapper` / `Prosjekter` toggle.
- Use a compact segmented control or tab-like control with two options:
  - `Mapper`
  - `Prosjekter`
- `Mapper` should be selected by default when a workspace opens.
- Switching views should not rescan or write files.
- Switching views should preserve the selected physical artifact when the same artifact exists in the target view.
- If the selected artifact does not exist in the target view, the target view should select the nearest sensible context:
  - first project context in `Prosjekter`;
  - workspace root in `Mapper`.
- The active view should be visually obvious and keyboard accessible.
- The URL/history model is not required; view state can be in renderer memory for this first build.
- `Mapper` should remain recognizable as the existing physical tree.
- `Prosjekter` should group files clearly by context and source.
- Physical project files should be visually distinguishable from empty project states and metadata warnings.
- The right context surface should explain `Vises her fordi`.
- The right context surface should show physical location even when the selected row comes from a logical view.
- Empty, unsupported, or ambiguous derived contexts should have clear compact states.
- User-facing text should be Norwegian.
- The UI should remain dense and work-surface oriented, not explanatory marketing copy.

### Security Requirements

- Keep filesystem scanning and context-view derivation in the main process or shared non-privileged domain code called by the main process.
- Do not expose raw filesystem, IPC, shell, process, or arbitrary path APIs to the renderer.
- Validate all artifact paths against the selected root.
- Do not let the renderer invent context membership for privileged operations.
- Do not let `context_view`, `context_id`, or `view_reason` become authority for filesystem writes.
- Preserve Electron security settings: no renderer `nodeIntegration`, keep `contextIsolation` and sandbox enabled.
- Treat context-view rows as read-only derived state.

### Acceptance Criteria

- [ ] `Mapper` remains available and preserves current physical tree behavior.
- [ ] `Prosjekter` is available as a read-only context view.
- [ ] The primary workspace has a keyboard-accessible `Mapper` / `Prosjekter` toggle.
- [ ] `Mapper` is selected by default when a workspace opens.
- [ ] Switching from `Mapper` to `Prosjekter` does not write files or rescan unnecessarily.
- [ ] Switching views preserves the selected artifact when that artifact exists in both views.
- [ ] Switching views falls back to a sensible default when the selected artifact does not exist in the target view.
- [ ] `Prosjekter` derives project contexts from valid `Prosjektmappe` metadata.
- [ ] `Prosjekter` does not derive project contexts from untagged folder names or folder signals.
- [ ] When no folders are tagged with `Prosjektmappe`, `Prosjekter` shows a compact empty state.
- [ ] Corrupt, unsupported, or duplicate folder metadata does not create project contexts.
- [ ] Context-view rows are derived from main/shared domain logic, not hardcoded in the renderer.
- [ ] Selecting a row preserves artifact identity, physical path, selected context view, selected context, and `view_reason`.
- [ ] Right context surface shows physical location for selected files in both `Mapper` and `Prosjekter`.
- [ ] Right context surface explains why a file is shown in the selected context view.
- [ ] The same artifact can appear in multiple context views without file duplication.
- [ ] `.sidekick/` is not treated as ordinary user content in context views.
- [ ] `.sidekick-folder.json` is not treated as ordinary user content in context views.
- [ ] Existing project scan, folder/file context, import, Codex, and context-package workflows still work.
- [ ] Tests cover metadata-based context-view derivation, selection state, no tagged projects, invalid metadata, and renderer smoke for switching views.

## Resolved Points After TASK-0037

- Sidekick creates a workspace root, not a project root.
- Workspace creation does not yet introduce `Prosjekter/`, `Bibliotek/`, `.sidekick/`, or `Applikasjoner/` as required physical areas.
- TASK-0035 should now be planned from this updated specification.
- First-version `Prosjekter` should derive project contexts from `Prosjektmappe` metadata only.
- No fallback folder heuristics should be used in the first build.
- The first build should primarily support a workspace-like root containing one or more tagged project folders.
- If the selected workspace has no tagged project folders, show an empty `Prosjekter` view.
- A single tagged project folder should appear as one project context.
- The physical/logical toggle should be a compact `Mapper` / `Prosjekter` control in the primary workspace.
- Toggle state can be renderer UI state in the first build, while view rows and membership are derived from main/shared domain logic.

## Planning Decisions

- Context-view derivation should live in a shared pure module: `src/shared/context-views.ts`.
  - The module should have no Electron, filesystem, IPC, DOM, or renderer dependencies.
  - The main scanner should call it when producing a `WorkspaceScan`, so the renderer receives a derived read model instead of inventing membership ad hoc.
  - Tests can then verify the context model without launching Electron.
- `view_reason` should be a typed shared value in `src/shared/sidekick-api.ts`.
  - First-version values should cover at least:
    - `physical-tree-node` for normal `Mapper` rows;
    - `project-root-tag` for a folder that becomes a project context because of `Prosjektmappe`;
    - `physical-project-file` for files shown under a project because they are physically inside the tagged project folder.
  - If implementation needs separate names, keep them explicit and documented in the shared API.
- The production UI should borrow the prototype's interaction, not its full visual treatment.
  - Use a compact `Mapper` / `Prosjekter` segmented or tab-like toggle in the primary workspace header.
  - Use project groups and a simple `Prosjektfiler` source label in `Prosjekter`.
  - Do not add the prototype's library styling, action bar, or simulated shared-library rows in this task.
- `TASK-0031` search integration is deferred.
  - TASK-0035 should not change search behavior beyond preserving selected physical paths when possible.
  - The selection/read model should keep enough information that a later search result can select an artifact in either `Mapper` or a context view.

## Implementation Plan

Plan complete. Because this is a Major task, build must wait for explicit human approval after this plan.

### Files or Areas

- `src/shared/sidekick-api.ts`
  - Add shared types for context views, context-view rows, context ids, source kind, and `view_reason`.
  - Extend `WorkspaceScan` with an optional or required derived context-view snapshot.
- `src/shared/context-views.ts`
  - New pure read-model module that derives `Mapper` and `Prosjekter` data from a `WorkspaceScan` or scan tree.
- `src/main/folder-scanner.ts`
  - Attach the derived context-view snapshot to every returned scan after metadata conflicts have been resolved.
- `index.html`
  - Add the `Mapper` / `Prosjekter` toggle target in the primary workspace surface.
- `src/renderer.ts`
  - Add context-view UI state.
  - Render `Mapper` with the existing physical tree.
  - Render `Prosjekter` from the derived context-view snapshot.
  - Preserve or fall back selection when switching views.
  - Show physical location, selected project context, and `Vises her fordi` in the right context surface.
- `src/index.css`
  - Style the compact toggle, project groups, project rows, source labels, empty states, and right-panel context explanation.
- `tests/unit/context-views.test.ts`
  - New tests for deterministic read-model derivation.
- `tests/integration/folder-scanner.test.ts`
  - Extend scanner tests so returned scans include project contexts only for valid `Prosjektmappe` metadata.
- `tests/e2e/renderer-smoke.spec.ts`
  - Add renderer smoke coverage for switching `Mapper` / `Prosjekter`, tagged projects, empty state, and right-panel explanation.
- `docs/tasks/TASK-0035-read-only-context-views.md`
  - Keep build, verification, review, and closeout notes current during implementation.

No new preload or IPC surface is expected. Existing scan-returning APIs should carry the derived read model.

### Steps

1. Create or reuse the task worktree before build.
   - Worktree: `../Sidekick-worktrees/TASK-0035-read-only-context-views`.
   - Branch: `task/TASK-0035-read-only-context-views`.
   - Run a baseline `npm run check` from the worktree when practical and record the result.
2. Add shared context-view contracts.
   - Define internal ids for the two first views, for example `folders` and `projects`, while keeping UI labels `Mapper` and `Prosjekter`.
   - Define typed `view_reason` values.
   - Define row/context structures that include artifact identity, physical path, view id, optional context id/label, artifact type, display label/group, and source kind.
3. Implement `src/shared/context-views.ts`.
   - Walk the scan tree deterministically.
   - Keep `Mapper` as the physical view over the existing tree.
   - Derive `Prosjekter` only from folder nodes with valid metadata containing a `Prosjektmappe` tag with `systemEffect: project-root`.
   - Treat each valid tagged folder as one project context.
   - Add a selectable project-root row with `view_reason: project-root-tag`.
   - Add file rows for files physically inside the tagged project folder with `view_reason: physical-project-file`.
   - Do not include files outside tagged project folders.
   - Do not create project contexts from invalid, unsupported, conflict, empty, or missing metadata.
   - Do not expose `.sidekick/` or `.sidekick-folder.json` as context-view content.
4. Attach context views to scans in `src/main/folder-scanner.ts`.
   - Derive the context-view snapshot after `markDuplicateFolderMetadata`, so duplicate metadata cannot create project contexts.
   - Ensure all existing scan-returning flows receive the same derived state after create workspace, initialize workspace, import, Codex refresh, context package generation, and tag edits.
5. Add renderer view state and toggle.
   - Default to `Mapper` whenever a workspace is opened.
   - Switching views must not write files and must not request a rescan.
   - If the selected physical artifact exists in the target view, preserve it.
   - If it does not exist in `Prosjekter`, select the first project context when available.
   - If `Prosjekter` has no contexts, show a compact empty state and keep the right panel focused on the workspace/root.
   - When switching back to `Mapper`, select the same physical path if it still exists, otherwise the workspace root.
6. Render `Prosjekter`.
   - Show one group per project context.
   - Show a `Prosjektfiler` source section for physical files inside the tagged folder.
   - Keep folders/files compact and keyboard accessible.
   - Keep tree tag pills only in `Mapper`; `Prosjekter` should show context membership, not duplicate the physical tree chrome.
7. Update the right context surface.
   - Preserve existing folder/file details and actions where they still apply to a physical path.
   - Show `Fysisk plassering` for selected files in both views.
   - Show `Prosjekt` when selection comes from `Prosjekter`.
   - Show `Vises her fordi` with a Norwegian explanation derived from `view_reason`.
   - For project-root rows, explain that the folder is tagged as `Prosjektmappe`.
8. Add tests.
   - Unit-test the pure context-view derivation for valid metadata, no tagged projects, invalid metadata, duplicate metadata, nested files, and untagged folders.
   - Integration-test that scanner results include derived context views after reading folder markers and after conflict marking.
   - E2E-test the visible toggle, default `Mapper`, `Prosjekter` groups, empty state, selection preservation/fallback, and right-panel `Vises her fordi`.
9. Update task build and verification logs during implementation.

### Verification

Automated checks from the task worktree:

- `npm run check`
- `npm run test`
- `npm run test:ui -- tests/e2e/renderer-smoke.spec.ts`

Manual verification from the task worktree:

1. Start Sidekick:

   ```bash
   cd /home/trutve/code/Sidekick-worktrees/TASK-0035-read-only-context-views
   npm start
   ```

2. Open or create a workspace that contains at least:

   ```text
   <Arbeidsområde>/
     Strategi/
       strategi-notat.md
     Operasjon/
       operasjon-notat.md
     Løsmateriale/
       uten-prosjekt.md
   ```

3. In `Mapper`, tag `Strategi/` and `Operasjon/` with `Prosjektmappe` from the right panel.
4. Verify `Mapper`:
   - `Mapper` is selected by default.
   - The physical folder tree is still shown.
   - `Strategi/` and `Operasjon/` show tag pills.
   - `.sidekick-folder.json` is not visible as a normal file.
5. Switch to `Prosjekter`.
   - The toggle changes view without rescan or write indicators.
   - `Strategi` and `Operasjon` appear as project groups.
   - Files inside each tagged folder appear under `Prosjektfiler`.
   - `Løsmateriale/uten-prosjekt.md` does not appear.
6. Select a file in `Prosjekter`.
   - The right panel shows file details.
   - `Fysisk plassering` points to the actual folder path.
   - `Prosjekt` shows the active project context.
   - `Vises her fordi` explains that the file lies physically inside a folder tagged as `Prosjektmappe`.
7. Switch back to `Mapper`.
   - The same physical file remains selected when it exists in both views.
8. Select `Løsmateriale/uten-prosjekt.md` in `Mapper`, then switch to `Prosjekter`.
   - The view falls back to the first project context or a compact empty state if no project exists.
9. Remove `Prosjektmappe` from both project folders and switch to `Prosjekter`.
   - `Prosjekter` shows a compact empty state explaining that project folders must be tagged.

### Security and Risk Review

- No new IPC or preload API should be added unless implementation proves it necessary.
- Context-view rows are read-only derived state and must not become authority for filesystem writes.
- Existing main-process path validation remains the authority for tag edits, imports, context packages, Codex, and other filesystem actions.
- Derivation must ignore invalid, unsupported, or duplicate metadata because the scanner already marks those statuses as unsafe for system effects.
- Renderer code may display derived context data, but privileged actions must still use validated physical paths and existing IPC contracts.
- The task does not change Electron security settings.

### Documentation

- Update this task record during build, verification, review, and closeout.
- Add a decision record only if implementation changes the durable persistence model, security boundary, or IPC/API authority model beyond this plan.

### Human Gates

- Required: yes, because this is a Major task.
- Approval status: approved for build, then accepted after manual user testing.

## Build Log

- Built in worktree `/home/trutve/code/Sidekick-worktrees/TASK-0035-read-only-context-views` on branch `task/TASK-0035-read-only-context-views`.
- Baseline `npm run check` initially failed before implementation because `node_modules` was not installed in the new worktree: `eslint: not found`.
- Ran `npm install` in the task worktree to install local dependencies.
- Added shared context-view types to `src/shared/sidekick-api.ts`.
- Added `src/shared/context-views.ts` as a pure read-model module.
- Updated `src/main/folder-scanner.ts` so every workspace scan includes derived context views after duplicate metadata conflicts are marked.
- Added a compact `Mapper` / `Prosjekter` toggle in `index.html`.
- Updated `src/renderer.ts` with:
  - active context-view state;
  - default `Mapper` behavior on workspace open;
  - project-view fallback selection;
  - read-only project groups derived from scan data;
  - right-panel `Fysisk plassering`, `Prosjekt`, and `Vises her fordi` details for logical rows.
- Updated `src/index.css` for the toggle, project groups, project rows, and empty project state.
- Added unit tests for the pure context-view read model.
- Extended scanner integration tests to assert metadata-based project context derivation.
- Extended renderer smoke tests for:
  - default `Mapper`;
  - switching to `Prosjekter`;
  - tagged project folders;
  - project empty state;
  - right-panel context explanation.

## Verification Log

- Passed: `npm run typecheck`.
- Passed: `npm run lint`.
- Passed: `npm run test -- tests/unit/context-views.test.ts tests/integration/folder-scanner.test.ts`.
  - Note: because of the repository script shape, this ran the full unit/integration suite.
  - Result: 26 files, 114 tests passed.
- Passed: `npm run test:ui -- tests/e2e/renderer-smoke.spec.ts`.
  - Result: 35 tests passed.
- Passed: `npm run check`.
- Passed: `npm run test`.
  - Result: 26 files, 114 tests passed.
- Passed: `git diff --check`.

## Review Notes

- Self-review completed before handoff.
- User verified the feature in the app and reported that it works.
- No new IPC or preload API was added.
- Context-view membership is derived in shared domain code and attached by the main scanner.
- Renderer only switches between and displays the derived read model.
- Filesystem write authority remains in existing validated main-process APIs.
- Known limitation accepted for this task: search results still operate against the existing physical path behavior. Deeper search/context-view integration remains deferred to TASK-0031 or a follow-up.

## Documentation Notes

- Updated this task record with build and verification notes.
- No new decision record was added because this build follows the already planned metadata/read-model direction and does not change persistence, IPC authority, or Electron security boundaries.

## Closeout

- Final status: Done.
- Implemented read-only `Mapper` / `Prosjekter` context views.
- `Prosjekter` is derived only from valid `Prosjektmappe` metadata.
- Context-view derivation lives in shared pure code and is attached by the main scanner.
- Renderer displays and switches between derived views without adding new IPC authority.
- Task branch: `task/TASK-0035-read-only-context-views`.
- Task worktree: `/home/trutve/code/Sidekick-worktrees/TASK-0035-read-only-context-views`.
- Release version prepared after acceptance: `0.1.10`.
