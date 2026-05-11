# Static Analysis Workflow

Status: Draft

This document defines an application-agnostic workflow for using static analysis in TypeScript projects. It is intended to be reusable across desktop apps, web apps, services, libraries, command-line tools, and mixed repositories.

Static analysis findings are signals, not automatic deletion instructions. Findings must be reviewed against the project's runtime model, public APIs, tests, security boundaries, and user workflows before code is removed or a rule becomes mandatory in local scripts.

## Goals

- Keep TypeScript, lint, and import errors out of the repository.
- Find unused files, unused exports, unused types, unused dependencies, and stale public APIs.
- Detect architecture drift, such as forbidden imports, dependency cycles, and layer violations.
- Detect security anti-patterns before release.
- Make analysis repeatable on a local developer machine.
- Keep false-positive handling explicit and reviewable.

## Non-Goals

- Do not auto-delete code from static analysis output alone.
- Do not add new dependencies without a separate implementation task and dependency review.
- Do not treat every third-party tool finding as mandatory work on first adoption.
- Do not replace tests, runtime checks, manual QA, or security review.
- Do not require every project to use every tool listed here.

## Baseline Model

Each project should define a small local baseline before adding specialized tools.

Typical TypeScript baseline:

- lint: ESLint with TypeScript-aware rules.
- typecheck: TypeScript compiler with no emit.
- dependency audit: package-manager audit or a dependency scanning service.
- tests: unit, integration, or UI tests where relevant.

Example commands, if a project exposes npm scripts:

```bash
npm run lint
npm run typecheck
npm run check
npm test
npm audit --omit=dev
```

The exact command names are project-specific. The workflow requires that the commands be discoverable in project documentation, package scripts, or agent instructions.

## Minimal Recommended Toolchain

Prefer a small default toolchain. Add more tools only when a functional gap remains.

| Need | Default choice | Why |
| --- | --- | --- |
| Type correctness | TypeScript | Native source-of-truth for TypeScript type checking. |
| Lint and local maintainability limits | ESLint with typescript-eslint | Covers style, correctness rules, import rules, and many size or complexity thresholds locally. |
| Dead code and dependency cleanup | Knip | Covers unused files, exports, types, dependencies, and project entry point drift better than a linter. |
| Import architecture | dependency-cruiser | Covers dependency direction, forbidden imports, cycles, and boundary rules. |

## Free-Only Constraint

The default toolchain must use tools that can be run without license fees and without hosted product subscriptions.

| Tool | Free status | Notes |
| --- | --- | --- |
| TypeScript | Free, open source | Apache-2.0 licensed. |
| ESLint | Free, open source | MIT licensed. |
| typescript-eslint | Free, open source | MIT licensed. |
| Knip | Free, open source | ISC licensed. |
| dependency-cruiser | Free, open source | MIT licensed. |

Tools with paid products, hosted subscriptions, or restricted free tiers must not be default dependencies. They may be used only when a separate decision explicitly accepts their constraints.

Do not run overlapping tools by default. In particular:

- Do not add another linter when ESLint already owns linting.
- Do not add another import graph tool when dependency-cruiser already owns import architecture.
- Do not add separate SAST products by default unless a security requirement cannot be covered by the core toolchain.
- Do not add reporting products to the default workflow.
- Add a platform-specific scanner only when the project has a platform-specific security boundary that the default stack cannot check.

## Functional Coverage Without Reporting Products

Removing reporting products keeps the toolchain smaller and fully local, but changes the coverage model.

| Functional need | Covered by default? | Default coverage |
| --- | --- | --- |
| Type errors | Yes | TypeScript. |
| Lint correctness rules | Yes | ESLint with TypeScript-aware rules. |
| Unused locals and imports | Yes | TypeScript and ESLint rules. |
| Unused files, exports, types, and dependencies | Yes | Knip. |
| Forbidden imports, dependency direction, and cycles | Yes | dependency-cruiser. |
| File length, function length, statement count, nesting, parameters, classes per file | Yes | ESLint size and complexity rules. |
| Cyclomatic complexity | Yes | ESLint `complexity`. |
| Cognitive complexity | Partly | Use cyclomatic complexity, nesting depth, function length, and review as proxies. Exact cognitive-complexity scoring requires an additional analyzer. |
| Methods per class | Partly | Use review checklist or a custom ESLint rule if this becomes important. |
| Single Responsibility and SOLID indicators | Partly | Use metrics and import graphs as signals; final judgment remains human review. |
| Duplication detection | Partly | Small-scale duplication can be reviewed manually. Repository-wide duplicate-code detection requires an additional analyzer. |
| Security anti-patterns | Partly | ESLint, dependency audit, and boundary rules cover baseline issues. Dedicated SAST requires an additional free tool if the project needs deeper security analysis. |
| Central reports, historical trends, and maintainability ratings | No | These are intentionally out of scope for the default free local toolchain. Local scripts can still fail on concrete lint, typecheck, Knip, and dependency-cruiser thresholds. |

## Analysis Layers

Use analysis in layers. Each layer answers a different question.

| Layer | Question | Default tool |
| --- | --- | --- |
| Type and syntax | Does the code typecheck and follow baseline lint rules? | TypeScript, ESLint |
| Dead code | What files, exports, types, and dependencies appear unused? | Knip |
| Import architecture | Are module dependencies allowed? Are there cycles? | dependency-cruiser |
| Local maintainability metrics | Is changed code becoming large, nested, or hard to test? | ESLint complexity rules |
| Runtime or platform security | Are framework, desktop, server, or browser security boundaries respected? | Platform-specific scanner only when needed |

## Standard Local Flow

Run this flow before handing back non-trivial code changes.

1. Confirm scope.
   - Identify whether the change touches runtime boundaries, shared contracts, dependencies, local scripts, packaging, release behavior, filesystem access, networking, shell execution, external URLs, authentication, authorization, or persistence.
   - If it touches privileged APIs, external input, secrets, dependency configuration, release behavior, or deployment, mark the task as security-sensitive.

2. Check worktree state.
   - Run the project's normal status command, usually `git status --short`.
   - Do not revert unrelated user changes.

3. Run the baseline static checks.
   - Run the project's lint and typecheck commands.
   - If the project has a combined baseline command, prefer that.
   - If a check fails, fix failures that are in scope.
   - If failures are unrelated, record them clearly in the closeout.

4. Run broader verification when relevant.
   - Run tests when logic, contracts, services, UI behavior, or integrations changed.
   - Run build or packaging checks when build configuration, release configuration, or runtime packaging changed.
   - Run dependency audit or dependency scanning when dependencies or lockfiles changed.

5. Review the diff manually.
   - Confirm that imports respect the project's intended layers.
   - Confirm that public APIs, shared contracts, and generated artifacts have not changed accidentally.
   - Confirm that privileged operations stay behind narrow interfaces.
   - Confirm that external input is validated at enforceable boundaries.

6. Record results.
   - Include exact commands run.
   - Include failed or skipped checks with reasons.
   - Write a structured findings report when any tool or manual review finds an issue.
   - Include any static analysis findings that were intentionally accepted, deferred, or dismissed.

## Finding Handling Flow

Use this flow whenever local static analysis finds an issue. The goal is not to fix every finding immediately. The goal is to produce a structured report that can later be converted into implementation tasks.

1. Normalize the finding.
   - Give it a stable local ID, such as `SA-001`.
   - Record the tool, rule, command, file, line, symbol, and affected layer where available.
   - Copy only the minimal evidence needed to understand the finding.

2. Classify the finding.
   - Category: `typecheck`, `lint`, `dead-code`, `unused-dependency`, `import-boundary`, `cycle`, `maintainability`, `security`, `platform-boundary`, or `unknown`.
   - Severity: `critical`, `high`, `medium`, `low`, or `info`.
   - Confidence: `high`, `medium`, or `low`.
   - Scope: `single-file`, `module`, `cross-module`, `public-api`, `dependency`, `security-boundary`, or `project-wide`.

3. Decide the local outcome.
   - `fix-now`: small, safe, clearly in scope.
   - `report-for-task`: real issue, but should become a separate task.
   - `defer`: likely real, but needs more context before task creation.
   - `false-positive`: not a real issue after review.
   - `accepted-risk`: real issue, but intentionally not fixed now.

4. Capture task-ready context.
   - Explain the observed problem in one or two sentences.
   - Explain why it matters: correctness, maintainability, security, performance, developer experience, or cleanup.
   - Name the affected files, symbols, commands, or dependencies.
   - Include reproduction steps or the exact local command that produced the finding.
   - Describe the recommended next action.
   - List suggested verification for a future fix.
   - Note whether the future task is likely tiny, standard, or major.

5. Group related findings.
   - Group repeated instances of the same rule when they have the same cause and fix strategy.
   - Keep separate findings separate when they affect different owners, modules, risk levels, or verification paths.
   - Avoid creating one huge finding that cannot become a coherent task.

6. Record non-actions explicitly.
   - False positives need a reason and, if relevant, the narrow ignore or configuration improvement.
   - Accepted risks need a reason, owner, and review date if the project uses them.
   - Deferred findings need the missing context and the next investigation step.

## Severity And Confidence Guide

Use severity for impact and confidence for how likely the finding is real.

| Severity | Meaning |
| --- | --- |
| Critical | Likely security issue, data loss risk, or severe runtime failure that should be reported immediately. |
| High | Real correctness, security-boundary, dependency, or architecture problem that should be handled soon. |
| Medium | Maintainability, cleanup, or localized correctness risk that should become a normal task. |
| Low | Minor cleanup, readability, or local improvement. |
| Info | Useful observation with no clear required action yet. |

| Confidence | Meaning |
| --- | --- |
| High | Tool evidence and local inspection agree. |
| Medium | Tool evidence looks plausible, but needs owner review or more context. |
| Low | Tool output may be framework noise, dynamic usage, generated-code mismatch, or incomplete configuration. |

## Task Readiness Guide

A finding is task-ready when a developer can understand the problem and start work without rerunning the whole analysis first.

Task-ready findings should include:

- stable finding ID;
- title;
- category, severity, confidence, and outcome;
- affected files, symbols, dependencies, or boundaries;
- exact command or manual check that produced the finding;
- concise evidence;
- why it matters;
- recommended next action;
- suggested verification;
- known false-positive risks or open questions.

A finding is not task-ready when:

- it only says that a tool complained;
- it lacks affected files or symbols;
- it has no explanation of impact;
- it has no suggested next action;
- it groups unrelated problems together;
- it cannot be reproduced from a local command or described manual check.

## Report Placement

Static analysis reports should be stored in a predictable location so they can be reviewed later and converted into tasks when appropriate.

Recommended location:

```text
docs/static-analysis/
```

Recommended filename pattern:

```text
YYYY-MM-DD-static-analysis.md
YYYY-MM-DD-static-analysis-<short-scope>.md
```

Examples:

```text
docs/static-analysis/2026-05-11-static-analysis.md
docs/static-analysis/2026-05-11-static-analysis-dead-code.md
docs/static-analysis/2026-05-11-static-analysis-import-boundaries.md
```

Use one report per coherent analysis run. A coherent run usually means one local session with a clear scope, such as dead code, import boundaries, maintainability metrics, or a full local static-analysis pass.

Placement rules:

- Store durable reports in `docs/static-analysis/`.
- Keep temporary scratch output out of the report directory.
- Do not commit raw tool dumps when a summarized finding is enough.
- Include exact commands in the report so the analysis can be reproduced locally.
- Use stable finding IDs within each report, such as `SA-001`, `SA-002`, and `SA-003`.
- If a finding is later turned into a task, link the task back to the report and finding ID.
- If multiple reports exist for the same day, add a short scope suffix to the filename.

## Dead Code Flow

Use this flow when looking for unused files, unused exports, unused types, or unused dependencies.

1. Prefer a project-level dead-code analyzer.
   - Knip is a strong default for TypeScript repositories.
   - Start in report-only mode.
   - Do not use automatic fixes until the report has been reviewed and configuration is stable.

2. Configure entry points carefully.
   - Entry points should include actual application, library, script, test, and build entry files.
   - Project files should include source, tests, scripts, and configuration files that should be considered for usage.
   - Exclude generated output, dependency directories, build artifacts, caches, reports, and transient test output.

3. Triage findings in this order.
   - Unused files.
   - Unused exports and exported types.
   - Unused dependencies and devDependencies.
   - Missing or unlisted dependencies.

4. Confirm before deleting.
   - Search for dynamic references with a fast project search tool such as `rg`.
   - Check tests, scripts, build configuration, package scripts, and framework conventions.
   - Check whether an export is part of a public API, plugin boundary, generated contract, or documented integration point.
   - Remove code only when both the usage graph and local search support deletion.

5. Handle false positives explicitly.
   - Prefer better entry point or project configuration before adding ignores.
   - If an ignore is needed, add the narrowest ignore possible and include the reason.
   - Re-run the analyzer after each cleanup slice.

6. Verify after cleanup.
   - Run the project's lint and typecheck baseline.
   - Run targeted tests for affected modules.
   - Run the broader test suite when deleting shared utilities, public contracts, service wiring, or dependency wiring.

## Import Architecture Flow

Use this flow to protect module boundaries and avoid dependency drift.

1. Choose an import graph tool.
   - dependency-cruiser is a strong default when the project needs enforceable rules.
   - ESLint import rules can cover narrower import constraints, but should not replace dependency-cruiser when the project needs a full dependency graph.

2. Start in report-only mode.
   - Generate a graph or rule report without making it part of the normal local baseline yet.
   - Make rules mandatory in local scripts only after the baseline is clean or accepted exceptions are documented.

3. Define project-specific boundaries.
   - UI layers should not import server-only, desktop-only, or privileged modules.
   - Runtime-specific layers should not leak APIs into shared or universal code.
   - Test code should not be imported by production code.
   - Generated output and package artifacts should not be imported by source code.
   - Shared code should avoid runtime-specific APIs unless that is an explicit design choice.

4. Detect structural risk.
   - Report circular dependencies.
   - Report forbidden cross-layer imports.
   - Report deep imports into modules that are intended to expose a public entry point.
   - Report imports that bypass a documented contract or adapter.

5. Review exceptions.
   - Exceptions require a clear reason in rule configuration or adjacent documentation.
   - Security boundary exceptions require human approval and may require a decision record.

## Maintainability Metrics Flow

Use this flow to find code that may be too large, too complex, or too coupled to maintain safely.

1. Separate measurable signals from design judgment.
   - Static analysis can measure size, branching, nesting, parameter counts, dependency direction, cycles, and duplication.
   - Static analysis can suggest Single Responsibility Principle or SOLID issues, but it cannot prove the intended responsibility of a module or class.
   - Treat maintainability metrics as refactoring candidates, not automatic failures.

2. Start with report-only metrics.
   - Collect the current baseline before enforcing thresholds.
   - Sort findings by risk and change frequency, not just by the largest number.
   - Prefer improving new or recently changed code before forcing a full legacy cleanup.

3. Track these local metrics.

| Signal | What it suggests | Example checks |
| --- | --- | --- |
| File length | A file may have too many responsibilities or hidden submodules. | `max-lines` |
| Function or method length | A function may mix orchestration, validation, branching, and side effects. | `max-lines-per-function`, `max-statements` |
| Cyclomatic complexity | A function has many independent execution paths and may be hard to test. | ESLint `complexity` |
| Cognitive complexity proxy | A function may be hard to read due to nesting, jumps, recursion, or non-linear flow. | `complexity`, `max-depth`, `max-nested-callbacks`, `max-lines-per-function`, review checklist |
| Nesting depth | Logic may be hard to follow and may need guard clauses or extraction. | `max-depth`, `max-nested-callbacks` |
| Parameter count | A function may need an options object, value object, or smaller API boundary. | `max-params`, `@typescript-eslint/max-params` |
| Classes per file | A file may be doing too much or hiding separate concepts. | `max-classes-per-file` |
| Methods per class | A class may have too many responsibilities or a broad public surface. | Review checklist or custom ESLint rule if needed |
| Dependency fan-in and fan-out | A module may be too central, too coupled, or difficult to change safely. | dependency-cruiser, graph reports |
| Duplication | Logic may need extraction, but duplication can also be intentional for boundary clarity. | Review checklist; add a separate free duplicate-code analyzer only if needed |

4. Define thresholds as review prompts before mandatory local failures.
   - Use warning-level thresholds first.
   - Make thresholds tighter for new code than for old code.
   - Avoid one global threshold when generated files, tests, configuration, UI composition, or data fixtures need different treatment.
   - Exclude generated code and vendored code.

5. Review Single Responsibility and SOLID indicators.
   - A long file with unrelated imports may indicate multiple responsibilities.
   - A class with many public methods may indicate a broad interface or Interface Segregation Principle issue.
   - A function with many branches over type, mode, or status may indicate missing polymorphism, strategy objects, or smaller use-case functions.
   - A module with imports across many layers may indicate Dependency Inversion or boundary issues.
   - Repeated conditional logic across files may indicate a missing abstraction, but only extract one when the abstraction is stable and meaningful.

6. Choose refactoring responses deliberately.
   - Extract pure helper functions when it reduces branching or clarifies names.
   - Split modules by behavior or responsibility, not by arbitrary line count.
   - Replace deeply nested logic with guard clauses only when it improves readability.
   - Replace long parameter lists with named options only when call sites become clearer.
   - Avoid refactors that satisfy a metric while making the code harder to understand.

7. Verify after maintainability cleanup.
   - Run lint and typecheck.
   - Run targeted tests for changed behavior.
   - Add tests before refactoring complex behavior when existing coverage is weak.
   - Review the diff for accidental API changes or behavior changes.

## Suggested Maintainability Thresholds

Use these as starting points, not universal rules. Tune them per project, language, framework, and file type.

| Metric | Starting warning threshold | Starting mandatory threshold |
| --- | ---: | ---: |
| File length | 300 lines | 500 lines |
| Function or method length | 60 lines | 100 lines |
| Statements per function | 25 statements | 40 statements |
| Cyclomatic complexity per function | 10 | 15 to 20 |
| Cognitive complexity proxy | Review at 15 cyclomatic complexity or depth 3 | Block at 20 cyclomatic complexity or depth 4 |
| Nesting depth | 3 | 4 |
| Parameters per function | 4 | 6 |
| Classes per file | 1 | 2 |
| Public methods per class | 10 | 20 |

Threshold exceptions should be explicit. Common exceptions include generated code, framework entry points, test fixtures, declarative UI composition, schema definitions, and configuration files.

## Security Analysis Flow

Use this flow for security-sensitive changes and before release hardening.

1. Use lint and typecheck as the baseline.
   - They catch many unsafe patterns indirectly through type and import constraints.

2. Use dependency and import-boundary checks as the default security-adjacent static analysis.
   - Dependency audit catches known vulnerable production dependencies.
   - dependency-cruiser can prevent untrusted or UI-facing layers from importing privileged modules.
   - ESLint can enforce project-specific unsafe-pattern rules where the rule is local and maintainable.

3. Add a dedicated SAST tool only when the core toolchain does not cover a required security need.
   - Use one dedicated free SAST tool, not several overlapping ones.
   - Do not rely on paid SAST tiers unless a separate decision explicitly changes the free-only constraint.

4. Triage by risk.
   - Critical and high-confidence findings should be highlighted at the top of the report.
   - Medium findings need owner review and a recorded outcome.
   - Low-confidence or framework-mismatch findings can be tracked or suppressed with a reason.

5. Apply a security checklist appropriate to the project.
   - Validate external input at trust boundaries.
   - Keep privileged operations behind narrow interfaces.
   - Avoid exposing filesystem, shell, process, network, or raw transport APIs to untrusted layers.
   - Allow-list URLs, callbacks, origins, and protocols where relevant.
   - Avoid shell execution unless it is tightly scoped and justified.
   - Ensure secrets, credentials, tokens, signing material, and private keys are not exposed to untrusted code.

## Runtime Or Platform Security Flow

Use this flow when a project has runtime-specific security boundaries, such as browser, server, desktop, mobile, extension, plugin, or worker boundaries.

1. Identify the boundary.
   - Examples: browser versus server, renderer versus privileged process, plugin versus host, worker versus main thread, public package API versus internal modules.

2. Define what must not cross the boundary.
   - Privileged APIs.
   - Secrets or credentials.
   - Raw transport objects.
   - Filesystem or shell access.
   - Internal service clients.
   - Unvalidated external input.

3. Choose platform-specific checks.
   - Browser and web apps may use framework lint rules and dependency restrictions.
   - Node services may use security-focused ESLint rules and dependency scanning.
   - Electron apps may use a free Electron-specific scanner when the default stack cannot check the relevant boundary.
   - Browser extensions, mobile apps, and plugin hosts should add their own platform-specific scanners where available.

4. Verify runtime configuration when relevant.
   - Build or package the application.
   - Run smoke tests against the packaged or production-like artifact.
   - Confirm release hardening, signing, sandboxing, permissions, or manifest settings when the platform uses them.

## Recommended Adoption Order

1. Keep lint and typecheck as the mandatory local baseline.
2. Add a dead-code analyzer in report-only mode.
3. Add import architecture rules for project-specific boundaries and cycles.
4. Add maintainability metrics in warning mode for new or changed code.
5. Add a dedicated free SAST tool only when the core toolchain does not cover a required security use case.
6. Add runtime or platform-specific scanners only where the project needs them.

## Structured Report Template

Use this template when static analysis produces findings. The report is an intermediate artifact. It records enough context to create future tasks, but it does not create those tasks by itself.

```markdown
# Static Analysis Report

Date:
- ...

Repository or project:
- ...

Scope:
- ...

Tools and commands:
- `...`

Summary:
- Total findings:
- Fix now:
- Report for task:
- Deferred:
- False positives:
- Accepted risks:

## Findings

### SA-001: <short finding title>

Category:
- typecheck | lint | dead-code | unused-dependency | import-boundary | cycle | maintainability | security | platform-boundary | unknown

Severity:
- critical | high | medium | low | info

Confidence:
- high | medium | low

Outcome:
- fix-now | report-for-task | defer | false-positive | accepted-risk

Task readiness:
- ready | needs-triage | not-a-task

Affected area:
- Files:
- Symbols:
- Dependencies:
- Boundary:

Evidence:
- Tool:
- Rule:
- Command:
- Output excerpt:

Problem:
- ...

Why it matters:
- ...

Recommended next action:
- ...

Suggested verification:
- ...

Likely task class:
- tiny | standard | major | unknown

Open questions:
- ...

False-positive risk:
- ...

## False Positives

- Finding:
  Reason:
  Suppression or config change:

## Deferred Findings

- Finding:
  Missing context:
  Next investigation step:

## Accepted Risks

- Finding:
  Reason:
  Owner:
  Review trigger:

## Local Verification

- `...`
```

## References

- TypeScript: [Apache-2.0 licensed repository](https://github.com/microsoft/TypeScript)
- TypeScript TSConfig: [`noUnusedLocals`](https://www.typescriptlang.org/tsconfig/#noUnusedLocals) and [`noUnusedParameters`](https://www.typescriptlang.org/tsconfig/#noUnusedParameters)
- ESLint: [MIT licensed repository](https://github.com/eslint/eslint)
- typescript-eslint: [`@typescript-eslint/no-unused-vars`](https://typescript-eslint.io/rules/no-unused-vars/)
- typescript-eslint: [`@typescript-eslint/max-params`](https://typescript-eslint.io/rules/max-params/)
- typescript-eslint: [MIT licensed repository](https://github.com/typescript-eslint/typescript-eslint)
- ESLint: [`complexity`](https://eslint.org/docs/latest/rules/complexity), [`max-lines`](https://eslint.org/docs/latest/rules/max-lines), [`max-lines-per-function`](https://eslint.org/docs/latest/rules/max-lines-per-function), [`max-statements`](https://eslint.org/docs/latest/rules/max-statements), [`max-depth`](https://eslint.org/docs/latest/rules/max-depth), [`max-nested-callbacks`](https://eslint.org/docs/latest/rules/max-nested-callbacks), [`max-params`](https://eslint.org/docs/latest/rules/max-params), and [`max-classes-per-file`](https://eslint.org/docs/latest/rules/max-classes-per-file)
- Knip: [unused files, exports, dependencies, and project graph analysis](https://knip.dev/)
- Knip: [ISC licensed repository](https://github.com/webpro-nl/knip)
- dependency-cruiser: [dependency validation and visualization](https://github.com/sverweij/dependency-cruiser)
- dependency-cruiser: [MIT licensed npm package](https://www.npmjs.com/package/dependency-cruiser)
