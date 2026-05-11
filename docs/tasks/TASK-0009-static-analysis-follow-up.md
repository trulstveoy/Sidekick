# Task: Static Analysis Follow-Up

ID: TASK-0009
Status: Planned - Pending Human Approval
Class: Major
Owner: Pair
Created: 2026-05-11
Updated: 2026-05-11

## Summary

Turn the first local static-analysis run into one coordinated improvement package.

The work should keep one task boundary because the findings are related: the static-analysis workflow first needs stronger project configuration, then the remaining findings can be converted into concrete cleanup, refactoring, and dependency-review changes.

The task is organized as separate deliverables so each change can be implemented, reviewed, and verified independently while still preserving one overall context.

## Current Phase

Plan

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [ ] Human approval received, if required
- [ ] Build complete
- [ ] Verification complete
- [ ] Review complete
- [ ] Documentation complete
- [ ] Closeout complete

## Links

Related files:
- `docs/static-analysis/2026-05-11-static-analysis.md`
- `docs/workflows/static-analysis.md`
- `package.json`
- `package-lock.json`
- `forge.config.ts`
- `src/renderer.ts`
- `src/main/folder-scanner.ts`
- `src/main/repomix-runner.ts`
- `src/main/context-package.ts`
- `src/main/transcription-importer.ts`
- `src/shared/sidekick-api.ts`
- `src/preload.ts`
- `vite.preload.config.ts`
- `tests/e2e/renderer-smoke.spec.ts`
- `tests/integration/transcription-importer.test.ts`

Related decisions:
- None yet.

Related reports:
- `docs/static-analysis/2026-05-11-static-analysis.md`

Related workflows:
- `docs/workflows/static-analysis.md`
- `docs/workflows/agentic-development.md`

## Explore Notes

Source material:
- The first static-analysis run is documented in `docs/static-analysis/2026-05-11-static-analysis.md`.
- The follow-up review concluded that most findings are relevant, but they should not all become equal-priority implementation tasks.

Confirmed important findings:
- Runtime dependency audit is clean: `npm audit --omit=dev` reports `found 0 vulnerabilities`.
- Full dependency audit reports development/build-toolchain vulnerabilities.
- Knip finds a real unlisted direct dependency: `@electron-forge/shared-types`.
- Knip finds a likely unused development dependency: `@electron-forge/plugin-auto-unpack-natives`.
- Knip also reports Electron/Vite entrypoints and fixture files as unused, which are false positives until project-specific Knip configuration exists.
- Maintainability checks identify real production hotspots in `src/renderer.ts` and `src/main/folder-scanner.ts`.
- Dependency-cruiser found no import-boundary violations after TypeScript support was correctly enabled.
- The static-analysis workflow needed first-run operational guidance; that has already been added to `docs/workflows/static-analysis.md`.

Additional review observation:
- Knip reports `powershell.exe` as an unlisted binary from `package.json`. This should be classified explicitly as a Windows-script environment dependency, accepted exception, or local tooling note.

Risk framing:
- The strongest code-quality risk is maintainability, especially large renderer and scanner functions.
- The strongest dependency risk is development/build-toolchain exposure, not production runtime exposure.
- The strongest analysis-process risk is acting on Knip dead-code findings before configuring framework entrypoints and fixture ignores.

## Task Spec

Goal:
- Convert the first static-analysis report into an actionable set of improvements while preserving behavior and avoiding unsafe cleanup.

Primary outcome:
- Static-analysis tooling produces higher-signal local results for this Electron/Vite TypeScript project.
- Direct dependency declarations are accurate.
- Unused dependency candidates are resolved or explicitly retained.
- Renderer and scanner maintainability hotspots are reduced through behavior-preserving refactors.
- Development/build-toolchain audit findings are reviewed and either reduced or explicitly documented.
- The report is updated or closed out with the final disposition of each finding.

Acceptance criteria:
- A project-specific Knip configuration exists or an equivalent local command/configuration is documented.
- Knip no longer misclassifies `src/preload.ts` and `vite.preload.config.ts` as unused files.
- Fixture paths that are intentionally present for tests are ignored or documented as accepted analysis exceptions.
- The `powershell.exe` unlisted-binary finding is classified explicitly.
- The direct import of `@electron-forge/shared-types` is resolved by adding it as a direct dev dependency or by switching to a type import from an already direct dependency.
- `@electron-forge/plugin-auto-unpack-natives` is removed if confirmed unused, or documented as intentionally retained.
- `src/renderer.ts` is split or reorganized enough that the largest render/state functions become smaller and easier to review.
- `src/main/folder-scanner.ts` is split or reorganized enough that traversal, classification, warning construction, and state updates are clearer.
- Production behavior remains unchanged unless a specific deliverable explicitly approves a behavior change.
- Tests pass after each completed deliverable when practical.
- `npm run check` passes before closeout.
- `npm run test` passes before closeout unless a documented blocker exists.
- Dependency or Forge changes include packaging-relevant verification or a clear reason why packaging verification was deferred.

Non-goals:
- CI integration for static analysis.
- Making static-analysis tools mandatory in CI.
- Large UI redesign.
- Changing Electron security boundaries.
- Replacing Electron Forge.
- Public distribution hardening beyond the dependency/toolchain review described here.
- Automatic deletion of dead code based only on first-pass tool output.

Constraints:
- Keep the workflow local-machine oriented.
- Use free tools only.
- Keep renderer privileged access unchanged: no raw filesystem, shell, process, or IPC exposure.
- Preserve `contextIsolation` and sandbox assumptions.
- Do not weaken existing Electron Forge fuses or packaging security settings.
- Do not run destructive dependency updates such as `npm audit fix --force` without explicit review and approval.
- Keep each deliverable independently reviewable.

## Deliverables

### D1: Configure Static Analysis For Project Shape

Purpose:
- Make dead-code and dependency analysis reliable enough to produce task-ready findings.

Scope:
- Add or document project-specific Knip configuration.
- Include Electron/Vite entrypoints such as `src/preload.ts`, `forge.config.ts`, and Vite config files.
- Exclude or classify test fixtures that are intentionally present but not imported.
- Classify `powershell.exe` as an accepted local environment binary, explicit ignore, or documented exception.
- Re-run Knip and update the static-analysis report with the new baseline.

Acceptance criteria:
- Known Electron/Vite entrypoints are no longer reported as unused.
- Intentional fixtures are no longer presented as deletion candidates.
- Remaining Knip findings are separated into true cleanup candidates, accepted exceptions, and unresolved questions.

Suggested verification:
- `npx knip --no-progress`
- `npm run check`
- `npm run test`

### D2: Resolve Dependency Declaration Findings

Purpose:
- Remove concrete dependency hygiene issues found by Knip.

Scope:
- Resolve the direct `@electron-forge/shared-types` import issue.
- Confirm whether `@electron-forge/plugin-auto-unpack-natives` is unused.
- Remove the plugin if obsolete, or document why it stays.
- Regenerate lockfile only when package metadata changes.

Acceptance criteria:
- Direct imports correspond to direct dependencies or are changed to use already direct dependencies.
- Unused Forge plugin status is resolved.
- Dependency changes are reflected consistently in `package.json` and `package-lock.json`.

Suggested verification:
- `npm ci`
- `npm run check`
- `npm run test`
- `npx knip --no-progress`
- Packaging verification if Forge plugin dependencies change.

### D3: Review Development/Build Toolchain Audit Findings

Purpose:
- Understand and reduce development/build-toolchain vulnerability exposure without confusing it with runtime dependency risk.

Scope:
- Keep production and full dependency audit results separate.
- Review Electron Forge, Vite, Electron, and transitive dependency versions.
- Identify whether non-breaking upgrades reduce the audit surface.
- Avoid blind forced upgrades.
- Document any accepted development-toolchain risks that remain.

Acceptance criteria:
- `npm audit --omit=dev` result is recorded.
- Full `npm audit` result is recorded.
- Any upgrade proposal includes expected risk, affected packages, and verification commands.
- Remaining unresolved audit findings are documented as development/build-toolchain risk, not runtime dependency risk.

Suggested verification:
- `npm audit --omit=dev`
- `npm audit`
- `npm run check`
- `npm run test`
- `npm run package` or narrower packaging verification when Electron Forge or packaging dependencies change.

### D4: Refactor Renderer Maintainability Hotspots

Purpose:
- Reduce review and regression risk in the renderer without changing product behavior.

Scope:
- Break up large render/state functions in `src/renderer.ts`.
- Prioritize `renderContextPackage`, `renderTranscriptionImport`, `renderTreeNode`, and `render`.
- Prefer small named helpers and feature-oriented render sections.
- Preserve current DOM structure and user-facing behavior unless a specific improvement is approved.

Acceptance criteria:
- Renderer code is easier to navigate by feature area.
- Large function and statement-count warnings are reduced for production renderer code.
- Existing renderer smoke coverage still passes.
- No new privileged renderer access is introduced.

Suggested verification:
- `npm run check`
- `npm run test`
- `npm run test:ui`
- Local Electron smoke run if practical.

### D5: Refactor Folder Scanner Maintainability Hotspots

Purpose:
- Reduce risk in filesystem scanning logic while preserving scanner behavior.

Scope:
- Break up `scanNode` in `src/main/folder-scanner.ts`.
- Separate traversal, file classification, folder exclusion, warning construction, and state mutation where useful.
- Reduce parameter count by introducing a small scan context object if that keeps the code clearer.
- Keep symlink, max-depth, max-files, hidden-folder, and excluded-folder behavior unchanged.

Acceptance criteria:
- Scanner behavior is preserved.
- `scanNode` or its replacement structure is smaller and easier to reason about.
- Complexity, statement-count, nesting, and parameter warnings are reduced for scanner production code.
- Integration tests continue to cover scanner limits, exclusions, warnings, and classification.

Suggested verification:
- `npm run check`
- `npm run test`
- Targeted scanner integration tests.

### D6: Reclassify Informational And Already-Fixed Findings

Purpose:
- Make the static-analysis report accurate as a source for future tasks.

Scope:
- Reclassify import-boundary analysis from `false-positive` to a passed informational check.
- Mark workflow first-run guidance as fixed or closed.
- Add final disposition for each original finding.

Acceptance criteria:
- The report clearly distinguishes open tasks, fixed items, passed checks, false positives, accepted risks, and deferred investigations.
- No item that is merely a passed check appears as an actionable defect.

Suggested verification:
- Documentation review.
- `npm run check` if docs-only changes are part of the same branch.

## Proposed Implementation Order

1. D1: Configure static analysis for project shape.
2. D2: Resolve direct dependency and unused plugin findings.
3. D3: Review development/build-toolchain audit findings.
4. D4: Refactor renderer maintainability hotspots.
5. D5: Refactor folder scanner maintainability hotspots.
6. D6: Update report dispositions and close out.

Reasoning:
- D1 should happen first because it improves signal before any deletion or cleanup.
- D2 and D3 are dependency-focused and can be reviewed separately from code refactors.
- D4 and D5 are production-code refactors and should be isolated to keep regression risk manageable.
- D6 belongs at the end because it records what actually happened.

## Human Gates

Human approval is required before implementation because this is a Major task.

Additional approval should be requested before:
- removing dependencies that could affect Electron Forge packaging;
- changing Electron Forge versions or build-toolchain versions;
- changing renderer structure in a way that alters UI behavior;
- changing scanner behavior around filesystem traversal, exclusions, symlinks, or limits;
- accepting unresolved dependency audit findings as known risk.

## Verification Plan

Baseline verification:
- `npm run check`
- `npm run test`

Static-analysis verification:
- `npx knip --no-progress`
- maintainability ESLint command from `docs/static-analysis/2026-05-11-static-analysis.md`
- dependency-cruiser command from `docs/workflows/static-analysis.md` if import-boundary rules are changed or adopted.

Dependency verification:
- `npm audit --omit=dev`
- `npm audit`
- `npm ci` after dependency metadata changes.

Packaging verification:
- Run packaging verification when Forge, Electron, Vite, or maker/plugin dependencies change.
- If packaging verification is deferred, record the reason in the task closeout.

## Review Notes

Initial review judgment:
- SA-005 is the highest-value code-quality finding.
- SA-001 is important but should be framed as development/build-toolchain risk.
- SA-004 should be handled before acting on dead-code findings.
- SA-002 is a small concrete dependency hygiene fix.
- SA-003 is a low-priority dependency cleanup candidate.
- SA-006 is a passed check, not a defect.
- SA-007 is already addressed by the workflow update.

## Documentation Notes

Expected documentation updates:
- Update `docs/static-analysis/2026-05-11-static-analysis.md` with final dispositions.
- Update `docs/workflows/static-analysis.md` only if the follow-up work reveals additional reusable workflow improvements.
- Add a decision record only if the project adopts new static-analysis tooling as durable project policy or changes build-toolchain strategy.

## Closeout

Pending.
