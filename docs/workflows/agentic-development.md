# Agentic Development Workflow

Status: Draft

This document defines a general workflow for agentic software development. It is intended for coding agents and humans working together in any repository.

This document is written primarily for the agent to follow. Sections marked as Human Gates require action or approval from the human working with the agent.

The workflow is deliberately tool-neutral. It does not require a specific agent framework, package manager, test runner, language, or application stack. Repository-specific rules, commands, architecture notes, and security requirements should live in the repository's local instructions, such as `AGENTS.md`, `README.md`, or project docs.

## Workflow At A Glance

1. Explore
2. Specify
3. Plan
4. Build
5. Verify
6. Ready For Review
7. Review
8. Document
9. Close

## Purpose

Agentic development can move quickly, but speed is only useful when the work remains understandable, reviewable, and verifiable.

This workflow exists to:

- make agent-assisted work repeatable;
- reduce guesswork before edits;
- keep humans in control of important decisions;
- create clear verification habits;
- preserve important context for future sessions;
- prevent security and maintainability regressions.

## Core Operating Model

Every non-trivial task should maintain one continuous **Task Record**.

See the template under "Task Record Template" later in this document.

The Task Record is the thread that connects the workflow. It starts as exploration notes, becomes a specification, becomes a plan, receives build and verification logs, and ends as a closeout summary.

The Task Record is not bureaucracy. It is a compact working artifact that lets a human or a future agent answer:

- What are we trying to do?
- What do we know?
- What did we decide?
- What changed?
- What was verified?
- What remains uncertain?

### Task Record Lifecycle

```text
Task Record
  -> Explore Notes
  -> Task Spec
  -> Implementation Plan
  -> Build Log
  -> Verification Log
  -> Review Notes
  -> Documentation Notes
  -> Closeout
```

### Where The Task Record Lives

Use the smallest durable artifact that fits the task.

- Tiny task: usually conversation only.
- Standard task: conversation by default; repository task document if the work spans sessions or has meaningful risk.
- Major task: repository task document, unless the repository has a stronger existing tracking system.

If a repository has a task-doc convention, follow it. If not, a reasonable default is:

```text
docs/tasks/TASK-0001-short-title.md
```

### Task Status Model

Use this light task-tracking model when a task needs explicit state.

```text
Backlog
Exploring
Specified
Planned
Approved
Building
Verifying
Ready For Review
Reviewing
Documenting
Done
Blocked
Canceled
```

Status rules:

- Move status forward when a workflow phase is completed.
- Use `Backlog` for a Task Record that already exists but is not yet being explored or planned.
- Use the repository backlog document for smaller deferred ideas that are not yet Task Records.
- Use `Blocked` when progress requires human input or unavailable external access.
- Use `Approved` only when a required human gate has been cleared.
- Use `Ready For Review` when build and verification are complete and the task is waiting for human review.
- Use `Done` only after closeout.
- Move task records with `Done` status into the repository's closed-task archive when one exists.
- Use `Canceled` when the task is intentionally abandoned.

### Task Classes

Use the smallest workflow that still protects quality.

#### Tiny

Examples:

- Fix a typo.
- Adjust simple copy.
- Rename a label.
- Make a small formatting or style tweak.
- Update a narrow documentation sentence.

Required artifacts:

- No formal Task Record required unless the repository requires one.
- Final response should still say what changed and whether verification ran.

For tiny tasks, the agent should still confirm what changed and, when relevant, state whether simple verification was performed, such as checking the edited file for syntax errors or confirming that a link still works.

#### Standard

Examples:

- Add a focused feature.
- Fix a bug.
- Change a user-facing behavior.
- Add a small API endpoint or integration point.
- Refactor a small module.
- Add or update tests for a contained behavior.

Required artifacts:

- Task Record in the conversation or a task document.
- Explore Notes.
- Task Spec.
- Implementation Plan.
- Verification Log.
- Closeout.

#### Major

Examples:

- Architecture changes.
- Persistence or data model changes.
- Authentication, authorization, or security-sensitive changes.
- Packaging, deployment, release, infrastructure, or update changes.
- Large UX or navigation changes.
- Cross-system integrations.
- New dependencies with meaningful operational or security impact.

Required artifacts:

- Task Record in a repository task document.
- Explore Notes.
- Task Spec.
- Implementation Plan.
- Explicit human approval before Build.
- Build Log.
- Verification Log.
- Review Notes.
- Documentation Notes.
- Closeout.
- Decision record when the decision is durable.

### Artifact Summary

| Artifact | Tiny | Standard | Major |
| --- | --- | --- | --- |
| Explore Notes | – | ✓ | ✓ |
| Task Spec | – | ✓ | ✓ |
| Implementation Plan | – | ✓ | ✓ |
| Human Approval | – | – | ✓ |
| Build Log | – | – | ✓ |
| Verification Log | – | ✓ | ✓ |
| Decision Record | – | Optional | Optional |
| Closeout | – | ✓ | ✓ |

## Task Record Template

Use this template for standard or major work when a persistent task document is useful.

```markdown
# Task: <short title>

ID: TASK-0001
Status: Backlog
Class: Tiny | Standard | Major
Owner: Human | Agent | Pair
Created: YYYY-MM-DD
Updated: YYYY-MM-DD
Branch: task/TASK-0001-short-title
Worktree: ../repo-worktrees/TASK-0001-short-title
Base branch: origin/main
Write scope:
- `path/or/module`
Parallel safety: Safe | Coordinate | Exclusive

## Summary

...

## Current Phase

Explore | Specify | Plan | Build | Verify | Review | Document | Close

## Progress Checklist

- [ ] Explore complete
- [ ] Spec complete
- [ ] Plan complete
- [ ] Worktree created or reused, if required
- [ ] Human approval received, if required
- [ ] Build complete
- [ ] Verification complete
- [ ] Review complete
- [ ] Documentation complete
- [ ] Closeout complete

## Links

Related files:
- ...

Related decisions:
- ...

Related docs:
- ...

## Explore Notes

...

## Task Spec

...

## Implementation Plan

...

## Build Log

...

## Verification Log

...

## Review Notes

...

## Documentation Notes

...

## Closeout

...
```

## Repository Organization For Workflow Artifacts

The workflow should be easy to follow from the repository tree. A future agent should be able to locate active tasks, decisions, workflow rules, and supporting documentation without reading chat history.

Repositories may already have their own documentation layout. If they do, use the local convention. If not, the following structure is recommended.

### Recommended Directory Layout

```text
docs/
  workflows/
    agentic-development.md
  tasks/
    BACKLOG.md
    TASK-0001-short-title.md
    TASK-0002-short-title.md
    closed/
      TASK-0000-completed-title.md
  decisions/
    0001-decision-title.md
    0002-decision-title.md
  templates/
    task-record.md
    decision-record.md
```

### Directory Responsibilities

`docs/workflows/`

- Contains repeatable process documentation.
- Describes how work should happen.
- Should be relatively stable.
- Should not contain task-specific notes.

`docs/tasks/`

- Contains active persistent Task Records.
- Used for standard work that spans sessions and for major work.
- Captures the lifecycle from Explore through Close.
- Serves as the lightweight task tracker.

`docs/tasks/BACKLOG.md`

- Contains deferred ideas and candidate work that may become tasks later.
- Used when useful future work is discovered but intentionally left out of the current task.
- Keeps active task records focused on approved or planned work.
- Should not contain full implementation plans.
- Should link back to the source task, report, or decision when possible.

`docs/tasks/closed/`

- Contains completed Task Records.
- Used after a task reaches `Done`.
- Keeps active task discovery focused on work that is not finished.
- Preserves closed task history without deleting or renumbering records.

`docs/decisions/`

- Contains durable decision records.
- Used when a decision changes architecture, security boundaries, persistence, deployment, or reusable patterns.
- Should explain context, decision, and consequences.
- Should not be used for ordinary task status.

`docs/templates/`

- Optional.
- Contains reusable blank templates for task records, decision records, or review checklists.
- Useful when a repository creates many task or decision documents.

### Naming Patterns

Use predictable names that sort well and are easy to reference.

Task records:

```text
docs/tasks/TASK-0001-short-title.md
docs/tasks/closed/TASK-0000-completed-title.md
```

Rules:

- Use `TASK-` followed by a zero-padded number.
- Use a short lowercase kebab-case title.
- Keep the title stable after creation unless it is misleading.
- Do not reuse task IDs.
- Keep active task records directly under `docs/tasks/`.
- Move completed task records to `docs/tasks/closed/` during closeout.

Backlog:

```text
docs/tasks/BACKLOG.md
```

Backlog item rules:

- Use `BL-` followed by a zero-padded number for backlog items, for example `BL-0001`.
- Do not reuse backlog item IDs.
- Keep each item short and task-ready.
- Include status, title, source, reason deferred, and next step.
- Mark an item as `Promoted` when it becomes a Task Record, and link to that task.
- Do not use backlog items as a substitute for an approved task plan.

Decision records:

```text
docs/decisions/0001-decision-title.md
```

Rules:

- Use a zero-padded number.
- Use a short lowercase kebab-case title.
- Do not renumber existing decisions.
- If a decision is superseded, mark it in the document instead of deleting it.

Workflow documents:

```text
docs/workflows/<workflow-name>.md
```

Rules:

- Use lowercase kebab-case.
- Keep workflow documents general and reusable.
- Put repository-specific commands and policies in local instructions unless the workflow itself is intentionally repository-specific.

Templates:

```text
docs/templates/task-record.md
docs/templates/decision-record.md
```

Rules:

- Keep templates blank and reusable.
- Avoid task-specific examples unless they are clearly marked as examples.

### Task Record Indexing

For small repositories, a separate task index is optional because filenames and statuses inside task files may be enough.

For larger repositories, add:

```text
docs/tasks/README.md
```

The task index can contain:

```markdown
# Tasks

| ID | Status | Class | Title | Updated |
| --- | --- | --- | --- | --- |
| TASK-0001 | Done | Major | Short title | YYYY-MM-DD |
| TASK-0002 | Building | Standard | Short title | YYYY-MM-DD |
```

Index rules:

- Keep it lightweight.
- Update it only when a persistent task document is created or changes final state.
- Do not duplicate full task details in the index.

### Backlog Management

Use a backlog when the repository repeatedly discovers useful future work during active tasks.

The backlog is for ideas that are worth preserving but not ready or approved as active tasks. Typical examples:

- follow-up workflows deferred from the current task;
- cleanup that is valid but not part of the current scope;
- product ideas that need prioritization;
- investigation topics that need a future decision.

Backlog items should answer:

- What is the idea?
- Where did it come from?
- Why is it not part of the current task?
- What decision or trigger would make it active work?

Recommended backlog statuses:

- `Candidate`: captured idea that still needs refinement.
- `Deferred`: valid future work, intentionally not part of current scope.
- `Ready for Task`: clear enough to become a task when prioritized.
- `Promoted`: converted to a Task Record.
- `Dropped`: intentionally not going forward.

Promotion rules:

- Create a normal `TASK-0000-title.md` file when a backlog item becomes active work.
- Keep the backlog item and mark it `Promoted`.
- Link from the backlog item to the task record.
- Link from the task record back to the backlog item when the relationship matters.
- Do not start building directly from a backlog item; specify and plan the task first.

### Artifact Placement Rules

- Tiny task artifacts usually stay in the conversation.
- Standard task artifacts stay in the conversation unless the work spans sessions, has meaningful risk, or needs later review.
- Major task artifacts should be stored in `docs/tasks/` while active.
- Deferred ideas and future-work candidates should be captured in `docs/tasks/BACKLOG.md` when they are worth preserving.
- Completed task records should be moved to `docs/tasks/closed/` when they reach `Done`.
- Durable decisions belong in `docs/decisions/`, even if they started inside a task record.
- Workflow changes belong in `docs/workflows/`.
- Reusable blank forms belong in `docs/templates/`.

### Linking Between Artifacts

Artifacts should reference each other when the relationship is durable.

Task Records should link to:

- related decision records;
- relevant workflow docs;
- important source files or modules;
- related tasks.

Decision records should link to:

- the task that produced the decision, if one exists;
- prior decisions that are superseded or extended.

Links should be simple relative paths:

```markdown
Related decisions:
- `../decisions/0001-decision-title.md`

Related tasks:
- `TASK-0002-short-title.md`
```

### Cleanup And Retention

Task Records are useful project memory. Do not delete them just because the task is done.

Recommended retention rules:

- Keep completed major task records.
- Keep completed standard task records when they explain non-obvious context.
- Archive or remove trivial task records if they add no long-term value.
- Preserve decision records permanently unless the repository has an explicit archival policy.

### Natural Extensions

Do not create extra artifact categories before they have a clear use. A small repository can work well with only workflows, tasks, decisions, and templates.

As the repository grows, these optional directories may become useful:

```text
docs/
  architecture/
  specs/
  runbooks/
  testing/
  research/
```

`docs/architecture/`

- Describes how the system is structured.
- Useful when the project has multiple modules, processes, services, trust boundaries, or data flows.
- Should explain the current system, not every abandoned alternative.

`docs/specs/`

- Contains larger product or feature specifications.
- Useful when a feature spans multiple tasks or requires product-level alignment.
- Should define behavior, scope, constraints, and acceptance criteria at a higher level than a single task.

`docs/runbooks/`

- Contains operational procedures.
- Useful for release, rollback, deployment, incident response, signing, updates, migrations, or environment setup.
- Should be procedural and executable by someone who was not part of the original implementation.

`docs/testing/`

- Contains test strategy, manual QA procedures, compatibility matrices, or verification checklists.
- Useful when verification becomes broader than a few commands in a task record.
- Should clarify what must be tested, when, and how.

`docs/research/`

- Contains investigation notes, spikes, comparisons, and discarded alternatives.
- Useful when exploration is too large to fit inside a task record.
- Should feed into a decision record when the research produces a durable choice.

Extension rules:

- Add a directory only when at least one concrete document belongs there.
- Prefer tasks and decisions until the need for a new category is clear.
- Keep boundaries between categories explicit.
- If a research note leads to a durable decision, summarize the outcome in `docs/decisions/` and link back to the research.
- If a large spec creates implementation work, link it to one or more task records.

## Agent Worktrees

Use Git worktrees to keep parallel agent work isolated. The main repository checkout should normally act as the control and integration surface; substantial task work should happen in a task-specific worktree.

### Purpose

Agent worktrees exist to:

- reduce conflicts between agents;
- make task ownership explicit;
- keep unmerged changes out of the main checkout;
- make review and integration easier;
- preserve a clean place for release, CI, and final verification commands.

### Default Rule

For standard and major tasks, create or reuse a task-specific worktree before Build begins.

Tiny documentation or copy edits may happen in the main checkout when there is no realistic conflict risk. If a tiny task touches files likely to be edited by other agents, use a worktree anyway.

If the agent is already inside the correct task worktree, it should reuse that worktree and record it in the Task Record. Do not create a second worktree for the same task unless there is an explicit reason.

Recommended naming:

```text
Branch: task/TASK-0001-short-title
Worktree: ../<repo-name>-worktrees/TASK-0001-short-title
```

If a repository already has a worktree convention, follow it. If the repository uses a repo-local `.worktrees/` directory, that directory should be ignored by version control.

### Task Record Fields

When a persistent Task Record exists, include enough worktree information for another agent to understand where work is happening.

During active work, the Task Record's source of truth is the task worktree. The agent should update the Task Record in the assigned worktree together with code and documentation changes. Do not maintain a second live copy in the main checkout; the Task Record is merged back to the main checkout during integration.

Recommended fields:

```markdown
Branch: task/TASK-0001-short-title
Worktree: ../repo-worktrees/TASK-0001-short-title
Base branch: origin/main
Write scope:
- `path/or/module`
Parallel safety: Safe | Coordinate | Exclusive
Depends on:
- ...
Blocks:
- ...
```

Use `Safe` when the work has a disjoint write scope. Use `Coordinate` when another active task may touch nearby files. Use `Exclusive` when only one agent should work in the area at a time, such as broad architecture, package management, release workflows, or shared agent instructions.

The base branch should describe the latest intended integration base. This is usually `origin/main`. If local `main` commits must be included, push them first or explicitly choose local `main` as the base and record that choice in the Task Record.

### Starting A New Task

Before creating or entering a worktree, the agent should:

1. Check the main checkout status.
2. Check existing active Task Records in the main checkout and in known task worktrees.
3. Check existing worktrees with `git worktree list`.
4. Identify likely write scope.
5. Look for overlapping active work.
6. Create or reuse the task branch and worktree.
7. Record branch, worktree, base branch, and write scope in the Task Record when one exists.

If the main checkout has uncommitted changes, stop and classify them as user work, other-agent work, or current-task work before creating or integrating a worktree. Do not stash, reset, overwrite, or absorb those changes without explicit approval.

Default command shape:

```text
git fetch
git worktree add ../<repo-name>-worktrees/TASK-0001-short-title -b task/TASK-0001-short-title <base-ref>
```

Usually `<base-ref>` is `origin/main`.

If the branch already exists, reuse it instead of creating another branch for the same task:

```text
git worktree add ../<repo-name>-worktrees/TASK-0001-short-title task/TASK-0001-short-title
```

After creating or entering the worktree, run a relevant baseline check when practical. If the baseline fails, record the failure before implementation so later agents can distinguish pre-existing failures from task regressions.

### Working Rules

While working in a task worktree, the agent should:

- make task edits only inside the assigned worktree;
- keep the main checkout free for integration and quick inspection;
- avoid editing another task's worktree;
- keep file ownership aligned with the Task Record write scope;
- coordinate before touching files owned by another active task;
- run verification from the task worktree unless repository instructions require otherwise;
- update the Task Record when write scope changes.

The agent should not:

- create multiple worktrees for the same task without a clear reason;
- use the main checkout for substantial implementation while a task worktree exists;
- assume a clean main checkout means no other agent is working;
- resolve conflicts by discarding another agent's changes;
- merge or delete another task branch without explicit instruction.

### Conflict Rules

If two tasks need the same files, treat that as a coordination point, not a merge problem to solve later.

Use these defaults:

- Disjoint files: parallel work is allowed.
- Same module but different files: parallel work is allowed only with clear write scopes.
- Same file: coordinate before editing.
- Shared contracts, package files, CI, release, security, persistence, or workflow docs: prefer exclusive ownership.

Common hotspot files should be treated carefully because many tasks can need them. Examples include package manifests, lockfiles, shared type definitions, IPC contracts, CI workflows, release scripts, architecture docs, workflow docs, and repository-root agent instructions.

### Integration

When implementation and verification are complete:

1. Review the task worktree diff.
2. Update the Task Record with build, verification, and review notes.
3. Rebase the task branch against the intended integration base unless repository policy says otherwise.
4. Fast-forward merge the task branch into the main checkout.
5. Run final relevant verification from the main checkout.
6. Confirm the main checkout has the expected final diff.
7. Push if the task requires a remote update.

Default command shape:

```text
git fetch
git -C ../<repo-name>-worktrees/TASK-0001-short-title rebase <base-ref>
git merge --ff-only task/TASK-0001-short-title
```

Use merge commits only when the repository has chosen that policy or when a fast-forward integration is not appropriate and the human has accepted the tradeoff.

Integration should be deliberate. Do not let a task worktree become the hidden source of truth after the task is complete.

### Closeout And Cleanup

During Close, the agent should:

- record final branch and worktree status in the Closeout when a worktree was used;
- move completed task records to the closed-task archive when applicable;
- remove the task worktree only after the work is committed, integrated, verified, and pushed when the task requires push;
- delete the task branch only when repository policy allows it and the work is safely integrated.

Recommended cleanup command shape:

```text
git worktree remove ../<repo-name>-worktrees/TASK-0001-short-title
git branch -d task/TASK-0001-short-title
```

Use non-destructive cleanup. If the worktree has uncommitted or unmerged work, stop and resolve that state before removing it.

## Core Principles

### Human Accountability

The human developer owns final quality, product fit, security, maintainability, and release decisions. Agent output is a draft until it has been reviewed, understood, verified, and accepted.

### Explore Before Editing

Agents must inspect the relevant code, docs, commands, tests, history, and local conventions before making non-trivial changes. Do not solve a guessed version of the problem.

### Specify Before Building

For standard and major work, define the desired outcome before implementation. A good specification is short, concrete, and testable.

### Small Changes, Clear Boundaries

Prefer small, coherent increments. Keep edits tied to the requested behavior. Avoid opportunistic refactors unless they are necessary for a safe and understandable solution.

### Verification Is Part Of The Work

A task is not complete because files changed. A task is complete when the relevant behavior is implemented, reviewed, and verified, or when any remaining uncertainty is explicitly reported.

### Security Is A Gate

Any change involving authentication, authorization, data access, secrets, privileged APIs, external input, networking, filesystem access, execution, or deployment must pass an explicit security review before handoff.

### Documentation Should Earn Its Keep

Document durable decisions, reusable patterns, workflows, and behavior that future humans or agents need. Avoid documents that duplicate obvious code and quickly drift.

## Phase 1: Explore

### Purpose

Understand the problem, repository, constraints, and existing implementation before planning or editing.

### Agent Behavior

The agent should:

- read repository-specific agent instructions;
- read the project README and relevant docs;
- inspect files that define the current behavior;
- search the codebase before assuming where logic lives;
- check existing tests, build scripts, and CI configuration;
- check local conventions for naming, error handling, configuration, and structure;
- check current worktree state before large edits;
- use official docs or primary sources for unstable library, platform, or security facts;
- ask concise questions only when the answer cannot be safely inferred from local context.

The agent should not:

- edit files during exploration unless the task is tiny and obvious;
- propose a broad rewrite before understanding existing architecture;
- trust memory for current framework behavior when official docs may have changed;
- ignore uncommitted human work.

### Artifact: Explore Notes

Add or update this section in the Task Record.

```markdown
## Explore Notes

Relevant files:
- `path/file`

Current behavior:
- ...

Observed patterns:
- ...

Constraints:
- ...

Open questions:
- ...

Initial risk:
- Low | Medium | High
```

### How To Produce It

1. Start with local instructions and setup docs.
2. Search for the relevant code paths.
3. Read only enough code to understand the problem and local patterns.
4. Note current behavior and any constraints.
5. Record open questions instead of guessing.

### Completion Checklist

- [ ] Local agent instructions checked.
- [ ] Relevant project docs checked.
- [ ] Relevant source files located.
- [ ] Existing tests, scripts, or CI checked where relevant.
- [ ] Current behavior summarized.
- [ ] Constraints identified.
- [ ] Open questions recorded.
- [ ] Task status moved to `Exploring` or next appropriate state.

For long tasks or when transitioning to a new session, see "Context Management" for the summary format.

## Phase 2: Specify

### Purpose

Define what done means before implementation begins.

### Agent Behavior

The agent should:

- turn the user's request into a concrete outcome;
- separate goals from non-goals;
- make acceptance criteria observable;
- call out constraints and risks;
- keep the spec proportional to the task;
- ask for clarification if the goal is ambiguous or high risk.

The agent should not:

- write a vague goal that cannot be verified;
- silently expand scope;
- skip non-goals for broad tasks;
- hide uncertainty in confident language.

### Artifact: Task Spec

Add or update this section in the Task Record.

```markdown
## Task Spec

Goal:
- ...

Non-goals:
- ...

Acceptance criteria:
- ...

Constraints:
- ...

Risks:
- ...
```

Clarification: Explore Notes capture what already exists: observed behavior, technical constraints, and open questions discovered in the repository. The Task Spec defines what should be done: desired outcome, acceptance criteria, intentional boundaries, and risks that shape implementation and verification.

### How To Produce It

1. Restate the user's request as an outcome.
2. Convert the outcome into acceptance criteria.
3. Define what is intentionally out of scope.
4. Add repository, security, UX, compatibility, operational, or timing constraints.
5. List risks that could affect design, implementation, verification, or rollout.

### Completion Checklist

- [ ] Goal is clear.
- [ ] Non-goals prevent scope creep.
- [ ] Acceptance criteria are observable.
- [ ] Constraints are listed.
- [ ] Risks are explicit.
- [ ] Human clarification requested if needed.
- [ ] Task status moved to `Specified`.

## Phase 3: Plan

### Purpose

Turn the specification into a concrete, reviewable implementation path.

### Agent Behavior

The agent should:

- identify files, modules, or areas likely to change;
- break work into small steps;
- map steps to acceptance criteria;
- define verification before implementation;
- identify security, privacy, data, or operational review items;
- identify documentation updates;
- pause for approval when a human gate applies.

The agent should not:

- create a plan that is disconnected from the spec;
- skip verification planning;
- bury major tradeoffs;
- begin major implementation before approval.

### Artifact: Implementation Plan

Add or update this section in the Task Record.

```markdown
## Implementation Plan

Files or areas:
- `path/or/module`

Steps:
1. ...
2. ...
3. ...

Verification:
- `command or manual check`

Security and risk review:
- ...

Docs:
- ...

Human gates:
- Required | Not required
- Approval status: Pending | Approved | Not applicable
```

### How To Produce It

1. Start from acceptance criteria.
2. Identify the smallest set of files or modules that should change.
3. Order implementation steps so each step can be understood and verified.
4. Choose relevant verification commands or manual checks from repository context.
5. Identify whether human approval is required.
6. Record documentation or decision-record impact.

### Completion Checklist

- [ ] Plan maps to acceptance criteria.
- [ ] Files or areas are identified.
- [ ] Implementation steps are ordered.
- [ ] Verification is defined.
- [ ] Security and risk review is considered.
- [ ] Documentation impact is considered.
- [ ] Consider whether the decision requires a Decision Record (see "Decision Records").
- [ ] Human approval gate is resolved if required.
- [ ] Task status moved to `Planned` or `Approved`.

For long tasks or when transitioning to a new session, see "Context Management" for the summary format.

## Phase 4: Build

### Purpose

Implement the plan in small, controlled changes.

### Agent Behavior

The agent should:

- follow existing project patterns;
- keep edits scoped to the requested behavior;
- implement in small increments;
- update the Task Record when the plan changes;
- add tests when the change introduces logic, risk, or regression surface;
- validate external input at the correct boundary;
- keep privileged operations isolated and intentional;
- preserve compatibility unless the task explicitly changes it;
- keep documentation and code in sync when behavior changes.

The agent should not:

- rewrite working code merely to match a personal preference;
- introduce dependencies without checking whether existing tools solve the need;
- weaken security or validation to make implementation easier;
- expose broad internal capabilities through public interfaces;
- leave debug output or temporary scaffolding unless clearly marked and accepted;
- discard user changes.

If implementation reveals that the plan is impossible or would require changes affecting security, architecture, or the data model, the agent must stop and consult the human before continuing. Minor deviations, such as a different filename or an ordering change within the same scope, may be handled directly but must be recorded in the Build Log.

### Code Commenting Guidelines

Comments are part of code quality, but they should be used deliberately. The agent should add or update comments when they help a future reviewer understand intent, safety, or non-obvious behavior faster than reading the code alone.

Use comments for:

- security boundaries, such as Electron main/preload separation, IPC validation, filesystem writes, shell/process execution, and external navigation;
- important invariants, such as "context packages must not include themselves" or "transcript imports must never overwrite an existing file";
- non-obvious algorithms, heuristics, ordering rules, fallback behavior, or race-condition handling;
- deliberate tradeoffs where a simpler-looking implementation would be wrong;
- exported APIs, public contracts, or typed bridges where callers need to know behavior, constraints, or failure modes.

Avoid comments that:

- restate simple code flow or syntax;
- describe what a variable assignment, loop, or function call already makes obvious;
- preserve outdated history that belongs in git, a task record, or a decision record;
- hide confusing code instead of making the code clearer;
- promise behavior that is not covered by tests or actual implementation.

When editing existing code, the agent should treat nearby comments as part of the change surface. If the behavior changes, update affected comments in the same patch. If a comment is misleading or no longer useful, remove it. Prefer concise comments close to the code they explain, and use structured documentation comments only where an exported function, type, or bridge API has a real contract future callers need to understand.

### Artifact: Build Log

Add or update this section in the Task Record for standard and major tasks.

```markdown
## Build Log

Changes made:
- ...

Important decisions during build:
- ...

Deviations from plan:
- ...

Files changed:
- `path/file`
```

### How To Produce It

1. Implement one coherent slice at a time.
2. Keep notes only for decisions, deviations, and meaningful changes.
3. If the implementation changes direction, update the plan or record the deviation.
4. Keep the list of changed files current enough for review.

### Completion Checklist

- [ ] Changes are scoped to the task.
- [ ] Existing patterns are followed.
- [ ] No unrelated refactors added.
- [ ] New logic has appropriate tests or verification.
- [ ] Risky assumptions are recorded.
- [ ] Comments explain intent, safety, or non-obvious behavior where needed.
- [ ] No stale or noise comments added.
- [ ] Deviations from plan are recorded.
- [ ] Task status moved to `Building` or next appropriate state.

## Phase 5: Verify

### Purpose

Prove that the change works and did not break expected behavior.

### Agent Behavior

The agent should:

- choose verification from repository context;
- run relevant automated checks;
- perform relevant manual checks when automation is insufficient;
- inspect failures and fix root causes;
- record skipped checks with reasons;
- distinguish passed, failed, and not-run verification.

The agent should not:

- claim success for checks that did not run;
- suppress failures without understanding them;
- treat unrelated failures as invisible;
- skip runtime or manual checks when the change clearly needs them.

### Artifact: Verification Log

Add or update this section in the Task Record.

```markdown
## Verification Log

Passed:
- `command`
- manual check: ...

Failed:
- `command`
  Reason:
  Follow-up:

Not run:
- `command`
  Reason:

Notes:
- ...
```

### How To Produce It

1. Start with the verification planned earlier.
2. Add any extra checks discovered during implementation.
3. Run checks from the repository root unless local docs say otherwise.
4. Record exact commands and meaningful manual checks.
5. If a check fails, fix it or document why it remains.
6. If a check cannot run, explain the blocker.

### Completion Checklist

- [ ] Relevant automated checks run.
- [ ] Relevant manual checks run or explicitly skipped.
- [ ] Failures fixed or documented with evidence.
- [ ] Skipped checks explained.
- [ ] Verification matches acceptance criteria.
- [ ] Task status moved to `Ready For Review` when verification is complete and human review is pending.

## Phase 6: Ready For Review

### Purpose

Make the handoff point between agent verification and human review explicit.

`Ready For Review` means the agent believes Build and Verify are complete, the Task Record has been updated with evidence, and the task is waiting for the human to inspect or approve the result.

### Agent Behavior

The agent should:

- stop implementation work unless the human asks for changes;
- keep the working state available for human testing;
- clearly state what changed and what was verified;
- give practical human verification instructions that explain exactly how to inspect or test the result;
- avoid closing the task before human review when review is required.

The agent should not:

- treat `Ready For Review` as `Done`;
- move completed tasks to the closed-task archive before approval;
- start dependent build work unless the human explicitly allows it.

### Ready For Review Handoff Message

When moving a task to `Ready For Review`, the agent's user-facing handoff must include:

- where the work can be found, such as worktree path, branch, local URL, installer path, or relevant file;
- a short summary of the visible change;
- verification already performed by the agent;
- a short "How to verify" section for the human;
- confirmation that no merge or closeout has happened yet, unless the human requested otherwise.

The handoff is incomplete without a practical "How to verify" section. Do not rely only on automated test output, and do not make the human infer how to start or inspect the work.

The "How to verify" section must be practical and specific:

- state the exact folder or worktree to run from;
- state the exact command to start the app, server, CLI, or check;
- describe the exact app flow, page, dialog, command output, file, artifact, or release page to inspect;
- describe the expected result in concrete terms;
- mention any useful cleanup, test data, or safe temporary location when the verification creates files.

For GUI work, describe the exact flow to run through in the app and what the human should expect to see. For command-line, packaging, or documentation work, give the exact command, file, artifact, or release page to inspect. Keep it short enough to follow while testing.

Example:

```text
Tasken er satt til Ready For Review. Ingen merge eller commit er gjort enda.

How to verify:
1. Start appen fra riktig arbeidsmappe:
   `cd /path/to/repo-or-worktree && npm start`
2. Velg en prosjektmappe som har én transkripsjonsmappe.
3. Klikk `Velg fil...` under Transkripsjoner og velg en `.md` eller `.txt` fil.
4. Bekreft at forhåndsvisningen viser kildefil, målmappe, nytt filnavn og at dette er en skriveoperasjon.
5. Klikk `Tilbake` og bekreft at ingen fil importeres.
6. Gjenta importen, klikk `Importer fil`, og bekreft at filen dukker opp i mappetreet med riktig `NN. filename`-navn.

Expected result:
- Importflyten viser korrekt forhåndsvisning før skriving.
- Avbrutt import oppretter ingen fil.
- Bekreftet import oppretter filen i riktig mappe og oppdaterer mappetreet.
```

### Completion Checklist

- [ ] Build Log is current.
- [ ] Verification Log is current.
- [ ] Review Notes contain the agent's self-review.
- [ ] Handoff includes a "How to verify" section.
- [ ] "How to verify" includes exact folder/worktree and exact start or inspection command.
- [ ] "How to verify" includes the concrete UI flow, command output, file, or artifact to inspect.
- [ ] "How to verify" includes practical expected outcomes for manual verification.
- [ ] Task status moved to `Ready For Review`.

## Phase 7: Review

### Purpose

Catch mistakes before handoff.

### Agent Behavior

The agent should:

- review the diff against the spec;
- check for accidental scope expansion;
- check local style and patterns;
- check error handling and edge cases;
- apply the security checklist when relevant;
- check that comments are useful, current, and not merely restating the code;
- check whether docs are needed;
- identify residual risk.

The agent should not:

- summarize instead of reviewing when review is required;
- ignore security-sensitive uncertainty;
- hand off code that obviously contradicts the task spec;
- hide known gaps.

### Artifact: Review Notes

Add or update this section in the Task Record.

```markdown
## Review Notes

Diff matches goal:
- Yes | No

Scope respected:
- Yes | No

Risks remaining:
- ...

Security concerns:
- ...

Maintainability concerns:
- ...

Follow-up items:
- ...
```

### How To Produce It

1. Compare changed files to the acceptance criteria.
2. Check that non-goals were respected.
3. Review public interfaces, validation, errors, and edge cases.
4. Run or reference security review when relevant.
5. Record only meaningful findings and remaining risks.

### Completion Checklist

- [ ] Diff matches spec.
- [ ] No obvious scope creep.
- [ ] Errors and edge cases considered.
- [ ] Security checklist considered where relevant.
- [ ] Code comments are useful and current where comments exist or are needed.
- [ ] Maintainability concerns considered.
- [ ] Documentation impact checked.
- [ ] Decision record updated if the review uncovered a durable decision.
- [ ] Task status moved to `Reviewing` or next appropriate state.

## Phase 8: Document

### Purpose

Preserve durable information future humans and agents need.

### Agent Behavior

The agent should:

- update docs when setup, usage, behavior, architecture, workflow, or security boundaries change;
- keep always-on agent instructions short and actionable;
- link from short docs to detailed docs instead of duplicating content;
- write decision records for durable architecture decisions;
- avoid documenting implementation details that are obvious from code and likely to drift.

The agent should not:

- create large documentation that nobody will maintain;
- duplicate the same rule in many places;
- update docs for temporary implementation details;
- skip docs when behavior or workflow changed.

### Artifact: Documentation Notes

Add or update this section in the Task Record.

```markdown
## Documentation Notes

Docs updated:
- `path/file`

Docs intentionally not updated:
- Reason:

Decision record needed:
- Yes | No
- Reason:
```

### How To Produce It

1. Check whether user-facing behavior changed.
2. Check whether developer setup, commands, or architecture changed.
3. Check whether agent instructions or workflow changed.
4. Check whether a durable decision record is needed.
5. Update only the docs that future work will actually use.

### Completion Checklist

- [ ] README or setup impact checked.
- [ ] Agent instruction impact checked.
- [ ] Workflow impact checked.
- [ ] Architecture or decision-record impact checked.
- [ ] Relevant docs updated.
- [ ] Intentional doc omissions explained if needed.
- [ ] Task status moved to `Documenting` or next appropriate state.

## Phase 9: Close

### Purpose

Hand back work in a way that is easy to review and continue.

### Agent Behavior

The agent should:

- summarize what changed;
- name important files or areas touched;
- report verification honestly;
- disclose known gaps and residual risks;
- state the next useful step when relevant;
- set final task status to `Done`, `Blocked`, or `Canceled`.

The agent should not:

- bury skipped or failed verification;
- over-explain routine implementation details;
- end with vague "let me know" filler;
- mark work done when required gates remain open.

### Artifact: Closeout

Add or update this section in the Task Record.

```markdown
## Closeout

Changed:
- ...

Verified:
- ...

Known gaps:
- ...

Next:
- ...

Final status:
- Done | Blocked | Canceled
```

### How To Produce It

1. Review the Task Record.
2. Pull the final summary from the Build Log.
3. Pull verification directly from the Verification Log.
4. Pull risks from Review Notes.
5. Keep the final handoff concise and factual.

### Completion Checklist

- [ ] Summary is concise.
- [ ] Files or areas touched are clear.
- [ ] Verification is explicit.
- [ ] Known gaps are not hidden.
- [ ] Next step is included when useful.
- [ ] Task status set to `Done`, `Blocked`, or `Canceled`.
- [ ] Task record moved to the closed-task archive if status is `Done` and the repository has one.

## Human Gates

This section applies primarily to the human working with the agent.

Human approval is required before implementation when:

- the task is classified as major;
- the change affects architecture, persistence, security, deployment, or external integrations;
- there are multiple reasonable approaches with meaningful tradeoffs;
- the implementation would add a new dependency;
- the implementation would remove or replace an established pattern;
- the change could destroy or migrate data;
- verification requires credentials, paid services, production access, or external systems the agent cannot access safely.

Human approval is usually not required for:

- tiny tasks;
- standard tasks where the user has clearly asked for implementation;
- mechanical fixes needed to make relevant verification pass, if they are within scope;
- documentation edits that clarify existing agreed behavior.

When in doubt, pause and ask a concise question.

## Progress Control

Use the Task Record checklist to control movement through the workflow.

Recommended task header fields:

```markdown
ID: TASK-0001
Status: Building
Class: Standard
Current Phase: Build
Updated: YYYY-MM-DD
```

Recommended progress checklist:

```markdown
- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [ ] Human approval received, if required
- [ ] Build complete
- [ ] Verification complete
- [ ] Review complete
- [ ] Documentation complete
- [ ] Closeout complete
```

Progress rules:

- A checked phase should have a corresponding artifact or explicit reason it was skipped.
- Major tasks should not enter `Building` until approval is recorded.
- `Verification complete` requires either passed verification or documented blocked/skipped verification.
- `Done` requires closeout.

## Context Management

Agents must manage context deliberately.

Rules:

- Keep exploration focused on files likely to matter.
- Prefer fast search and targeted reads over dumping whole directories.
- Summarize findings before moving from exploration to planning.
- For long tasks, maintain a short progress summary.
- If context is compacted or a new session starts, resume from the documented spec, plan, and verification state.

When context becomes noisy:

1. Summarize the current goal.
2. List completed steps.
3. List remaining steps.
4. List modified files.
5. List verification status.
6. List open questions or blockers.

## Parallel Agents

Parallel agents can help when work can be cleanly separated.

Use parallel agents for:

- independent codebase exploration questions;
- independent implementation slices with disjoint file ownership;
- review or verification that can run while implementation continues;
- research tasks that do not block the immediate next step.

Avoid parallel agents when:

- the next step depends on their result;
- file ownership overlaps;
- the task is small enough that coordination costs more than it saves;
- the subtask requires nuanced architectural judgment that should stay in the main thread.

Parallel work requirements:

- Assign clear ownership.
- State that other agents may be editing the repository.
- Do not duplicate the same task across agents.
- Integrate and review returned changes before closing.

## Test-Driven Development Guidance

Use TDD where it creates real value:

- bug fixes with a reproducible failure;
- pure logic;
- data transforms;
- public API behavior;
- persistence behavior;
- authorization or validation logic;
- regression-prone edge cases.

TDD loop:

1. Write or identify a failing test that captures the desired behavior.
2. Run it and confirm it fails for the expected reason.
3. Implement the smallest fix.
4. Run the test and relevant suite.
5. Refactor while keeping tests green.

Do not force TDD for:

- documentation-only changes;
- simple styling or copy changes;
- scaffolding where no test harness exists yet;
- exploratory prototypes clearly marked as disposable.

If no test harness exists, use the best available verification and consider adding a test framework when the feature risk justifies it.

## Security Checklist

Apply this checklist to security-sensitive work.

Data and secrets:

- No secrets are committed.
- Sensitive data is not logged unnecessarily.
- Data retention and deletion behavior is understood.
- Encryption or secure storage is used where required by the project.

Input and boundaries:

- External input is validated.
- Trust boundaries are explicit.
- Privileged operations are behind narrow interfaces.
- Error messages do not leak sensitive details.

Access control:

- Authentication behavior is preserved.
- Authorization checks happen at enforceable boundaries.
- Role, tenant, or ownership checks are not bypassed.

External systems:

- URLs, callbacks, redirects, and origins are constrained where needed.
- Network calls have appropriate timeout and error behavior.
- Third-party dependencies and services are justified.

Execution and filesystem:

- Shell execution is avoided or tightly constrained.
- File paths are validated and scoped.
- Uploaded or generated files are handled safely.

Deployment:

- Configuration defaults are safe.
- Debug-only behavior is not enabled in production.
- Migration and rollback behavior is understood.

## Dependency Policy

Before adding a dependency:

1. Check whether the language runtime, platform, framework, or existing packages already solve the need.
2. Prefer small, maintained, widely used packages.
3. Check license compatibility.
4. Consider security, performance, and deployment impact.
5. Document why the dependency is needed if the reason is not obvious.

After dependency changes:

- install or lock dependencies using the repository's package manager;
- run relevant verification;
- run a dependency audit if the repository supports one;
- update docs if setup or deployment changes.

## Branches, Commits, And Checkpoints

Agents and humans may share the same working tree. Agents must not discard human work.

Rules:

- Check worktree state before large edits.
- Do not revert changes you did not make unless explicitly asked.
- Use meaningful checkpoints for multi-step work.
- Keep commits focused if the user asks for commits.
- Do not run destructive version-control commands without explicit user instruction.

Recommended checkpoint moments:

- after a green baseline;
- after a spec or plan is approved;
- after a meaningful implementation slice passes verification;
- before risky refactors;
- before data migrations or destructive operations.

## Decision Records

Write or update a decision record when a decision:

- changes architecture;
- introduces or changes persistence, synchronization, or data ownership;
- changes security boundaries;
- adds a major dependency;
- changes deployment, packaging, or release strategy;
- establishes a reusable pattern future work should follow.

Decision record minimum structure:

```markdown
# NNNN: Decision Title

## Status

Accepted

## Context

...

## Decision

...

## Consequences

...
```

If the repository has its own decision-record format, use that.

## Common Failure Patterns

Avoid these:

- coding before reading the relevant code;
- solving a broader problem than requested;
- treating generated tests as trustworthy without reviewing assertions;
- suppressing type, lint, or test failures instead of fixing root causes;
- adding abstractions before there is repeated complexity;
- exposing broad internal capabilities for convenience;
- weakening security defaults to make code easier;
- adding dependencies for small problems already solved locally;
- creating large docs that duplicate code and drift;
- reporting "done" without saying what verification ran;
- continuing after the agent appears confused instead of re-establishing context.

## Source Inspiration

This workflow is inspired by patterns from public agentic development guidance, but it does not depend on those tools or frameworks.

- Superpowers: brainstorming, plans, small tasks, review, and verification-first habits.
- AGENTS.md: a short repository-root instruction file for coding agents.
- GitHub Spec Kit: specification-driven phases and specs as durable artifacts.
- AGENT-ZERO: state-machine thinking, approval gates, and architecture alignment.
- Claude Code best practices: explore first, plan, implement, verify, and manage context.
- Agentic Coding Principles: human accountability, understand-and-verify, security, and consistency.

References:

- https://github.com/obra/superpowers
- https://github.com/agentsmd/agents.md
- https://github.com/github/spec-kit
- https://github.com/msitarzewski/AGENT-ZERO
- https://code.claude.com/docs/en/best-practices
- https://agentic-coding.github.io/
