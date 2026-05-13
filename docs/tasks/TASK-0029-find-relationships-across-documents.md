# Task: Find Relationships Across Documents

ID: TASK-0029
Status: Specified
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

Specify

Specification is updated. Planning has not started.

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
- Use a generated context package as the first-version input.
- Run Codex with a relationship-analysis prompt.
- Produce a human-readable relationship report.
- Store the report under `.sidekick/`.
- Include enough structured information to support future visualization or filtering.
- Show the latest relationship report from project context or a dedicated primary-workspace view.
- Make uncertainty visible instead of inventing relationships.
- Include source scope metadata so the report is traceable to the input context.
- Exclude `.sidekick/` and generated reports from context-package input.

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
context_package_path: ./<project-name>.context-package.md
context_package_sha256: <hash>
summary_language: nb
---

# Sidekick Document Relationships

## Overview

## Relationship Map

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

### UI Requirements

- Relationship generation runs as an explicit workflow in the primary workspace.
- The right context surface should not become the generation progress surface.
- The latest relationship report may be surfaced from project context, but detailed report reading can use a dedicated primary-workspace view if planning chooses that.
- User-facing labels should be Norwegian.
- Uncertainty and low-confidence sections should be visible, not hidden behind success styling.

### Security Requirements

- Keep filesystem writes in the main process.
- Keep Codex execution in the main process.
- Do not expose raw filesystem, shell, process, or IPC APIs to the renderer.
- Do not let the renderer provide arbitrary Codex command arguments.
- Codex should not write relationship files directly.
- Exclude `.sidekick/` from context package input.
- Validate that report reads and writes remain inside the selected project root.

### Acceptance Criteria

- [ ] User can generate a relationship analysis from the selected project's current generated context.
- [ ] Sidekick runs Codex with a dedicated relationship-analysis prompt.
- [ ] Output is stored under `.sidekick/`.
- [ ] Output identifies related documents and explains the relationship in text.
- [ ] Output includes source scope and context hash metadata.
- [ ] Output includes uncertainty/low-confidence notes.
- [ ] GUI can show the latest relationship report without turning the context surface into workflow progress.
- [ ] The report is not included in future context package input.
- [ ] Tests cover report writing/parsing and Codex failure behavior.
- [ ] UI smoke coverage covers starting analysis, success, failure, and viewing the latest report.

## Open Points For Future Planning

- What relationship types should be first-class: themes, dependencies, contradictions, participants, chronology, or all of these?
- Should visualization be part of first build, or should first build only create structured text that later visualization can use?
- If visualization is included, should it be graph, matrix, timeline, or thematic cluster view?
- Should the report use Markdown only, or Markdown plus a machine-readable JSON artifact?
- Should relationship generation use the latest full-project context package, generate a fresh one, or let the user choose?
- How should large context packages be handled if they exceed practical Codex limits?
- How should this report evolve if Sidekick later supports logical projects or shared content libraries?

## Implementation Plan

Not started. Stop after Specify until this task is explicitly approved for planning.

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
