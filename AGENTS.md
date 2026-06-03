# Sidekick Agent Instructions

## Mission

Build Sidekick as a secure, local-first Electron desktop application for agentic work.

## Mandatory Workflow

Superpowers is the governing agentic workflow for this repository.

Before non-trivial work, use the relevant Superpowers skill:

- `superpowers:brainstorming` for new features, behavior changes, design, and specs.
- `superpowers:systematic-debugging` for bugs, failures, and unexpected behavior.
- `superpowers:test-driven-development` before implementation of features, fixes, refactors, or behavior changes.
- `superpowers:writing-plans` when a written spec or multi-step implementation plan is needed.
- `superpowers:verification-before-completion` before claiming work is complete.
- `superpowers:requesting-code-review` for major features or before merge.

`docs/workflows/agentic-development.md` is not a second workflow. It is the Sidekick repository supplement for local artifact conventions, task records, decision records, worktrees, security checks, verification commands, and closeout expectations.

If Superpowers and the Sidekick supplement conflict on workflow sequencing, follow Superpowers. If either conflicts with explicit human instructions, explain the conflict briefly and ask for direction.

## Working Loop

Use this short loop as the quick reminder. The detailed method is provided by Superpowers, with Sidekick-specific rules in `docs/workflows/agentic-development.md`.

1. Invoke the relevant Superpowers skill.
2. Inspect existing code and docs before editing.
3. Keep changes small and tied to the requested behavior.
4. Use TDD for implementation unless the human explicitly approves an exception.
5. Verify with `npm run check` before handing work back when practical.
6. Record durable decisions in `docs/decisions/` when they affect security, persistence, packaging, or agent workflows.

## Plain Language

- Write tasks, plans, findings, reports, and closeouts in clear practical language.
- Prefer concrete status words such as `fixed`, `accepted`, `deferred`, `blocked`, `false positive`, and `needs human decision`.
- Avoid vague process terms such as `disposition` unless they are immediately explained in plain language.
- For every task deliverable, make the concrete output clear: what files or artifacts should exist, what should be verified, and what happens next.
- When one step produces input for a later step, state that dependency explicitly.

## Code Comments

- Use comments to explain intent, security boundaries, invariants, non-obvious tradeoffs, and fragile edge cases.
- Do not add comments that merely repeat what the code says.
- Keep comments current when behavior changes, and remove misleading comments instead of preserving them.

## Electron Rules

- Keep privileged code in the main process or preload.
- Do not enable renderer `nodeIntegration`.
- Keep `contextIsolation` and `sandbox` enabled.
- Expose only typed, task-specific APIs through `contextBridge`.
- Do not expose raw `ipcRenderer`, `webContents`, filesystem, shell, or process APIs to the renderer.
- Validate IPC inputs in the main process before using them.
- Open external URLs with `shell.openExternal` only after protocol allow-listing.

## Frontend Rules

- Treat Sidekick as a work surface, not a marketing page.
- Prefer dense, readable layouts with restrained color.
- Use cards only for actual repeated work items or framed interactions.
- Avoid decorative gradients, oversized heroes, and explanatory UI copy.

## Documentation Sources

- Use official Electron and Electron Forge documentation for framework decisions.
- Use Context7 when checking current library APIs.
- Prefer primary sources over blog posts for security, packaging, and lifecycle behavior.
