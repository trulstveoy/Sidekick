# Task: Project Summary From Generated Context

ID: TASK-0025
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-13
Branch: task/TASK-0025-project-summary-from-context
Worktree: main checkout (`/home/trutve/code/Sidekick`)
Base branch: origin/main
Write scope:
- `src/main/context-package.ts`
- `src/main/codex-runner.ts`
- `src/main/project-info.ts`
- `src/main/project-summary.ts`
- `src/main/prompts/project-summary.nb.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `index.html`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit`
- `tests/integration`
- `tests/e2e`
- `docs/tasks/TASK-0025-project-summary-from-context.md`
Parallel safety: Coordinate
Depends on:
- `closed/TASK-0004-context-package-workflow.md`
- `closed/TASK-0010-controlled-codex-panel.md`
- `closed/TASK-0017-project-overview-scan-understanding.md`
- `closed/TASK-0020-context-package-workflow-refresh.md`
- `closed/TASK-0021-controlled-codex-assistant-refresh.md`
- `closed/TASK-0023-codex-cli-path-discovery.md`
- `closed/TASK-0024-settings-codex-path.md`
- `closed/TASK-0033-revised-navigation-model.md`
Coordinates with:
- `TASK-0029-find-relationships-across-documents.md`
- `TASK-0030-generate-thematic-context-packages.md`
- `TASK-0034-folder-scoped-context-package.md`
- `BACKLOG.md` (`BL-0008`)

## Summary

Generate and maintain a short Norwegian project summary from the full-project context package.

The first version is tied to the current physical project-folder model: Sidekick generates the normal full-project context package, sends that generated Markdown to Codex, stores the resulting project summary as Sidekick-owned metadata under `.sidekick/`, and shows the latest summary read-only in the project context surface.

## Current Phase

Close

Build, verification, human review, and closeout are complete.

Human approval to build was given in conversation on 2026-05-13.

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

Related docs:
- `../architecture/desktop-design-guidelines.md`
- `../architecture/product-vision.md`
- `../architecture/prosjektuavhengig-innholdsmodell.md`

Related tasks:
- `closed/TASK-0020-context-package-workflow-refresh.md`
- `closed/TASK-0021-controlled-codex-assistant-refresh.md`
- `closed/TASK-0033-revised-navigation-model.md`
- `TASK-0034-folder-scoped-context-package.md`

## Explore Notes

Current baseline:

- Full-project context-package generation already has preview, confirmation, overwrite warning, result state, skipped files, and warnings.
- The revised navigation model is in place: global workflows run in the primary workspace, while the right context surface remains tied to the selected project, folder, or file.
- Codex runs directly against the selected project folder today and does not require a context package for normal user-initiated Codex runs.
- Codex execution is main-process only, uses fixed arguments, streams typed output, and permits only one active Codex process in the first version.
- Generated context packages are already ignored by context-package generation. `.sidekick/` metadata still needs to be excluded from context-package input when this task introduces that folder.
- `TASK-0034` defines folder-scoped context packages. This summary task should not treat folder-scoped packages as project summaries unless a later task explicitly changes that.
- The project-independent content model is only a draft exploration. This task should avoid irreversible assumptions where practical, but it should not implement logical projects, shared libraries, or cross-project summaries.

## Resolved Decisions

- First version summarizes only the normal full-project context package.
- Folder-scoped, thematic, and future logical-project context packages do not refresh the project summary in this task.
- Summary generation starts only after the full-project context package has been generated successfully.
- Codex output is captured by Sidekick. Codex must not write `.sidekick/project-info.md` directly.
- The summary is stored as generated Sidekick metadata under the selected project root.
- The summary language is Norwegian.
- The summary is read-only in the UI.
- The latest summary is shown in project-level context, not as a dashboard surface.
- Codex failure must not make the context package generation itself fail.
- A previous valid project summary should remain available if a later summary refresh fails.

## Task Spec

### Problem

Sidekick can generate a full-project context package, but it does not yet preserve a compact project summary that the user can see later without reopening or rereading the generated package.

The summary needs to fit the revised workspace model and should not turn context-package generation into a hidden Codex requirement for unrelated workflows.

### Goal

After a full-project context package is generated, Sidekick should create or refresh a short Norwegian project summary and make it available in the project context surface.

### Storage Recommendation

Use Markdown as the first-version storage format.

Project metadata folder:

```text
<project-root>/.sidekick/
```

Project information file:

```text
<project-root>/.sidekick/project-info.md
```

Rationale:

- Markdown is human-readable and local-first.
- Front matter plus fixed headings gives Sidekick a stable parsing contract.
- The file can later hold more Sidekick-owned project information without creating many separate first-version metadata files.
- A JSON companion file can be deferred unless Markdown parsing becomes too fragile.
- The project-independent content model may later need richer artifact identity, but this task should keep the first version project-local.

### Project Info File Contract

`project-info.md` should be Sidekick-owned generated metadata. It should be safe for a user to read, but Sidekick should treat it as generated output.

Recommended structure:

```markdown
---
sidekick_schema: project-info.v1
generated_at: 2026-05-13T12:00:00.000Z
source_scope: full-project
context_package_path: ./<project-name>.context-package.md
context_package_sha256: <hash>
summary_language: nb
---

# Sidekick Project Info

## Project Summary

<short generated summary>

## Participants

<identified participants, roles, or organizations, or "Ikke identifisert">

## Themes

- <theme 1>
- <theme 2>
- <theme 3>

## Open Questions

- <question 1>
- <question 2>

## Source Context

- Scope: full-project
- Context package: `./<project-name>.context-package.md`
- Generated at: `2026-05-13T12:00:00.000Z`
- Context hash: `<hash>`
```

Parsing contract:

- Sidekick reads `## Project Summary`, `## Participants`, `## Themes`, and optionally `## Open Questions` for project-context display.
- `generated_at`, `source_scope`, `context_package_path`, `context_package_sha256`, and `summary_language` are used to show freshness and trace which context input produced the summary.
- Unknown future sections should be ignored by the first parser.
- First version may overwrite the whole file because this is generated Sidekick metadata.

### Prompt Storage

Store the reusable prompt template in application source, not inside each project folder.

Suggested path:

```text
src/main/prompts/project-summary.nb.ts
```

Rationale:

- The prompt is application behavior and should be versioned with Sidekick.
- Later features can reuse the prompt template for regeneration, tests, or alternate summary surfaces.
- A TypeScript module is safer for the first version because Electron Forge/Vite already bundles TypeScript entry dependencies.

Suggested prompt:

```text
Du er Sidekick, en lokal applikasjon som hjelper brukeren å forstå et prosjekt basert på en generert context package.

Lag et kort, presist prosjektsammendrag på norsk.

Bruk bare informasjon som finnes i context package. Ikke finn opp personer, roller, kunder, formål eller temaer. Hvis noe ikke fremgår, skriv "Ikke identifisert".

Sammendraget skal passe i Sidekick sitt prosjektpanel og være lett å skanne.

Returner bare Markdown med nøyaktig disse seksjonene:

## Project Summary
Skriv 3-5 korte setninger om hva prosjektet ser ut til å være, hva materialet handler om, og hvilken type arbeid prosjektet støtter.

## Participants
List deltakere, roller eller organisasjoner som fremgår av materialet. Hvis ingen er tydelige, skriv "Ikke identifisert".

## Themes
List 3-7 korte punkter med de viktigste temaene i materialet.

## Open Questions
List 0-5 korte punkter med viktige uklarheter som fremgår av materialet. Hvis ingen er tydelige, skriv "Ingen tydelige åpne spørsmål".
```

### Scope

- Create `.sidekick/` in the selected project folder when needed.
- Write `.sidekick/project-info.md` as Markdown with front matter and fixed sections.
- Exclude `.sidekick/` from future context package input.
- Generate the summary from the freshly generated full-project context package.
- Store enough metadata to know which context package produced the summary.
- Preserve the existing full-project context-package preview and confirmation behavior.
- Return summary success/failure status as part of the full-project context-package workflow result.
- Show the latest summary read-only in the project context surface.
- Show compact freshness and error state when summary generation fails.

### Non-goals

- Summary history or versions.
- User editing of the generated summary in the UI.
- Running this summary workflow independently of full-project context-package generation.
- Refreshing the project summary from folder-scoped context packages.
- Refreshing the project summary from thematic context packages.
- Automatic file watching.
- Logical-project summaries or shared-library summaries.
- Moving the existing context package output.
- WSL bridge support.
- Changing Codex login, sandbox, model, or general assistant behavior.

### UI Requirements

- The full-project context-package workflow still runs in the primary workspace.
- Project summary status may appear in the workflow result after generation.
- The latest summary is displayed read-only when the right context surface is showing project context.
- The right context surface must not become the generation progress surface.
- Folder and file context surfaces should not show the project summary as if it describes that selected folder or file.
- User-facing text should be Norwegian.
- Avoid long explanatory UI copy.

### Security Requirements

- Keep filesystem writes in the main process.
- Keep Codex execution in the main process.
- Do not expose raw filesystem, shell, process, or IPC APIs to the renderer.
- Do not let the renderer provide arbitrary Codex command arguments.
- Exclude `.sidekick/` from context package input.
- Treat `.sidekick/project-info.md` as generated Sidekick metadata.
- Codex should not write `project-info.md` directly. Sidekick should capture Codex output and write the file itself.
- Validate that summary reads and writes remain inside the selected project root.

### Error Handling

- If full-project context package generation fails, summary generation must not start.
- If Codex is unavailable or not logged in, context package generation may still complete, but summary status should show that summary generation failed.
- If another Codex process is already running, context package generation may still complete, but summary status should show that summary generation failed.
- If Codex returns malformed output, show an error and keep the previous `.sidekick/project-info.md` if one exists.
- If `.sidekick/` cannot be created or written, show an error with the path.

### Acceptance Criteria

- [ ] Full-project context package generation can trigger project summary generation after the package succeeds.
- [ ] Folder-scoped and thematic context-package generation do not refresh the project summary in this task.
- [ ] `.sidekick/` is created on demand in the selected project folder.
- [ ] `.sidekick/project-info.md` is written as Markdown with front matter and fixed sections.
- [ ] `.sidekick/` is excluded from future context package input.
- [ ] Summary is generated by Codex from the freshly generated full-project context package.
- [ ] Summary is Norwegian.
- [ ] Summary is overwritten on each successful regeneration.
- [ ] Previous summary remains available if a later Codex summary generation fails.
- [ ] UI shows the latest summary read-only in the project context surface.
- [ ] UI shows summary generation failure clearly without replacing the context surface with workflow progress.
- [ ] Tests cover project-info Markdown writing/parsing.
- [ ] Tests cover `.sidekick/` exclusion from context package generation.
- [ ] Tests cover context package then Codex summary sequence.
- [ ] Tests cover Codex unavailable, Codex busy, malformed output, and write failure behavior.
- [ ] UI smoke coverage covers project-context summary display.

## Resolved Planning Decisions

- Summary generation is automatic in the first version when the user generates a full-project context package.
- Do not add a user-facing toggle for "context package only" in this task.
- The context-package result surface should show summary status immediately after generation.
- The long-lived summary display belongs in the project context surface.
- Use Markdown with front matter only for `project-info.md` in the first build. Do not add a JSON companion file or embedded machine-readable JSON block.
- Logical projects, shared libraries, and cross-project summaries remain deferred. Use `source_scope: full-project` as the current traceability marker.

## Deferred Questions

- Should a later workflow let the user generate a context package without refreshing the summary?
- Should a later metadata format add JSON if Markdown parsing becomes fragile?
- How should project summaries evolve when Sidekick supports logical projects or shared content libraries?

## Implementation Plan

Planning complete. Stop before Build until the task is explicitly approved for implementation.

Each delivery should be small enough to review independently. The task should preserve existing full-project context-package behavior if summary generation fails.

### Build Base And Worktree

Before build:

1. Review the main checkout status and keep unrelated local changes out of this task.
2. Create or reuse `../Sidekick-worktrees/TASK-0025-project-summary-from-context` from the latest intended integration base.
3. Run a baseline check when practical:
   - `npm run check`
   - targeted context-package tests
   - targeted renderer smoke tests if the baseline is expected to pass

If local `main` contains required unpushed commits, record the chosen base in this task before editing code.

### Delivery 1: Project Info Markdown Handling

Concrete output:

- `src/main/project-info.ts`
- `tests/unit/project-info.test.ts`

What it does:

- Defines the `.sidekick/project-info.md` contract in code.
- Computes the project-info path from a selected project root.
- Creates `.sidekick/` on demand only when writing project info.
- Writes Markdown with front matter and fixed sections:
  - `## Project Summary`
  - `## Participants`
  - `## Themes`
  - `## Open Questions`
  - `## Source Context`
- Parses `project-info.md` into a typed snapshot for UI use.
- Ignores unknown future sections when reading.
- Treats missing and invalid project-info files as typed states, not fatal app errors.
- Overwrites the full generated file on successful summary refresh.

Suggested shared shape:

```ts
export type ProjectInfoSnapshot = {
  status: 'missing' | 'complete' | 'invalid';
  path: string;
  generatedAt?: string;
  sourceScope?: 'full-project';
  contextPackagePath?: string;
  contextPackageSha256?: string;
  summaryLanguage?: 'nb';
  projectSummary?: string;
  participants?: string;
  themes?: string[];
  openQuestions?: string[];
  message?: string;
};
```

Targeted verification:

```text
npx vitest run tests/unit/project-info.test.ts
```

### Delivery 2: Metadata Exclusion And Context Traceability

Concrete output:

- Update `src/main/context-package.ts`
- Update `src/main/folder-scanner.ts` if `.sidekick/` can otherwise appear in normal scans
- Update context-package tests

What it does:

- Adds `.sidekick/**` to context-package ignore patterns.
- Ensures generated Sidekick metadata is not included in later context packages.
- Adds or centralizes SHA-256 hashing for generated context-package content.
- Records the generated full-project context package path, hash, timestamp, and `source_scope: full-project` for later summary writing.
- Keeps generated context-package self-ignore behavior unchanged.

Important constraint:

- Folder-scoped and thematic packages must not trigger project-summary refresh in this task.

Targeted verification:

```text
npx vitest run tests/unit/context-package.test.ts tests/integration/context-package.test.ts
```

### Delivery 3: Project Summary Generation Service

Concrete output:

- `src/main/prompts/project-summary.nb.ts`
- `src/main/project-summary.ts`
- Unit tests for prompt assembly and output validation
- Integration test with a fake Codex-compatible executable or injectable runner boundary

What it does:

- Adds the Norwegian project-summary prompt as application logic.
- Builds the final prompt from the prompt template plus the freshly generated context-package Markdown.
- Runs Codex in read-only mode.
- Captures Codex stdout as Markdown text.
- Validates that Codex output contains the required sections:
  - `## Project Summary`
  - `## Participants`
  - `## Themes`
- Accepts `## Open Questions` when present.
- Returns a typed success/failure result without writing `project-info.md` directly.

Important constraints:

- Codex must not write `project-info.md`.
- If another Codex run is active, summary generation should fail clearly and preserve the generated context package.
- The implementation may reuse `CodexRunner` directly or add a narrow helper around it, but it must not expose a generic Codex command surface to the renderer.

Targeted verification:

```text
npx vitest run tests/unit/project-summary.test.ts tests/integration/project-summary.test.ts
```

### Delivery 4: Full-Project Context Package And Summary Sequence

Concrete output:

- Update `src/main/context-package.ts`
- Update `src/main.ts`
- Update `src/shared/sidekick-api.ts`
- Update `src/preload.ts`
- Integration tests for the sequence

What it does:

- Changes full-project context-package generation to run this main-process sequence:
  1. validate selected project root;
  2. generate the full-project context package;
  3. read and hash the generated context package;
  4. generate the project summary with Codex;
  5. write `.sidekick/project-info.md` if summary generation succeeds;
  6. return one structured result to the renderer.
- Extends `ContextPackageResult` with a summary result field.
- Keeps context-package generation successful if summary generation fails.
- Preserves any previous valid `project-info.md` when summary generation fails.
- Returns enough data for UI status:
  - summary status: `complete` or `failed`;
  - current project-info snapshot when available;
  - previous project-info snapshot when the refresh failed;
  - failure message when summary generation fails.

Suggested result shape:

```ts
export type ProjectSummaryGenerationResult = {
  status: 'complete' | 'failed';
  projectInfo?: ProjectInfoSnapshot;
  previousProjectInfo?: ProjectInfoSnapshot;
  message?: string;
};
```

Extend `ContextPackageResult` with:

```ts
projectSummary: ProjectSummaryGenerationResult;
```

Targeted verification:

```text
npx vitest run tests/integration/context-package.test.ts tests/integration/project-summary.test.ts
```

### Delivery 5: Read-Only Project Context Display

Concrete output:

- Update `src/shared/sidekick-api.ts`
- Update `src/main.ts`
- Update `src/preload.ts`
- Update `index.html`
- Update `src/renderer.ts`
- Update `src/index.css`
- Update `tests/e2e/renderer-smoke.spec.ts`

What it does:

- Adds a typed API for reading the current `project-info.md` snapshot for the selected project.
- Loads the existing project summary when a project is selected or rescanned.
- Shows the latest summary only when the right context surface is showing project context.
- Renders read-only sections:
  - project summary;
  - participants;
  - themes;
  - open questions, only when useful.
- Shows a compact freshness/status label.
- Shows a compact failure or stale state when the latest summary refresh failed but a previous summary exists.
- Shows summary status in the context-package result surface immediately after generation.
- Does not show project summary in folder or file context.

Targeted verification:

```text
npm run test:ui -- --grep "context package"
```

If grep filtering is not reliable for the current Playwright setup, run:

```text
npm run test:ui
```

### Delivery 6: Final Verification And Task Closeout

Concrete output:

- Updated task Build Log, Verification Log, Review Notes, Documentation Notes, and Closeout.
- Decision record only if implementation introduces a durable architecture decision beyond this plan.

Required verification before handoff:

```text
npm run check
npm run test
npm run test:ui
```

Run packaged verification if prompt bundling or packaged resource behavior changes:

```text
npm run package
```

Closeout must explicitly record:

- whether `.sidekick/` is excluded from generated context packages;
- how Codex failure behaves after context-package generation succeeds;
- whether prior project summaries are preserved on failure;
- which UI states were verified;
- any verification not run and why.

## Build Log

Started on: 2026-05-13

Implementation notes:
- Building in the main checkout because the current TASK-0025 plan and related task harmonization docs are already local uncommitted changes in this checkout.
- Unrelated local changes in `docs/tasks/BACKLOG.md`, other task specs, and `docs/architecture/prosjektuavhengig-innholdsmodell.md` are left untouched unless directly needed by TASK-0025.

Changes made:
- Added `src/main/project-info.ts` for `.sidekick/project-info.md` path handling, Markdown generation, parsing, missing/invalid states, and writes.
- Added `src/main/prompts/project-summary.nb.ts` and `src/main/project-summary.ts` for the Norwegian summary prompt, prompt assembly, Codex read-only execution, output normalization, and section validation.
- Added non-streaming text execution to `src/main/codex-runner.ts` for internal Codex workflows while preserving the existing streamed renderer Codex behavior.
- Added `.sidekick/**` to context-package ignore patterns and SHA-256 hashing for generated context packages.
- Extended full-project context-package generation so it refreshes the project summary after package generation succeeds.
- Preserved context-package success when summary generation fails, and preserved previous valid `project-info.md` when available.
- Added shared project-info and summary-result types in `src/shared/sidekick-api.ts`.
- Added `readProjectInfo` through main/preload for project-context display.
- Updated the renderer to show summary refresh status in the context-package result and display the latest project summary only in project context.
- Added unit, integration, and UI smoke coverage for project-info handling, summary generation, `.sidekick` exclusion, Codex text execution, and project-context summary display.

Files changed for TASK-0025:
- `src/main/project-info.ts`
- `src/main/project-summary.ts`
- `src/main/prompts/project-summary.nb.ts`
- `src/main/codex-runner.ts`
- `src/main/context-package.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `src/renderer.ts`
- `src/index.css`
- `tests/unit/project-info.test.ts`
- `tests/unit/project-summary.test.ts`
- `tests/unit/context-package.test.ts`
- `tests/integration/project-summary.test.ts`
- `tests/integration/codex-runner.test.ts`
- `tests/integration/context-package.test.ts`
- `tests/e2e/renderer-smoke.spec.ts`
- `docs/tasks/TASK-0025-project-summary-from-context.md`

Security notes:
- Renderer receives only typed summary/project-info APIs.
- Codex still runs in the main process.
- Summary generation uses read-only Codex mode.
- Codex output is captured by Sidekick; Codex does not write `project-info.md` directly.
- Project-info reads and writes validate paths inside the selected project root.
- `.sidekick/**` is excluded from context-package input.

## Verification Log

Passed:
- `npx vitest run tests/unit/project-info.test.ts`
- `npx vitest run tests/unit/project-info.test.ts tests/unit/project-summary.test.ts tests/unit/context-package.test.ts tests/integration/context-package.test.ts`
- `npx vitest run tests/unit/project-info.test.ts tests/unit/project-summary.test.ts tests/unit/context-package.test.ts tests/integration/context-package.test.ts tests/integration/codex-runner.test.ts tests/integration/project-summary.test.ts`
- `npm run check`
- `npm run test`
- `npm run test:ui -- --grep "context package"`
- `npm run test:ui`
- `npm run package`

Notes:
- `npm run test:ui -- --grep "context package"` first failed because a test locator matched both a detail term and heading named `Prosjektsammendrag`. The locator was narrowed to the heading, then the targeted UI test passed.
- `npm run package` passed. Vite emitted the pre-existing `web-tree-sitter` eval warning during packaging.

## Review Notes

Human review accepted on 2026-05-13.

Manual review notes:
- User confirmed the app works after running it from the main checkout.
- The project-context placement and `Prosjektsammendrag` display were accepted.
- Automatic summary generation after full-project context package generation was accepted.

## Documentation Notes

Task record updated with build notes, verification, and security notes.

No new decision record was added because the implementation follows the existing plan and does not introduce a durable architecture decision beyond `project-info.md` generated metadata and the existing main/preload security boundary.

## Closeout

Completed on: 2026-05-13

Result:
- Full-project context-package generation now refreshes `.sidekick/project-info.md` with a Codex-generated Norwegian project summary.
- The summary is read-only and shown only in project context.
- Context-package generation still succeeds if summary generation fails.
- Previous valid summaries are preserved on summary refresh failure.
- `.sidekick/**` is excluded from generated context packages.

Final verification:
- `npm run check`
- `npm run test`
- `npm run test:ui`
- `npm run package`
- Manual app test by the user with `npm start`

Final status:
- Task is complete.
- Moved to the closed task archive.
