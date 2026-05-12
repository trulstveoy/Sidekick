# Task: Design System And Shell Foundation

ID: TASK-0015
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0015-design-system-shell-foundation
Worktree: ../Sidekick-worktrees/TASK-0015-design-system-shell-foundation
Base branch: origin/main
Write scope:
- `index.html`
- `src/index.css`
- `src/renderer.ts`
- `tests/e2e`
- `docs/design`
Parallel safety: Exclusive
Implementation ordering: Must be completed before `TASK-0016` through `TASK-0022`.

## Summary

Establish the GUI refresh foundation: revised design tokens, base UI primitives, and the new application shell model.

This task should create a visible shell change that future GUI refresh tasks can build on. It should not redesign every workflow. It should make Sidekick visibly follow the consultant design direction: topbar, primary workspace, context surface, action bar, status bar, calm colors, compact typography, and consistent focus states.

This is the foundation task for the GUI refresh. It is intentionally exclusive because later tasks depend on the shell, tokens, base components, and test structure it establishes.

## Current Phase

Close

Task is complete.

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
- `../design/desktop-design-guidelines.md`
- `../design/gui-refresh-implementation-analysis.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-tokens-v2.json`
- `../design/sidekick-ui design leveranse.zip::fase3b-komponentveiledning.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-tilstandsbibliotek.html`
- `../design/sidekick-ui design leveranse.zip::fase3b-minimumsopplevelse.md`
- `../design/sidekick-ui design leveranse.zip::fase4-oppgave-01-designsystem.md`
- `../design/sidekick-ui design leveranse.zip::fase4-oppgave-08-globale-tilstander.md`

Related tasks:
- `closed/TASK-0006-minimalist-ui-refresh.md`

## Explore Notes

Current app state:
- The renderer is a vanilla TypeScript/DOM UI, not React.
- `index.html` currently defines a three-area proof-of-concept shell: sidebar, workspace, inspector.
- `src/index.css` contains the current visual surface hierarchy.
- `src/renderer.ts` owns most UI state rendering.
- Existing UI tests are Playwright smoke tests under `tests/e2e`.
- The Electron window minimum size is already `1040 x 720`, which matches the consultant minimum.

Design source observations:
- The consultant refresh moves the product toward a topbar plus primary workspace, context surface, action bar, and status bar.
- `fase3b-tokens-v2.json` is the authoritative token source for color, spacing, focus, borders, status colors, and layout dimensions.
- The state library defines visible component states for buttons, inputs, list rows, status banners, write-operation badges, and contrast.
- The component guide defines base primitives that later workflow tasks depend on.
- The refreshed UI should use Norwegian product language.

Risk notes:
- This is a broad shell/foundation change and will affect most later UI work.
- It touches shared UI files that other GUI tasks will also need. It should be completed first.
- It must not weaken Electron security boundaries.
- The task should avoid introducing a frontend framework unless separately justified.
- Do not run later GUI refresh tasks in parallel with this task. They will otherwise compete for the same renderer, CSS, and smoke-test structure.

## Task Spec

### Problem

The current UI is a proof-of-concept surface. Later GUI refresh tasks need a stable visual foundation and shell model before individual workflows are redesigned.

### Goal

Create the shared design foundation for the GUI refresh and make the application visibly adopt the new shell structure.

### Scope

- Define CSS custom properties from `fase3b-tokens-v2.json`.
- Establish base typography, spacing, color, border, focus, and state styles.
- Establish reusable styling for buttons, inputs, list rows, banners, badges, progress, and terminal/output surfaces.
- Replace the old shell model with a new shell that includes:
  - topbar;
  - primary workspace;
  - context surface;
  - action bar;
  - status bar.
- Keep selected project name and path visible when a project is active.
- Use Norwegian shell labels where labels are visible.
- Preserve all existing workflows functionally.
- Add or update smoke coverage so the new shell renders in empty and selected-project states.

### Non-goals

- Redesign project entry in detail.
- Redesign project overview content in detail.
- Redesign folder hierarchy behavior.
- Redesign transcript import, context package, or Codex workflows.
- Add dark mode.
- Add persistence.
- Add model selection or new Codex behavior.
- Add scan progress/cancellation.
- Add file opening.
- Replace the renderer architecture or introduce a UI framework.

### User Workflows

- User opens Sidekick without a selected project and sees the refreshed shell with a clear primary workspace.
- User selects an existing project and sees project identity in the topbar.
- User can still reach existing actions, even if their detailed refresh belongs to later tasks.
- User can tab through primary controls and see visible focus.

### Design Requirements

- Follow `docs/design/desktop-design-guidelines.md`.
- Use `fase3b-tokens-v2.json` as the visual source of truth.
- Use one primary accent color and restrained neutral surfaces.
- Avoid decorative gradients, stacked cards, marketing copy, and heavy surface chrome.
- Use the new shell vocabulary: topbar, primary workspace, context surface, action bar, status bar.
- Keep the primary workspace visually dominant.
- Ensure status and action surfaces are compact and predictable.
- Preserve the supported minimum window behavior around `1040 x 720`.

### Acceptance Criteria

- [ ] The app shell visibly contains a topbar, primary workspace, context surface, action bar, and status bar.
- [ ] The selected project name and path are visible in the shell when a project is active.
- [ ] The UI uses token-driven colors, spacing, typography, borders, and focus states.
- [ ] No workflow-specific component uses hardcoded hex colors outside token definitions unless explicitly justified.
- [ ] Buttons, inputs, banners, badges, list rows, progress, and output surfaces share consistent base styling.
- [ ] Keyboard focus is visible on all interactive controls touched by this task.
- [ ] The app remains usable at `1280 x 820` and `1040 x 720`.
- [ ] Existing project selection and existing workflow entry points still work.
- [ ] UI smoke coverage verifies the shell in empty and selected-project states.

### Dependencies

None. This is the first GUI refresh implementation task.

### Parallelization Notes

This task is not parallel-safe with other GUI refresh implementation tasks. Complete and integrate it before starting `TASK-0016` through `TASK-0022`.

Current hotspot files are `index.html`, `src/renderer.ts`, `src/index.css`, and `tests/e2e`. If this task creates smaller renderer/style modules, later tasks may be easier to parallelize, but that should be a result of this task rather than an assumption.

### Open Questions

None blocking.

## Implementation Plan

### Plan Status

This plan intentionally stops before Build. The next agent should not edit implementation files until the human approves Build for this task.

Before Build starts, create or reuse the task worktree:

```text
git fetch
git worktree add ../Sidekick-worktrees/TASK-0015-design-system-shell-foundation -b task/TASK-0015-design-system-shell-foundation origin/main
```

If the branch already exists, reuse it:

```text
git worktree add ../Sidekick-worktrees/TASK-0015-design-system-shell-foundation task/TASK-0015-design-system-shell-foundation
```

### Design Direction

Visual thesis:
- Sidekick should feel like a quiet local desktop workspace: warm neutral background, crisp white work surfaces, restrained borders, blue accent for interaction, and compact readable project information.

Content plan:
- Topbar: Sidekick identity, selected project name/path, and mode context.
- Primary workspace: current project work surface. For this task, preserve existing folder tree/workflow content but place it inside the new shell.
- Context surface: existing summary and workflow panels, visually calmer and prepared for later task-specific refresh.
- Action bar: stable placement for primary project/workflow actions.
- Status bar: compact operational status from current app/runtime/project state.

Interaction thesis:
- Keep motion minimal; use hover, focus, selected, disabled, and pending states rather than animation-heavy transitions.
- Make keyboard focus obvious through the tokenized focus ring.
- Keep write-capable workflows reachable but do not redesign their internal flow in this task.

### Implementation Steps

1. Establish token foundation.
   - Translate `fase3b-tokens-v2.json` into `:root` CSS custom properties in `src/index.css`.
   - Keep names readable and semantic, such as `--bg`, `--surface`, `--text-1`, `--accent`, `--warning-bg`, and `--border-focus`.
   - Replace current legacy color variables with token-backed equivalents.
   - Avoid hardcoded hex colors outside the token block except where the consultant explicitly defines terminal/output colors.

2. Define base component classes.
   - Add base button styles for primary, secondary, ghost, danger, and small/action variants.
   - Add shared input, textarea, list-row, status-banner, badge, progress, and output-surface styles.
   - Keep class names generic enough for later tasks to reuse.
   - Preserve visible `:focus-visible` for every interactive element.

3. Restructure the static shell in `index.html`.
   - Replace the current sidebar/workspace/inspector structure with:
     - `app-topbar`;
     - `app-main`;
     - `primary-workspace`;
     - `context-surface`;
     - `action-bar`;
     - `status-bar`.
   - Preserve existing `data-*` hooks wherever practical so renderer behavior survives the shell change.
   - Add new `data-*` hooks only where needed for topbar/status/action rendering.
   - Keep existing workflow panels present but visually subordinate to the primary workspace.

4. Adapt renderer bindings without changing product behavior.
   - Update query selectors only where the shell markup changes.
   - Add small renderer helpers for topbar/statusbar text if needed.
   - Keep existing state machines for project creation, scan, tree, transcript import, context package, and Codex.
   - Convert visible shell-level labels to Norwegian where this task touches them.
   - Avoid broad workflow copy rewrites that belong to later tasks.

5. Make the shell responsive within supported bounds.
   - Target `1280 x 820` as the reference viewport.
   - Preserve usability at `1040 x 720`.
   - Keep topbar, action bar, and status bar fixed in the layout.
   - Allow primary workspace and context content to scroll as needed.
   - Truncate long project names and paths predictably.

6. Update smoke tests for the new shell.
   - Add or update tests that assert:
     - topbar is visible;
     - primary workspace is visible;
     - context surface is visible;
     - action bar is visible;
     - status bar is visible;
     - selected project name/path appears after choosing a project;
     - existing workflow entry points remain reachable.
   - Prefer stable `data-*` selectors for shell structure.
   - Keep existing workflow tests passing unless labels intentionally change at shell level.

7. Perform visual/manual verification.
   - Start the app or renderer test server as appropriate.
   - Inspect at `1280 x 820` and `1040 x 720`.
   - Confirm no major overlap, clipped primary actions, or unreadable text.
   - Confirm the app still feels like a work surface rather than a dashboard/card mosaic.

### File-Level Plan

Expected implementation files:
- `index.html`: shell markup and stable data hooks.
- `src/index.css`: token block, base styles, shell layout, component primitives.
- `src/renderer.ts`: selector updates and minimal topbar/status/action text rendering.
- `tests/e2e/renderer-smoke.spec.ts`: smoke test selector/copy updates and shell assertions.

Avoid touching:
- Electron main/preload IPC security boundaries.
- Scanner behavior.
- Transcript import backend behavior.
- Context package backend behavior.
- Codex runner behavior.
- Packaging/signing/release files.

### Verification Plan

Required:

```text
npm run check
npm run test:ui
```

Recommended if time allows:

```text
npm run test
```

Manual/visual checks:
- Empty app at `1280 x 820`.
- Empty app at `1040 x 720`.
- Mocked selected-project smoke flow.
- Keyboard tab order through topbar, primary workspace controls, context controls, action bar, and status-related controls.

### Rollback And Risk Controls

- Keep product behavior stable. If a workflow breaks, fix the shell integration rather than changing backend behavior.
- Prefer preserving existing `data-*` hooks to reduce test churn.
- Keep the component system CSS-only in this task.
- If the renderer becomes hard to manage, extract small helper functions only; do not introduce a framework.
- If a design detail conflicts with existing functionality, preserve functionality and document the visual compromise in Review Notes during implementation.

## Build Log

- 2026-05-12: Created task worktree at `../Sidekick-worktrees/TASK-0015-design-system-shell-foundation`.
- 2026-05-12: Human approved Build by asking to build task 15.
- 2026-05-12: Replaced the proof-of-concept sidebar/workspace/inspector shell with the refreshed shell model: topbar, primary workspace, context surface, action bar, and status bar.
- 2026-05-12: Added token-driven CSS foundation for the refreshed visual language, including neutral surfaces, accent color, semantic status colors, spacing, borders, typography, focus rings, buttons, inputs, banners, list rows, progress, and output surfaces.
- 2026-05-12: Preserved existing workflow hooks and behavior for project selection, project creation, folder tree, transcript import, context package generation, and Codex.
- 2026-05-12: Added shell status rendering for empty, loading, failed, ready, and partial scan states.
- 2026-05-12: Updated touched shell labels to Norwegian while leaving detailed workflow copy for later GUI refresh tasks.
- 2026-05-12: Updated Playwright smoke coverage for the refreshed shell structure and Norwegian shell actions.

## Verification Log

- 2026-05-12: `npm run check` passed.
- 2026-05-12: `npm run test:ui` passed, 7 Playwright smoke tests.
- 2026-05-12: `npm test` passed, 13 files and 50 tests.
- 2026-05-12: Manual browser screenshot check completed at `1280 x 820` and `1040 x 720`; shell remains usable at both supported sizes.

## Review Notes

- 2026-05-12: No Electron main/preload security boundaries were changed.
- 2026-05-12: Existing workflow panels remain visually subordinate but still contain some English workflow-level copy. This is intentional for this foundation task and should be handled by later workflow-specific GUI refresh tasks.
- 2026-05-12: Context surface content scrolls at minimum size; primary actions remain reachable.
- 2026-05-12: Human reviewed the task 15 preview at `http://127.0.0.1:5174/` and confirmed it looks good.

## Documentation Notes

- 2026-05-12: Updated `docs/design/desktop-design-guidelines.md` to align future UI work with the consultant GUI refresh direction.
- 2026-05-12: Kept consultant delivery and GUI refresh analysis artifacts available under `docs/design/` for traceability.

## Closeout

- Final branch: `task/TASK-0015-design-system-shell-foundation`.
- Final worktree: `../Sidekick-worktrees/TASK-0015-design-system-shell-foundation`.
- Summary: established the refreshed Sidekick shell and CSS foundation for the GUI refresh, preserving existing workflows while introducing topbar, primary workspace, context surface, action bar, status bar, tokenized styles, and smoke-test coverage.
- Verification: `npm run check`, `npm run test:ui`, and `npm test` passed before closeout.
- Residual risk: detailed workflow panels still contain some English copy and proof-of-concept flow structure. This is intentionally deferred to `TASK-0016` through `TASK-0022`.
- Follow-up: integrate this branch before building `TASK-0016`.
