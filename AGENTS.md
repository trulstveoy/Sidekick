# Sidekick Agent Instructions

## Mission

Build Sidekick as a secure, local-first Electron desktop application for agentic work.

## Mandatory Workflow

Before starting any non-trivial task, read and follow `docs/workflows/agentic-development.md`.

This workflow is part of the repository contract for agents. Do not treat it as optional background reading. Apply its task classes, human gates, verification expectations, security checklist, and closeout format.

If the workflow and a user request appear to conflict, explain the conflict briefly and ask for direction before bypassing the workflow.

## Working Loop

Use this short loop as the quick reminder. The full process is defined in `docs/workflows/agentic-development.md`.

1. Inspect the existing code before editing.
2. State the implementation plan for substantial changes.
3. Keep changes small and tied to the requested behavior.
4. Verify with `npm run check` before handing work back when practical.
5. Record architectural decisions in `docs/decisions/` when they affect security, persistence, packaging, or agent workflows.

## Plain Language

- Write tasks, plans, findings, reports, and closeouts in clear practical language.
- Prefer concrete status words such as `fixed`, `accepted`, `deferred`, `blocked`, `false positive`, and `needs human decision`.
- Avoid vague process terms such as `disposition` unless they are immediately explained in plain language.
- For every task deliverable, make the concrete output clear: what files or artifacts should exist, what should be verified, and what happens next.
- When one step produces input for a later step, state that dependency explicitly.

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
