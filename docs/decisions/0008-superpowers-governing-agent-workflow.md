# Decision: Superpowers governs agent workflow

Status: Accepted
Date: 2026-06-03

## Context

Sidekick already had a repository-specific workflow in `docs/workflows/agentic-development.md`. The Superpowers plugin is now installed and intended to provide the active agentic workflow for this repository.

The previous Sidekick workflow overlapped with Superpowers by defining its own phase model for exploration, specification, planning, build, verification, review, documentation, and closeout. Keeping both as primary workflows would make future agent behavior ambiguous.

## Decision

Superpowers is the governing agentic workflow for Sidekick.

`AGENTS.md` now directs agents to use the relevant Superpowers skill before non-trivial work. `docs/workflows/agentic-development.md` is retained as a Sidekick-specific supplement for repository conventions, including task records, decision records, worktrees, security checks, verification expectations, documentation sources, and closeout format.

If Superpowers and the Sidekick supplement conflict on workflow sequencing, agents follow Superpowers. If either conflicts with explicit human instructions, agents ask for direction.

## Consequences

- Future workflow changes should update `AGENTS.md`, the Sidekick supplement, and this decision if the governing workflow changes again.
- Superpowers specs and plans should use their default `docs/superpowers/` locations unless the human asks otherwise.
- Sidekick task records remain available for durable project memory, especially for major or multi-session work.
- Sidekick-specific security and verification rules still apply while using Superpowers.
