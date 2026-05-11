# Task: Repomix Integration Spike

ID: TASK-0003
Status: Done
Class: Standard
Owner: Pair
Created: 2026-05-09
Updated: 2026-05-09

## Summary

Investigate whether Repomix can be used inside Sidekick to create AI-friendly context packages from selected project folders.

## Current Phase

Close

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
- `package.json`
- `src/main.ts`
- `src/preload.ts`
- `src/shared/sidekick-api.ts`
- `src/main/folder-scanner.ts`
- `docs/architecture/application-architecture.md`
- `.gitignore`
- `scripts/spikes/repomix-spike.mjs`

Related decisions:
- None yet.

Related docs:
- `docs/product/vision.md`
- `docs/tasks/closed/TASK-0001-inspect-local-folder.md`

External references:
- `https://repomix.com/guide/development/using-repomix-as-a-library`
- `https://www.npmjs.com/package/repomix`

## Explore Notes

Initial findings:
- Repomix exists as an npm package named `repomix`.
- Current tested package version is `1.14.0`.
- The package exposes TypeScript declarations.
- The package can be used as a CLI and as a Node.js library.
- The documented high-level API is `runCli`.
- The documented lower-level APIs include `searchFiles`, `collectFiles`, `processFiles`, and `TokenCounter`.
- Repomix can produce AI-friendly outputs such as XML, Markdown, and plain text.
- Repomix reports useful packaging metadata such as total files, total characters, total tokens, and per-file counts.
- Repomix has bundling caveats around worker-thread dependencies and Tree-sitter WASM assets, especially when using compression.

Current Sidekick context:
- Sidekick already scans a selected project folder read-only.
- Filesystem access belongs in the Electron main process.
- Renderer access must go through narrow typed preload APIs.
- Sidekick project folders may include Markdown, text, transcripts, PDFs, PowerPoint files, draw.io diagrams, images, and other artifacts.
- Sidekick should not assume all project folders are code repositories.

Constraints:
- Do not add permanent product UI during the spike unless explicitly approved.
- Do not expose raw filesystem or raw IPC APIs to the renderer.
- Do not send folder content to an external service.
- Do not write generated context packages into the selected project folder by default.
- Avoid disabling Repomix security checks unless the spike explicitly documents why.
- Treat this as technical discovery, not a product commitment.

Open questions:
- Does Repomix work reliably inside Electron Forge/Vite main-process bundling?
- Does Repomix work without compression, avoiding Tree-sitter WASM complexity?
- Can Repomix package non-code project folders usefully?
- Can Repomix respect Sidekick's intended include/exclude rules?
- Can output be generated to a temp location or returned in memory?
- What metadata can Sidekick surface without reading the whole output in the renderer?
- How large are outputs and token counts for realistic Sidekick folders?
- What security checks does Repomix run by default, and how should Sidekick report failures?
- Is the library API stable enough for direct integration, or should Sidekick invoke a separate process later?

Initial risk:
- Medium

## Task Spec

Goal:
- Determine whether Repomix is a practical dependency for creating Sidekick context packages from selected local folders.

Non-goals:
- No permanent product UI.
- No persistent settings.
- No cloud upload.
- No agent integration.
- No final context-package workflow.
- No deep PDF, PowerPoint, draw.io, audio, or video parsing.
- No broad refactor of the current scanner.

Acceptance criteria:
- Confirm the current npm package version and exposed TypeScript API.
- Install Repomix only if the spike proceeds to local validation.
- Create a minimal main-process-only prototype or script that runs Repomix against a controlled fixture or local test folder.
- Test at least one output format suitable for AI context, preferably Markdown or XML.
- Test with compression disabled first.
- Record whether compression appears viable or introduces bundling/WASM complexity.
- Record generated metadata such as file count, character count, token count, and output size.
- Record whether Repomix respects ignore/include settings needed by Sidekick.
- Record whether Repomix handles non-code files acceptably or skips them.
- Record security behavior and any warnings/errors.
- Decide whether Repomix should be adopted, deferred, wrapped behind an abstraction, or avoided.

## Spike Plan Draft

Selected approach:

1. Inspect Repomix documentation and npm metadata.
2. Run the spike as a standalone Node script outside the app bundle.
3. Install `repomix` as a devDependency after human approval.
4. Run Repomix against a small controlled folder.
5. Use `tests/fixtures/project-folder-basic/` as the representative Sidekick-style folder with mixed artifacts.
6. Test output with `style: 'markdown'` and/or `style: 'xml'`.
7. Keep `compress: false` initially.
8. Capture output metadata and practical issues.
9. Run `npm run check`, `npm run package`, and any focused validation needed.
10. Update this task with findings and a recommendation.

## Verification Plan Draft

Run as applicable:
- `npm run check`
- `npm run package`
- focused spike command or script
- `npm audit --omit=dev` if a dependency is added

Manual checks:
- Confirm generated output does not include unexpected ignored folders.
- Confirm generated output is not written into the selected project folder unless explicitly requested.
- Confirm sensitive-file warnings are visible or captured.
- Inspect output readability for an AI-agent context use case.

## Build Log

Implemented:
- Installed `repomix` as a devDependency.
- Added `npm run spike:repomix`.
- Added `scripts/spikes/repomix-spike.mjs`.
- Added `tmp/` to `.gitignore`.
- Script writes generated output to `tmp/repomix-spike/`.
- Script runs three variants against `tests/fixtures/project-folder-basic/`:
  - Markdown, compression disabled.
  - XML, compression disabled.
  - Markdown, compression enabled.
- Script keeps Repomix security checks enabled.
- Script passes custom ignore pattern `dist/**`.
- Script captures output path, output size, total files, characters, tokens, processed files, skipped files, suspicious-file results, and a short preview.

Plan deviations:
- The spike did not add an Electron main-process experimental module. This was intentional to avoid making product code depend on Repomix before the library behavior was validated in isolation.

## Verification Log

Focused spike command:
- `npm run spike:repomix`

Spike output:
- `fixture-markdown`
  - 4 processed files.
  - 523 tokens.
  - 2.2 KB output.
  - 344 ms.
- `fixture-xml`
  - 4 processed files.
  - 545 tokens.
  - 2.3 KB output.
  - 246 ms.
- `fixture-markdown-compressed`
  - 4 processed files.
  - 560 tokens.
  - 2.4 KB output.
  - 217 ms.

Processed files:
- `01-bakgrunn/marked-notes.md`
- `02-transkripsjoner/intervju-01.txt`
- `03-informasjonsmodell/begrepsmodell.drawio`
- `04-arkitektur/systemskisse.drawio.svg`

Skipped files:
- `01-bakgrunn/brief.pdf` skipped as `binary-extension`.
- `02-transkripsjoner/intervju-02.docx` skipped as `binary-extension`.
- `03-informasjonsmodell/domene-modell.png` skipped as `binary-extension`.
- `04-arkitektur/arkitektur.pptx` skipped as `binary-extension`.

Ignore behavior:
- `dist/**` was excluded from generated output.
- Binary files were not included as file contents, but were still listed in the generated directory structure.

Security behavior:
- No suspicious files were reported for the fixture.

Generated output:
- `tmp/repomix-spike/fixture-markdown.md`
- `tmp/repomix-spike/fixture-xml.xml`
- `tmp/repomix-spike/fixture-markdown-compressed.md`
- `tmp/repomix-spike/summary.json`

General verification:
- `npm run test`
  - 2 test files passed.
  - 5 tests passed.
- `npm run test:ui`
  - 3 Playwright tests passed.
- `npm run check`
  - ESLint passed.
  - TypeScript typecheck passed.
- `npm run package`
  - Electron Forge packaged the app for Linux x64.
- `npm audit --omit=dev`
  - Found 0 production dependency vulnerabilities.
- `npm audit --audit-level=critical`
  - Found no critical vulnerabilities.
  - Reported existing dev dependency vulnerabilities: 32 total, 6 low, 2 moderate, 24 high.

## Review Notes

Findings:
- Repomix works as an importable Node library in a standalone script.
- `runCli` is sufficient for a first context-package prototype.
- Markdown output is the best initial fit for human inspection and agent context.
- XML output also works and is slightly larger on the fixture.
- Compression is not useful for this mixed non-code fixture; it increased tokens and output size slightly.
- Repomix handles text-like artifacts well.
- Repomix skips common binary Office/PDF/image artifacts as content.
- Repomix still lists skipped binary files in the directory structure, which is useful for context but not enough for content-level understanding.
- Custom ignore patterns work for Sidekick-style exclusions.
- Output to a controlled temp directory works.

Risks:
- Direct Electron main-process bundling was not validated because this spike intentionally avoided importing Repomix into product code.
- Repomix documentation notes worker-thread and WASM caveats for bundling, especially around compression.
- If Sidekick needs PDF, DOCX, PPTX, image, or audio content extraction, Repomix alone is insufficient.
- Repomix terminology and default output still says "repository" and "codebase", which may need custom header/instruction text for Sidekick project folders.

Recommendation:
- Defer permanent product integration for now.
- Keep Repomix as a devDependency spike tool until the context-package workflow is specified.
- If adopted later, wrap Repomix behind a Sidekick-owned main-process service or separate worker/process boundary.
- Start without compression.
- Prefer Markdown output first.
- Always generate to a Sidekick-controlled temp/output location, never into the selected project folder by default.
- Surface skipped files explicitly in the UI or package summary.
- Add a durable decision record before moving Repomix from devDependency to runtime dependency.

## Documentation Notes

Docs updated:
- `docs/tasks/closed/TASK-0003-repomix-integration-spike.md`

Docs intentionally not updated:
- `README.md` because no product workflow was added.
- `docs/architecture/application-architecture.md` because no app architecture or process boundary changed.

Decision record needed:
- Not yet
- Reason: the recommendation is to defer permanent product integration. A decision record is needed only if Repomix becomes a runtime dependency or product architecture component.

## Closeout

Changed:
- Added an isolated Repomix spike script.
- Added Repomix as a devDependency.
- Added a spike npm script.
- Added `tmp/` to `.gitignore`.
- Ran Markdown, XML, and compressed Markdown spike variants against the controlled fixture.

Verified:
- `npm run spike:repomix`
- `npm run test`
- `npm run test:ui`
- `npm run check`
- `npm run package`
- `npm audit --omit=dev`
- `npm audit --audit-level=critical`

Known gaps:
- Direct Electron main-process bundling with Repomix was not validated.
- Real-world large project folders were not tested.
- Binary document extraction is outside Repomix's useful scope.

Next:
- Specify Sidekick's context-package product workflow before adopting Repomix permanently.
- Decide whether context packaging should use Repomix directly, wrap it, or combine it with Sidekick's own artifact model.

Final status:
- Done
