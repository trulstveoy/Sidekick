# Task: Minimalist UI Refresh

ID: TASK-0006
Status: Done
Class: Standard
Owner: Pair
Created: 2026-05-10
Updated: 2026-05-10

## Summary

Update the Sidekick app UI to follow the minimalist desktop design direction documented in `docs/design/desktop-design-guidelines.md`.

The first refresh should reduce visual noise, keep the three-area desktop workspace, make the folder tree the primary visual focus, and keep actions and metadata quieter unless they are directly relevant to the current workflow.

## Current Phase

Closeout

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [x] Human approval received, if required
- [x] Build complete
- [x] Verification complete
- [x] Review complete
- [x] Documentation complete
- [x] Closeout complete

## Links

Related files:
- `docs/design/desktop-design-guidelines.md`
- `docs/product/vision.md`
- `docs/architecture/application-architecture.md`
- `src/renderer.ts`
- `src/index.css`
- `tests/e2e/renderer-smoke.spec.ts`

Related decisions:
- None yet.

Related tasks:
- `docs/tasks/TASK-0001-inspect-local-folder.md`
- `docs/tasks/TASK-0002-folder-tree-expand-collapse.md`
- `docs/tasks/TASK-0004-context-package-workflow.md`

## Explore Notes

User goal:
- The app should be updated according to the new desktop design guidelines.
- The desired UI direction is minimalist.
- The current UI has too much visual noise.

Current product shape:
- Sidekick is a local-first desktop app for understanding and organizing project folders.
- The primary workflow is selecting a local folder, inspecting its structure, understanding artifact counts and signals, and optionally generating a context package.
- The UI currently uses a three-column work surface:
  - left: selected project, path, runtime, and folder signals;
  - center: read-only folder structure;
  - right: summary, context-package action/result, artifact counts, recent files, and warnings.

Current implementation:
- Renderer UI lives mainly in `src/renderer.ts`.
- Styling lives in `src/index.css`.
- Existing Playwright smoke tests cover the empty state, folder selection, tree behavior, and context-package UI states.
- The Electron security boundary is already documented and should not be changed by this task.

Observed UI risks to address:
- Too many filled surfaces can make the app feel heavier than necessary.
- Sidebar, workspace, inspector, banners, toolbars, and metadata sections can compete visually.
- Helper copy and section treatments can make a simple folder inspection workflow feel more complicated than it is.
- The folder tree should read as the main work area, but surrounding UI can currently draw too much attention.

Design constraints from guidelines:
- Keep the center workspace as the primary visual focus.
- Preserve the three-area desktop shell.
- Prefer structure over decoration.
- Reduce cards, decorative panels, shadows, gradients, and heavy filled blocks.
- Keep actions close to the object or workflow they affect.
- Use compact rows, lists, trees, and tables for project information.
- Keep warnings, empty states, success states, and errors specific and compact.
- Preserve keyboard focus and accessible tree interaction.

Risk level:
- Medium.

Risk drivers:
- This task changes user-facing UI.
- Visual changes can accidentally reduce scanability or accessibility.
- Existing smoke tests may rely on text, layout, or visible state behavior.
- The app should feel simpler without hiding important workflow state.

## Task Spec

Draft status:
- The design direction is known.
- The first-version scope is intentionally limited to simplifying the existing UI.
- The implementation should not introduce new product capabilities.

Goal:
- Refresh the existing Sidekick UI so it better matches the minimalist desktop design guidelines.

Acceptance criteria:
- The app still uses a three-area desktop workspace.
- The center folder tree is visually the strongest work surface.
- Filled panels, borders, and section treatments are reduced where they do not clarify structure.
- Sidebar and inspector content is quieter than the center workspace.
- Empty state text is shorter and focused on the next action.
- Folder tree rows remain expandable and collapsible.
- File rows remain visually quieter than folder rows.
- Primary and secondary actions are visually distinct.
- Context-package preview, confirmation, result, and error states remain visible and understandable.
- Long folder names, filenames, and paths still behave correctly.
- Focus states remain visible.
- No Electron security boundaries are weakened.
- Existing automated tests pass, or tests are updated only to reflect intentional UI changes.
- At least one UI smoke test continues to cover the folder-tree workflow.

Out of scope:
- New navigation model.
- Persistent project database.
- Full design system.
- Dark mode.
- Custom native menu implementation.
- New context menus or keyboard shortcuts, unless needed to preserve an existing command while reducing visible controls.
- New file mutation capabilities.
- New context-package functionality.
- App icon, branding, packaging, or release changes.

## Open Questions

None blocking for the first pass.

Default assumptions:
- Keep the current three-column layout.
- Keep the warm neutral palette but make it quieter.
- Keep all existing product workflows available.
- Prefer CSS simplification before changing TypeScript structure.
- Preserve existing user-facing terminology unless a label is clearly noisy or redundant.

## Initial Implementation Ideas

Likely changes:
- Simplify `src/index.css` surface hierarchy.
- Reduce panel fills and heavy borders.
- Tighten spacing in sidebar and inspector.
- Make the workspace background calmer and the tree area more prominent.
- Reduce banner weight and helper text prominence.
- Make secondary buttons quieter.
- Keep primary action styling reserved for the main call to action.
- Review `src/renderer.ts` copy for text that can be shortened without losing meaning.

Likely tests:
- Run `npm run check`.
- Run `npm run test`.
- Run `npm run test:ui`.
- Manually inspect the app with a fixture folder if visual behavior cannot be fully judged from smoke tests.

## Implementation Plan

First pass scope:
- Keep the existing HTML structure and Electron IPC boundaries.
- Treat the update as a visual and copy cleanup, not a product feature change.
- Change `src/index.css` first, because the current noise is mostly surface hierarchy, spacing, borders, and color weight.
- Change `src/renderer.ts` only for short product copy that currently over-explains the workflow.
- Keep the same visible workflows:
  - choose folder;
  - inspect folder tree;
  - expand and collapse folders;
  - review summary, artifact counts, recent files, and warnings;
  - preview, confirm, generate, and review a context package.

Detailed steps:
1. Reduce global visual weight.
   - Add shared design tokens for text, panel, workspace, border, muted text, and accent colors.
   - Remove hover movement from buttons and rows.
   - Keep focus outlines strong and visible.
2. Calm the shell.
   - Keep three columns, but make sidebar and inspector visually quieter.
   - Make the center workspace the clearest and brightest surface.
   - Reduce padding and gaps so the app reads as a working tool rather than a dashboard.
3. Improve the folder tree emphasis.
   - Keep folder rows stronger than file rows.
   - Reduce pill and border weight.
   - Keep tree expand/collapse affordances visible.
   - Preserve current ARIA roles and button labels.
4. Simplify supporting panels.
   - Reduce repeated list borders.
   - Keep summary numbers compact.
   - Make context-package details readable without making the panel visually dominant.
5. Tighten copy.
   - Shorten empty, loading, ready, and context-package text where it currently explains obvious behavior.
   - Preserve test-facing labels where practical.
6. Verify.
   - Run TypeScript checks.
   - Run unit/integration tests.
   - Run Playwright smoke tests.
   - If a test fails due to intentional copy changes, update only that assertion.

## Human Gate

Human approval should be received before build if the proposed plan changes layout structure, hides existing information, or removes visible actions.

For a first CSS-focused cleanup that preserves all existing workflows, human approval can happen after the spec and plan are reviewed.

## Review Checklist

- [x] UI still supports the same workflows as before.
- [x] Center workspace is the main focus.
- [x] Sidebar and inspector are supportive, not dominant.
- [x] Visual noise is reduced without hiding critical state.
- [x] Folder tree is easier to scan.
- [x] Context-package actions remain clear.
- [x] Accessibility and focus states are preserved.
- [x] Smoke tests cover the changed workflow.

## Build Notes

Implemented changes:
- Added desktop design guidelines in `docs/design/desktop-design-guidelines.md`.
- Simplified `src/index.css` with shared visual tokens and a quieter shell.
- Reduced panel fills, heavy borders, list dividers, hover movement, spacing, and typographic scale.
- Kept the existing three-area workspace and existing renderer state model.
- Shortened explanatory copy in `index.html` and `src/renderer.ts`.
- Preserved existing folder tree behavior, context-package behavior, labels, and ARIA structure.

Files changed:
- `docs/design/desktop-design-guidelines.md`
- `docs/tasks/TASK-0006-minimalist-ui-refresh.md`
- `index.html`
- `src/index.css`
- `src/renderer.ts`

## Verification Log

Commands run:
- `npm run check`
- `npm run test`
- `npm run test:ui`

Result:
- TypeScript and lint passed.
- Unit and integration tests passed: 6 test files, 15 tests.
- Playwright UI smoke tests passed: 4 tests.

## Closeout

The first minimalist UI refresh is complete.

The implementation intentionally avoids new product behavior. The app should now read more like a compact desktop workspace: the center folder tree is clearer, side panels are quieter, and supporting copy is shorter.
