# Sidekick Agentic Development Supplement

Status: Repository supplement to Superpowers

Superpowers is the governing workflow for agentic work in Sidekick. This document does not define a competing phase model. It defines Sidekick-specific conventions that apply while using Superpowers.

If this document and a Superpowers skill conflict on workflow sequencing, follow Superpowers. If either conflicts with explicit human instructions, explain the conflict and ask for direction.

## Purpose

Sidekick is a secure, local-first Electron desktop application for agentic work. Agent work in this repository must preserve that product and security model while using the Superpowers workflow.

This supplement exists to:

- keep Sidekick's local artifact conventions clear;
- preserve task, decision, backlog, and closeout history;
- make Electron and filesystem security checks explicit;
- define the verification commands expected in this repository;
- prevent Superpowers plans and specs from drifting away from Sidekick's architecture.

## Superpowers Mapping

Use the relevant Superpowers skill first. Then apply the Sidekick-specific rules in this document.

| Work Concern | Governing Superpowers Skill |
| --- | --- |
| New features, behavior changes, design, and specs | `superpowers:brainstorming` |
| Bugs, failures, and unexpected behavior | `superpowers:systematic-debugging` |
| Feature, fix, refactor, or behavior implementation | `superpowers:test-driven-development` |
| Written implementation plans | `superpowers:writing-plans` |
| Isolated task worktrees | `superpowers:using-git-worktrees` |
| Plan execution | `superpowers:subagent-driven-development` or `superpowers:executing-plans` |
| Completion claims and handoff | `superpowers:verification-before-completion` |
| Major feature or pre-merge review | `superpowers:requesting-code-review` |

## Sidekick Operating Rules

Before editing non-trivial code or docs:

1. Invoke the relevant Superpowers skill.
2. Read `AGENTS.md`.
3. Inspect relevant Sidekick code, docs, tests, and existing patterns.
4. Check `git status --short` and preserve user or other-agent changes.
5. Identify whether the task touches security, persistence, packaging, release, or agent workflow rules.

While building:

- Keep changes small and tied to the requested behavior.
- Prefer existing Sidekick patterns over new abstractions.
- Use TDD for implementation unless the human explicitly approves an exception.
- Keep privileged operations in Electron main or preload.
- Update docs when behavior, workflow, persistence, packaging, or security boundaries change.

Before handoff:

- Use `superpowers:verification-before-completion`.
- Run `npm run check` when practical.
- Run narrower or broader checks when the change needs them.
- Report checks that were not run and why.

## Task Artifacts

Superpowers writes its own specs and plans by default:

```text
docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md
docs/superpowers/plans/YYYY-MM-DD-<topic>.md
```

Use those locations unless the human asks for another location.

Sidekick task records are still useful for work that spans sessions, has meaningful risk, or affects durable project history.

Use the smallest durable artifact that fits the task:

- Tiny task: conversation only is usually enough.
- Standard task: conversation plus Superpowers spec/plan when needed; create a Sidekick task record if the work spans sessions or needs durable review context.
- Major task: create or update a Sidekick task record under `docs/tasks/` and use the relevant Superpowers spec/plan flow.

Major tasks include:

- Electron process boundary changes.
- Filesystem access, external process execution, IPC, or renderer bridge changes.
- Persistence or `.sidekick/sidekick.db` schema changes.
- Packaging, signing, release, or CI changes.
- Agent workflow, task artifact, or repository instruction changes.
- New dependencies with security, operational, or packaging impact.

## Task Records

Task records live under:

```text
docs/tasks/TASK-0001-short-title.md
docs/tasks/closed/TASK-0000-completed-title.md
```

Use a task record when a future human or agent should be able to understand the work without reading the chat.

Recommended task record:

```markdown
# Task: <short title>

ID: TASK-0001
Status: Backlog | Exploring | Planned | Building | Verifying | Ready For Review | Done | Blocked | Canceled
Class: Tiny | Standard | Major
Owner: Human | Agent | Pair
Created: YYYY-MM-DD
Updated: YYYY-MM-DD
Branch: task/TASK-0001-short-title
Worktree: ../Sidekick-worktrees/TASK-0001-short-title
Base branch: origin/main
Write scope:
- `path/or/module`
Parallel safety: Safe | Coordinate | Exclusive

## Summary

...

## Superpowers Artifacts

Spec:
- `../superpowers/specs/YYYY-MM-DD-topic-design.md`

Plan:
- `../superpowers/plans/YYYY-MM-DD-topic.md`

## Sidekick Notes

Security:
- ...

Persistence:
- ...

Packaging/release:
- ...

Docs:
- ...

## Verification

Passed:
- `command`

Failed:
- `command`
  Reason:
  Follow-up:

Not run:
- `command`
  Reason:

## Closeout

...
```

Task status should move only when the work actually reaches that state. Use `Blocked` only when progress requires human input or unavailable external access. Use `Done` only after closeout.

Move completed task records to `docs/tasks/closed/` when they are worth retaining.

## Backlog

Use `docs/tasks/BACKLOG.md` for deferred ideas that are not active tasks.

Backlog items should include:

- stable `BL-0000` id;
- status;
- title;
- source;
- why the item was deferred;
- next decision or trigger.

Backlog status values:

- `Candidate`: captured idea that still needs refinement.
- `Deferred`: valid future work, intentionally not part of current scope.
- `Ready for Task`: clear enough to become a task when prioritized.
- `Promoted`: converted to a task record.
- `Dropped`: intentionally not going forward.

Do not build directly from a backlog item. Promote it to a task, then use the relevant Superpowers flow.

## Decision Records

Durable decisions belong in `docs/decisions/`.

Create or update a decision record when work affects:

- Electron security boundaries;
- renderer, preload, IPC, filesystem, shell, or process access;
- persistence, database schema, or generated files under `.sidekick/`;
- packaging, signing, release, CI, or update strategy;
- Codex execution model or sandbox behavior;
- agent workflows, repository instructions, task artifacts, or review rules;
- reusable architectural patterns.

Decision record naming:

```text
docs/decisions/0001-decision-title.md
```

Rules:

- Use a zero-padded number or the repository's existing dated convention.
- Use a short lowercase kebab-case title.
- Do not renumber existing decisions.
- If a decision is superseded, mark that in the document instead of deleting it.

## Worktrees

Use Superpowers worktree guidance when starting isolated implementation work.

Sidekick defaults:

- Tiny documentation or copy edits may happen in the main checkout when conflict risk is low.
- Standard and major implementation work should use a task-specific branch and worktree.
- Workflow docs, shared contracts, package files, CI, release scripts, persistence, and security-sensitive files should be treated as coordination hotspots.

Recommended naming:

```text
Branch: task/TASK-0001-short-title
Worktree: ../Sidekick-worktrees/TASK-0001-short-title
Base branch: origin/main
```

Before creating or using a worktree:

1. Check `git status --short`.
2. Check active task records.
3. Check existing worktrees with `git worktree list`.
4. Identify write scope.
5. Coordinate before editing overlapping files.

Do not stash, reset, overwrite, or absorb user changes without explicit approval.

## Security Checklist

Run this checklist for any change that touches Electron boundaries, filesystem access, external input, local persistence, process execution, networking, package/release behavior, or generated artifacts.

Electron boundaries:

- Renderer has no Node integration.
- Renderer sandbox remains enabled.
- `contextIsolation` remains enabled.
- Preload exposes only typed, task-specific APIs through `contextBridge`.
- Raw `ipcRenderer`, `webContents`, filesystem, shell, process, and terminal APIs are not exposed to renderer.

IPC and inputs:

- Main process validates all renderer input before use.
- Workspace roots come from native selection, creation, or initialization flow.
- Renderer cannot provide arbitrary output paths for privileged writes.
- Relative paths are normalized and checked to stay inside the selected workspace.
- `.sidekick` metadata paths are protected where relevant.

Filesystem and generated artifacts:

- Writes are limited to the requested Sidekick-owned artifact or user-approved location.
- Imports copy rather than move unless explicitly approved.
- Existing user files are not overwritten unless the task explicitly requires and confirms it.
- Symlinks are handled deliberately and not followed by default.
- Generated context packages do not include themselves or `.sidekick` internals.

External process execution:

- Commands use fixed argument arrays where possible.
- User prompts or content are passed through stdin when appropriate.
- No general shell, terminal, arbitrary executable, or sandbox bypass API is exposed.
- Codex `danger-full-access` is not exposed through Sidekick.

External navigation:

- New renderer windows are denied.
- External URLs are opened with `shell.openExternal` only after protocol allow-listing.

Secrets and release:

- Secrets are not written into renderer, preload, logs, generated packages, or task docs.
- Signing material remains a release-job or maintainer-machine concern, not runtime app state.
- Packaging or signing changes are verified against official Electron/Electron Forge documentation.

## Verification Expectations

Default handoff check:

```text
npm run check
```

Additional checks by change type:

| Change Type | Useful Verification |
| --- | --- |
| Main-process domain logic | `npm run test` or targeted Vitest test |
| IPC or shared API contract | `npm run typecheck` plus relevant unit/integration tests |
| Renderer behavior | `npm run test:ui` when practical, or documented manual Electron check |
| Electron security/package config | `npm run check`, relevant config tests, and package check when needed |
| Context package behavior | `npm run verify:packaged-context` when package behavior is affected |
| Release/signing | release scripts/tests plus relevant platform-specific verification |

Always report:

- passed commands;
- failed commands and cause;
- checks not run and why;
- any manual checks performed.

Do not claim work is complete without fresh verification evidence from the current task.

## Documentation Sources

Use primary sources for framework, security, packaging, and lifecycle decisions.

- Use official Electron documentation for Electron runtime and security behavior.
- Use official Electron Forge documentation for packaging, makers, fuses, and release behavior.
- Use Context7 for current library APIs when available.
- Use OpenAI official docs for OpenAI, Codex, and API behavior.
- Prefer primary sources over blog posts for security, packaging, and lifecycle behavior.

## Closeout

Closeout should be concise and concrete.

Include:

- what changed;
- files or artifacts changed;
- verification commands and outcomes;
- security, persistence, packaging, or workflow impact;
- decision records created or updated;
- remaining risks, deferred work, or human decisions.

Use practical status words:

- `fixed`
- `accepted`
- `deferred`
- `blocked`
- `false positive`
- `needs human decision`

Avoid vague process terms unless they are immediately explained in plain language.

## Plain Language

Write tasks, plans, findings, reports, and closeouts in clear practical language.

For every task deliverable, make the concrete output clear:

- what files or artifacts should exist;
- what was verified;
- what happens next;
- which later step depends on the current step.

## Code Comments

Use comments to explain:

- intent;
- security boundaries;
- invariants;
- non-obvious tradeoffs;
- fragile edge cases.

Do not add comments that merely repeat what the code says. Keep comments current when behavior changes, and remove misleading comments instead of preserving them.
