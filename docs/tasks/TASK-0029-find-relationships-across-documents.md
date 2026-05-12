# Task: Find Relationships Across Documents

ID: TASK-0029
Status: Specified
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
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
- `closed/TASK-0023-codex-cli-path-discovery.md`
- `closed/TASK-0024-settings-codex-path.md`
- `TASK-0025-project-summary-from-context.md`
Coordinates with:
- `TASK-0030-generate-thematic-context-packages.md`
- `TASK-0031-local-searchable-project-index.md`

## Summary

Use Codex and the generated context package to find relationships across project documents.

Relationships may include shared themes, dependencies, overlaps, contradictions, recurring participants, or documents that appear to describe the same topic from different angles. The result should be documented in text and designed so it can later support visualization.

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

## Backlog Source

Promoted from `BL-0003`.

## Task Spec

### Problem

Sidekick can scan project structure and generate context packages, but it does not yet help the user understand how documents relate to each other thematically or conceptually.

### Goal

Generate a structured relationship report that explains meaningful connections between documents in a project.

### Scope

- Use a generated context package as the input.
- Run Codex with a relationship-analysis prompt.
- Produce a human-readable relationship report.
- Store the report under `.sidekick/`.
- Include enough structured information to support future visualization.
- Show the relationship report in the GUI.
- Make uncertainty visible instead of inventing relationships.

### Recommended Output

Store generated relationship analysis at:

```text
<project-root>/.sidekick/document-relationships.md
```

Recommended sections:

```markdown
---
sidekick_schema: document-relationships.v1
generated_at: 2026-05-12T12:00:00.000Z
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
- Moving or tagging source files.
- Creating thematic context packages.
- Creating a fully interactive graph unless explicitly scoped in planning.
- Treating Codex output as authoritative when evidence is weak.

### Security Requirements

- Keep filesystem writes in the main process.
- Keep Codex execution in the main process.
- Do not expose raw filesystem, shell, process, or IPC APIs to the renderer.
- Codex should not write relationship files directly.
- Exclude `.sidekick/` from context package input.

### Acceptance Criteria

- [ ] User can generate a relationship analysis from the current context package.
- [ ] Sidekick runs Codex with a dedicated relationship-analysis prompt.
- [ ] Output is stored under `.sidekick/`.
- [ ] Output identifies related documents and explains the relationship in text.
- [ ] Output includes uncertainty/low-confidence notes.
- [ ] GUI can show the latest relationship report.
- [ ] The report is not included in future context package input.
- [ ] Tests cover report writing/parsing and Codex failure behavior.

## Open Points

- What relationship types should be first-class: themes, dependencies, contradictions, participants, chronology, or all of these?
- Should visualization be part of first build, or should first build only create structured text that later visualization can use?
- If visualization is included, should it be graph, matrix, timeline, or thematic cluster view?
- Should the report use Markdown only, or Markdown plus a machine-readable JSON artifact?
- Should relationship generation run automatically after context-package generation, or only on explicit user action?
- How should large context packages be handled if they exceed practical Codex limits?

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
