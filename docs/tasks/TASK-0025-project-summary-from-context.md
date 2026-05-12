# Task: Project Summary From Generated Context

ID: TASK-0025
Status: Planned
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0025-project-summary-from-context
Worktree: ../Sidekick-worktrees/TASK-0025-project-summary-from-context
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
- `closed/TASK-0023-codex-cli-path-discovery.md`
- `closed/TASK-0024-settings-codex-path.md`
- `closed/TASK-0017-project-overview-scan-understanding.md`
Coordinates with:
- `TASK-0020-context-package-workflow-refresh.md`
- `TASK-0021-controlled-codex-assistant-refresh.md`

## Summary

Generate and maintain a short Norwegian project summary every time Sidekick generates a new context package.

The summary is produced by Codex from the freshly generated context package, stored in the project folder under `.sidekick/`, and shown read-only in the dashboard after the GUI refresh has landed.

## Current Phase

Plan

Specification and planning are complete. Build has not started.

Because this is a Major task, build still requires explicit human approval. Dashboard UI work should wait until the GUI refresh dependency is ready.

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [ ] Worktree created or reused, if required
- [ ] Human approval received, if required
- [ ] Build complete
- [ ] Verification complete
- [ ] Review complete
- [ ] Documentation complete
- [ ] Closeout complete

## Resolved Decisions

- The project summary is updated every time new context is generated.
- Context package generation and summary generation always run in sequence.
- Sidekick first generates or updates the context package, then asks Codex to generate the summary.
- The summary is stored in the project folder.
- The summary is a living artifact that is overwritten on each successful regeneration.
- The summary language is Norwegian.
- The summary is read-only in the UI.
- The dashboard integration waits for the GUI refresh.
- Codex failure must produce a useful error message.

## Storage Recommendation

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
- Markdown matches the preferred human-readable format.
- Front matter plus fixed headings gives Sidekick a stable parsing contract.
- The same file can later contain more Sidekick-owned project information without adding many separate metadata files.
- A JSON companion file can be deferred unless Markdown parsing becomes too fragile.

## Project Info File Contract

`project-info.md` should be Sidekick-owned generated metadata. It should be safe for a user to read, but Sidekick should treat it as generated output.

Recommended structure:

```markdown
---
sidekick_schema: project-info.v1
generated_at: 2026-05-12T12:00:00.000Z
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

- Context package: `./<project-name>.context-package.md`
- Generated at: `2026-05-12T12:00:00.000Z`
- Context hash: `<hash>`
```

Parsing contract:
- Sidekick reads `## Project Summary`, `## Participants`, `## Themes`, and optionally `## Open Questions` for dashboard display.
- `generated_at`, `context_package_path`, `context_package_sha256`, and `summary_language` are used to show freshness and trace which context input produced the summary.
- Unknown future sections should be ignored by the first parser.
- First version may overwrite the whole file because this is generated Sidekick metadata.

## Prompt Storage

Store the reusable prompt template in the application source, not inside each project folder.

The prompt that is sent to Codex should live in Sidekick's codebase as a versioned prompt template. It should not be stored in `<project-root>/.sidekick/`.

Suggested path:

```text
src/main/prompts/project-summary.nb.ts
```

Rationale:
- The prompt is application behavior and should be versioned with the app.
- Later features can reuse the prompt template for regeneration, tests, or alternate summary surfaces.
- A TypeScript module is safer for the first version because Electron Forge/Vite already bundles TypeScript entry dependencies. A standalone `.md` prompt file would need explicit packaging/copy verification.

Runtime behavior:
- Sidekick imports the prompt template from `src/main/prompts/project-summary.nb.ts`.
- Sidekick appends or injects the freshly generated context package content.
- Sidekick sends the combined prompt and context to Codex.
- Sidekick writes Codex output to `<project-root>/.sidekick/project-info.md`.

Suggested prompt:

```text
Du er Sidekick, en lokal applikasjon som hjelper brukeren å forstå et prosjekt basert på en generert context package.

Lag et kort, presist prosjektsammendrag på norsk.

Bruk bare informasjon som finnes i context package. Ikke finn opp personer, roller, kunder, formål eller temaer. Hvis noe ikke fremgår, skriv "Ikke identifisert".

Sammendraget skal passe i et dashboard og være lett å skanne.

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

## Workflow

1. User triggers context package generation.
2. Sidekick generates or updates the context package.
3. Sidekick reads the generated context package.
4. Sidekick runs Codex with the Norwegian summary prompt and the generated context.
5. Sidekick validates that required sections exist in the Codex response.
6. Sidekick writes `.sidekick/project-info.md`.
7. Sidekick updates UI state:
   - success: dashboard shows the new summary;
   - failure: UI shows an error while preserving any previous summary if one exists.

## Scope

- Create `.sidekick/` in the selected project folder when needed.
- Write `.sidekick/project-info.md` as Markdown with front matter and fixed sections.
- Use Codex to generate the summary from the freshly generated context package.
- Keep the summary short enough for dashboard display.
- Store enough metadata to know which context package the summary came from.
- Surface summary generation status and errors in the context/dashboard flow.
- Show the summary read-only in the dashboard after the GUI refresh foundation is available.

## Non-goals

- Summary history or versions.
- User editing of the generated summary in the UI.
- Running Codex independently of context package generation.
- Automatic file watching.
- Moving the existing context package output unless separately decided.
- WSL bridge support.
- Changing Codex login or sandbox settings.

## Security Requirements

- Keep filesystem writes in the main process.
- Keep Codex execution in the main process.
- Do not expose raw filesystem, shell, process, or IPC APIs to the renderer.
- Do not let the renderer provide arbitrary Codex command arguments.
- Exclude `.sidekick/` from context package input.
- Treat `.sidekick/project-info.md` as generated Sidekick metadata.
- Codex should not write `project-info.md` directly; Sidekick should capture Codex output and write the file itself.

## Error Handling

- If context package generation fails, summary generation must not start.
- If Codex is unavailable or not logged in, context package generation may still complete, but summary status should show that summary generation failed.
- If Codex returns malformed output, show an error and keep the previous `.sidekick/project-info.md` if one exists.
- If `.sidekick/` cannot be created or written, show an error with the path.

## Acceptance Criteria

- [ ] Context package generation and project summary generation run in one sequence.
- [ ] Summary generation starts only after context package generation succeeds.
- [ ] `.sidekick/` is created on demand in the selected project folder.
- [ ] `.sidekick/project-info.md` is written as Markdown with front matter and fixed sections.
- [ ] `.sidekick/` is excluded from future context package input.
- [ ] Summary is generated by Codex from the freshly generated context package.
- [ ] Summary is Norwegian.
- [ ] Summary is overwritten on each successful regeneration.
- [ ] Previous summary remains available if a later Codex summary generation fails.
- [ ] UI shows the latest summary read-only in the dashboard after GUI refresh.
- [ ] UI shows summary generation failure clearly.
- [ ] Tests cover project-info Markdown writing/parsing.
- [ ] Tests cover `.sidekick/` exclusion from context package generation.
- [ ] Tests cover context package then Codex summary sequence.
- [ ] Tests cover Codex failure behavior.
- [ ] UI smoke coverage covers dashboard summary display after the GUI refresh dependency is satisfied.

## Open Questions

None blocking.

## Implementation Plan

Planning complete. Stop before Build until the task is explicitly approved.

Each delivery should be committed separately so the changes remain reviewable and reversible.

### Build Dependency

Dashboard rendering depends on the GUI refresh work. The dashboard foundation is in `closed/TASK-0017-project-overview-scan-understanding.md`, but the build must still coordinate with open GUI-refresh tasks that touch `src/renderer.ts`, `src/index.css`, or context-package/Codex surfaces.

If other GUI-refresh work is active when build starts, only the main-process/data-model deliveries should be built first. The dashboard delivery should wait until overlapping renderer changes are merged or explicitly coordinated.

### Delivery 1: Project Info Document Handling

Concrete output:
- `src/main/project-info.ts`
- `tests/unit/project-info.test.ts`

What it does:
- Defines the `.sidekick/project-info.md` file contract in code.
- Computes the project info path from a selected project root.
- Creates `.sidekick/` on demand.
- Writes `project-info.md` as Markdown with front matter and fixed sections.
- Parses `project-info.md` back into a typed snapshot for UI use.
- Ignores unknown future sections when reading.
- Overwrites the full file on successful regeneration.

What later deliveries use:
- Delivery 4 uses this writer to persist Codex output after context generation.
- Delivery 5 uses this reader to show an existing summary when a project is selected.

Suggested commit:
- `TASK-0025: Add project info document handling`

Targeted verification:
- `npx vitest run tests/unit/project-info.test.ts`

### Delivery 2: Metadata Exclusion And Context Traceability

Concrete output:
- Update `src/main/context-package.ts`
- Update `src/main/folder-scanner.ts` if `.sidekick/` can otherwise appear in scans
- Update context-package tests

What it does:
- Adds `.sidekick/**` to context package ignore patterns.
- Ensures generated Sidekick metadata is not included in later context packages.
- Adds or centralizes helper logic for hashing the generated context package with SHA-256.
- Ensures the summary can record `context_package_path`, `context_package_sha256`, and `generated_at`.

What later deliveries use:
- Delivery 4 uses the context path and hash when writing `project-info.md`.
- Delivery 5 uses the metadata to show freshness/status in the dashboard.

Suggested commit:
- `TASK-0025: Exclude Sidekick metadata from context packages`

Targeted verification:
- `npx vitest run tests/unit/context-package.test.ts tests/integration/context-package.test.ts`

### Delivery 3: Summary Prompt And Codex Text Generation

Concrete output:
- `src/main/prompts/project-summary.nb.ts`
- `src/main/project-summary.ts`
- Unit tests for prompt assembly and Codex response validation
- Integration test with a fake Codex executable or injectable Codex client

What it does:
- Adds the Norwegian project-summary prompt as application logic.
- Builds the final prompt by combining the prompt template with the freshly generated context package content.
- Runs Codex in read-only mode.
- Captures Codex output as Markdown text.
- Validates that the output contains the required sections:
  - `## Project Summary`
  - `## Participants`
  - `## Themes`
- Accepts `## Open Questions` when present.
- Returns a typed success/failure result instead of writing files directly.

Important constraint:
- Codex must not write `project-info.md` directly. Sidekick captures Codex output and writes the file itself in Delivery 4.

Concurrency rule:
- First version should not run two Codex jobs at the same time. If another Codex run is active, summary generation should fail with a clear message while preserving the generated context package.

What later deliveries use:
- Delivery 4 calls this generator after context package generation succeeds.

Suggested commit:
- `TASK-0025: Add Codex project summary generation`

Targeted verification:
- `npx vitest run tests/unit/project-summary.test.ts tests/integration/project-summary.test.ts`

### Delivery 4: Context Package And Summary Sequence

Concrete output:
- Update `src/main/context-package.ts`
- Update `src/main.ts`
- Update `src/shared/sidekick-api.ts`
- Update `src/preload.ts`
- Integration tests for the full sequence

What it does:
- Changes context package generation so the main process runs this sequence:
  1. validate selected project root;
  2. generate context package;
  3. read generated context package;
  4. generate summary with Codex;
  5. write `.sidekick/project-info.md`;
  6. return one structured result to the renderer.
- Extends the context package result with summary status.
- Keeps context package generation successful even if Codex summary generation fails.
- Preserves any previous `project-info.md` if summary generation fails.
- Returns enough data for UI status:
  - summary status: `complete` or `failed`;
  - project info path, when available;
  - generated timestamp, when available;
  - failure message, when summary generation fails;
  - previous summary snapshot, when a previous summary exists.

What later deliveries use:
- Delivery 5 renders the returned summary status and reads existing summary data through the shared API.

Suggested commit:
- `TASK-0025: Couple context generation with summary refresh`

Targeted verification:
- `npx vitest run tests/integration/context-package.test.ts tests/integration/project-summary.test.ts`

### Delivery 5: Read-Only Dashboard Summary

Concrete output:
- Update `src/shared/sidekick-api.ts`
- Update `src/main.ts`
- Update `src/preload.ts`
- Update `src/renderer.ts`
- Update `src/index.css`
- Update `tests/e2e/renderer-smoke.spec.ts`

What it does:
- Adds a typed API for reading the current `project-info.md` snapshot for the selected project.
- Shows the latest summary in the dashboard after the GUI refresh structure is ready.
- Renders read-only sections:
  - project summary;
  - participants;
  - themes;
  - open questions, only when useful.
- Shows a compact freshness/status label.
- Shows a clear error message when summary generation failed.
- If a previous summary exists and the latest generation failed, shows the previous summary with a stale/error status.
- Avoids long explanatory UI copy.

What it depends on:
- Delivery 1 parser.
- Delivery 4 summary status/result shape.
- GUI refresh dashboard structure.

Suggested commit:
- `TASK-0025: Show project summary in dashboard`

Targeted verification:
- `npm run test:ui`

### Delivery 6: Final Verification And Task Closeout

Concrete output:
- Updated task Build Log, Verification Log, Review Notes, Documentation Notes, and Closeout.
- Decision record only if the build introduces a durable architecture decision beyond this task spec.

What it does:
- Runs full verification.
- Records exactly what passed and what did not run.
- Confirms Electron security boundaries still hold.
- Confirms `.sidekick/` is not included in generated context packages.
- Confirms packaged app can still load the bundled prompt module.

Suggested commit:
- `TASK-0025: Document project summary implementation`

Required verification:
- `npm run check`
- `npm run test`
- `npm run test:ui`
- `npm run package`

## Planned Data Contracts

Add shared types similar to:

```ts
export type ProjectInfoSnapshot = {
  status: 'missing' | 'complete' | 'invalid';
  path: string;
  generatedAt?: string;
  contextPackagePath?: string;
  contextPackageSha256?: string;
  summaryLanguage?: 'nb';
  projectSummary?: string;
  participants?: string;
  themes?: string[];
  openQuestions?: string[];
  message?: string;
};

export type ProjectSummaryGenerationStatus = 'complete' | 'failed';

export type ProjectSummaryGenerationResult = {
  status: ProjectSummaryGenerationStatus;
  projectInfo?: ProjectInfoSnapshot;
  previousProjectInfo?: ProjectInfoSnapshot;
  message?: string;
};
```

Extend `ContextPackageResult` with a summary result field so the renderer can show both context-package success and summary-generation status from one operation.

## Planned Failure Behavior

- Context package generation failure: stop immediately. Do not run Codex.
- Codex unavailable or logged out: context package stays complete; summary status is `failed`; previous summary is preserved.
- Codex busy: context package stays complete; summary status is `failed`; message explains that Codex is already running.
- Codex malformed output: summary status is `failed`; previous summary is preserved.
- `.sidekick/` write failure: summary status is `failed`; context package stays complete.
- Existing valid `project-info.md`: keep showing it if the latest regeneration fails.

## Build Log

Not started.

## Verification Log

Not started.

## Review Notes

Not started.

## Documentation Notes

Not started.

## Closeout

Not started.
