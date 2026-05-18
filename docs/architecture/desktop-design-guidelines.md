# Sidekick Desktop Design Guidelines

Status: Draft

## Purpose

This document defines the desktop UI direction for Sidekick. It should guide new UI work and cleanup of existing screens. It is intended to stand alone as the durable design reference for implementation.

Sidekick should feel like a quiet local workspace for understanding project folders. The interface should reduce visual noise, make folder structure easy to scan, and keep potentially destructive or expensive actions explicit.

The design direction is captured directly in this document so agents and reviewers can apply it without consulting separate design delivery files.

## Design Thesis

Visual thesis: Sidekick is a minimalist desktop workspace with calm surfaces, strong alignment, restrained color, and dense but readable project information.

Content thesis: The UI should show the selected project, the folder structure, and the most useful metadata without explaining itself in long text.

Interaction thesis: Common actions should be direct and discoverable through the work surface, menus, context menus, and keyboard shortcuts. Motion should be subtle and functional only.

## Product Modes

Use these modes as a mental model for organizing functionality. They do not have to be literal navigation labels in every screen.

- Forstå: inspect the selected project folder, folder hierarchy, artifact types, warnings, recent files, and scan status.
- Strukturere: perform explicit structure-changing actions such as creating a project, importing a transcript, or opening a scoped folder/file action.
- Assistere: run controlled assistant operations such as Codex against the selected project folder.

The interface should make the active mode understandable through context, action placement, and state language. Do not make Sidekick feel like a chat product, a terminal, or a generic file manager.

## Core Principles

1. Prefer workspace over dashboard.
2. Prefer structure over decoration.
3. Prefer fewer visible controls with clearer placement.
4. Prefer native desktop conventions over web page patterns.
5. Prefer progressive detail over showing everything at once.
6. Prefer read-only inspection unless the user explicitly starts a write action.
7. Prefer quiet status and clear errors over banners and large explanatory blocks.

## Minimal UI Rules

Use these rules when reducing noise in the current UI:

- Remove decorative surfaces before adding new components.
- Avoid stacked cards, nested cards, decorative panels, hero sections, gradients, shadows, and large empty state illustrations.
- Use borders and background changes only when they clarify a boundary or selected state.
- Use one primary accent color for the main action and state highlights.
- Keep secondary actions visually quiet.
- Keep headings short and functional.
- Keep helper text rare. If the UI needs explanation, first improve labels, grouping, or placement.
- Avoid repeating the same metadata in multiple panels.
- Prefer compact rows, lists, trees, and tables for project information.
- Do not use animation unless it explains a transition or state change.

## Application Shell

Sidekick uses a calm desktop workspace with persistent project context and compact operational surfaces.

Preferred shell areas:

- Topbar: app identity, selected project name, selected project path, project switching, and app-level settings.
- Primary workspace: the main object the user is working with, usually project overview, folder hierarchy, a write-operation preview, settings, or a controlled assistant run.
- Context surface: secondary information about the selected project, folder, or file.
- Action bar: stable area for global project actions that open explicit workflow surfaces.
- Status bar: compact operational status such as scan state, Codex state, context-package state, or latest operation result.

The primary workspace is the main surface. Context surfaces, action bars, and status bars should support it without competing for attention.

The selected project folder must remain visible in the shell whenever a project is active. Long project names and paths must truncate predictably.

Panel responsibility model:

| Area | Responsibility |
| --- | --- |
| Topbar | Identifies the app and active project. |
| Primary workspace | Shows the active work: folder tree, workflow, settings, or assistant run. |
| Context surface | Explains the selected project, folder, or file. |
| Action bar | Starts global project actions. |
| Status bar | Reports compact operational state. |

The short rule is: the primary workspace is the verb, the context surface is the noun, the action bar starts global tools, and the topbar anchors app and project identity.

Workflow responsibility model:

- Project switching belongs in the topbar and should not appear as a routine bottom action.
- Settings is an app-level view that replaces the primary workspace body while keeping the topbar stable.
- Project-level actions such as full-project context-package generation, transcript import, and controlled Codex runs start from the action bar and run in the primary workspace.
- The primary workspace has two normal states: folder tree and active workflow. Starting an exclusive workflow replaces the folder tree; the tree and workflow should not compete inside the same surface.
- The context surface remains tied to the selected project, folder, or file while workflows run. It should not become the workflow progress panel.
- Back or cancel before confirmation returns to the folder tree without writing. After an import, generation, or edit operation has completed, the action is not silently rolled back.
- Competing global actions should be disabled while an exclusive workflow is active.
- Project switching and settings navigation should not silently hide an active workflow. Disable or explicitly guard them while a workflow is in progress.
- Folder-scoped actions, when introduced, should live near the selected folder context rather than in the global action bar.

Shell anti-patterns:

- Do not put workflow progress, confirmation controls, or generated-output result panels in the context surface.
- Do not make global actions depend on the selected folder or file.
- Do not hide the context surface just because a workflow is active.
- Do not make every action contextual; global project actions belong in the action bar.
- Do not expose file-opening actions unless a typed and validated main/preload API exists for that operation.

The shell should avoid page-like composition. Do not introduce landing-page sections, hero copy, marketing language, or decorative feature cards inside the app.

At `1280 x 820`, the full workspace should feel complete. At `1040 x 720`, the UI must keep the project context, core stats, primary workspace, and primary action usable. Hide lower-priority metadata before hiding core actions.

## Folder Tree

The folder tree is the primary UI element for folder understanding.

Expected behavior:

- Folders can expand and collapse.
- Collapsed folders show only the folder row and relevant summary signals.
- Expanded folders reveal direct child folders and files.
- Deep structures may use drill-down with breadcrumbs instead of expanding every level inline.
- File rows should be visually quieter than folder rows.
- Selected rows should be obvious without using heavy color blocks.
- Focus and selection are different states and must be visually distinguishable.
- Indentation should be consistent and compact.
- Counts and artifact hints should be aligned so the tree remains scannable.
- Tagged folders may show compact tag pills after the folder name. Limit inline tree tags to the first three tags and show `+N` for the remaining count.
- System-effect tags and free-form tags should share the same pill shape. Use color only to indicate system effect: blue for system-effect tags, gray for free-form tags.
- Long names and paths must truncate or wrap predictably without shifting the layout.

The tree should not show every detail inline. File type, size, modified date, warnings, and generated context-package status can move to the context surface when a row is selected.

Tree behavior must follow accessible tree-view expectations: arrow-key navigation, visible focus, `aria-expanded` for expandable folders, and assistive-technology state that matches the visual state.

## Folder Tagging

Folder tagging is the UI pattern for classifying folders in Sidekick.

Use `docs/architecture/klassifisering-med-tags.html` as the visual reference for the first tagging design.

Core model:

- A tag is a tag. Do not expose separate UI concepts for roles, classifiers, and free-text tags.
- Folders can have one or more tags.
- Some tags have system effect in Sidekick. `Prosjektmappe` is the first expected system-effect tag and makes the folder available to the future `Prosjekter` view.
- Other tags are free-form user labels with no system effect, for example `Follow up` or `Q2`.
- System-effect tags and free-form tags work the same way for the user. The distinction is visual and behavioral under the hood, not a separate interaction model.
- System-effect tags use blue pills. Free-form tags use gray pills.
- Tagging is stored as Sidekick metadata in the workspace-local database: `.sidekick/sidekick.db`.
- Tag metadata is not user content and should be hidden from normal Sidekick content views, context packages, summaries, and search indexes.

Primary interaction:

1. The user selects a folder in the tree.
2. The context surface shows a `Tagger` section.
3. Existing tags appear as removable chips.
4. Clicking the tag field opens a small suggestion dropdown.
5. Suggestions include system-effect tags and tags the user has used elsewhere in the workspace.
6. The user chooses a suggestion or types a new tag and presses Enter.
7. The tag is added immediately as a chip and saved to `.sidekick/sidekick.db` for the current workspace.
8. Clicking `x` on a chip removes the tag and saves the change.

Context surface requirements:

- The `Tagger` section belongs in the context surface for the selected folder.
- If no folder is selected, show a compact empty state such as `Velg en mappe for å legge til tagger.`
- If a file is selected, do not show folder-tag editing as an available action.
- The tag field should behave like a compact token input, not a large form.
- The dropdown should be small, anchored to the field, and limited to relevant suggestions.
- The UI should include quiet metadata reassurance, for example `Lagres som skjult Sidekick-metadata i arbeidsområdet - ikke i dokumentene dine`.
- Tag write errors should appear near the tag field and should not clear the user's selection or entered text.

Tree display requirements:

- Tagged folders show up to three tag pills directly after the folder name.
- If there are more than three tags, show a compact `+N` pill.
- Tree pills must not make rows taller, shift indentation, or overpower the folder name.
- Long tags should truncate before they make the tree row unstable.
- Do not show tag editing controls inside the tree row; editing belongs in the context surface.

Extensibility requirements:

- New system-effect tags should be addable without changing the interaction model.
- The user should not need to know whether a tag has system effect before using it.
- Future examples may include `Applikasjonsmappe`, `Bibliotek`, `Prosjektcontainer`, or `Applikasjonscontainer`, but the first design should not expose future tags unless they are implemented.
- Implementation should keep a typed distinction between system-effect tags and free-form tags, even though the UI presents both as tags.

## Context Surface

The context surface should answer "what matters about this selection or operation?" rather than duplicate the full folder tree.

Good context content:

- selected folder or file name;
- path;
- artifact type;
- folder tags when a folder is selected;
- child counts;
- relevant warnings;
- recent activity;
- context-package availability or generated-file metadata when relevant;
- safe contextual actions that apply only to the current selection.

The context surface changes when selection changes. It should stay stable during active workflows so the user does not lose orientation.

Avoid turning the context surface into a dashboard. If many unrelated sections appear, group them behind tabs, disclosure controls, or selection-specific views.

## Typography

Typography should be compact, legible, and utilitarian.

- Use the system font stack.
- Use small heading scales inside the app surface.
- Reserve large type for the app title or a rare empty state.
- Avoid uppercase labels except for very small metadata labels.
- Keep letter spacing at `0`.
- Use font weight and spacing before using color.
- Ensure filenames, folder names, and paths can handle long words.

## Color

Sidekick should use a restrained neutral palette with one accent color.

Color roles:

- app background;
- panel background;
- primary text;
- secondary text;
- border/divider;
- selected row;
- primary action;
- warning;
- error;
- success.

Use these baseline color tokens for the GUI refresh. Token names may be adapted to code conventions, but semantic intent should be preserved:

| Role | Value |
| --- | --- |
| App background | `#f4f3f1` |
| Panel background | `#ffffff` |
| Secondary surface | `#f9f8f7` |
| Primary text | `#1c1917` |
| Secondary text | `#57534e` |
| Subtle text | `#a8a29e` |
| Border/divider | `#e2dfd9` |
| Strong border | `#c0bcb5` |
| Primary action/accent | `#2d5fa3` |
| Accent hover | `#3a72bf` |
| Accent pressed | `#224a84` |
| Accent subtle background | `#ebf0fa` |
| Accent border | `#9dbde8` |
| Success text/background/border | `#15532d` / `#f0fdf4` / `#86efac` |
| Warning text/background/border | `#78350f` / `#fffbeb` / `#fcd34d` |
| Error text/background/border | `#7f1d1d` / `#fef2f2` / `#fca5a5` |
| Info text/background/border | `#1e3a8a` / `#eff6ff` / `#93c5fd` |

Avoid one-note palettes dominated by a single hue. The current warm neutral direction is acceptable, but it should be quieter: fewer filled surfaces, fewer high-contrast blocks, and fewer competing section treatments.

## Controls And Actions

Controls should follow desktop expectations.

- Primary actions should be limited to the current main task.
- Use at most one visually primary action in a panel or workflow surface.
- Secondary actions should use quiet buttons, icon buttons, menus, or context menus.
- Dangerous or broad write actions require explicit confirmation and should not be presented as routine toolbar actions.
- Long-running actions need disabled states and progress or pending status.
- Actions that create files, move files, rename files, or overwrite files must clearly show the target path before execution.
- Full workflow write operations must use a consistent write-operation indicator and confirmation pattern before execution. Inline metadata edits such as tagging may autosave after the user's direct add/remove action.

Global and contextual action placement:

| Action | Type | Placement |
| --- | --- | --- |
| Import transcript | Global | Action bar |
| Generate context package for the whole project | Global | Action bar |
| Run Codex | Global | Action bar |
| Generate context package for the selected folder | Contextual | Context surface |

Global actions are available because a project is active. Contextual actions are available because a specific project object is selected. Do not move global actions into the context surface to save space.

For Electron menus and shortcuts, prefer native menu roles and cross-platform accelerators where possible.

## Write Operations

Read-only inspection is the default mode. Any action that writes to disk must be visually and verbally explicit.

Full workflow write-operation requirements:

- Show that the action writes to disk before the user confirms.
- Show what will be written, copied, generated, or changed.
- Show the target folder or file path.
- Show overwrite status when relevant.
- Use calm warning treatment, not alarming destructive styling, unless data loss is possible.
- Show success with the resulting path or changed object.
- Rescan or refresh affected project information after successful writes when the operation changes the project folder.

Workflow behavior for write operations:

- Preview and confirmation happen in the primary workspace.
- The context surface remains unchanged while the workflow runs.
- Cancel before confirmation writes nothing.
- Completed writes are not automatically reversed.
- Success states should make the created, copied, or changed file visible through refreshed project information.

Inline metadata edits:

- Folder tagging is an inline Sidekick-metadata write, not a full workflow surface.
- Adding or removing a tag is the explicit user action. It may autosave immediately after the chip is added or removed.
- Inline metadata edits still need visible saved, saving, and failed states.
- The UI must make clear that tagging writes hidden Sidekick metadata in `.sidekick/sidekick.db` and does not change the user's own documents.
- Failed tag saves should leave the tag field usable and should not silently discard the attempted change.

Folder-scoped context packages, when introduced, should be a contextual folder action. The action starts from the selected folder context, opens the shared context-package workflow in the primary workspace, writes the generated Markdown file to the selected folder, and keeps the selected folder visible in the context surface.

Current resolved product constraints:

- Transcript import accepts existing `.txt`, `.md`, and `.markdown` files only. It does not import audio.
- Transcript import keeps the current filename convention: `NN. original-name.ext`.
- Context packages keep the current filename behavior based on the project folder name.
- Codex runs directly against the selected project folder, not through a required context package.
- Codex model selection is deferred.

## Menus, Context Menus, And Shortcuts

The visible UI should not carry every command. Desktop commands can live in:

- application menu;
- folder or file context menu;
- toolbar near the relevant surface;
- keyboard shortcut.

Guidelines:

- Use `CommandOrControl` for cross-platform shortcuts.
- Keep menu structure predictable: File, Edit, View, Window, Help, plus app-specific actions when needed.
- Context menus should only contain actions relevant to the clicked object.
- Keyboard shortcuts should be discoverable from menus, not only hidden in code.
- Global shortcuts should be avoided unless the app has a strong reason to work outside focus.

## Feedback And Empty States

Feedback should be specific and compact.

- Empty states should tell the user the next available action, not explain the product.
- Warnings should appear close to the affected folder, file, or action.
- Errors should include what failed, why if known, and what the user can do next.
- Success messages should be brief and should not remain prominent after the result is visible.
- Generated files should show their output path and overwrite status.
- The status bar should carry compact operational state; large banners should be reserved for states that require attention or action.
- Loading states should preserve layout stability and avoid shifting key actions.

## Accessibility

Minimal UI must still be accessible.

- Every interactive element needs a visible focus state.
- Tree rows must be keyboard navigable.
- Expand and collapse state must be available to assistive technology.
- Text contrast must remain usable in light and dark operating system themes.
- Hit targets must be large enough for pointer use, even when the visual design is compact.
- Do not rely on color alone for warnings, errors, or selected state.
- Minimum functional text should remain readable at the supported minimum window size.

## Electron Desktop Boundaries

The design should reinforce Sidekick's security model:

- The renderer should never imply arbitrary filesystem access.
- File writes must be explicit, reviewable, and tied to selected project roots.
- File opening, if introduced, must go through a typed main/preload API that validates the target is inside the selected project root before using OS integration.
- Codex must remain a controlled assistant operation, not a generic embedded shell.
- External links should open through safe Electron handling, not embedded web content.
- Avoid webview-based UI unless there is a specific reviewed need.
- Native dialogs should be used for folder selection and other OS-level file choices.

## Implementation Checklist

Use this checklist before merging UI changes:

- [ ] The primary workspace remains the primary visual focus.
- [ ] The selected project name and path remain visible when a project is active.
- [ ] The UI uses fewer surfaces, borders, and filled blocks than before.
- [ ] Repeated information has been removed or moved to selection-specific detail.
- [ ] Primary and secondary actions are visually distinct.
- [ ] Write operations use the shared write-operation indicator and show the target path before execution.
- [ ] Inline metadata edits such as folder tagging show saved/saving/error state and identify `.sidekick/sidekick.db` as the metadata target.
- [ ] Long folder names, filenames, and paths behave correctly.
- [ ] Empty, loading, success, warning, and error states are covered.
- [ ] Keyboard navigation and focus states work for new controls.
- [ ] The UI works at `1280 x 820` and remains usable at `1040 x 720`.
- [ ] The change does not weaken Electron security boundaries.
- [ ] UI smoke tests or screenshots cover the changed workflow when relevant.

## References

- Electron Application Menu: https://www.electronjs.org/docs/latest/tutorial/application-menu
- Electron Keyboard Shortcuts: https://www.electronjs.org/docs/latest/tutorial/keyboard-shortcuts
- Electron Security: https://www.electronjs.org/docs/latest/tutorial/security
- Windows app design overview: https://learn.microsoft.com/en-us/windows/apps/design/
- WAI-ARIA Tree View Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
- WCAG 2.2: https://www.w3.org/TR/wcag/
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines
- GNOME Human Interface Guidelines: https://developer.gnome.org/hig/
