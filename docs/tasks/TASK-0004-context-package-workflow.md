# Task: Context Package Workflow

ID: TASK-0004
Status: Done
Class: Standard
Owner: Pair
Created: 2026-05-09
Updated: 2026-05-10

## Summary

Specify Sidekick's context-package workflow: how a user turns a selected project folder into one combined context file that can help a human or AI agent understand the project.

## Current Phase

Closeout

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [x] Human approval received, if required
- [x] Build complete
- [x] Verification complete
- [x] Review complete
- [x] Documentation complete
- [x] Closeout complete

## Links

Related files:
- `docs/workflows/agentic-development.md`
- `AGENTS.md`
- `docs/product/vision.md`
- `docs/architecture/application-architecture.md`
- `src/main/folder-scanner.ts`
- `src/main/context-package.ts`
- `src/shared/sidekick-api.ts`
- `src/main.ts`
- `src/preload.ts`
- `src/renderer.ts`
- `index.html`
- `src/index.css`
- `tests/unit/context-package.test.ts`
- `tests/integration/context-package.test.ts`
- `tests/e2e/renderer-smoke.spec.ts`
- `scripts/spikes/repomix-spike.mjs`

Related decisions:
- None yet.

Related docs:
- `docs/tasks/TASK-0001-inspect-local-folder.md`
- `docs/tasks/TASK-0002-folder-tree-expand-collapse.md`
- `docs/tasks/TASK-0003-repomix-integration-spike.md`

## Explore Notes

Known product direction:
- Sidekick is a local-first desktop app for understanding and organizing local project folders.
- Sidekick project folders are not necessarily code repositories.
- Project folders may contain Markdown notes, transcripts, PDFs, PowerPoint files, draw.io diagrams, images, information models, architecture notes, and other artifacts.
- Sidekick should help the user structure work by reading folder structures and files, not by mutating them automatically.
- The current app already supports selecting one folder, scanning it read-only, showing artifact counts, showing folder signals, and browsing the folder tree.

Current implementation:
- Filesystem access is owned by the Electron main process.
- Renderer access goes through typed preload APIs.
- Folder scanning currently produces `ProjectFolderScan`.
- The folder tree is visible and expandable/collapsible.
- There is no context-package product UI yet.
- There is no package-generation service yet.
- There is no persistent workspace or project database yet.

Repomix spike findings:
- Repomix works as an importable Node library in an isolated script.
- Markdown and XML outputs work.
- Compression is not useful for the current mixed non-code fixture.
- Repomix skips binary Office/PDF/image artifacts as content.
- Repomix lists skipped binary files in the directory structure.
- Custom ignore patterns work.
- Generated output can be written to a controlled temp directory.
- Recommendation from the spike: defer permanent product integration until the Sidekick context-package workflow is specified.

Constraints:
- Context packaging must remain read-only with respect to the selected project folder.
- Generated package files must be excluded from later package generation, so an existing context package is not included in the next context package.
- No cloud upload.
- No agent execution.
- No file mutation.
- Use the Repomix library for the first context-package workflow unless implementation exposes a blocking limitation.
- Sidekick should own the workflow and user-facing concepts even though Repomix is used under the hood.

Open questions:
- Should Sidekick keep a history of generated packages?

Initial risk:
- Medium

## Concept Definition

A Sidekick context package is a generated single-file concatenation of the files in the selected project folder.

The first product direction is intentionally simple:
- Use the Repomix library to create the context package.
- Use Repomix Markdown output for the first version.
- Keep the structure Repomix exports instead of designing a custom Sidekick package format now.
- Combine the project folder into one output file.
- Name the output after the project folder and include `context-package` in the filename.
- Exclude the generated context package itself from future package generation if a previous package already exists.
- Treat the context package as generated output, not as source material.

Problem solved:
- The user should be able to turn a project folder into one file that can be handed to an AI agent or reviewed as a compact project context snapshot.
- The user should not need to manually copy individual notes, transcripts, diagrams, or folder listings.

Explicit non-goals for the concept:
- No editing or restructuring source files.
- No AI analysis during package generation.
- No cloud upload.
- No selective curation in the first concept unless required for safety or technical limits.
- No requirement to parse binary files deeply in the first version.

Important technical caveat:
- Repomix does not include binary file contents for formats such as PDF, DOCX, PPTX, and images. It can list those files in the directory structure and report them as skipped. If the product requirement is literally "all file contents", Sidekick will need later extractors for binary document formats. For the first Repomix-based workflow, "all files" means all eligible text-like files as content, with binary files represented as skipped files and directory entries.

## User And Recipient

Primary recipient:
- AI agent.

Secondary recipient:
- Human user.

The context package should primarily make it easy to hand project context to an AI agent. The human user should still be able to inspect the generated Markdown file before sharing or using it.

The recipient should be able to understand:
- the project folder structure;
- which files were included as content;
- the contents of text-like files Repomix can pack;
- which files were skipped or represented only by path;
- that the package is generated read-only context, not the source project itself.

## Scope Selection

First-version scope:
- The scope is always the full selected project folder.
- The user does not select individual folders.
- The user does not select artifact types.
- Sidekick does not suggest a curated subset.
- Sidekick does not provide manual include/exclude controls in the first version.

Exclusions:
- Repomix default ignore behavior should be used where appropriate.
- Sidekick should add explicit ignore patterns for generated context-package files.
- Sidekick should add explicit ignore patterns for known noisy folders already excluded by folder scanning, such as dependency, build, cache, and internal output folders.

Rationale:
- The first version should answer the simple workflow: "Create a context package from this project folder."
- Curation can come later after the basic end-to-end generation flow is proven.

## Inclusion Rules

Included as content:
- Text-like files that Repomix can read.
- Markdown files.
- Plain text files.
- Transcript files when they are represented as readable text, such as `.txt` or `.md`.
- draw.io files when they are readable XML/text, such as `.drawio`.
- draw.io SVG files when Repomix reads them as text, such as `.drawio.svg`.

Represented but not included as content:
- PDF files.
- Word/DOCX files.
- PowerPoint/PPTX files.
- Images.
- Audio.
- Video.
- Other binary formats Repomix classifies as binary.

Skipped files:
- Binary files skipped by Repomix must not be silently hidden.
- Generated context-package files must be skipped explicitly.
- Noisy folders should be skipped through ignore rules.

User-facing reporting:
- After generation, Sidekick should show which files were included as content.
- After generation, Sidekick should show which files were skipped and why when Repomix provides a reason.
- The UI should make it clear that skipped binary files were not included as full content.

Rationale:
- The first version should use Repomix's strengths instead of pretending to extract unsupported binary formats.
- Binary extraction can be added later as separate Sidekick capability.

## Output

Format:
- Markdown.
- Default Repomix Markdown structure.
- Single file.

Location:
- The context package is written to the root of the selected project folder.

Filename:
- The filename must be based on the selected project folder name.
- The filename must include `context-package`.
- Initial filename pattern: `<project-folder-name>.context-package.md`.

Overwrite behavior:
- Regenerating the context package should overwrite the existing context-package file for the same selected project folder.
- The existing context-package file must be ignored during generation so the package does not include an older package inside the new one.

Output contents:
- Use Repomix's generated Markdown sections.
- Do not create a custom Sidekick output structure in the first version.
- Sidekick may add custom header or instruction text later, but it is not required for the first version.

## Review And Warnings

Before generation, Sidekick should show:
- The selected project folder.
- The output path.
- The generated filename.
- Whether an existing context-package file will be overwritten.
- A short warning that binary files such as PDF, DOCX, PPTX, images, audio, and video are not included as full text content by Repomix.
- A short note that generated context-package files are ignored during generation.

Before generation, Sidekick does not need:
- Full package preview.
- Per-file selection.
- Token estimate before generation.
- Advanced warning configuration.

After generation, Sidekick should show:
- Success or failure status.
- Output path.
- Number of files included as content.
- Number of skipped files.
- Skipped file list or access to the skipped file list.
- Total tokens when Repomix provides it.
- Total characters when Repomix provides it.
- Output size if available.
- Any suspicious-file or security warnings reported by Repomix.

Failure behavior:
- If generation fails, Sidekick should show a readable error and leave source files unchanged.
- Failure should not remove or modify source files.
- If an existing output file was present and generation fails before writing a replacement, the old file should remain unless technical behavior proves otherwise and is documented.

## Technical Strategy

First implementation strategy:
- Use Repomix directly for context-package generation.
- Run Repomix only from the Electron main process.
- Do not run Repomix in the renderer.
- Do not expose raw filesystem access to the renderer.
- Do not expose raw IPC to the renderer.
- Expose a narrow typed preload API for context-package generation.

Expected API shape:
- Renderer requests package generation for the currently selected project folder.
- Main process owns the output path.
- Main process owns filename generation.
- Main process owns ignore patterns.
- Main process owns the Repomix call.
- Main process returns structured generation results to the renderer.

Repomix configuration:
- `style: 'markdown'`
- `compress: false`
- output path: selected project folder root
- output filename pattern: `<project-folder-name>.context-package.md`
- ignore generated context-package files, including at least `*.context-package.md`
- include known noisy-folder ignores aligned with the folder scanner
- keep Repomix security checks enabled

Dependency strategy:
- `repomix` is currently installed as a devDependency from the spike.
- When this becomes a product feature, move `repomix` to runtime `dependencies`.
- If Electron Forge/Vite bundling exposes worker or WASM issues, wrap Repomix behind a separate process or revisit the integration boundary.

Architecture constraints:
- The renderer should receive only structured status and metadata, not filesystem handles.
- The generated Markdown file should be written by main process code only.
- Existing Electron security settings should remain unchanged.

## First Implementation Boundary

First version user flow:
1. User selects a project folder.
2. UI shows a `Create context package` action.
3. User opens a simple confirmation/review state.
4. The confirmation state shows:
   - output filename;
   - output path;
   - whether an existing context package will be overwritten;
   - warning that binary files are not included as full text content;
   - note that generated context-package files are ignored during generation.
5. User confirms generation.
6. Main process runs Repomix.
7. Main process writes the generated Markdown file to the selected folder root.
8. UI shows generation result.

First version result display:
- output path;
- included file count;
- skipped file count;
- total token count;
- total character count;
- output size;
- warnings or suspicious-file results if Repomix reports any.

Out of scope for first implementation:
- package history;
- full package preview;
- file/folder selection;
- artifact-type selection;
- custom Sidekick output format;
- binary file content extraction;
- agent integration;
- cloud upload;
- persistent settings.

Minimum useful implementation:
- One button.
- One confirmation state.
- One generation result state.
- Main-process Repomix generation.
- Markdown output in selected folder root.
- Existing context-package file ignored and overwritten.

## Task Spec

Draft status:
- Step 1 is defined.
- Step 2 is defined.
- Step 3 is defined.
- Step 4 is defined.
- Step 5 is defined.
- Step 6 is defined.
- Step 7 is defined.
- Step 8 is defined.
- The first output format is defined as Repomix Markdown.
- The first implementation boundary is defined.

Goal:
- Let the user generate one context-package file from the selected project folder.

Initial acceptance criteria:
- The generated output is a single file.
- The generated output filename includes the selected project folder name.
- The generated output filename includes `context-package`.
- The context package is generated using the Repomix library.
- The first context package format is Markdown.
- The Markdown structure is the default Repomix export structure unless a later decision requires custom instructions or headers.
- The first generation scope is the full selected project folder.
- The generated file is written to the root of the selected project folder.
- The initial filename pattern is `<project-folder-name>.context-package.md`.
- Regeneration overwrites the existing context-package file for the selected folder.
- The first version does not require folder selection, artifact-type selection, or manual curation controls.
- Existing context-package files are ignored when generating a new context package.
- Text-like files supported by Repomix are included as content.
- Binary files unsupported by Repomix are reported as skipped or represented by path/directory structure only.
- Skipped files are reported after generation.
- Before generation, Sidekick shows output path, overwrite status, binary-content caveat, and self-ignore behavior.
- After generation, Sidekick shows output path, included file count, skipped files, token count, output size, and Repomix security warnings when available.
- The package generation process does not edit, move, rename, or delete source files.
- The package generation process reports skipped files.
- Binary files that Repomix cannot include as content are not silently hidden.
- Repomix runs only in the Electron main process.
- Renderer access goes through a narrow typed preload API.
- Repomix compression is disabled for the first version.
- Repomix security checks remain enabled.
- `repomix` must move from `devDependencies` to runtime `dependencies` when implemented as a product feature.

## Workflow Questions

We will specify the workflow sequentially.

Step 1: Define the concept.
- What is a Sidekick context package?
- What problem does it solve?
- What is explicitly not part of it?
- Status: Done

Step 2: Define the user and recipient.
- Is the package primarily for the human, for an AI agent, or both?
- What should the recipient be able to understand from the package?
- Status: Done

Step 3: Define scope selection.
- Does the user select folders?
- Does the user select artifact types?
- Does Sidekick suggest a package scope?
- What defaults should be used?
- Status: Done

Step 4: Define inclusion rules.
- Which artifacts are included as full content?
- Which artifacts are represented as metadata only?
- Which artifacts are skipped?
- How are skipped artifacts reported?
- Status: Done

Step 5: Define output.
- What format should be generated first?
- Should output be a single file or a folder?
- What sections must the output contain?
- Where is the output written?
- Status: Done

Step 6: Define review and warnings.
- What preview should the user see before generation?
- What warnings are required?
- How are token count, output size, skipped files, and sensitive-file warnings shown?
- Status: Done

Step 7: Define technical strategy.
- Does the first implementation use Sidekick's own scanner only?
- Does it use Repomix directly?
- Does it wrap Repomix behind a Sidekick-owned service?
- What dependency and packaging risks must be accepted?
- Status: Done

Step 8: Define first implementation boundary.
- What is the smallest useful version?
- What is out of scope?
- How will it be tested?
- Status: Done

## Implementation Plan

### Plan Scope

This plan covers the first product implementation of context-package generation.

In scope:
- Add a context-package action to the existing selected-folder workflow.
- Add a simple confirmation/review state.
- Add a main-process Repomix generation service.
- Add a narrow preload API.
- Add shared TypeScript types for request/result data.
- Move `repomix` from `devDependencies` to runtime `dependencies`.
- Write Markdown output to the selected folder root.
- Ignore generated context-package files during generation.
- Return included file count, skipped file count, token count, character count, output size, output path, and warnings.
- Add focused tests.

Out of scope:
- package history;
- package preview;
- file/folder selection;
- artifact filtering;
- binary extraction;
- custom package format;
- agent integration;
- persistence.

### Expected Files

- `package.json`
- `package-lock.json`
- `src/shared/sidekick-api.ts`
- `src/main.ts`
- `src/main/context-package.ts`
- `src/preload.ts`
- `src/renderer.ts`
- `index.html`
- `src/index.css`
- `tests/unit/`
- `tests/integration/`
- `tests/e2e/`
- `docs/tasks/TASK-0004-context-package-workflow.md`

### Data Model Draft

Add shared types similar to:

```ts
type ContextPackageRequest = {
  rootPath: string;
};

type ContextPackageResult = {
  status: 'complete' | 'failed';
  outputPath: string;
  outputFileName: string;
  overwritten: boolean;
  totalFiles: number;
  totalCharacters: number;
  totalTokens: number;
  outputBytes: number;
  processedFiles: string[];
  skippedFiles: Array<{
    path: string;
    reason: string;
  }>;
  warnings: string[];
};
```

The exact shape can be adjusted during implementation if Repomix exposes better structured fields.

### API Draft

Add two preload methods:

- `previewContextPackage(rootPath: string): Promise<ContextPackagePreview>`
- `generateContextPackage(rootPath: string): Promise<ContextPackageResult>`

IPC channels:

- `context-package:preview`
- `context-package:generate`

Rules:
- Main process must validate that `rootPath` is a non-empty absolute path.
- Main process owns filename and output path.
- Renderer must not pass arbitrary output paths.
- Renderer must not receive raw filesystem access.

### Generation Rules

- Output filename: `<project-folder-name>.context-package.md`
- Output location: selected project folder root.
- Repomix style: `markdown`.
- Repomix compression: `false`.
- Repomix security check: enabled.
- Copy to clipboard: disabled.
- Ignore generated package files:
  - `*.context-package.md`
  - `*context-package*`
- Ignore noisy folders aligned with folder scanner:
  - `.git/**`
  - `node_modules/**`
  - `out/**`
  - `dist/**`
  - `.vite/**`
  - `.cache/**`

### UI Plan

Add a small context-package area to the existing interface after a folder is selected.

Suggested placement:
- Right inspector, near project summary, because the action operates on the selected project as a whole.

States:
- unavailable: no folder selected.
- ready: folder selected and package can be generated.
- confirming: show output path and warnings before generation.
- generating: package generation running.
- complete: show output path, counts, tokens, skipped files, and warnings.
- error: show readable failure message.

### Testing Strategy

Unit/integration:
- filename generation sanitizes or handles project folder names safely enough for local filesystem use.
- ignore patterns include context-package output and noisy folders.
- generation against fixture creates Markdown output in fixture root or a temporary fixture copy.
- existing context-package file is not included in regenerated output.
- skipped binary files are reported.

UI smoke:
- with mocked API, context-package action appears after folder scan.
- confirmation state shows output filename and warnings.
- successful mocked generation shows output path, token count, and skipped file count.
- failed mocked generation shows error state.

### Verification Plan

Run:
- `npm run test`
- `npm run test:ui`
- `npm run check`
- `npm run package`
- `npm audit --omit=dev`
- `npm start`

Manual smoke:
- Select a small representative folder.
- Generate context package.
- Confirm file appears in selected folder root.
- Generate again and confirm it overwrites without including itself.
- Confirm skipped binary files are reported.
- Confirm no source files are modified except the generated context-package file.

## Build Log

Implemented:
- Moved `repomix` from `devDependencies` to runtime `dependencies`.
- Added `src/main/context-package.ts` as the main-process context package service.
- Added filename generation, output path preview, overwrite detection, generated-package self-ignore rules, noisy-folder ignore rules, Repomix Markdown generation, and structured result mapping.
- Added shared context-package preview/result/skipped-file/warning types to `src/shared/sidekick-api.ts`.
- Added `previewContextPackage` and `generateContextPackage` to the preload bridge.
- Added `context-package:preview` and `context-package:generate` IPC handlers in `src/main.ts`.
- Added session validation so context-package generation only works for folders selected through Sidekick.
- Added the context-package UI area in the right inspector.
- Added renderer states for unavailable, ready, previewing, confirming, generating, complete, and error.
- Added unit, integration, and Playwright smoke tests for the new workflow.
- Updated the application architecture document.

## Verification Log

Passed:
- `npm run test`
- `npm run check`
- `npm run test:ui`
- `npm run package`
- `npm audit --omit=dev`
- `timeout 15s npm start`

Notes:
- The integration test generates a Repomix Markdown package from a temporary copy of the fixture project folder.
- The integration test verifies that an existing generated context-package file is overwritten but not included in the new package.
- The integration test verifies that binary fixture artifacts are reported as skipped.
- The Playwright smoke test verifies the confirmation and successful result states with a mocked Sidekick API.

## Review Notes

Reviewed against the task acceptance criteria:
- Output is a single Markdown file in the selected folder root.
- Filename follows `<project-folder-name>.context-package.md`.
- Existing generated packages are ignored during regeneration.
- Binary files are reported as skipped instead of hidden.
- Repomix runs only in the main process.
- Renderer access uses typed preload methods.
- Main process owns output path and filename generation.
- Existing Electron security settings remain unchanged.

## Documentation Notes

Docs updated:
- `docs/tasks/TASK-0004-context-package-workflow.md`
- `docs/architecture/application-architecture.md`

Docs intentionally not updated:
- README remains unchanged because this is still an early internal product capability and the architecture/task docs hold the implementation details.

Decision record needed:
- Not yet.
- Reason: this task implements the approved first-version strategy from the task spec and TASK-0003 spike. A decision record should be created if the package format, storage model, binary extraction strategy, or Repomix adoption changes into a longer-lived architectural policy.

## Closeout

Closed 2026-05-10.
