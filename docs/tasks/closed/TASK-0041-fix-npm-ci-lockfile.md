# Task: Fix npm ci lockfile

ID: TASK-0041
Status: Done
Class: Standard
Owner: Agent
Created: 2026-05-21
Updated: 2026-05-21
Branch: main
Worktree: /home/truls/code/Sidekick
Base branch: origin/main
Write scope:
- `package-lock.json`
- `package.json` only if package metadata must be clarified
- `README.md` or setup docs only if the supported Node/npm setup needs documentation
Parallel safety: Coordinate

## Summary

Make dependency installation reproducible again. The cloned repository could not run `npm ci` with the committed lockfile until the lockfile was refreshed with a newer npm. The task should preserve a clean dependency setup and document any local Node/npm requirement that future agents or humans need.

## Current Phase

Close

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

## Links

Related files:
- `../../.nvmrc`
- `../../package.json`
- `../../package-lock.json`
- `../../README.md`

Related docs:
- `../workflows/agentic-development.md`

## Explore Notes

Relevant files:
- `package.json`
- `package-lock.json`

Current behavior:
- A fresh clone initially had no `node_modules`, so `npm run check` failed because ESLint plugins were not installed.
- System `npm@9.2.0` failed before installing dependencies with `Invalid comparator` while parsing Electron's git-based `@electron/node-gyp` dependency metadata.
- `npx npm@10 ci` got past that parser issue but reported that `package.json` and `package-lock.json` were out of sync, specifically missing `esbuild@0.28.0`.
- Refreshing the install with newer npm updated `package-lock.json`.
- After switching to nvm, the active toolchain is `node v24.15.0` and `npm 11.12.1`.
- With that toolchain, `npm ci`, `npm run check`, and `npm run test` pass.

Observed patterns:
- The repository expects `npm ci` to be the clean install command.
- `README.md` lists `npm run check`, `npm run test`, and related scripts, but does not currently state a required Node/npm version.
- The repository had no `.nvmrc` before this task.

Constraints:
- Keep dependency changes limited to the lockfile unless package metadata must change.
- Do not run `npm audit fix` as part of this task unless separately approved, because it can change dependency versions and behavior.
- Preserve the existing Electron security defaults and application behavior; this task is dependency setup only.

Open questions:
- Resolved: document and provide a repo-local nvm baseline without adding a hard `engines` policy.

Initial risk:
- Medium

## Task Spec

Goal:
- Ensure a fresh checkout can install dependencies with `npm ci` and run the standard verification commands without manual lockfile repair.

Non-goals:
- Do not upgrade application dependencies beyond what is needed to repair the lockfile.
- Do not resolve npm audit findings in this task.
- Do not change application source behavior.

Acceptance criteria:
- `npm ci` succeeds from a clean dependency state using the agreed Node/npm toolchain.
- `npm run check` succeeds.
- `npm run test` succeeds.
- The final diff is limited to dependency/setup files needed for reproducible install.
- Any required Node/npm version guidance is documented if the current docs are insufficient.

Constraints:
- Use the repository package manager and lockfile.
- Keep changes reviewable and scoped.
- Treat package and lockfile edits as shared dependency-surface changes.

Risks:
- npm version differences can rewrite unrelated lockfile metadata.
- Adding an `engines` field could affect consumers or CI if their Node version differs.
- Audit fixes could introduce breaking dependency changes and are intentionally out of scope.

## Implementation Plan

Files or areas:
- `package-lock.json`
- `package.json` if adding `engines` or package-manager metadata is accepted
- `README.md` if setup requirements need documentation

Steps:
1. Use the current checkout because the current-task lockfile and task-record changes already existed there before implementation.
2. Refresh the lockfile with the agreed npm version and inspect the diff for unrelated churn.
3. Add a repo-local `.nvmrc` with the supported Node major version.
4. Document the setup path in `README.md`.
5. Run verification from the current checkout.
6. Review the diff for scope, dependency churn, and documentation accuracy.

Verification:
- `npm ci`
- `npm run check`
- `npm run test`

Security and risk review:
- No runtime security boundary changes expected.
- Dependency lockfile changes should be reviewed for unintended package upgrades.
- `npm audit` findings should be reported but not auto-fixed in this task.

Docs:
- Update README or setup docs only if the expected Node/npm version is a durable project requirement.

Human gates:
- Not required for lockfile-only repair.
- Required if adding or enforcing a Node/npm version policy through `package.json` metadata.
- Approval status: Not applicable. This task documents an nvm baseline but does not add `package.json` engines or package-manager enforcement.

## Build Log

Changes made:
- Refreshed `package-lock.json` so `npm ci` installs cleanly with modern npm.
- Added `.nvmrc` with Node major version `24`.
- Added README setup instructions for `nvm use` and `npm ci`.
- Kept `package.json` unchanged to avoid introducing a hard engines policy.

Important decisions during build:
- Use `.nvmrc` plus README guidance rather than `package.json` `engines`. This prevents repeat setup confusion without blocking environments that can already run the app.
- Do not run `npm audit fix`; audit remediation is outside this task and may change dependency versions or behavior.

Deviations from plan:
- The task was implemented in the main checkout instead of a task worktree because the current-task lockfile repair and task record were already uncommitted in the main checkout when implementation began.

Files changed:
- `.nvmrc`
- `README.md`
- `package-lock.json`
- `docs/tasks/TASK-0041-fix-npm-ci-lockfile.md`

## Verification Log

Passed:
- `npm ci`
- `npm run check`
- `npm run test`

Failed:
- None.

Not run:
- `npm run test:ui`
  Reason: Not part of the dependency setup acceptance criteria.

Notes:
- Verification used nvm-managed `node v24.15.0` and `npm 11.12.1`.
- `npm ci` still reports 31 audit findings. They were reported but not fixed in this task.

## Review Notes

Diff matches goal:
- Yes

Scope respected:
- Yes

Risks remaining:
- `package-lock.json` includes npm metadata churn in addition to the missing `vitest` nested `esbuild@0.28.0` entry.
- The project still has npm audit findings that need separate review.

Security concerns:
- No runtime security-boundary changes.

Maintainability concerns:
- `.nvmrc` and README setup guidance should reduce future local setup drift.

Follow-up items:
- Decide separately whether to address npm audit findings.

## Documentation Notes

Docs updated:
- `README.md`

Docs intentionally not updated:
- `package.json` engines were intentionally not added to avoid enforcing a policy beyond the documented nvm baseline.

Decision record needed:
- No
- Reason: A lockfile repair alone is not an architectural decision. A durable Node/npm version policy may need documentation but likely not a decision record.

## Closeout

Changed:
- Refreshed `package-lock.json`.
- Added `.nvmrc`.
- Documented setup with `nvm use` and `npm ci`.

Verified:
- `npm ci`
- `npm run check`
- `npm run test`

Known gaps:
- npm audit findings remain and should be handled separately.
- Work was committed directly on `main`; no separate task branch existed to merge.

Next:
- Decide separately whether to address npm audit findings.

Final status:
- Done
