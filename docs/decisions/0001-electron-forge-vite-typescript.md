# 0001: Electron Forge, Vite, and TypeScript

## Status

Accepted

## Context

Sidekick needs a maintained Electron baseline with fast local iteration, packaging support, and room for a typed preload contract.

## Decision

Use Electron Forge with the first-party Vite + TypeScript template.

## Consequences

- Development starts with `npm start`.
- Packaging and installers use Electron Forge.
- Main, preload, and renderer code are bundled through Vite.
- Security-sensitive APIs must pass through typed preload methods instead of direct renderer access.
