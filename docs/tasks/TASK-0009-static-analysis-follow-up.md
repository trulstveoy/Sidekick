# Task: Static Analysis Follow-Up

ID: TASK-0009
Status: Approved - Building
Class: Major
Owner: Pair
Created: 2026-05-11
Updated: 2026-05-11

## Summary

Turn the first local static-analysis run into one coordinated improvement package.

The work should keep one task boundary because the findings are related: the static-analysis workflow first needs stronger project configuration, then the remaining findings can be converted into concrete cleanup, refactoring, and dependency-review changes.

The task is organized as separate deliverables so each change can be implemented, reviewed, and verified independently while still preserving one overall context.

## Current Phase

Build

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [x] Human approval received, if required
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

## Finding To Deliverable Map

| Finding | Current judgment | Deliverable | Expected final status |
| --- | --- | --- | --- |
| SA-001: development dependency audit reports vulnerable toolchain packages | Important, but development/build-time risk rather than runtime risk | D3 | Reduce through reviewed upgrades where safe, or document accepted build-toolchain risk |
| SA-002: `@electron-forge/shared-types` imported directly but not listed directly | Concrete dependency hygiene issue | D2 | Resolve by direct dev dependency or stable type import from an existing direct dependency |
| SA-003: `@electron-forge/plugin-auto-unpack-natives` appears unused | Likely valid, low priority | D2 | Remove if obsolete, or document intentional retention |
| SA-004: Knip needs project-specific entry and ignore configuration | Important analysis-process blocker | D1 | Add configuration before creating deletion/refactor tasks from Knip output |
| SA-005: renderer and scanner have maintainability hotspots | Highest-value code-quality finding | D4, D5 | Reduce production hotspot size/complexity with behavior-preserving refactors |
| SA-006: import-boundary analysis found no violations | Passed check, not a defect | D6 | Reclassify as passed informational verification |
| SA-007: static-analysis workflow needed first-run operational guidance | Valid, already fixed by workflow update | D6 | Mark fixed and retain as workflow observation |
| Knip unlisted binary: `powershell.exe` | Missing from original report | D1, D6 | Classify as Windows local tooling exception or explicit Knip ignore |
| Deferred duplication/cognitive-complexity checks | Valid investigation backlog, not required for this package | D6 | Keep deferred unless a free local tool is deliberately adopted later |

## Task Spec

Goal:
- Convert the first static-analysis report into an actionable set of improvements while preserving behavior and avoiding unsafe cleanup.

Primary outcome:
- Static-analysis tooling produces higher-signal local results for this Electron/Vite TypeScript project.
- Direct dependency declarations are accurate.
- Unused dependency candidates are resolved or explicitly retained.
- Renderer and scanner maintainability hotspots are reduced through behavior-preserving refactors.
- Development/build-toolchain audit findings are reviewed and either reduced or explicitly documented.
- The report is updated or closed out with the final status of each finding.

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
- Keep each deliverable independently committable.
- Do not mix changes from multiple deliverables in the same commit.

## Planning Assumptions

- This task is local-machine oriented. It does not add CI requirements.
- Static-analysis tools may be run transiently with `npx` or `npm exec`; adopting a tool as a project dependency is a separate decision.
- Behavior-preserving refactors should be preferred over redesigns.
- Production code findings have higher priority than test-file size warnings.
- Dependency changes should be smaller than the refactors and should be verified independently.
- `npm audit --omit=dev` and full `npm audit` must stay separate in reporting because they answer different risk questions.
- Any future agent implementing a deliverable should update this task document as it progresses, not wait until closeout.
- Each deliverable should end with its own verification note and its own commit before the next deliverable starts.
- If a deliverable is too large for one reviewable commit, split it into multiple commits within that deliverable, but do not include files or behavior from another deliverable.

## Deliverables

### D1: Configure Knip So Dead-Code Findings Are Trustworthy

Purpose:
- Make dead-code and dependency analysis reliable enough to produce task-ready findings.

Plain-language explanation:
- D1 does not remove code, refactor code, or fix dependencies.
- D1 teaches Knip what this repository looks like so Knip does not mistake real Electron/Vite entrypoints, test fixtures, or platform-specific scripts for dead code.
- The problem D1 solves is that the first Knip run reported some things that are not actually unused, such as `src/preload.ts` and `vite.preload.config.ts`.
- After D1, the remaining Knip output should be clean enough that later deliverables can decide what is genuinely dead code, dependency drift, or an accepted exception.

Concrete output:
- A project-specific Knip configuration file, unless investigation shows a documented command-only setup is better.
- A before/after Knip result recorded in the static-analysis report.
- An explicit classification of every remaining Knip finding:
  - true cleanup candidate;
  - accepted exception;
  - needs human decision;
  - tool limitation.
- A handoff table that routes every remaining Knip finding to a later deliverable, an accepted exception, or a new follow-up task.
- A report update that explains why `src/preload.ts`, `vite.preload.config.ts`, intentional fixtures, and `powershell.exe` should not be treated as ordinary dead-code findings.
- One isolated D1 commit containing only the Knip configuration and report/task documentation updates.

D1 is complete when:
- Running Knip no longer reports known Electron/Vite entrypoints as unused files.
- Intentional fixture files are either ignored by configuration or clearly documented as accepted exceptions.
- `powershell.exe` is either ignored by configuration or clearly documented as a Windows local-tooling exception.
- The remaining Knip output is small and classified enough that D2 can safely act on dependency findings.
- Every remaining Knip finding has a named destination.

D1 handoff rules:
- Unlisted dependencies and unused dependencies go to D2.
- Development/build-toolchain audit issues stay in D3, not D1.
- Renderer dead-code or export cleanup found by Knip goes to D4 only if it belongs naturally with the renderer refactor.
- Scanner dead-code or export cleanup found by Knip goes to D5 only if it belongs naturally with the scanner refactor.
- Informational checks, accepted exceptions, and report-only reclassifications go to D6.
- True unused files, exports, or types that do not belong to D2, D4, or D5 must not be silently dropped. D1 must either add a clearly named cleanup sub-deliverable to this task or create a separate follow-up task recommendation.
- Findings marked `needs human decision` remain blocked until the decision is recorded in this task or in the static-analysis report.

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

Implementation steps:
1. Inspect current Knip behavior with the existing first-pass command.
   - Command: `npx knip --no-progress`
   - Capture exact output before configuration changes.
2. Decide the smallest local configuration artifact.
   - Preferred first option: add a repo-root Knip config file without adding Knip as a dependency.
   - Do not add a new npm script unless the team decides local static-analysis scripts should become durable project commands.
3. Configure known project entrypoints.
   - Include `forge.config.ts`.
   - Include Electron/Vite entrypoints: `src/main.ts`, `src/preload.ts`, `src/renderer.ts`.
   - Include Vite config files: `vite.main.config.ts`, `vite.preload.config.ts`, `vite.renderer.config.ts`.
   - Include test entry patterns if Knip needs them to understand test-only exports.
4. Configure intentional ignores.
   - Exclude `tests/fixtures/**` only where fixture files are intentionally not imported.
   - Add an explicit treatment for `powershell.exe` from package scripts.
   - Do not ignore broad source folders just to make the report clean.
5. Re-run Knip and classify the remaining output.
   - True cleanup candidate.
   - Accepted exception.
   - Needs human decision.
   - Tool limitation.
6. Create the handoff table for remaining findings.
   - Include the finding name.
   - Include the chosen destination: D2, D4, D5, D6, accepted exception, human decision, or new follow-up.
   - Include the reason for that destination.
7. Update `docs/static-analysis/2026-05-11-static-analysis.md`.
   - Add a short addendum or final-status section for the new Knip baseline.
   - Preserve the original first-run evidence rather than overwriting history.

Expected outputs:
- A Knip configuration or explicitly documented local Knip command/configuration.
- Static-analysis report updated to say what happened with SA-004 and the `powershell.exe` binary finding.
- No production code behavior changes.

Do not:
- Delete files based only on the first-pass Knip output.
- Mark `src/preload.ts` or `vite.preload.config.ts` as dead code.
- Hide dependency issues by broad ignore patterns.

Suggested verification:
- `npx knip --no-progress`
- `npm run check`
- `npm run test`

### D2: Resolve Dependency Declaration Findings

Purpose:
- Remove concrete dependency hygiene issues found by Knip.

Inputs from D1:
- Use the D1 handoff table as the authoritative list of Knip dependency findings that D2 owns.
- D2 should start from the configured Knip baseline produced by D1, not the raw first-pass Knip output.
- D2 owns D1-routed findings for unlisted dependencies and unused dependencies.
- If D2 discovers a dependency finding that was not routed by D1, document it in the task before fixing it.

Scope:
- Resolve the direct `@electron-forge/shared-types` import issue.
- Confirm whether `@electron-forge/plugin-auto-unpack-natives` is unused.
- Remove the plugin if obsolete, or document why it stays.
- Regenerate lockfile only when package metadata changes.

Acceptance criteria:
- Direct imports correspond to direct dependencies or are changed to use already direct dependencies.
- Unused Forge plugin status is resolved.
- Dependency changes are reflected consistently in `package.json` and `package-lock.json`.

Implementation steps:
1. Read the D1 handoff table and confirm the dependency findings assigned to D2.
2. Resolve `@electron-forge/shared-types`.
   - Inspect whether the current Electron Forge version exposes `ForgeConfig` from a package already listed in `devDependencies`.
   - If a stable direct import exists from an existing direct dependency, change `forge.config.ts` to use it.
   - Otherwise add `@electron-forge/shared-types` as a direct `devDependency` at a version compatible with the installed Forge packages.
3. Resolve `@electron-forge/plugin-auto-unpack-natives`.
   - Search the repository for references to native modules and this plugin.
   - Confirm whether current package output depends on auto-unpacking native modules.
   - If no current native dependency needs it, remove it from `devDependencies`.
   - If it is intentionally reserved, document the reason and add the appropriate Knip exception.
4. Regenerate dependency metadata only when needed.
   - Use the lockfile-preserving package-manager command appropriate to the chosen change.
   - Review both `package.json` and `package-lock.json`.
5. Re-run Knip after D1 configuration.
   - Confirm SA-002 is gone.
   - Confirm SA-003 is either gone or intentionally ignored with documentation.

Expected outputs:
- Clean dependency declaration state for the two Forge findings.
- The report states whether SA-002 and SA-003 were fixed, accepted as intentional, or deferred, with verification notes.

Do not:
- Run `npm audit fix --force`.
- Upgrade Electron Forge as part of this deliverable unless D3 explicitly decides to do that.
- Remove packaging-related dependencies without packaging-oriented verification or an explicit deferral note.

Suggested verification:
- `npm ci`
- `npm run check`
- `npm run test`
- `npx knip --no-progress`
- Packaging verification if Forge plugin dependencies change.

### D3: Review Development/Build Toolchain Audit Findings

Purpose:
- Understand and reduce development/build-toolchain vulnerability exposure without confusing it with runtime dependency risk.

Relationship to D1:
- D3 does not consume D1's Knip handoff table.
- D3 uses audit evidence from the static-analysis report and fresh `npm audit` runs.
- If D1 changes package metadata unexpectedly, stop and reconcile that before starting D3.

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

Implementation steps:
1. Establish the current audit baseline.
   - Run `npm audit --omit=dev`.
   - Run full `npm audit`.
   - Record whether counts and advisory chains changed since the first report.
2. Separate advisory groups by impact path.
   - Runtime dependency risk.
   - Development server risk.
   - Packaging/build-toolchain risk.
   - Transitive dependency with no available fix.
3. Inspect safe upgrade options.
   - Check whether patch/minor upgrades within existing major versions reduce `vite`, `esbuild`, Electron Forge, `@electron/rebuild`, `tar`, `tmp`, or related advisory chains.
   - Prefer targeted dependency updates over broad upgrades.
   - Treat major-version jumps as separate human-gated proposals.
4. Make or defer changes.
   - Apply only low-risk, reviewed updates that preserve the current packaging model.
   - If no safe update exists, document the accepted development/build-toolchain risk and why it is not runtime exposure.
5. Record final audit state.
   - Update the report with before/after audit results.
   - Identify advisories that remain blocked by upstream packages or breaking upgrades.

Expected outputs:
- A clear final status for SA-001.
- Optional dependency updates if low-risk fixes exist.
- Explicit accepted-risk text for unresolved development/build-toolchain vulnerabilities.

Do not:
- Conflate development dependencies with shipped runtime dependencies.
- Force major upgrades just to make `npm audit` clean.
- Change release/build strategy without a decision record if the change is durable.

Suggested verification:
- `npm audit --omit=dev`
- `npm audit`
- `npm run check`
- `npm run test`
- `npm run package` or narrower packaging verification when Electron Forge or packaging dependencies change.

### D4: Refactor Renderer Maintainability Hotspots

Purpose:
- Reduce review and regression risk in the renderer without changing product behavior.

Inputs from D1:
- Use the D1 handoff table to identify any renderer-related Knip findings assigned to D4.
- D4 should only handle D1-routed renderer cleanup when it naturally belongs with the renderer refactor.
- If a renderer dead-code finding does not belong with the refactor, D4 should leave it documented for D6 or a follow-up cleanup task.
- D4 should use the configured Knip baseline from D1 when checking whether renderer exports/files are still reported.

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

Implementation steps:
1. Read the D1 handoff table and note any renderer findings assigned to D4.
2. Establish renderer baseline.
   - Run `npm run check`.
   - Run `npm run test`.
   - Run the maintainability ESLint command from the static-analysis report and record current renderer warnings.
3. Split by feature area without changing behavior.
   - Keep shared DOM utilities together.
   - Separate context-package rendering from transcription-import rendering.
   - Separate tree rendering helpers from top-level page-state rendering.
   - Keep event handlers and state transitions readable and close to their feature logic.
4. Reduce the largest functions first.
   - `renderContextPackage`
   - `renderTranscriptionImport`
   - `renderTreeNode`
   - `render`
5. Apply D1-routed renderer cleanup only when it belongs with the current refactor.
   - If it does not belong, leave it documented for D6 or a follow-up task.
6. Prefer extraction over abstraction.
   - Use small named helper functions for repeated detail rows, list rendering, button state, and status-specific sections.
   - Avoid introducing a framework or architectural rewrite.
7. Preserve Electron security boundaries.
   - Renderer must keep using the typed preload API.
   - Do not expose new raw IPC, filesystem, process, shell, or path APIs.
8. Compare maintainability output.
   - Record which warnings were reduced.
   - If some warnings remain intentionally, explain why.

Expected outputs:
- Smaller renderer functions.
- Updated maintainability baseline for renderer production code.
- No user-facing behavior change unless explicitly approved.

Do not:
- Redesign the UI.
- Move privileged work into the renderer.
- Combine this with scanner refactoring in the same code change.

Suggested verification:
- `npm run check`
- `npm run test`
- `npm run test:ui`
- Local Electron smoke run if practical.

### D5: Refactor Folder Scanner Maintainability Hotspots

Purpose:
- Reduce risk in filesystem scanning logic while preserving scanner behavior.

Inputs from D1:
- Use the D1 handoff table to identify any scanner-related Knip findings assigned to D5.
- D5 should only handle D1-routed scanner cleanup when it naturally belongs with the scanner refactor.
- If a scanner dead-code finding does not belong with the refactor, D5 should leave it documented for D6 or a follow-up cleanup task.
- D5 should use the configured Knip baseline from D1 when checking whether scanner exports/files are still reported.

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

Implementation steps:
1. Read the D1 handoff table and note any scanner findings assigned to D5.
2. Establish scanner baseline.
   - Run `npm run check`.
   - Run `npm run test`.
   - Run the maintainability ESLint command and record scanner warnings.
3. Identify scanner responsibilities.
   - Path/stat reading and error handling.
   - Folder exclusion and hidden-folder behavior.
   - Folder signal and inherited hint calculation.
   - Depth and file-count limit handling.
   - File artifact classification and recent-file tracking.
   - Warning construction and state updates.
4. Introduce a small scan context if it reduces parameter pressure.
   - Candidate context fields: `rootPath`, `options`, `state`.
   - Keep depth and inherited hints explicit if that makes recursion easier to read.
5. Extract behavior-preserving helpers.
   - `scanDirectory` or equivalent for directory-specific flow.
   - `scanFile` or equivalent for file-specific flow.
   - Warning helper functions for read errors, skipped symlinks, excluded folders, depth limit, and file limit.
   - State update helpers only where they clarify behavior.
6. Apply D1-routed scanner cleanup only when it belongs with the current refactor.
   - If it does not belong, leave it documented for D6 or a follow-up task.
7. Preserve edge-case behavior.
   - Symlink skipping when `followSymlinks` is false.
   - `maxDepth` behavior.
   - `maxFiles` behavior and single file-limit warning.
   - Hidden folder handling.
   - Excluded folder warning behavior.
   - Recent file ordering and truncation.
8. Compare maintainability output.
   - Record which scanner warnings were reduced.
   - Keep any remaining warning only with a clear reason.

Expected outputs:
- Smaller scanner traversal functions.
- Clearer separation between traversal, classification, warning creation, and scan-state mutation.
- No scanner behavior change.

Do not:
- Change default scan limits.
- Follow symlinks by default.
- Change warning semantics without explicit approval.
- Mix renderer refactoring into this deliverable.

Suggested verification:
- `npm run check`
- `npm run test`
- Targeted scanner integration tests.

### D6: Reclassify Informational And Already-Fixed Findings

Purpose:
- Make the static-analysis report accurate as a source for future tasks.

Inputs from D1:
- Use D1's before/after Knip result as the source for final dead-code-analysis status.
- Use D1's handoff table to verify that every remaining Knip finding was fixed, accepted, deferred, assigned to a later deliverable, or converted into a follow-up task recommendation.
- D6 must not close TASK-0009 while any D1-routed finding has no final status.

Scope:
- Reclassify import-boundary analysis from `false-positive` to a passed informational check.
- Mark workflow first-run guidance as fixed or closed.
- Add final status for each original finding.

Acceptance criteria:
- The report clearly distinguishes open tasks, fixed items, passed checks, false positives, accepted risks, and deferred investigations.
- No item that is merely a passed check appears as an actionable defect.

Implementation steps:
1. Read the D1 handoff table and confirm each routed finding has a final status.
2. Add a final-status section to the static-analysis report.
   - Keep the original findings intact as first-run evidence.
   - Add a later dated table or addendum that says what happened to each finding.
3. Reclassify SA-006.
   - Change the follow-up interpretation from false positive to passed informational check.
   - Preserve the command that produced the passing dependency-cruiser result.
4. Close SA-007.
   - Mark the workflow guidance issue as fixed by the existing workflow update.
   - Record whether any new workflow guidance was added during TASK-0009.
5. Close or carry each deliverable.
   - SA-001: fixed, partially fixed, or accepted build-toolchain risk.
   - SA-002: fixed or explicitly deferred.
   - SA-003: fixed, intentionally retained, or deferred.
   - SA-004: fixed enough for local use, or remaining tool limitations listed.
   - SA-005: renderer/scanner refactors completed or remaining hotspots listed.
6. Update this task's closeout.
   - Record final commands run.
   - Record residual risk.
   - Record follow-up tasks only if something is intentionally left outside this task.

Expected outputs:
- Static-analysis report is useful as history and as task source material.
- TASK-0009 can be closed without ambiguity about which findings remain.

Do not:
- Rewrite the original report in a way that erases first-run evidence.
- Leave passed checks classified as defects.

Suggested verification:
- Documentation review.
- `npm run check` if docs-only changes are part of the same branch.

## Implementation Plan

This task should be implemented as a sequence of small changes, not as one large mixed refactor.

Each phase is a separate sub-task. Complete, verify, document, and commit one phase before starting the next phase. The expected default is one commit per deliverable. Use more than one commit inside a deliverable only when the deliverable itself naturally splits into smaller reviewable changes.

Commit isolation rules:
- Every commit must map to exactly one deliverable: D1, D2, D3, D4, D5, or D6.
- A commit message should include the deliverable id, for example `TASK-0009 D1: Configure Knip baseline`.
- Do not combine dependency changes with renderer or scanner refactors.
- Do not combine report closeout with implementation changes unless the report update is the only purpose of that deliverable commit.
- Before committing a deliverable, run that deliverable's minimum verification commands and record the result in this task.
- After committing a deliverable, confirm the worktree is clean or contains only explicitly deferred work for a later deliverable.

### Phase 0: Reconfirm Baseline

Steps:
1. Confirm the worktree is clean before starting.
2. Run `npm run check`.
3. Run `npm run test`.
4. Run `npx knip --no-progress`.
5. Run the maintainability ESLint command from the report.
6. Record any drift from the 2026-05-11 report in this task before editing code.

Exit criteria:
- The implementer knows whether the original findings still reproduce.
- Any changed baseline is documented before fixes begin.
- No product or tooling changes are committed in this phase unless the baseline documentation itself is updated; if committed, use a D1 or planning-documentation commit rather than mixing it with later fixes.

### Phase 1: Make Analysis Output Trustworthy

Deliverable:
- D1

Steps:
1. Add the smallest Knip config that models this Electron/Vite project.
2. Treat entrypoints, fixtures, and `powershell.exe` explicitly.
3. Re-run Knip.
4. Update the report with the new dead-code-analysis baseline.

Exit criteria:
- Remaining Knip findings are actionable or explicitly classified.
- D1 changes are committed separately before D2 begins.

### Phase 2: Resolve Small Dependency Hygiene Items

Deliverable:
- D2

Steps:
1. Fix or re-source the `ForgeConfig` type import.
2. Remove or document the unused auto-unpack plugin.
3. Regenerate package metadata if dependency declarations change.
4. Verify package metadata with `npm ci`, `npm run check`, `npm run test`, and Knip.

Exit criteria:
- SA-002 and SA-003 have final status recorded.
- D2 changes are committed separately before D3 begins.

### Phase 3: Review Build-Toolchain Security Findings

Deliverable:
- D3

Steps:
1. Re-run production and full dependency audits.
2. Identify low-risk updates, if any.
3. Apply only reviewed safe updates.
4. Document unresolved advisories and risk acceptance separately for dev/build tooling.

Exit criteria:
- SA-001 has a final status and no one has to infer runtime risk from full-audit output.
- D3 changes are committed separately before D4 begins.

### Phase 4: Refactor Renderer

Deliverable:
- D4

Steps:
1. Create a focused renderer refactor change.
2. Extract context-package rendering helpers.
3. Extract transcription-import rendering helpers.
4. Extract tree rendering helpers where useful.
5. Keep top-level render orchestration readable.
6. Verify with tests and maintainability command.

Exit criteria:
- Renderer production hotspots are reduced and behavior is preserved.
- D4 changes are committed separately before D5 begins.

### Phase 5: Refactor Scanner

Deliverable:
- D5

Steps:
1. Create a focused scanner refactor change.
2. Introduce scan context if it reduces parameter count cleanly.
3. Extract directory and file scan branches.
4. Extract warning helpers.
5. Preserve all scanner edge-case behavior.
6. Verify with scanner tests and maintainability command.

Exit criteria:
- Scanner production hotspots are reduced and behavior is preserved.
- D5 changes are committed separately before D6 begins.

### Phase 6: Report And Task Closeout

Deliverable:
- D6

Steps:
1. Add final status to the static-analysis report.
2. Update this task's checklist, build log, verification log, review notes, documentation notes, and closeout.
3. Identify any residual follow-up tasks.
4. Run final verification.

Exit criteria:
- The task can be reviewed without reading the entire conversation history.
- D6 documentation and closeout changes are committed separately from implementation commits.

## Proposed Implementation Order

1. D1: Configure static analysis for project shape.
2. D2: Resolve direct dependency and unused plugin findings.
3. D3: Review development/build-toolchain audit findings.
4. D4: Refactor renderer maintainability hotspots.
5. D5: Refactor folder scanner maintainability hotspots.
6. D6: Update the report with what happened to each finding and close out.

Reasoning:
- D1 should happen first because it improves signal before any deletion or cleanup.
- D2 and D3 are dependency-focused and can be reviewed separately from code refactors.
- D4 and D5 are production-code refactors and should be isolated to keep regression risk manageable.
- D6 belongs at the end because it records what actually happened.

Parallelization guidance:
- D4 and D5 may be done by separate implementers only if their write scopes stay disjoint.
- D2 and D3 should not run in parallel if both may edit `package.json` or `package-lock.json`.
- D6 should not start until the other deliverables have recorded final status.
- Parallel work must still be integrated as separate deliverable commits. Do not squash parallel deliverables into one combined commit.
- If a later deliverable reveals that an earlier deliverable needs adjustment, make a new commit for the earlier deliverable's scope or explicitly document why the adjustment belongs to the current deliverable.

## Human Gates

Human approval is required before implementation because this is a Major task.

Additional approval should be requested before:
- adopting Knip, dependency-cruiser, or any other static-analysis tool as a committed project dependency;
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

Per-deliverable minimums:
- D1: Knip command plus `npm run check`.
- D2: `npm ci`, `npm run check`, `npm run test`, Knip, and packaging verification or explicit packaging deferral.
- D3: production audit, full audit, `npm run check`, `npm run test`, and packaging verification if build dependencies change.
- D4: `npm run check`, `npm run test`, `npm run test:ui` when practical, and maintainability command comparison.
- D5: `npm run check`, `npm run test`, targeted scanner tests, and maintainability command comparison.
- D6: documentation review plus final `npm run check`.

Commit gate for each deliverable:
- Verify the deliverable.
- Update this task's Build Log and Verification Log for that deliverable.
- Commit only the files that belong to that deliverable.
- Confirm the next deliverable starts from a clean or intentionally documented worktree.

Final verification before closeout:
- `npm run check`
- `npm run test`
- `npx knip --no-progress`
- `npm audit --omit=dev`
- Full `npm audit`, with any remaining dev/build-toolchain advisories documented.

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
- Update `docs/static-analysis/2026-05-11-static-analysis.md` with final status for each finding.
- Update `docs/workflows/static-analysis.md` only if the follow-up work reveals additional reusable workflow improvements.
- Add a decision record only if the project adopts new static-analysis tooling as durable project policy or changes build-toolchain strategy.

Documentation structure expectation:
- Preserve the original report as first-run evidence.
- Add later dated addenda for reruns and final status updates.
- Keep task-level planning and implementation logs in this file.

## Build Log

- 2026-05-11: D1 started after human approval.
- 2026-05-11: Baseline before D1:
  - `npm run check`: passed.
  - `npm run test`: passed, 9 test files and 32 tests.
  - `npx knip --no-progress`: reproduced first-run Knip findings.
- 2026-05-11: Added `knip.json` to model Electron/Vite entrypoints, scripts, tests, intentional fixtures, and `powershell.exe` Windows tooling.
- 2026-05-11: D1 after configuration:
  - Known Electron/Vite entrypoints no longer appear as unused files.
  - Intentional fixture files no longer appear as deletion candidates.
  - `powershell.exe` no longer appears as an unlisted binary.
  - Remaining Knip findings were routed in `docs/static-analysis/2026-05-11-static-analysis.md`.
- 2026-05-11: D2 started from D1's handoff table.
- 2026-05-11: D2 changed dependency metadata:
  - Added `@electron-forge/shared-types` as a direct `devDependency`.
  - Removed `@electron-forge/plugin-auto-unpack-natives` because no repository usage or current native dependency need was found.
  - Regenerated `package-lock.json`.
- 2026-05-11: D3 reviewed development/build-toolchain audit findings.
  - Production dependency audit remains clean.
  - Full audit still reports development/build-toolchain vulnerabilities.
  - `npm audit fix --package-lock-only --dry-run` did not identify a safe non-breaking cleanup path.
  - No dependency update was made in D3.
  - SA-001 is accepted for now as development/build-toolchain risk, not runtime dependency risk.

## Verification Log

- 2026-05-11: D1 verification:
  - `npm run check`: passed.
  - `npm run test`: passed.
  - `npx knip --no-progress`: completed with remaining findings documented in the D1 handoff table.
- 2026-05-11: D2 verification:
  - `npm ci`: passed.
  - `npm run check`: passed.
  - `npm run test`: passed.
  - `npm run package`: passed on Linux x64.
  - `npx knip --no-progress`: SA-002 and SA-003 no longer appear; remaining output is exported symbols and exported types routed by D1.
- 2026-05-11: D3 verification:
  - `npm audit --omit=dev`: passed.
  - `npm audit`: failed with remaining development/build-toolchain advisories; accepted as documented in the static-analysis report.
  - `npm run check`: passed.
  - `npm run test`: passed.

## Closeout

Pending.
