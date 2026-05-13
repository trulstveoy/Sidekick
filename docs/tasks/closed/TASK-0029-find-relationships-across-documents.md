# Task: Find Relationships Across Documents

ID: TASK-0029
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-13
Branch: task/TASK-0029-find-relationships-across-documents
Worktree: ../Sidekick-worktrees/TASK-0029-find-relationships-across-documents
Base branch: origin/main
Write scope:
- `src/main/context-package.ts`
- `src/main/document-relationships.ts`
- `src/main/prompts/document-relationships.nb.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0029-find-relationships-across-documents.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0004-context-package-workflow.md`
- `closed/TASK-0010-controlled-codex-panel.md`
- `closed/TASK-0020-context-package-workflow-refresh.md`
- `closed/TASK-0021-controlled-codex-assistant-refresh.md`
- `closed/TASK-0023-codex-cli-path-discovery.md`
- `closed/TASK-0024-settings-codex-path.md`
- `closed/TASK-0033-revised-navigation-model.md`
Coordinates with:
- `TASK-0025-project-summary-from-context.md`
- `TASK-0030-generate-thematic-context-packages.md`
- `TASK-0031-local-searchable-project-index.md`
- `TASK-0034-folder-scoped-context-package.md`
- `BACKLOG.md` (`BL-0008`)

## Summary

Use Codex and generated context to find relationships across project documents.

The first version should produce a traceable relationship report for the selected physical project folder. It should be designed so later work can support visualization, search, thematic packages, and possible logical-project models without treating weak Codex inferences as facts.

## Current Phase

Done

Build, verification, merge, and human GUI review are complete.

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

## Backlog Source

Promoted from `BL-0003`.

## Links

Related docs:
- `../architecture/desktop-design-guidelines.md`
- `../architecture/product-vision.md`
- `../architecture/prosjektuavhengig-innholdsmodell.md`

Related tasks:
- `TASK-0025-project-summary-from-context.md`
- `TASK-0030-generate-thematic-context-packages.md`
- `TASK-0031-local-searchable-project-index.md`
- `TASK-0034-folder-scoped-context-package.md`

## Explore Notes

Current baseline:

- Sidekick can scan project folder structure and classify files and folder signals.
- Sidekick can generate full-project context packages.
- `TASK-0034` is separately scoped for folder-scoped context packages.
- `TASK-0030` is separately scoped for thematic context packages.
- The revised navigation model keeps long-running generation workflows in the primary workspace and keeps the context surface tied to selection.
- Codex is a controlled assistant operation with typed APIs and no raw shell access.
- The project-independent content model is only a draft exploration. This task should not implement logical projects or shared libraries, but the generated report should include source scope so future models can distinguish physical and logical context.

## Task Spec

### Problem

Sidekick can scan project structure and generate context packages, but it does not yet help the user understand how documents relate to each other thematically or conceptually.

Users need a report that points out likely connections while preserving uncertainty and source traceability.

### Goal

Generate a structured relationship report that explains meaningful connections between documents in the selected project.

Relationships may include shared themes, dependencies, overlaps, contradictions, recurring participants, chronology, or documents that appear to describe the same topic from different angles.

### Scope

- Use an explicit user-triggered relationship-analysis workflow.
- Generate a fresh full-project context package as the first-version input.
- Run Codex with a relationship-analysis prompt.
- Produce a human-readable relationship report.
- Store the report under `.sidekick/`.
- Include enough structured information to support future visualization or filtering.
- Show the latest relationship report from project context or a dedicated primary-workspace view.
- Make uncertainty visible instead of inventing relationships.
- Include source scope metadata so the report is traceable to the input context.
- Exclude `.sidekick/` and generated reports from context-package input.
- Keep the first version scoped to the selected physical project folder.
- Keep the first version Markdown-only, but structure it so later parsing or visualization is possible.

### Recommended Output

Store generated relationship analysis at:

```text
<project-root>/.sidekick/document-relationships.md
```

Recommended sections:

```markdown
---
sidekick_schema: document-relationships.v1
generated_at: 2026-05-13T12:00:00.000Z
source_scope: full-project
source_model: physical-project-folder
context_package_path: ./<project-name>.context-package.md
context_package_sha256: <hash>
summary_language: nb
---

# Sidekick Document Relationships

## Overview

## Relationship Map

Each relationship should include:

- relationship type;
- related source documents;
- explanation;
- supporting evidence or source references when available;
- confidence: high, medium, or low.

## Thematic Clusters

## Notable Overlaps

## Possible Contradictions

## Low Confidence Or Missing Evidence
```

### Non-goals

- Replacing search.
- Editing source documents.
- Moving, tagging, or annotating source files.
- Creating thematic context packages.
- Creating folder-scoped context packages.
- Creating a fully interactive graph unless explicitly scoped in a later plan.
- Automatic relationship generation after every context-package generation.
- Treating Codex output as authoritative when evidence is weak.
- Cross-project relationship analysis or logical-project relationship analysis.
- Producing a separate JSON artifact in the first version.
- Implementing chunking or multi-pass analysis for oversized context packages.
- Letting the user choose among historical context packages in the first version.

### UI Requirements

- Relationship generation runs as an explicit workflow in the primary workspace.
- The right context surface should not become the generation progress surface.
- The latest relationship report may be surfaced from project context, but detailed report reading can use a dedicated primary-workspace view if planning chooses that.
- User-facing labels should be Norwegian.
- Uncertainty and low-confidence sections should be visible, not hidden behind success styling.
- If the context package is too large for practical analysis, fail clearly and point users toward future folder-scoped or thematic context-package workflows rather than attempting an unreliable run.

### Security Requirements

- Keep filesystem writes in the main process.
- Keep Codex execution in the main process.
- Do not expose raw filesystem, shell, process, or IPC APIs to the renderer.
- Do not let the renderer provide arbitrary Codex command arguments.
- Codex should not write relationship files directly.
- Exclude `.sidekick/` from context package input.
- Validate that report reads and writes remain inside the selected project root.

### Acceptance Criteria

- [x] User can generate a relationship analysis from a freshly generated full-project context package.
- [x] Sidekick runs Codex with a dedicated relationship-analysis prompt.
- [x] Output is stored under `.sidekick/`.
- [x] Output identifies related documents and explains the relationship in text.
- [x] Output includes source scope and context hash metadata.
- [x] Output includes uncertainty/low-confidence notes.
- [x] Output is Markdown-only in the first version.
- [x] GUI can show the latest relationship report without turning the context surface into workflow progress.
- [x] The report is not included in future context package input.
- [x] Oversized context packages fail with clear no-write feedback before Codex analysis starts.
- [x] Tests cover report writing/parsing and Codex failure behavior.
- [x] UI smoke coverage covers starting analysis, success, failure, and viewing the latest report.

## Resolved Planning Decisions

- First-class relationship types for the first report:
  - shared themes;
  - document overlap;
  - document dependency;
  - possible contradiction;
  - chronology;
  - recurring participants or organizations.
- Visualization is not part of the first build. First build creates structured text that can support later visualization.
- Later visualization options remain open. The likely candidates are thematic cluster view or graph view. Timeline should wait until chronology proves useful.
- The first version writes one Markdown report only. It should use YAML frontmatter and repeated structured sections rather than a separate JSON artifact.
- Relationship generation should generate a fresh full-project context package as part of the workflow. The report stores the source context path and hash so it is traceable.
- Large context packages should fail with a clear message before Codex analysis starts. First build should not implement chunking, splitting, or multi-pass analysis.
- First build analyzes the selected physical project folder only. The report should include `source_scope` and `source_model` so future logical-project or shared-library reports can coexist with this format.

## Deferred Questions

- Should later builds generate a machine-readable JSON sidecar for graph visualization?
- Should later builds support relationship analysis over folder-scoped, thematic, manual-selection, or logical-project context?
- Should later builds support chunked analysis for very large projects?

## Implementation Plan

### Build Control

This is a major task and must be built in a dedicated worktree.

Build setup:

1. Preserve unrelated local edits in the main checkout.
2. Create or reuse `../Sidekick-worktrees/TASK-0029-find-relationships-across-documents`.
3. Use a branch named `task/TASK-0029-find-relationships-across-documents`.
4. Base the task branch on the current local task-spec commits plus `origin/main`, because this task depends on the closed `TASK-0034` work currently on `origin/main`.
5. Build only inside the task worktree.
6. Make separate commits for the implementation steps below.
7. Run targeted verification before each commit when practical, and full verification before Ready For Review.

### Step 0: Baseline And Integration

Goal: prepare the task branch without losing existing local task documentation or the `TASK-0034` implementation.

Actions:

- Create or reuse the task worktree.
- Integrate `origin/main` so the task branch includes closed `TASK-0034`.
- Resolve conflicts by preserving newer implemented code and the current TASK-0029 spec.
- Run baseline verification.

Verification:

```bash
npm run check
npm test
```

Commit:

- No implementation commit unless conflict-resolution changes are required.

### Step 1: Main-Process Relationship Report Service

Goal: add the filesystem and report-generation service without exposing new privileged renderer APIs.

Actions:

- Add `src/main/document-relationships.ts`.
- Add `src/main/prompts/document-relationships.nb.ts`.
- Ensure `.sidekick/` exists before writing the report.
- Generate a fresh full-project context package and compute a SHA-256 hash of the generated context file.
- Build a Norwegian Codex prompt for relationship analysis.
- Run Codex through the existing controlled runner.
- Write only the final Sidekick-owned report to `<project-root>/.sidekick/document-relationships.md`.
- Add helpers to read the latest report and parse frontmatter needed by the UI.
- Add a practical context-size guard before starting Codex analysis.

Verification:

```bash
npm run check
npm test -- tests/unit tests/integration
```

Commit:

```text
feat: add document relationship report service
```

### Step 2: Typed IPC Contract

Goal: expose relationship analysis through narrow, task-specific APIs.

Actions:

- Extend `src/shared/sidekick-api.ts` with request/result/report-status types.
- Add main-process IPC handlers in `src/main.ts`.
- Add preload bridge methods in `src/preload.ts`.
- Validate selected project roots before reading or writing relationship reports.
- Do not expose raw paths beyond the existing selected-project contract.

Verification:

```bash
npm run check
npm test -- tests/unit tests/integration
```

Commit:

```text
feat: expose document relationship APIs
```

### Step 3: Renderer Workflow And Report View

Goal: let users run analysis and inspect the latest report from the revised navigation model.

Actions:

- Add a global action for relationship analysis in the action bar or overflow area.
- Render the workflow in the primary workspace, not the right context surface.
- Show Norwegian labels and states for preparing context, analyzing, success, failure, and oversized-context failure.
- Show latest report availability in project context without turning the right surface into workflow progress.
- Add a primary-workspace report view for reading the latest Markdown report.
- Keep global actions disabled or guarded during active relationship analysis.

Verification:

```bash
npm run check
npm run test:ui -- --grep "relationship|context|Codex"
```

Commit:

```text
feat(ui): add document relationship workflow
```

### Step 4: Exclusion, Regression Tests, And Documentation

Goal: verify the report is traceable, excluded from future context, and safe to review.

Actions:

- Ensure `.sidekick/` and relationship reports are excluded from generated context packages.
- Add integration tests for report writing, report reading, context hash metadata, Codex failure, and oversized context handling.
- Add UI smoke tests for starting analysis, success, failure, and viewing the latest report.
- Update task Build Log and Verification Log.

Verification:

```bash
npm run check
npm test
npm run test:ui
```

Commit:

```text
test: cover document relationship workflow
```

### Final Verification Before Ready For Review

Run from the task worktree:

```bash
npm run check
npm test
npm run test:ui
```

Final Ready For Review message should include:

- worktree path;
- commit list;
- verification results;
- any known limitations;
- concrete human GUI checks:
  - select a project;
  - start relationship analysis;
  - confirm a new context package is generated first;
  - confirm the workflow runs in the primary workspace;
  - confirm the report appears under `.sidekick/document-relationships.md`;
  - confirm low-confidence/uncertainty sections are visible;
  - confirm the latest report can be viewed in the GUI.

## Build Log

- 2026-05-13: Created dedicated worktree `../Sidekick-worktrees/TASK-0029-find-relationships-across-documents` on branch `task/TASK-0029-find-relationships-across-documents`.
- 2026-05-13: Integrated `origin/main` so the branch includes closed `TASK-0034` folder-scoped context-package work. Resolved conflicts by preserving both project-summary generation and folder-scoped context-package generation.
- 2026-05-13: Added `src/main/document-relationships.ts` and `src/main/prompts/document-relationships.nb.ts`.
- 2026-05-13: Added report read/write handling for `<project-root>/.sidekick/document-relationships.md`, YAML frontmatter metadata, context-package SHA-256 metadata, section validation, oversized-context guard, and typed missing/invalid/complete states.
- 2026-05-13: Added narrow IPC/preload APIs: `readDocumentRelationships(rootPath)` and `generateDocumentRelationships(rootPath)`.
- 2026-05-13: Added renderer workflow in the primary workspace with Norwegian states for missing report, generation, success, failure, and latest-report reading.
- 2026-05-13: Added project-context status and a `Vis rapport` action without using the right context surface as the progress surface.
- 2026-05-13: Added Playwright coverage for successful report generation/viewing and failed relationship analysis.
- Note: Step 1 and Step 2 were committed together in `e4d10b2` because the typed IPC contract was needed to verify the main-process service end to end.

## Verification Log

- 2026-05-13: Baseline after integrating `origin/main`: `npm run check` passed, `npm test` passed.
- 2026-05-13: After backend/API implementation: `npm run check` passed, `npm test` passed. Vitest result: 21 files, 93 tests.
- 2026-05-13: After renderer workflow and UI regression tests: `npm run check` passed, `npm run test:ui` passed. Playwright result: 29 tests passed.
- 2026-05-13: Final verification before Ready For Review passed:
  - `npm run check`
  - `npm test` (21 files, 93 tests)
  - `npm run test:ui` (29 tests)

## Review Notes

Human GUI review accepted on 2026-05-13. The user confirmed that the feature works.

Reviewed GUI flow:

- Select a project.
- Start `Finn sammenhenger`.
- Confirm the workflow runs in the primary workspace.
- Confirm the analysis first creates a fresh full-project context package.
- Confirm `.sidekick/document-relationships.md` is written.
- Confirm uncertainty and low-confidence sections are visible in the report.
- Confirm the latest report can be opened again from the project context surface with `Vis rapport`.
- Confirm an oversized or failed analysis shows clear no-write feedback.

## Documentation Notes

- Task record updated with build results, verification evidence, and review steps.
- No architecture decision record was added because this task follows existing persistence and Codex-runner patterns and does not introduce a new durable architecture decision beyond the task specification.

## Closeout

- Completed on 2026-05-13.
- Merged to `main` with merge commit `53b4908`.
- Final main-branch verification after merge:
  - `npm run check`
  - `npm test` (22 files, 98 tests)
  - `npm run test:ui` (29 tests)
- Human GUI test passed.
- Task record moved to `docs/tasks/closed/`.
