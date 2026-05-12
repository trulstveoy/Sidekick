# Task: GUI Refresh Accessibility And Regression Pass

ID: TASK-0022
Status: Planned
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0022-gui-refresh-accessibility-regression
Worktree: ../Sidekick-worktrees/TASK-0022-gui-refresh-accessibility-regression
Base branch: main
Write scope:
- `src/renderer.ts`
- `src/index.css`
- `tests/e2e`
- `docs/design`
- `index.html`
Parallel safety: Exclusive
Depends on:
- `closed/TASK-0015-design-system-shell-foundation.md`
- `closed/TASK-0016-project-entry-creation-refresh.md`
- `closed/TASK-0017-project-overview-scan-understanding.md`
- `closed/TASK-0018-folder-hierarchy-artifact-detail.md`
- `closed/TASK-0019-write-pattern-transcript-import.md`
- `closed/TASK-0020-context-package-workflow-refresh.md`
- `closed/TASK-0021-controlled-codex-assistant-refresh.md`
Implementation ordering: Final pass after `TASK-0015` through `TASK-0021` are integrated.

## Summary

Run a final GUI refresh accessibility, keyboard, responsive, and smoke-test pass after the main visual workflow tasks are implemented.

This task should produce visible polish and test confidence across the refreshed app. It should not introduce new product features.

This is intentionally a final integration-quality task, not a parallel workflow task.

## Current Phase

Plan

Planning is complete. Build requires human approval.

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [ ] Worktree created or reused, if required
- [ ] Human approval received, if required
- [ ] Build complete
- [ ] Verification complete
- [ ] Review complete
- [ ] Documentation complete
- [ ] Closeout complete

## Links

Related docs:
- `../design/gui-refresh-implementation-analysis.md`
- `../design/desktop-design-guidelines.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-tilstandsbibliotek.html`
- `../design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`
- `../design/sidekick-ui design leveranse.zip::fase3b-minimumsopplevelse.md`
- `../design/sidekick-ui design leveranse.zip::fase4-handoff-oversikt.md`
- `../design/sidekick-ui design leveranse.zip::fase4-oppgave-08-globale-tilstander.md`
- WAI-ARIA Tree View Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
- WCAG 2.2: https://www.w3.org/TR/wcag/

Related tasks:
- `closed/TASK-0015-design-system-shell-foundation.md`
- `closed/TASK-0016-project-entry-creation-refresh.md`
- `closed/TASK-0017-project-overview-scan-understanding.md`
- `closed/TASK-0018-folder-hierarchy-artifact-detail.md`
- `closed/TASK-0019-write-pattern-transcript-import.md`
- `closed/TASK-0020-context-package-workflow-refresh.md`
- `closed/TASK-0021-controlled-codex-assistant-refresh.md`

## Explore Notes

Current app state:
- Playwright smoke tests already exist under `tests/e2e`.
- The refreshed UI tasks will likely update selectors, layout, text, and state rendering.
- Accessibility requirements should be included in each workflow task, but a final pass is still useful because interactions cross workflow boundaries.
- The design package includes a state library, state inventory, minimum-size guidance, and handoff QA checklist.

Design source observations:
- The consultant handoff expects state coverage, visible focus, keyboard behavior, contrast, minimum window behavior, and design QA.
- `fase3b-tilstandsbibliotek.html` gives concrete button/input/list/banner/focus examples.
- `fase3b-minimumsopplevelse.md` defines `1280 x 820` and `1040 x 720` behavior.
- The folder hierarchy must satisfy tree-view accessibility expectations.

Risk notes:
- A sequence of workflow-specific tasks can drift in spacing, states, labels, and keyboard behavior.
- UI tests can become stale during the redesign.
- Accessibility regressions are easy to miss if only pointer workflows are tested.
- Running this before the main workflow refresh tasks are integrated would create churn instead of useful QA.

## Task Spec

### Problem

After the GUI refresh is implemented across multiple tasks, the app needs a focused pass to ensure consistency, keyboard usability, responsive behavior, and smoke-test coverage.

### Goal

Make the refreshed GUI coherent and testable across the main user workflows.

### Scope

- Review and adjust global state treatments:
  - empty;
  - loading;
  - success;
  - warning;
  - error;
  - disabled;
  - partial;
  - cancelled.
- Review keyboard navigation across:
  - project entry;
  - overview;
  - folder hierarchy;
  - transcript import;
  - context package;
  - Codex.
- Review visible focus and selected states.
- Review minimum window behavior at `1040 x 720`.
- Review reference window behavior at `1280 x 820`.
- Update UI smoke tests for refreshed workflows.
- Add screenshot or visual smoke coverage where practical.
- Update design docs if the implemented refresh intentionally diverges from guidance.

### Non-goals

- New product workflows.
- New backend APIs.
- Scan progress/cancellation.
- File opening.
- Dark mode.
- Full automated accessibility audit framework unless separately planned.

### User Workflows

- User can operate core refreshed workflows with keyboard and pointer.
- User can understand state transitions across empty, loading, success, warning, error, and cancelled states.
- User can use the app at the supported minimum window size.
- User can distinguish focus, selection, warning, error, and write-operation states.

### Design Requirements

- Follow the consultant state library, screen/state inventory, and handoff QA checklist.
- Follow `docs/design/desktop-design-guidelines.md`.
- Use token-consistent state colors and focus outlines.
- Do not rely on color alone for warnings, errors, selected rows, or write mode.
- Keep status messages compact and actionable.
- Keep action placement consistent across workflows.

### Acceptance Criteria

- [ ] Build Log records the concrete accessibility, keyboard, responsive, or state-treatment issues found before fixes are applied.
- [ ] Project entry has automated coverage for empty state, create-project dialog focus behavior, cancel behavior, success, and error/no-change behavior.
- [ ] Project overview has automated coverage for complete scan, partial scan, empty scan, warning state, and primary actions at a supported viewport.
- [ ] Folder hierarchy has automated coverage for expand/collapse, expand-all/collapse-all, selection, breadcrumb selection, arrow-key navigation, `aria-expanded`, and visible distinction between focus and selection.
- [ ] Transcript import has automated coverage for preview, cancel/back without file change, success, file-picker cancel, and preview failure/no-change state.
- [ ] Context package has automated coverage for preview, overwrite/write warning, cancel/back without generation, success/result summary, skipped/warning files, and preview failure/no-change state.
- [ ] Codex has automated coverage for ready/read-only, logged-out/login, write-mode warning, running/cancel, completed, failed, and canceled states.
- [ ] Keyboard-only navigation can reach and operate the main controls for project entry, folder hierarchy, transcript import, context package, and Codex.
- [ ] Focus states are visible for buttons, inputs, tree rows, mode controls, and workflow action controls.
- [ ] Warning, error, selected, disabled, canceled, partial, and write-operation states are not communicated by color alone.
- [ ] At `1040 x 720`, project context, core stats, folder hierarchy, and primary actions remain usable without incoherent overlap or clipped controls.
- [ ] At `1280 x 820`, the refreshed shell remains balanced and does not introduce unnecessary scroll or competing action surfaces.
- [ ] Any intentional divergence from the consultant design or `docs/design/desktop-design-guidelines.md` is documented in the Task Record, and durable guideline changes are applied to `docs/design/desktop-design-guidelines.md`.

### Dependencies

- Should run after `TASK-0015` through `TASK-0021`.

### Parallelization Notes

This task is exclusive and should run after the other GUI refresh tasks are complete and integrated.

Do not run it in parallel with feature refresh tasks. Its purpose is to catch and correct cross-task inconsistencies after the sequence is in place.

### Open Questions

None blocking.

## Implementation Plan

### Plan Status

Planning is complete.

Do not start Build until:

- the human approves the plan;
- a dedicated task worktree has been created from `main`;
- unrelated open task/backlog changes in the main checkout have been left untouched;
- a baseline verification run has been recorded in this Task Record.

### Build Base And Worktree

Use local `main` as the base because `TASK-0015` through `TASK-0021` are integrated there and this task is explicitly a final pass over that integrated GUI refresh.

```text
git worktree add ../Sidekick-worktrees/TASK-0022-gui-refresh-accessibility-regression -b task/TASK-0022-gui-refresh-accessibility-regression main
```

During Build, edit this Task Record in the task worktree and merge it back with the task branch.

### Files Or Areas

Expected change areas:

- `src/index.css`
  - focus states;
  - responsive minimum-size adjustments;
  - selected/warning/error/disabled state treatment;
  - long text/path behavior;
  - any small global state polish needed for consistency.
- `src/renderer.ts`
  - keyboard behavior;
  - ARIA labels, roles, and state attributes;
  - state copy or state rendering consistency;
  - no new product workflows.
- `index.html`
  - labels, landmarks, heading structure, and static accessibility attributes if needed.
- `tests/e2e/renderer-smoke.spec.ts`
  - keyboard-only workflow coverage;
  - minimum and reference viewport coverage;
  - state regression coverage;
  - focus/selection assertions.
- `docs/design/desktop-design-guidelines.md`
  - only if implementation reveals a durable guideline adjustment.

Backend areas expected to remain unchanged:

- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- scanner, transcript import, context package, and Codex runner modules.

If implementation requires new IPC, persistence, filesystem operations, shell access, or backend APIs, stop and ask for human direction before continuing.

### Implementation Steps

1. Create the task worktree from `main` and run baseline checks.
   - `npm run check`
   - `npm test`
   - `npm run test:ui`
   - Record results before edits.

2. Audit the integrated refreshed UI against the design sources.
   - Compare the current app against:
     - `fase3b-tilstandsbibliotek.html`;
     - `fase3b-skjerm-tilstandsinventar.md`;
     - `fase3b-minimumsopplevelse.md`;
     - `fase4-oppgave-08-globale-tilstander.md`;
     - `docs/design/desktop-design-guidelines.md`.
   - Record concrete gaps in the Build Log before fixing them.

3. Check keyboard navigation and focus order.
   - Project entry and project creation dialog.
   - Project overview actions.
   - Folder tree expand/collapse/selection.
   - Transcript import flow.
   - Context package flow.
   - Codex flow.
   - Fix only concrete accessibility or regression issues discovered.

4. Check folder tree accessibility.
   - Confirm `tree`, `treeitem`, `aria-expanded`, and selected/focus behavior match the visual state.
   - Ensure focus and selection are visually different.
   - Ensure arrow-key navigation remains predictable.

5. Check global states and state copy.
   - Empty state.
   - Loading/checking state.
   - Success state.
   - Warning state.
   - Error/no-write state.
   - Partial scan state.
   - Canceled Codex state.
   - Disabled controls.
   - Fix inconsistent state treatment and non-actionable copy where needed.

6. Check responsive behavior.
   - Verify `1280 x 820` reference behavior.
   - Verify `1040 x 720` minimum behavior.
   - Fix overlap, clipped controls, inaccessible primary actions, unreadable text, and unstable layout.
   - Prefer hiding/de-emphasizing lower-priority metadata over hiding primary context/actions.

7. Check non-color-only state communication.
   - Selected folder/file rows.
   - Focused controls.
   - Warnings and errors.
   - Write operations.
   - Disabled state.
   - Add labels, icons, border/shape differences, or copy where color alone carries meaning.

8. Expand Playwright smoke tests.
   - Add or strengthen keyboard-only tests for the main workflows.
   - Add viewport tests for `1040 x 720` and `1280 x 820`.
   - Add assertions for focus visibility/progression where practical.
   - Add state regression assertions for warning/error/success/canceled states where current tests are weak.
   - Prefer stable `data-*` selectors for structure and durable Norwegian labels for user-facing contract.

9. Update documentation only for durable guideline changes.
   - If the implementation reveals a design guideline that should apply later, update `docs/design/desktop-design-guidelines.md`.
   - Do not rewrite consultant analysis or task specs unless there is a concrete divergence to document.

10. Self-review the diff.
   - Confirm no new product features were introduced.
   - Confirm no Electron security boundary changed.
   - Confirm the task remains a polish/regression pass, not a redesign.

### Verification Plan

Automated verification from the task worktree:

```text
npm run check
npm test
npm run test:ui
```

Manual verification for Ready For Review handoff:

- Start the app from the task worktree.
- At `1280 x 820`, select a project folder and confirm the refreshed shell, overview, actions, and context surfaces feel balanced.
- Resize to approximately `1040 x 720` and confirm project context, core stats, folder tree, and primary actions remain usable.
- Use keyboard only to:
  - open/select a project where practical;
  - navigate the folder tree;
  - run through transcript import until preview/cancel;
  - run through context package preview/cancel;
  - focus Codex instruction/mode/action controls.
- Confirm focus is always visible.
- Confirm warnings, errors, selected states, and write operations are understandable without relying on color alone.

### Security And Risk Review

- This task should not change backend behavior, IPC contracts, filesystem behavior, persistence, packaging, or Codex execution.
- Renderer changes must not expose raw filesystem, shell, process, or IPC access.
- No new dependency is planned.
- No automated full accessibility framework is planned; use Playwright smoke coverage and targeted DOM/ARIA assertions unless a separate task approves a dedicated tool.
- Any proposed feature expansion, new IPC, file opening, scan cancellation, persistence, or assistant behavior change must stop Build and return to the human for direction.

### Documentation

- Update this Task Record during Build with:
  - baseline results;
  - concrete issues found during the audit;
  - fixes applied;
  - verification results;
  - Ready For Review manual test instructions.
- Update `docs/design/desktop-design-guidelines.md` only if a durable design rule changes.
- No Decision Record is expected if the task stays within UI polish, tests, and accessibility regression fixes.

### Human Gates

- Required.
- Approval status: Pending.

This is a Major final-pass task across the refreshed UI. Human approval is required before Build.

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
