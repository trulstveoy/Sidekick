# Static Analysis Report

Date:
- 2026-05-11

Repository or project:
- Sidekick

Scope:
- First local run of `docs/workflows/static-analysis.md` against the repository codebase.
- Scope included TypeScript baseline checks, dependency audit, dead-code analysis, import-boundary analysis, and maintainability metrics.
- This report is task-ready source material. It does not create implementation tasks by itself.

Environment:
- Analysis execution branch: `codex/local-static-analysis-workflow`
- Analysis execution commit: `f9d3e49`
- Analysis execution worktree: `/home/trutve/code/Sidekick-codex`
- Document location after cleanup: `/home/trutve/code/Sidekick/docs/static-analysis/2026-05-11-static-analysis.md`
- Dependency install: `npm ci`
- Tool versions:
  - TypeScript: project dev dependency `6.0.3`
  - ESLint: project dev dependency `8.57.1`
  - Knip: transient `npx knip`, version `6.12.2`
  - dependency-cruiser: transient `npm exec --package dependency-cruiser@17.4.0`

Tools and commands:
- `npm ci`
- `npm run check`
- `npm audit --omit=dev`
- `npm audit`
- `npm run test`
- `npx knip --version`
- `npx knip --no-progress`
- `npx dependency-cruiser --version`
- `npx dependency-cruiser --info`
- `npx dependency-cruiser --no-config src tests scripts --output-type err`
- `npx dependency-cruiser --no-config --exclude "^node_modules" src tests scripts --output-type err`
- `NODE_PATH=./node_modules npm exec --package dependency-cruiser@17.4.0 -- dependency-cruiser --info`
- `NODE_PATH=./node_modules npm exec --package dependency-cruiser@17.4.0 -- dependency-cruiser --no-config --exclude "^node_modules" src tests scripts --output-type err`
- `npx eslint --ext .ts,.tsx . --rule 'complexity: ["warn", 10]' --rule 'max-lines: ["warn", {"max": 300, "skipBlankLines": true, "skipComments": true}]' --rule 'max-lines-per-function: ["warn", {"max": 60, "skipBlankLines": true, "skipComments": true}]' --rule 'max-statements: ["warn", 25]' --rule 'max-depth: ["warn", 3]' --rule 'max-params: ["warn", 4]' --rule 'max-classes-per-file: ["warn", 1]'`

Summary:
- Total findings: 7
- Fix now: 1
- Report for task: 5
- Deferred: 0
- False positives: 1
- Accepted risks: 0

Baseline results:
- `npm run check`: passed after local dependencies were installed.
- `npm audit --omit=dev`: passed, `found 0 vulnerabilities`.
- `npm run test`: passed, 9 files and 32 tests.
- First `npm run check` before `npm ci`: failed because `eslint` was not installed in the new worktree.

## Findings

### SA-001: Development dependency audit reports vulnerable toolchain packages

Category:
- security

Severity:
- medium

Confidence:
- high

Outcome:
- report-for-task

Task readiness:
- ready

Affected area:
- Files:
  - `package.json`
  - `package-lock.json`
- Dependencies:
  - `@electron-forge/*`
  - `@electron/node-gyp`
  - `@electron/rebuild`
  - `vite`
  - transitive packages including `tar`, `tmp`, `esbuild`, `@tootallnate/once`
- Boundary:
  - development/build toolchain

Evidence:
- Tool: npm audit
- Rule: npm advisory database
- Command: `npm audit`
- Output excerpt:
  - `32 vulnerabilities (6 low, 2 moderate, 24 high)`
  - `npm audit --omit=dev` separately returned `found 0 vulnerabilities`.
  - `esbuild <=0.24.2` has a moderate development-server advisory through `vite`.
  - `tar <=7.5.10` high advisories appear through Electron Forge rebuild/tooling dependencies, with `No fix available` in the current dependency tree.
  - `tmp <=0.2.3` appears through `@inquirer/prompts`, with `No fix available`.

Problem:
- Runtime production dependencies have no reported vulnerabilities, but the full dependency tree contains development/build-toolchain vulnerabilities.

Why it matters:
- Development-only vulnerabilities do not necessarily affect shipped runtime code, but this repository builds and packages a desktop app. Build-toolchain vulnerabilities should be understood because they can affect local packaging, release preparation, or developer machines.

Recommended next action:
- Create a dependency review task focused on the development/build toolchain.
- Split production dependency risk from development-toolchain risk.
- Check whether newer Electron Forge, Vite, Electron, or related package versions reduce the audit surface without breaking packaging.
- Do not run `npm audit fix --force` blindly because npm reports breaking-change upgrades.

Suggested verification:
- `npm audit --omit=dev`
- `npm audit`
- `npm run check`
- `npm run test`
- packaging verification if Electron Forge versions change

Likely task class:
- standard

Open questions:
- Are development-toolchain vulnerabilities acceptable for local-only prerelease work?
- Is there a current Electron Forge version that resolves the `tar` chain without introducing package/regression risk?

False-positive risk:
- Low. The advisories are real, but their impact is development/build-time rather than production runtime.

Workflow observations:
- The workflow should continue to require production audit and full audit results to be reported separately.

### SA-002: `@electron-forge/shared-types` is imported directly but not listed directly

Category:
- unused-dependency

Severity:
- medium

Confidence:
- high

Outcome:
- report-for-task

Task readiness:
- ready

Affected area:
- Files:
  - `forge.config.ts`
  - `package.json`
  - `package-lock.json`
- Dependencies:
  - `@electron-forge/shared-types`

Evidence:
- Tool: Knip
- Rule: unlisted dependencies
- Command: `npx knip --no-progress`
- Output excerpt:
  - `Unlisted dependencies (1)`
  - `@electron-forge/shared-types  forge.config.ts:1:34`
- Local inspection:
  - `forge.config.ts` imports `ForgeConfig` from `@electron-forge/shared-types`.
  - `package-lock.json` contains `@electron-forge/shared-types` transitively through Electron Forge packages.

Problem:
- The project imports `@electron-forge/shared-types` directly but relies on it being available transitively.

Why it matters:
- Direct imports should normally be direct dependencies or devDependencies. Relying on transitive package availability makes the Forge config more fragile during dependency upgrades.

Recommended next action:
- Add `@electron-forge/shared-types` as a direct `devDependency`, or change the config to import the type from a direct package if Electron Forge exposes an equivalent stable type.

Suggested verification:
- `npm run check`
- `npx knip --no-progress`
- `npm run test`

Likely task class:
- standard

Open questions:
- Which Electron Forge package is the preferred public source for `ForgeConfig` in the current Forge version?

False-positive risk:
- Low. The import is direct and the package is not direct in `package.json`.

Workflow observations:
- The workflow should explicitly treat unlisted dependency findings as stronger task candidates than generic unused-export findings.

### SA-003: `@electron-forge/plugin-auto-unpack-natives` appears unused

Category:
- unused-dependency

Severity:
- low

Confidence:
- medium

Outcome:
- report-for-task

Task readiness:
- ready

Affected area:
- Files:
  - `package.json`
  - `package-lock.json`
  - `forge.config.ts`
- Dependencies:
  - `@electron-forge/plugin-auto-unpack-natives`

Evidence:
- Tool: Knip
- Rule: unused devDependencies
- Command: `npx knip --no-progress`
- Output excerpt:
  - `Unused devDependencies (1)`
  - `@electron-forge/plugin-auto-unpack-natives  package.json:39:6`
- Local inspection:
  - `forge.config.ts` configures `VitePlugin` and `FusesPlugin`.
  - No import or plugin usage for `@electron-forge/plugin-auto-unpack-natives` was found.

Problem:
- The package appears to be installed but unused by the current Forge configuration.

Why it matters:
- Unused development dependencies add install time, audit surface, and maintenance noise.

Recommended next action:
- Confirm whether native auto-unpack behavior is intentionally deferred or obsolete.
- If obsolete, remove `@electron-forge/plugin-auto-unpack-natives` from `devDependencies` and regenerate the lockfile.

Suggested verification:
- `npm ci`
- `npm run check`
- `npx knip --no-progress`
- packaging verification if Forge plugin dependencies change

Likely task class:
- standard

Open questions:
- Was this plugin intentionally reserved for a future native dependency?

False-positive risk:
- Medium. Electron Forge plugins can be configuration-driven, but local inspection did not find usage.

Workflow observations:
- Dependency cleanup findings need package-manager verification steps in the eventual task.

### SA-004: Knip needs project-specific entry and ignore configuration

Category:
- dead-code

Severity:
- medium

Confidence:
- high

Outcome:
- report-for-task

Task readiness:
- ready

Affected area:
- Files:
  - `src/preload.ts`
  - `vite.preload.config.ts`
  - `tests/fixtures/project-folder-basic/dist/ignored-package/index.js`
  - `forge.config.ts`
  - `src/main/context-package.ts`
  - `src/main/folder-scanner.ts`
  - `src/main/transcription-importer.ts`
  - `src/shared/sidekick-api.ts`

Evidence:
- Tool: Knip
- Rule: unused files, unused exports, unused exported types
- Command: `npx knip --no-progress`
- Output excerpt:
  - `Unused files (3)`
  - `src/preload.ts`
  - `tests/fixtures/project-folder-basic/dist/ignored-package/index.js`
  - `vite.preload.config.ts`
  - `Unused exports (6)`
  - `default forge.config.ts:104:16`
  - `CONTEXT_PACKAGE_SUFFIX src/main/context-package.ts:11:14`
  - `BINARY_FILE_WARNING src/main/context-package.ts:24:14`
  - `SELF_IGNORE_WARNING src/main/context-package.ts:27:14`
  - `DEFAULT_SCAN_OPTIONS src/main/folder-scanner.ts:14:14`
  - `findTranscriptionFolders src/main/transcription-importer.ts:157:14`
  - `Unused exported types (4)`
  - `ScanStatus`
  - `ScanWarningSeverity`
  - `TranscriptionImportWarning`
  - `SidekickApi`
- Local inspection:
  - `src/preload.ts` and `vite.preload.config.ts` are Electron Forge/Vite entrypoints configured in `forge.config.ts`.
  - `tests/fixtures/project-folder-basic/dist/ignored-package/index.js` is fixture data for scanner ignore behavior.
  - Several exported constants/functions are used internally in their source module but may not need to be exported.
  - `SidekickApi` is imported by `src/preload.ts`, so its unused-type report is downstream of Knip not recognizing the preload entrypoint.

Problem:
- First-pass Knip output mixes true cleanup candidates with known framework entrypoints, fixture files, and public contract types. Without project configuration, the report is not directly actionable.

Why it matters:
- Dead-code analysis needs high signal before deletion. Misclassifying Electron preload/config files or fixtures as unused could lead to unsafe cleanup tasks.

Recommended next action:
- Add a local Knip configuration task before making Knip results mandatory.
- Configure Electron/Vite entrypoints, package scripts, tests, fixture exclusions, and generated/noisy paths.
- After configuration, rerun Knip and split remaining findings into cleanup tasks.

Suggested verification:
- `npx knip --no-progress`
- `npm run check`
- `npm run test`
- packaging/preload smoke verification if preload entry configuration changes

Likely task class:
- standard

Open questions:
- Should exported types in `src/shared/sidekick-api.ts` be treated as public API even when only used by composed exported types?
- Should fixture files under ignored directories be excluded globally from dead-code analysis?

False-positive risk:
- High for `src/preload.ts`, `vite.preload.config.ts`, fixture files, and `SidekickApi`.
- Medium for exported constants/functions that are used internally but may not need `export`.

Workflow observations:
- The workflow should explicitly say first-pass Knip output is expected to require project-specific configuration before deletion tasks are created.

### SA-005: Renderer and scanner have maintainability hotspots

Category:
- maintainability

Severity:
- medium

Confidence:
- high

Outcome:
- report-for-task

Task readiness:
- ready

Affected area:
- Files:
  - `src/renderer.ts`
  - `src/main/folder-scanner.ts`
  - `src/main/repomix-runner.ts`
  - `tests/e2e/renderer-smoke.spec.ts`
  - `tests/integration/transcription-importer.test.ts`

Evidence:
- Tool: ESLint with local maintainability rules
- Rules:
  - `complexity`
  - `max-lines`
  - `max-lines-per-function`
  - `max-statements`
  - `max-depth`
  - `max-params`
  - `max-classes-per-file`
- Command:
  - `npx eslint --ext .ts,.tsx . --rule 'complexity: ["warn", 10]' --rule 'max-lines: ["warn", {"max": 300, "skipBlankLines": true, "skipComments": true}]' --rule 'max-lines-per-function: ["warn", {"max": 60, "skipBlankLines": true, "skipComments": true}]' --rule 'max-statements: ["warn", 25]' --rule 'max-depth: ["warn", 3]' --rule 'max-params: ["warn", 4]' --rule 'max-classes-per-file: ["warn", 1]'`
- Output excerpt:
  - `src/main/folder-scanner.ts`: `scanNode` has 137 lines, 52 statements, complexity 18, 6 parameters, and nesting depth 4.
  - `src/main/folder-scanner.ts`: file has 412 lines.
  - `src/main/folder-scanner.ts`: `extensionType` has complexity 13.
  - `src/renderer.ts`: file has 807 lines.
  - `src/renderer.ts`: `renderContextPackage` has 91 lines, 52 statements, complexity 13.
  - `src/renderer.ts`: `renderTranscriptionImport` has 86 lines, 50 statements, complexity 11.
  - `src/renderer.ts`: `renderTreeNode` has 68 lines, 49 statements, complexity 14.
  - `src/renderer.ts`: `render` has 43 statements.
  - `src/main/repomix-runner.ts`: `validateFileSafetyInProcess` has 5 parameters.
  - Test files also exceed some size/function thresholds.

Problem:
- Rendering and scanning logic has grown into large functions/files with high statement counts and branching. The strongest production hotspots are `src/renderer.ts` and `src/main/folder-scanner.ts`.

Why it matters:
- Large renderer functions make UI state changes harder to review safely. Large recursive scanner logic increases regression risk around filesystem boundaries, symlink handling, limits, warnings, and artifact classification.

Recommended next action:
- Create separate refactoring tasks for renderer rendering/state slices and scanner traversal/classification.
- Prioritize production files over test files.
- Avoid behavior changes in the first refactor; extract named helpers and preserve tests.

Suggested verification:
- `npm run check`
- `npm run test`
- targeted UI smoke tests if renderer rendering changes
- scanner integration tests if `scanNode` changes

Likely task class:
- standard

Open questions:
- Should tests have looser maintainability thresholds than production code?
- Should renderer composition be split by feature panels before adding more UI features?

False-positive risk:
- Low for production file/function size and complexity.
- Medium for test file size, because long scenario tests can be acceptable.

Workflow observations:
- The workflow should say maintainability thresholds should distinguish production code from tests and fixtures.

### SA-006: Import-boundary analysis found no violations after TypeScript support was enabled

Category:
- import-boundary

Severity:
- info

Confidence:
- high

Outcome:
- false-positive

Task readiness:
- not-a-task

Affected area:
- Files:
  - `src/main.ts`
  - `src/preload.ts`
  - `src/renderer.ts`
  - `src/shared/sidekick-api.ts`
  - `tests/**`
  - `scripts/**`

Evidence:
- Tool: dependency-cruiser
- Command:
  - `NODE_PATH=./node_modules npm exec --package dependency-cruiser@17.4.0 -- dependency-cruiser --no-config --exclude "^node_modules" src tests scripts --output-type err`
- Output excerpt:
  - `✔ no dependency violations found (36 modules, 59 dependencies cruised)`
- Text graph excerpt:
  - `src/renderer.ts -> src/index.css`
  - `src/renderer.ts -> src/shared/sidekick-api.ts`
  - `src/preload.ts -> src/shared/sidekick-api.ts`
  - `src/main.ts -> src/main/context-package.ts`
  - `src/main.ts -> src/main/folder-scanner.ts`
  - `src/main.ts -> src/main/transcription-importer.ts`
  - `src/main.ts -> src/shared/sidekick-api.ts`

Problem:
- No import-boundary issue was found in this run.

Why it matters:
- This is positive evidence that the renderer does not currently import main-process modules directly.

Recommended next action:
- No code task from this finding.
- Future adoption should add explicit dependency-cruiser rules before treating import-boundary analysis as mandatory.

Suggested verification:
- Re-run the dependency-cruiser command after rule configuration exists.

Likely task class:
- unknown

Open questions:
- What exact import-boundary rules should become mandatory if this tool is adopted locally?

False-positive risk:
- Low after `NODE_PATH=./node_modules` enabled `.ts` and `.tsx` support.

Workflow observations:
- A transient dependency-cruiser run without `NODE_PATH=./node_modules` did not detect TypeScript files and only cruised 14 JavaScript modules. The workflow needed a TypeScript support check.

### SA-007: Static-analysis workflow needed first-run operational guidance

Category:
- maintainability

Severity:
- medium

Confidence:
- high

Outcome:
- fix-now

Task readiness:
- ready

Affected area:
- Files:
  - `docs/workflows/static-analysis.md`

Evidence:
- Manual workflow execution
- Commands:
  - `npm run check`
  - `npm ci`
  - `npx knip --no-progress`
  - `npx dependency-cruiser --info`
  - `NODE_PATH=./node_modules npm exec --package dependency-cruiser@17.4.0 -- dependency-cruiser --no-config --exclude "^node_modules" src tests scripts --output-type err`
- Observations:
  - Initial `npm run check` failed because `node_modules` was missing in the new worktree.
  - `npx dependency-cruiser --info` did not detect TypeScript support in the transient package environment.
  - `NODE_PATH=./node_modules` was needed so transient dependency-cruiser could detect the project's TypeScript installation.
  - Running dependency-cruiser without `--exclude "^node_modules"` produced noisy raw output.

Problem:
- The workflow did not explain enough first-run mechanics for an isolated worktree where dependencies and transient tools may be missing.

Why it matters:
- Without this guidance, the first local static-analysis run can produce misleading failures or incomplete import graphs.

Recommended next action:
- Update `docs/workflows/static-analysis.md` with local environment bootstrap, transient tool usage, and dependency-cruiser TypeScript support checks.

Suggested verification:
- Review the updated workflow text.
- `npm run check`

Likely task class:
- tiny

Open questions:
- Should future reports include a dedicated `Workflow observations` section by default?

False-positive risk:
- Low. These issues were observed during this first run.

Workflow observations:
- This finding was fixed as part of the same analysis pass by updating the workflow.

## False Positives

- Finding: Knip reported `src/preload.ts` and `vite.preload.config.ts` as unused files.
  Reason: They are Electron Forge/Vite preload entrypoints configured through `forge.config.ts`.
  Suppression or config change: Add project-specific Knip entry configuration before acting on these as deletion candidates.

- Finding: Knip reported `SidekickApi` as an unused exported type.
  Reason: `SidekickApi` is imported by `src/preload.ts`; the finding is downstream of Knip not recognizing `src/preload.ts` as an entrypoint.
  Suppression or config change: Same as above.

## Deferred Findings

- Finding: Repository-wide duplication detection.
  Missing context: The free local default stack does not include a duplicate-code analyzer.
  Next investigation step: Decide whether duplication detection is worth adding as a separate free local tool.

- Finding: Exact cognitive-complexity scoring.
  Missing context: The default stack uses ESLint complexity, nesting, function length, and review as proxies.
  Next investigation step: Decide whether exact cognitive complexity is worth adding as a separate free local tool.

## Accepted Risks

- None.

## Local Verification

- `npm run check`: passed.
- `npm audit --omit=dev`: passed, `found 0 vulnerabilities`.
- `npm audit`: failed with development/build-toolchain vulnerabilities; captured as `SA-001`.
- `npm run test`: passed, 9 files and 32 tests.
- `npx knip --no-progress`: completed with findings; captured in `SA-002`, `SA-003`, and `SA-004`.
- `NODE_PATH=./node_modules npm exec --package dependency-cruiser@17.4.0 -- dependency-cruiser --no-config --exclude "^node_modules" src tests scripts --output-type err`: passed with no dependency violations.
