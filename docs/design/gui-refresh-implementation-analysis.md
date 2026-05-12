# Sidekick GUI Refresh Implementation Analysis

Status: Draft
Date: 2026-05-12
Source package: `docs/design/sidekick-ui design leveranse.zip`

## Purpose

This document analyzes the consultant's GUI refresh delivery and translates it into implementation needs for Sidekick.

It does not create implementation tasks yet. It describes what future tasks should cover, which consultant artifacts they should depend on, where the design fits the current application, and where the consultant delivery must be clarified or adjusted before implementation.

The main goal is traceability: when future tasks are created, they should reuse the sketches, wireframes, design guides, token files, task specifications, and state references from the zip package rather than reinterpreting the design from memory.

## Source Reference Convention

References to consultant artifacts use this format:

```text
docs/design/sidekick-ui design leveranse.zip::<file-name>
```

The zip package is the authoritative source. During analysis, the HTML sketches were also rendered locally for visual inspection, but those screenshots are temporary analysis outputs and are not part of the repository contract.

## Executive Assessment

The consultant delivery is strong enough to become the basis for a GUI refresh, but it should not be copied directly into implementation tasks without normalization.

The strongest parts are:

- the calm desktop visual direction;
- the revised token set in `fase3b-tokens-v2.json`;
- the state library and component guide;
- the map hierarchy sketches;
- the global write-operation treatment;
- the minimum window guidance;
- the overall sequencing in `fase4-handoff-oversikt.md`.

The main implementation cautions are:

- Some consultant task specs describe capabilities Sidekick does not currently have, especially audio transcription, external transcription APIs, Codex model selection, Codex API-key setup, and a context-package dependency for Codex runs.
- Current Sidekick already has several capabilities marked as new in the consultant package, such as recursive folder expand/collapse, Codex availability checks, Codex login, Codex cancellation, and read-only versus write mode.
- Several UI terms and filename patterns conflict with implemented behavior. The biggest examples are transcript numbering (`NN. filename.ext` today versus `NN-filename.ext` in parts of the delivery) and context-package filename normalization.
- The visual design uses a different shell model from the current UI. That is acceptable, but it means the refresh should be treated as a large UX/navigation change, not a small restyle.

Recommended direction: use the consultant work as the design source, but create future implementation tasks that explicitly preserve current product rules unless the user approves a functional expansion.

## Best-Practice Lens

The proposed chapter structure and implementation split were checked against established desktop, accessibility, and design-system guidance:

- Microsoft Windows app design basics emphasize navigation, command surfaces, spacing, content hierarchy, lists, and grids. This supports separate analysis of shell/navigation, command placement, dense content display, and responsive minimum size.
- WAI-ARIA Authoring Practices for tree views distinguish focus, selection, expansion, keyboard behavior, and assistive-technology state. This supports treating the folder tree as a dedicated interaction task, not just a styling task.
- WCAG 2.2 reinforces contrast, focus appearance, target size, and predictable interaction. This supports keeping accessibility requirements inside every relevant work package.
- W3C Design Tokens Community Group guidance supports treating design tokens as a structured source of truth for colors, typography, spacing, state, and component-level values.
- Electron security guidance supports keeping filesystem, shell, process, and external navigation behavior behind typed main/preload APIs.

Useful external references:

- Microsoft Windows app design basics: https://learn.microsoft.com/en-us/windows/apps/design/basics/
- WAI-ARIA Tree View Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
- WCAG 2.2: https://www.w3.org/TR/wcag/
- W3C Design Tokens Format Module: https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/
- Electron Security: https://www.electronjs.org/docs/latest/tutorial/security

## Current App Baseline

Sidekick is currently a vanilla Electron/Vite/TypeScript application with no React or component framework.

Important existing behavior:

- Electron security posture is good: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, app sandbox enabled, external navigation constrained.
- The renderer uses a typed `window.sidekick` API from preload.
- Project selection uses a native folder dialog and then scans the selected root.
- Project creation creates the root folder plus `00. Forutsetninger` and `01. Transkripsjoner`.
- The scanner returns a recursive tree, artifact counts, folder signals, recent files, warnings, and partial-scan status.
- The current folder tree already supports expand/collapse and expand-all/collapse-all.
- Transcript import supports `.txt`, `.md`, and `.markdown`, copies the file into the single detected transcript folder, uses strict two-digit numbering with separator `. `, strips source numeric prefixes, and never overwrites.
- Context package generation uses Repomix, writes to the project root, ignores previous context-package output, and returns processed/skipped/warning summary data.
- Codex support already checks CLI availability and login, starts device-auth login, runs `codex exec` in read-only or workspace-write sandbox mode, streams output, supports cancellation, and refreshes the scan after successful write-mode completion.
- The current UI is English; the consultant design assumes Norwegian user-facing language.
- The BrowserWindow minimum size is already `1040 x 720`, matching the consultant's minimum-experience document.

This means several future tasks can reuse working application behavior and focus on shell, state model, wording, and visual interaction rather than rebuilding backend features.

## Design Intent To Preserve

The refresh should preserve these design intents from the consultant delivery:

- A quiet, minimalist desktop workspace.
- Norwegian user-facing product language.
- Clear separation between read-only inspection and write operations.
- Project folder context always visible.
- Dense but readable folder and artifact information.
- Explicit write-operation preview before copying or generating files.
- A visible and consistent activity/status layer.
- Codex presented as a controlled assistant operation, not a generic terminal.
- No marketing-style hero sections, decorative gradients, oversized copy, or ornamental cards.
- No hidden filesystem mutation.

Primary supporting artifacts:

- `docs/design/sidekick-ui design leveranse.zip::fase1-ux-rammeverk.md`
- `docs/design/sidekick-ui design leveranse.zip::fase1-ia-diagram.html`
- `docs/design/sidekick-ui design leveranse.zip::sidekick-leveranseforslag-v2.md`
- `docs/design/sidekick-ui design leveranse.zip::fase4-handoff-oversikt.md`

## Candidate Implementation Work Packages

These are candidate work packages for later task creation. They are not tasks yet.

### 1. Design System, Tokens, And Base Components

Purpose: establish the shared visual foundation before changing individual workflows.

Main consultant sources:

- `docs/design/sidekick-ui design leveranse.zip::fase3b-tokens-v2.json`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-komponentveiledning.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-tilstandsbibliotek.html`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-01-designsystem.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3-tokens.json` for comparison only

Implementation needs:

- Convert `fase3b-tokens-v2.json` into CSS custom properties.
- Treat v2 tokens as authoritative; keep the older `fase3-tokens.json` only as historical comparison.
- Define base styles for typography, spacing, colors, borders, focus ring, buttons, inputs, badges, banners, list rows, progress, and terminal/output surfaces.
- Decide whether to keep pure CSS/vanilla DOM or introduce a component structure inside the existing vanilla renderer. A framework change should be avoided unless there is a separate reason.
- Add or adopt an icon set. The consultant permits equivalent icons; current repo has no icon library.

Testing implications:

- Visual smoke tests should check token-driven surfaces, focus states, disabled states, and state banners.
- CSS should avoid hardcoded hex values outside token definitions.
- Keyboard focus must be visible and not hidden by layout.

Risks and clarifications:

- The token structure is not in formal W3C DTCG format, but it is structured enough for direct CSS variable generation.
- The component guide sometimes describes a left sidebar while some reference screens use a right-side context area or action bar. Future tasks must specify the chosen shell explicitly.

### 2. Application Shell, Global Status, And Action Surfaces

Purpose: replace the proof-of-concept shell with the consultant's calmer desktop workspace structure.

Main consultant sources:

- `docs/design/sidekick-ui design leveranse.zip::fase1-ia-diagram.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3-ref-prosjektoversikt.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-minimumsopplevelse.md`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-03-prosjektoversikt.md`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-08-globale-tilstander.md`
- `docs/design/sidekick-ui design leveranse.zip::wireframe-02-prosjektoversikt.html`

Implementation needs:

- Define the stable app shell: top project context, primary work area, secondary/context area, action bar, and status bar.
- Keep selected project name/path visible without consuming too much vertical space.
- Implement the global status bar pattern for scan status, Codex status, context-package status, and recent operation state.
- Ensure primary actions are visually constrained: normally one primary action per panel or workflow.
- Make bottom or contextual action surfaces predictable for write operations.
- Respect the minimum-size behavior from `fase3b-minimumsopplevelse.md`.

Testing implications:

- UI smoke tests should cover `1280 x 820` and `1040 x 720`.
- At minimum size, primary actions must remain available, text must truncate predictably, and no major panels should overlap.

Risks and clarifications:

- This is a navigation/shell change and should be handled as a major UX implementation task.
- `desktop-design-guidelines.md` has been updated to follow the consultant shell direction, so future tasks should use it as the local design contract.

### 3. Norwegian Terminology And Product Language

Purpose: align the UI language with the consultant's terminology and avoid mixed English/Norwegian wording.

Main consultant sources:

- `docs/design/sidekick-ui design leveranse.zip::fase3b-terminologi-og-avvik.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3-ref-tom-tilstand.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3-ref-prosjektoversikt.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3-ref-skriveoperasjoner.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-ref-codex.html`

Implementation needs:

- Convert visible UI copy from English to Norwegian.
- Use stable terms: `Prosjektmappe`, `Skann`, `Kontekstpakke`, `Transkripsjonsimport`, `Codex-kjøring`, `Lesetilgang`, `Skrivetilgang`, and `Skriveoperasjon`.
- Prefer `Instruksjon` over `Prompt` in user-facing text unless the technical term is necessary.
- Normalize status language across scan, import, context package, and Codex.
- Correct terminology that conflicts with current functionality before it is used in implementation tasks.

Testing implications:

- UI tests should assert durable labels that define workflow states, not incidental text.
- Copy changes will require updating existing Playwright selectors if they depend on English labels.

Risks and clarifications:

- The terminology document contains functional deviations that are inaccurate for the current app. It must be used as language guidance, not as a factual implementation inventory.

### 4. Project Entry And Project Creation

Purpose: implement the refreshed empty state, choose-folder flow, create-project flow, and loading/error states.

Main consultant sources:

- `docs/design/sidekick-ui design leveranse.zip::wireframe-01-tom-tilstand.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3-ref-tom-tilstand.html`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-02-prosjektinngang.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`

Implementation needs:

- Replace the current sidebar project-creation form with the new entry pattern.
- Keep native folder selection for existing project folders.
- Decide how much of project creation is visible before the native parent-folder dialog. Current API asks for project name in the renderer and asks for parent folder in the main process.
- Add polished loading and error states for folder selection, project creation, and scan startup.
- Decide whether "last used folder" persistence is in scope. The consultant spec asks for it, but current app does not persist it.

Testing implications:

- Smoke tests should cover no selected project, cancelled folder selection, successful existing folder selection, create-folder success, and create-folder error.
- Unit or integration tests should remain focused on project creation rules and no-overwrite behavior.

Risks and clarifications:

- Persisting last project is a functional enhancement with persistence implications. It should be explicit in a future task if included.
- The UI should not imply cloud storage or workspace sync.

### 5. Project Overview And Scan Understanding

Purpose: implement the calm overview of a scanned project: stats, meaningful folder groups, warnings, recent activity, and scan metadata.

Main consultant sources:

- `docs/design/sidekick-ui design leveranse.zip::wireframe-02-prosjektoversikt.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3-ref-prosjektoversikt.html`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-03-prosjektoversikt.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-minimumsopplevelse.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`

Implementation needs:

- Rework summary data into the consultant's stats stripe and context panels.
- Reuse existing scanner data where possible: file count, folder count, artifact counts, folder signals, recent files, warnings, partial status.
- Add derived context-package status if needed.
- Decide whether disk size is required. Current scan summary does not expose total disk size.
- Keep scan progress and cancellation out of the first GUI refresh unless a later task explicitly scopes the API enhancement.
- Make warnings specific, compact, and close to affected project information.

Testing implications:

- UI tests should cover complete scan, partial scan, scan warnings, empty folder, long path/name truncation, and minimum window.
- If scan cancellation is added, main-process tests should cover cancellation safety and cleanup.

Risks and clarifications:

- Scan progress/cancellation is a backend API change and should be split from pure visual refresh unless there is a strong reason to combine it.

### 6. Folder Hierarchy, Drill-Down, And Artifact View

Purpose: implement the refreshed folder and artifact exploration model.

Main consultant sources:

- `docs/design/sidekick-ui design leveranse.zip::fase3b-mappehierarki.html`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-04-mappehierarki.md`
- `docs/design/sidekick-ui design leveranse.zip::wireframe-02-prosjektoversikt.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3-ref-prosjektoversikt.html`
- WAI-ARIA Tree View Pattern

Implementation needs:

- Build on the current recursive tree instead of replacing scanner behavior.
- Add clear selection state separate from focus state.
- Add arrow-key behavior and ARIA behavior consistent with tree-view guidance.
- Decide whether to implement the consultant's two-level inline tree plus drill-down model. Current tree can recursively expand all levels; the consultant suggests limiting inline expansion and using breadcrumb drill-down for deeper navigation.
- Add folder details and artifact list for selected folder.
- Treat opening a file in the system default app as a separate, scoped feature. If added, use a typed main/preload API that validates the file is inside the selected project root and then uses Electron's safe shell handling.
- Preserve the rule that transcript import targets the single detected transcript folder, unless a future product decision allows import into selected folders.

Testing implications:

- UI tests should cover expand, collapse, selection, keyboard navigation, breadcrumb navigation, file rows, long names, empty folder, and partial-scan warnings.
- If file opening is added, main-process tests should verify path containment and reject traversal/outside-root paths.

Risks and clarifications:

- The consultant sketch includes "Importer transkripsjon hit" in selected-folder context. That conflicts with the current single-transcript-folder rule if interpreted literally.
- Opening files is security-sensitive because it uses OS integration. It should be explicitly scoped.

### 7. Shared Write-Operation Pattern

Purpose: make every write action visibly different from read-only inspection.

Main consultant sources:

- `docs/design/sidekick-ui design leveranse.zip::fase3-ref-skriveoperasjoner.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-komponentveiledning.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-tilstandsbibliotek.html`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-08-globale-tilstander.md`

Implementation needs:

- Create a reusable visual pattern for write-operation badges, amber confirmation blocks, target path display, success result, and failure recovery.
- Apply this pattern to project creation, transcript import, context-package generation, and Codex write mode.
- Keep warnings factual and path-specific.
- Ensure write actions are not triggered from vague or hidden controls.

Testing implications:

- UI tests should verify write-operation badge presence for write flows.
- Smoke tests should verify target path is visible before confirm.
- Accessibility checks should verify status is not color-only.

Risks and clarifications:

- This pattern cuts across multiple workflows and should be implemented early enough to avoid each workflow inventing its own warning layout.

### 8. Transcript Import Refresh

Purpose: redesign transcript import while preserving current product rules.

Main consultant sources:

- `docs/design/sidekick-ui design leveranse.zip::wireframe-03-transkripsjonimport.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3-ref-skriveoperasjoner.html`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-05-transkripsjonimport.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`

Implementation needs:

- Use the three-step mental model: choose source file, preview destination, confirm copy.
- Preserve current supported source formats: `.txt`, `.md`, `.markdown`.
- Preserve current numbering convention unless the user explicitly approves a change: `00. original-name.md`, `01. original-name.md`, etc.
- Preserve automatic conflict handling and no overwrite.
- Show source path, target transcript folder, generated destination filename, and numbering basis before confirm.
- Rescan and update project view after successful import.

Testing implications:

- Existing unit/integration tests for numbering and conflict handling remain valuable.
- UI tests should cover preview, cancel, confirm, success, invalid source, no transcript folder, and multiple transcript folders.

Risks and clarifications:

- The consultant task spec describes audio formats and an external transcription service. That is outside current Sidekick scope and must not be included in the GUI refresh.
- The consultant task spec describes `NN-` filename prefixes in places. Current behavior uses `NN. ` and remains authoritative.

### 9. Context Package Refresh

Purpose: redesign context-package preview, generation, overwrite warning, result, and warning handling.

Main consultant sources:

- `docs/design/sidekick-ui design leveranse.zip::wireframe-04-kontekstpakke.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3-ref-skriveoperasjoner.html`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-06-kontekstpakke.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`

Implementation needs:

- Present preview as a write operation with output filename, output location, overwrite status, self-ignore note, and binary-file warning.
- Preserve current Repomix-based generation and current self-ignore behavior.
- Show result summary: included file count, skipped file count, token count, character count, output size, skipped files, and warnings.
- Keep generation progress and streaming logs out of the first GUI refresh unless a later task explicitly scopes the API enhancement.
- Preserve current context-package filename behavior: keep the project folder name except invalid filename characters.

Testing implications:

- Unit/integration tests should preserve self-ignore and output filename behavior.
- UI tests should cover preview, overwrite warning, generation success, skipped files, warnings, and error.
- If streaming progress is added, tests should cover event ordering and cancellation if cancellation is supported.

Risks and clarifications:

- "Kjør Codex med denne kontekstpakken" appears in the consultant flow, but current Codex runs directly against the selected project folder. Treat context-package-to-Codex as future design intent, not current required functionality.

### 10. Controlled Codex Assistant Refresh

Purpose: redesign the Codex experience around availability, mode, instruction input, streaming output, cancellation, and completion states.

Main consultant sources:

- `docs/design/sidekick-ui design leveranse.zip::fase3b-ref-codex.html`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-07-codex-assistent.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-terminologi-og-avvik.md`

Implementation needs:

- Preserve the controlled-assistant boundary: no generic terminal.
- Reuse existing backend behavior for availability, login status, device-auth login, read-only/workspace-write modes, streaming output, cancellation, and scan refresh after write-mode completion.
- Redesign mode selection as `Lesetilgang` and `Skrivetilgang`, with `Skrivetilgang` using the write-operation pattern.
- Rename prompt input to `Instruksjon` in user-facing UI.
- Show streaming output in a controlled log surface, not a full shell.
- Show completion states for success, failure, cancellation, and write-mode rescan.
- Decide whether run history is in scope. Current renderer shows current output only.
- Keep model selection out of the GUI refresh. Current Codex runner does not pass a model argument.

Testing implications:

- Existing mocked Playwright Codex tests can be expanded to cover availability, logged out, login started, read-only run, write-mode warning, cancellation, success, failure, and rescan after write-mode success.
- Main-process tests should preserve command argument safety and shell-free spawning.

Risks and clarifications:

- The consultant reference includes API-key wording and model names. Current Sidekick uses `codex login status` and `codex login --device-auth`; do not introduce API-key UX unless the actual Codex CLI flow requires it.
- Any model selector must be verified against current official OpenAI/Codex documentation at implementation time.
- The consultant flow assumes a context package is loaded. Current Codex workflow does not require that.

### 11. Global States, Accessibility, And Keyboard Pass

Purpose: make state handling and accessibility consistent across the refreshed UI.

Main consultant sources:

- `docs/design/sidekick-ui design leveranse.zip::fase3b-tilstandsbibliotek.html`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md`
- `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-08-globale-tilstander.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-minimumsopplevelse.md`
- WCAG 2.2
- WAI-ARIA Tree View Pattern

Implementation needs:

- Define reusable state surfaces for empty, loading, success, warning, error, disabled, partial, and cancelled.
- Ensure status messages are specific and actionable.
- Add keyboard behavior for primary workflows, especially tree navigation, action execution, Escape to cancel/close where appropriate, and refresh if scoped.
- Ensure focus ring matches token guidance and is visible on all controls.
- Avoid using color alone for warnings, errors, selection, and write mode.
- Decide whether app menu shortcuts are in scope. Avoid Electron global shortcuts unless there is a clear need outside app focus.

Testing implications:

- UI smoke tests should cover keyboard-only use for the main flows.
- Accessibility checks should verify ARIA roles/state for the tree and labelled controls.
- Visual tests should cover focus, disabled, error, warning, success, and minimum window.

Risks and clarifications:

- This should not be left until the end as a cosmetic QA task. It should be a cross-cutting acceptance criterion in each workflow task, plus a final pass.

### 12. UI Test And Screenshot Baseline Refresh

Purpose: make the design implementable without losing confidence in core workflows.

Main consultant sources:

- All visual references and wireframes.
- `docs/design/sidekick-ui design leveranse.zip::fase4-handoff-oversikt.md`
- `docs/design/sidekick-ui design leveranse.zip::fase3b-minimumsopplevelse.md`

Implementation needs:

- Update existing Playwright smoke tests as the UI shell changes.
- Keep backend unit/integration tests for scanner, transcript import, context package, and Codex command construction.
- Add screenshot checks for key reference states where practical:
  - empty/project entry;
  - project overview;
  - map hierarchy expanded and drill-down;
  - transcript import preview/success;
  - context package preview/result;
  - Codex read-only/write/running/failure;
  - global state library examples if implemented as static test states.
- Test at `1280 x 820` and `1040 x 720`.

Risks and clarifications:

- The app uses vanilla DOM rendering. Tests should prefer stable `data-*` selectors over visible text when copy is still being normalized.

## Recommended Sequence

The consultant's sequence is broadly right, but Sidekick should add an explicit normalization step before task creation.

Recommended sequence:

1. Normalize design assumptions against actual product behavior.
2. Implement design tokens and base components.
3. Implement app shell, global status/action surfaces, and minimum-size behavior.
4. Implement Norwegian terminology baseline.
5. Implement project entry and project creation refresh.
6. Implement project overview and scan understanding.
7. Implement folder hierarchy, selection, drill-down, and artifact view.
8. Implement shared write-operation pattern if not already delivered with the shell/components.
9. Implement transcript import refresh.
10. Implement context package refresh.
11. Implement controlled Codex assistant refresh.
12. Run global accessibility, keyboard, and UI regression pass.

Possible parallelization:

- Design tokens/components and terminology can start together if they touch disjoint files.
- Global state components can be implemented with the design system before workflow-specific screens.
- Transcript import and context package can be developed in parallel after the shared write-operation pattern exists.
- Codex should wait until the shell, state model, and write-operation pattern are stable.

## Resolved Design Decisions Before Task Creation

The following decisions were clarified with the product owner on 2026-05-12. Future task records should treat these as resolved product constraints unless the product owner explicitly changes them later.

1. Transcript import scope
   - Consultant delivery mentions audio files and external transcription services.
   - Current Sidekick imports existing text/Markdown transcripts only.
   - Decision: keep GUI refresh scoped to text/Markdown transcript import. Do not include audio import or transcription service UX.

2. Transcript filename convention
   - Consultant delivery sometimes uses `NN-filename`.
   - Current Sidekick uses `NN. filename`.
   - Decision: preserve current `NN. filename.ext` convention.

3. Context package filename normalization
   - Consultant delivery suggests lowercase/hyphen normalization in places.
   - Current Sidekick uses the project folder name with invalid filename characters replaced.
   - Decision: preserve current context-package filename behavior.

4. Codex authentication language
   - Consultant delivery mentions API key in places.
   - Current Sidekick uses Codex CLI login status and device-auth login.
   - Decision: keep current Codex CLI login/device-auth model. UI should not use API-key language.

5. Codex model selector
   - Consultant delivery includes model choices.
   - Current runner does not expose model selection.
   - Decision: defer model selection.

6. Codex context-package dependency
   - Consultant delivery visually treats the context package as loaded into the Codex flow.
   - Current Codex runs against the project folder directly.
   - Decision: Codex should continue to run directly against the selected project folder. Do not require or imply a context package.

7. Scan progress and cancellation
   - Consultant delivery includes scan progress/cancel.
   - Current scan is synchronous from the UI perspective and not cancellable.
   - Decision: follow the recommendation. Do not mix scan progress/cancellation into the first GUI refresh unless a later task explicitly scopes it.

8. File opening
   - Consultant delivery implies file-level interactions.
   - Current app does not open files from the renderer.
   - Decision: follow the recommendation. File opening may be introduced as a separate, scoped feature through a typed, validated main-process API.

9. Current versus consultant shell model
   - Current guidelines describe left/center/right.
   - Consultant references use topbar, main content, contextual side/action/status surfaces.
   - Decision: update internal design guidelines to follow the new consultant design direction. This has been applied in `docs/design/desktop-design-guidelines.md`.

## Artifact Coverage Matrix

| Artifact | Type | Role In Future Work |
| --- | --- | --- |
| `docs/design/sidekick-ui design leveranse.zip::sidekick-leveranseforslag.md` | Proposal | Historical context for original delivery scope. Use only for provenance. |
| `docs/design/sidekick-ui design leveranse.zip::sidekick-leveranseforslag-v2.md` | Revised proposal | Confirms repo-friendly formats, Norwegian product language, visual reference screens, and no Figma dependency. |
| `docs/design/sidekick-ui design leveranse.zip::fase1-ux-rammeverk.md` | UX framework | Source for product feel, work modes, hierarchy, trust model, and local-first principles. |
| `docs/design/sidekick-ui design leveranse.zip::fase1-ia-diagram.html` | IA diagram | Source for conceptual flow and how project entry, understanding, structuring, and assistant actions relate. |
| `docs/design/sidekick-ui design leveranse.zip::wireframe-01-tom-tilstand.html` | Wireframe | Use for empty state, choose existing project, and create project flow. |
| `docs/design/sidekick-ui design leveranse.zip::wireframe-02-prosjektoversikt.html` | Wireframe | Use for project overview, folder rows, stats, warnings, and contextual project information. |
| `docs/design/sidekick-ui design leveranse.zip::wireframe-03-transkripsjonimport.html` | Wireframe | Use for transcript import flow structure, preview, confirmation, and success/error states. |
| `docs/design/sidekick-ui design leveranse.zip::wireframe-04-kontekstpakke.html` | Wireframe | Use for context-package preview, overwrite warning, generation, and result states. |
| `docs/design/sidekick-ui design leveranse.zip::fase3-tokens.json` | Design tokens v1 | Keep as older token reference only. Do not implement from this when v2 conflicts. |
| `docs/design/sidekick-ui design leveranse.zip::fase3-ref-tom-tilstand.html` | Visual reference | Use for visual treatment of empty state, project entry, spacing, and primary action weight. |
| `docs/design/sidekick-ui design leveranse.zip::fase3-ref-prosjektoversikt.html` | Visual reference | Use as main visual reference for the project overview, stats stripe, list density, right context area, and action placement. |
| `docs/design/sidekick-ui design leveranse.zip::fase3-ref-skriveoperasjoner.html` | Visual reference | Use for transcript import and context-package write-operation panels, amber warning treatment, and result summaries. |
| `docs/design/sidekick-ui design leveranse.zip::fase3b-tokens-v2.json` | Revised design tokens | Authoritative token source for color, typography, spacing, borders, focus, status colors, and minimum layout constants. |
| `docs/design/sidekick-ui design leveranse.zip::fase3b-komponentveiledning.md` | Component guide | Source for buttons, inputs, mode selector, list rows, stats stripe, banners, write badges, terminal output, progress, topbar, statusbar, sidebar, and Codex availability card. |
| `docs/design/sidekick-ui design leveranse.zip::fase3b-tilstandsbibliotek.html` | State library | Visual source for button states, input states, list-row states, status banners, contrast, and write-operation badge. |
| `docs/design/sidekick-ui design leveranse.zip::fase3b-mappehierarki.html` | Visual reference | Source for expandable hierarchy, drill-down panel, breadcrumbs, selected folder context, and bottom action bar. |
| `docs/design/sidekick-ui design leveranse.zip::fase3b-ref-codex.html` | Visual reference | Source for Codex availability, read/write mode selection, streaming output, success, failure, cancellation, and assistant status treatment. Must be normalized against actual Codex behavior. |
| `docs/design/sidekick-ui design leveranse.zip::fase3b-minimumsopplevelse.md` | Responsive guideline | Source for `1280 x 820` reference behavior and `1040 x 720` minimum behavior. |
| `docs/design/sidekick-ui design leveranse.zip::fase3b-skjerm-tilstandsinventar.md` | State inventory | Source for screen/state inventory across empty, scanning, overview, import, context package, Codex, and global errors. Must be corrected where it assumes non-existing features. |
| `docs/design/sidekick-ui design leveranse.zip::fase3b-terminologi-og-avvik.md` | Terminology/deviation guide | Source for Norwegian terms and UX language. Must be treated carefully because some deviation notes do not match current app reality. |
| `docs/design/sidekick-ui design leveranse.zip::fase4-handoff-oversikt.md` | Handoff overview | Source for implementation sequencing, QA checklist, and delivery inventory. |
| `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-01-designsystem.md` | Consultant task spec | Use as basis for future design-system task. Remove implementation assumptions that do not fit repo style. |
| `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-02-prosjektinngang.md` | Consultant task spec | Use as basis for future project-entry task. Decide persistence and parent-folder interaction explicitly. |
| `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-03-prosjektoversikt.md` | Consultant task spec | Use as basis for overview task. Split scan progress/cancel if needed. |
| `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-04-mappehierarki.md` | Consultant task spec | Use as basis for folder hierarchy task. Reuse current recursive tree and clarify file-open/security scope. |
| `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-05-transkripsjonimport.md` | Consultant task spec | Use only after correcting audio/API assumptions and filename convention. |
| `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-06-kontekstpakke.md` | Consultant task spec | Use as basis for context-package task. Clarify filename normalization and streaming progress scope. |
| `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-07-codex-assistent.md` | Consultant task spec | Use as basis for Codex UI task after removing or separately scoping model selector, API-key copy, and context-package dependency. |
| `docs/design/sidekick-ui design leveranse.zip::fase4-oppgave-08-globale-tilstander.md` | Consultant task spec | Use as basis for global states/accessibility task and acceptance criteria across all workflow tasks. |

## Future Task Boundaries

When tasks are created later, they should not simply copy the eight consultant task specs. They should adapt them into Sidekick's workflow format and account for current implementation facts.

Suggested future task boundaries:

1. Design tokens and base UI primitives.
2. App shell, status bar, action surfaces, and minimum-size behavior.
3. Norwegian terminology and copy normalization.
4. Project entry and project creation refresh.
5. Project overview and scan understanding.
6. Folder hierarchy, drill-down, selection, and artifact details.
7. Shared write-operation pattern.
8. Transcript import refresh.
9. Context package refresh.
10. Controlled Codex assistant refresh.
11. Accessibility, keyboard, and UI regression pass.

If this feels too granular, tasks 3 and 7 can be folded into adjacent tasks as cross-cutting acceptance criteria. If the goal is safer parallel work, keeping them separate is cleaner.

## Remaining Product Questions

The original blocking design mismatches above are resolved. These smaller questions remain for future task scoping:

- Should project entry include persistence of the last selected project folder in the first GUI refresh, or defer it?
- Should file opening be tracked as a separate follow-up idea now, or wait until folder/artifact interaction needs it?
- Should scan progress/cancellation be tracked as a separate follow-up idea now, or left as a later enhancement idea?

## Conclusion

The consultant package is reusable and valuable, but the implementation path should be governed by Sidekick's existing product rules and Electron security boundaries.

The safest next step is to turn this analysis into one or more task specs. The first implementation task should be the design system and base component foundation, because every later task depends on tokens, focus states, buttons, banners, list rows, and write-operation primitives.
