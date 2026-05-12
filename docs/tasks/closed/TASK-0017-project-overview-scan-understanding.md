# Task: Project Overview And Scan Understanding

ID: TASK-0017
Status: Closed
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: main
Worktree: main checkout (`/home/trutve/code/Sidekick`)
Base branch: main
Write scope:
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/e2e`
Parallel safety: Exclusive
Depends on:
- `closed/TASK-0015-design-system-shell-foundation.md`
- `closed/TASK-0016-project-entry-creation-refresh.md`
Implementation ordering: Build after `TASK-0015` and `TASK-0016`. Build before `TASK-0018`, `TASK-0019`, and `TASK-0020`.

## Summary

Refresh the scanned project overview so the user can quickly understand project size, structure, warnings, recent activity, and generated-context status.

This task should produce a visible overview after a folder scan. It should use existing scanner data and should not add scan progress or cancellation.

This task is the bridge between project entry and the workflow-specific surfaces. It should be integrated before folder hierarchy, transcript import, and context package refresh work depends on scanned project state.

## Current Phase

Close

Human review approved. Task is complete.

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
- `../design/gui-refresh-implementation-analysis.md`
- `../design/desktop-design-guidelines.md`
- `../design/sidekick-ui design leveranse.zip::wireframe-02-prosjektoversikt.html`
- `../design/sidekick-ui design leveranse.zip::fase3-ref-prosjektoversikt.html`
- `../design/sidekick-ui design leveranse.zip::fase4-oppgave-03-prosjektoversikt.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-minimumsopplevelse.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`

Related tasks:
- `closed/TASK-0015-design-system-shell-foundation.md`
- `closed/TASK-0016-project-entry-creation-refresh.md`
- `closed/TASK-0001-inspect-local-folder.md`

## Explore Notes

Current app state:
- `ProjectFolderScan` already contains root path/name, scanned timestamp, status, warnings, tree, artifact counts, folder signal counts, and recent files.
- Current UI shows these data points, but they are distributed across the proof-of-concept shell.
- The scanner can report `partial` status and limits reached.
- The scanner does not expose scan progress, cancellation, or total disk size.
- Context-package status can be derived or queried through the existing context-package preview flow if needed.

Design source observations:
- The consultant project overview emphasizes a compact stats stripe, a calm folder summary, recent files, warnings, and scan metadata.
- At the minimum window size, lower-priority metadata should hide before core stats and actions.
- The overview is the "Forstå" mode entry point after a project is selected.

Resolved decisions:
- Do not add scan progress or cancellation in this task.
- Do not change scanner semantics in this task unless a small derived display field is needed.

Risk notes:
- Showing too much metadata can recreate the visual noise the refresh is trying to remove.
- The UI should not hide partial-scan warnings.
- Existing UI tests may need selector updates after the overview layout changes.
- This task is tightly coupled to the shell and later folder/workflow surfaces through shared renderer state.

## Task Spec

### Problem

After scanning a project, the current UI exposes useful data but does not prioritize it clearly enough for quick project understanding.

### Goal

Give the user a calm, scannable project overview that highlights the most important project signals and makes scan warnings visible.

### Scope

- Redesign the scanned project overview.
- Use existing scan data for:
  - file count;
  - folder count;
  - artifact type counts;
  - folder signals;
  - recent files;
  - scan timestamp;
  - complete/partial status;
  - warnings.
- Add context-package status if it can be derived without introducing a large new backend feature.
- Show partial-scan and warning states clearly.
- Preserve all existing scan behavior.
- Use Norwegian user-facing copy.

### Non-goals

- Scan progress.
- Scan cancellation.
- File watching or automatic refresh.
- New scanner classification rules.
- Total disk-size calculation unless already available.
- Folder drill-down redesign; that belongs to `TASK-0018`.
- Context-package generation redesign; that belongs to `TASK-0020`.

### User Workflows

- User selects a project folder and sees an overview after scan.
- User can understand how many files/folders and artifact types exist.
- User can see recent files and warnings without hunting through unrelated panels.
- User can tell whether the scan was complete or partial.
- User can move from overview into folder exploration.

### Design Requirements

- Follow `wireframe-02-prosjektoversikt.html` and `fase3-ref-prosjektoversikt.html`.
- Use the shared shell and components from `TASK-0015`.
- Keep the overview dense but readable.
- Keep the primary workspace dominant.
- Use compact status and warning treatments from the state library.
- Preserve minimum window behavior from `fase3b-minimumsopplevelse.md`.

### Acceptance Criteria

- [ ] A scanned project displays a refreshed overview with core stats.
- [ ] At least file count, folder count, scan status/time, and warning state are visible or available in the overview.
- [ ] Artifact counts and folder signals are presented in a calmer, scannable way.
- [ ] Recent files are available without competing with the primary overview.
- [ ] Complete and partial scans are visually distinguishable.
- [ ] Scan warnings are specific and not hidden.
- [ ] The overview remains usable at `1280 x 820` and `1040 x 720`.
- [ ] UI smoke tests cover complete scan, partial/warning scan, and minimum viewport behavior where practical.

### Dependencies

- Requires `TASK-0015`.
- Should follow `TASK-0016` so project entry transitions into the refreshed overview.
- Should be completed before `TASK-0018`, `TASK-0019`, and `TASK-0020`.

### Parallelization Notes

This task has a standalone visible deliverable, but it should be treated as sequential in the current codebase.

Avoid parallel implementation with:

- `TASK-0016-project-entry-creation-refresh.md`
- `TASK-0018-folder-hierarchy-artifact-detail.md`
- `TASK-0019-write-pattern-transcript-import.md`
- `TASK-0020-context-package-workflow-refresh.md`

because they are likely to touch the same project-state rendering and smoke tests.

### Open Questions

None blocking.

## Implementation Plan

### Plan Status

This plan intentionally stops before Build. Build should not start until the human approves it.

`TASK-0016` has been merged into local `main` and closed. At planning time, local `main` is ahead of `origin/main`, so the correct implementation base is local `main`.

Human override: this task will not use a separate task worktree because the user confirmed that `TASK-0017` will not be developed in parallel. Treat `main` as the active task checkout during Build and do not start other overlapping GUI-refresh work until this task is closed or explicitly paused.

Before Build starts, run a baseline check from the main checkout:

```text
npm run check
npm run test:ui
```

If the baseline fails, record the failure in the Build Log before implementation.

### Design Sources

Use these consultant artifacts as the design source for this task:

- `docs/design/sidekick-ui design leveranse.zip::wireframe-02-prosjektoversikt.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3-ref-prosjektoversikt.html`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-03-prosjektoversikt.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-minimumsopplevelse.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`
- `docs/design/gui-refresh-implementation-analysis.md`
- `docs/design/desktop-design-guidelines.md`

Normalize the consultant scope against the approved Sidekick scope:

- Do not add scan progress, scan cancellation, file watching, or a new scan backend.
- Do not add disk-size calculation; the scanner does not expose it.
- Do not redesign deep folder drill-down; that belongs to `TASK-0018`.
- Do not redesign transcript import, context-package generation, or Codex workflows; those belong to later tasks.
- Keep Norwegian user-facing copy for newly touched overview surfaces.

### Integrated Baseline From TASK-0016

`TASK-0016` changed the entry flow and shell behavior:

- no-project states now hide the context surface and action bar;
- after a successful folder selection or project creation, the app transitions into `ready` or `partial` scan state;
- the topbar shows selected project name/path;
- project creation now adds selected roots to the main-process allowed-root set;
- the current overview still contains the old recursive tree and several workflow panels in the context surface.

`TASK-0017` should build on that state transition. It should not reintroduce the old project-entry form, duplicate empty-state actions, or move selected project context out of the topbar.

### Files Or Areas

Expected implementation files:

- `index.html`: overview markup, overview context sections, action bar buttons, stable data hooks.
- `src/renderer.ts`: derived overview data, rendering, scan state copy, context-package overview status, action wiring.
- `src/index.css`: stats stripe, overview folder rows/tree styling, context sections, warning/status treatments, minimum-width behavior.
- `tests/e2e/renderer-smoke.spec.ts`: refreshed overview smoke tests.

Potential implementation files if the plan reveals a small shared-helper need:

- `src/shared/sidekick-api.ts`: only if a type-only helper is needed; avoid IPC changes for this task.

Avoid touching:

- `src/main.ts` and main-process scanner behavior;
- scanner classification rules;
- transcript import backend behavior;
- context-package generation backend behavior;
- Codex runner behavior;
- packaging, release, and signing files.

### UX Model

Target states:

1. Scanning/loading after project selection.
   - Preserve the existing non-streaming loading state.
   - Use Norwegian copy: `Leser mappeinnhold`.
   - Make clear that this is read-only inspection.
   - Do not show fake file counts, progress bars, or cancel controls.

2. Complete scan overview.
   - Topbar keeps project name and path visible.
   - Primary workspace starts with a compact stats stripe.
   - Main content shows a calmer folder overview based on top-level folders and the existing tree.
   - Context surface shows recent files, warnings, scan metadata, artifact/folder signals, and context-package status.
   - Action bar exposes main workflow entry points without redesigning those workflows.

3. Partial scan overview.
   - Same structure as complete overview.
   - Status and warnings must clearly communicate that the scan is partial.
   - `limitsReached.maxDepth` and `limitsReached.maxFiles` should be visible as specific warning/status text.

4. Empty scanned project.
   - If the scan succeeds but there are no child folders/files, show a compact empty overview in the primary workspace.
   - Keep stats visible; do not return to the no-project empty state.

5. Scan error.
   - Preserve the existing error path from folder selection.
   - Show a compact actionable error in the entry/error surface.
   - Do not add retry/rescan backend unless explicitly approved later.

### Data And Derivation Plan

Use existing `ProjectFolderScan` data only.

Derived data needed in the renderer:

- top-level folder rows from `scan.tree.children` where `kind === 'folder'`;
- direct child file/folder counts per top-level folder;
- visible artifact chips per folder from child `artifactType` values;
- folder signal label from `folderSignals` or `contextHints`;
- total files and folders from `scan.summary`;
- transcript count from `scan.summary.artifactTypeCounts.transcript`;
- warning count from `scan.warnings.length` plus limit flags;
- recent file rows from `scan.summary.recentFiles`;
- scan timestamp from `scan.scannedAt`;
- scan completeness from `scan.status` and `scan.summary.limitsReached`.

Context-package status:

- Use the existing `previewContextPackage(scan.rootPath)` API if practical.
- Treat `preview.willOverwrite === true` as `Finnes`.
- Treat `preview.willOverwrite === false` as `Mangler`.
- Treat unavailable API, browser preview, or preview failure as `Ukjent`.
- Do not block overview rendering while this status is being checked.
- Do not trigger generation from this status check.

Stats stripe:

- Always visible at `1040 x 720`: `Filer`, `Mapper`, `Siste skanning`, `Kontekstpakke`.
- Additional visible stats at wider layout: `Transkripsjoner`, `Varsler`, and one useful artifact count such as `Markdown/tekst`.
- Do not include disk size because it is not available.

### Markup Plan

Add or update stable data hooks:

- `data-overview-title`
- `data-overview-subtitle`
- `data-overview-stats`
- `data-overview-folder-list`
- `data-overview-empty`
- `data-overview-context-package-status`
- `data-overview-scan-status`
- `data-overview-action-generate-context`
- `data-overview-action-import-transcription`
- `data-overview-action-run-codex`

Keep existing hooks that later tasks rely on:

- `data-folder-tree`
- `data-expand-all`
- `data-collapse-all`
- `data-context-package-*`
- `data-transcription-import-*`
- `data-codex-*`
- `data-settings-*`

Prefer adapting the current tree/list area rather than deleting the recursive tree implementation. `TASK-0018` will decide the final folder hierarchy and drill-down model.

### Renderer Plan

1. Introduce overview helper functions.
   - `getTopLevelFolderRows(scan)`.
   - `getFolderArtifactTypes(node)`.
   - `getFolderSignalLabel(node)`.
   - `getOverviewWarnings(scan)`.
   - `getOverviewStats(scan, contextPackageStatus)`.

2. Introduce a small context-package overview status state.
   - Status values: `unavailable`, `checking`, `exists`, `missing`, `unknown`.
   - Reset on no active project.
   - Start checking after `setActiveScan(scan)` when `window.sidekick` exists.
   - Guard against stale async results if the user switches projects before the preview returns.

3. Update ready/partial rendering.
   - Use Norwegian overview titles and status copy.
   - Replace English summary labels.
   - Show partial-scan state clearly in stats/context and warning list.
   - Keep the existing recursive tree behavior available as a bridge, but visually present it as the overview folder structure until `TASK-0018`.

4. Update context surface for overview.
   - Prioritize `Nylig endret`, `Varsler`, `Skannet`, `Artefakttyper`, and `Mappesignaler`.
   - Avoid showing every workflow panel as equal context in the overview.
   - Keep workflow functionality reachable through the action bar and existing underlying renderer handlers.

5. Update action bar for active project.
   - Primary: `Generer kontekstpakke`.
   - Secondary: `Importer transkripsjon`.
   - Secondary: `Kjør Codex`.
   - Quiet secondary: `Bytt prosjekt`.
   - Do not implement a true `Skann på nytt` action unless the task is explicitly broadened, because there is no current rescan IPC and scan progress/cancellation are out of scope.

6. Preserve settings behavior.
   - Do not change Codex path settings beyond any labels that remain visible in the overview.

### Styling Plan

Build on the tokens and base primitives from `TASK-0015`.

Add or revise styles for:

- overview stats stripe with 4 always-visible stats and extra stats hidden at minimum width;
- compact overview folder rows;
- artifact type chips;
- folder signal text;
- partial-scan and warning treatments;
- recent-file rows;
- scan metadata rows;
- context-package status chip;
- action bar button grouping;
- empty scanned-project state.

Minimum-size requirements:

- At `1280 x 820`, show the full overview with extra stats and context surface.
- At `1040 x 720`, keep topbar, stats stripe, primary folder overview, context surface, action bar, and status bar usable.
- Hide lower-priority stats before wrapping or overflowing.
- Long paths and filenames must truncate or wrap inside their own cells without shifting layout.

Do not introduce:

- decorative gradients;
- dashboard-card mosaics;
- nested cards;
- multiple competing accent colors;
- oversized explanatory copy.

### Test Plan

Update Playwright smoke coverage:

- empty entry state still passes after overview changes;
- choosing an existing project transitions into refreshed overview;
- complete scan shows project name/path, core stats, folder rows/tree, recent files, and scan metadata;
- context-package overview status shows `Finnes`, `Mangler`, or `Ukjent` based on mocked preview result;
- partial scan shows partial status and warning/limit information;
- scan warnings are visible and specific;
- empty scanned project shows an overview empty state, not the no-project empty state;
- action bar workflow entry points remain keyboard reachable;
- minimum viewport `1040 x 720` keeps core stats and primary actions visible.

Keep or adapt existing smoke tests for:

- expand/collapse behavior as a compatibility bridge until `TASK-0018`;
- context package generation;
- transcription import;
- Codex run;
- settings.

Required verification during Build:

```text
npm run check
npm run test:ui
npm test
```

Manual/visual checks:

- complete project overview at `1280 x 820`;
- complete project overview at `1040 x 720`;
- partial scan with warning(s);
- empty scanned project;
- long project path and long folder/file names.

### Security And Risk Review

- No new filesystem write capability should be introduced.
- No new raw filesystem, shell, process, or IPC access should be exposed to the renderer.
- If context-package status uses preview, it must use the existing typed preload API and known selected project root.
- Do not add a renderer-controlled arbitrary rescan path in this task.
- Partial-scan warnings must not be hidden, because hiding them can misrepresent project completeness.
- Action bar buttons must not trigger write operations without the existing preview/confirmation flows.

### Documentation And Decisions

No decision record is currently required because this plan does not introduce a durable architecture change, persistence model, security boundary, or new dependency.

Update this Task Record during Build with:

- any deviation from the no-new-backend-scope decision;
- final changed files;
- verification results;
- visual/manual review notes.

If Build requires a new scan/rescan IPC, stop and ask for approval before continuing because that broadens the task beyond the current plan.

### Human Gates

- Required: yes.
- Approval status: approved for Build by the human.
- Reason: `TASK-0017` is a Major GUI/navigation change and touches shared renderer/CSS/test surfaces used by later tasks.

## Build Log

- Built directly in the main checkout per human override because `TASK-0017` is not developed in parallel.
- Added refreshed overview markup and stable data hooks for overview title, subtitle, stats, empty scanned-project state, scan status, context-package status, and action-bar workflow entry points.
- Reworked the active-project stats stripe to show `Filer`, `Mapper`, `Siste skanning`, `Kontekstpakke`, `Transkripsjoner`, `Varsler`, and `Markdown/tekst`, with lower-priority stats hidden at the 1040px minimum width.
- Added derived overview data in the renderer from existing `ProjectFolderScan` only: warning count, limit warnings, folder artifact chips, folder signals, scan metadata, and context-package status.
- Added non-blocking context-package status lookup using the existing `previewContextPackage` preload API. No new IPC or backend scan behavior was added.
- Kept the existing recursive folder tree as a compatibility bridge for `TASK-0018`, while making rows calmer and more overview-oriented.
- Moved workflow panels below overview context in the context surface and exposed primary workflow actions in the action bar.
- Hid the duplicate active-project state banner to reduce visual noise in the refreshed overview.
- Added smoke coverage for complete overview, partial scan warnings, empty scanned project, and minimum viewport behavior.

## Verification Log

- Baseline before implementation:
  - `npm run check` passed.
  - `npm run test:ui` initially failed under the earlier sandbox because Vite could not listen on `127.0.0.1:5173`; after sandbox permissions changed, `npm run test:ui` passed before implementation.
- Final verification:
  - `npm run check` passed.
  - `npm run test:ui` passed: 13 Playwright tests.
  - `npm test` passed: 15 files, 57 tests.
- Manual/visual checks:
  - Complete project overview checked at `1280 x 820`.
  - Complete project overview checked at `1040 x 720`.
  - Long project path visual behavior checked.
  - Screenshots written to `/tmp/sidekick-task17-overview-final2-1280x820.png` and `/tmp/sidekick-task17-overview-final2-1040x720.png`.

## Review Notes

- The implementation follows the approved narrowed scope: no scan progress, scan cancellation, disk-size calculation, file watching, or new scan IPC.
- Partial-scan and scanner-limit warnings remain visible in the overview and warning list.
- Context-package status is derived from the existing preview API and does not trigger generation.
- The overview action bar reuses existing workflow handlers, so write operations still go through their existing preview/confirmation flows.
- Some deeper folder tree behavior and workflow panel language remain for later GUI-refresh tasks, especially `TASK-0018`, `TASK-0019`, `TASK-0020`, and `TASK-0021`.

## Documentation Notes

- Task record updated with build, verification, and review notes.

## Closeout

- Human reviewed and approved the task on 2026-05-12.
- Built directly in `main` by explicit human direction; no task worktree was used.
- Closed task record moved to `docs/tasks/closed/`.
