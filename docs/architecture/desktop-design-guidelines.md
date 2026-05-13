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

Workflow responsibility model:

- Project switching belongs in the topbar and should not appear as a routine bottom action.
- Settings is an app-level view that replaces the primary workspace body while keeping the topbar stable.
- Project-level actions such as full-project context-package generation, transcript import, and controlled Codex runs start from the action bar and run in the primary workspace.
- Starting an exclusive workflow should replace the folder tree in the primary workspace, not take over the context surface.
- The context surface should remain tied to the selected project, folder, or file while workflows run. It should not become the workflow progress panel.
- Competing global actions should be disabled while an exclusive workflow is active.
- Project switching and settings navigation should not silently hide an active workflow. Disable or explicitly guard them while a workflow is in progress.
- Folder-scoped actions, when introduced, should live near the selected folder context rather than in the global action bar.

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
- Long names and paths must truncate or wrap predictably without shifting the layout.

The tree should not show every detail inline. File type, size, modified date, warnings, and generated context-package status can move to the context surface when a row is selected.

Tree behavior must follow accessible tree-view expectations: arrow-key navigation, visible focus, `aria-expanded` for expandable folders, and assistive-technology state that matches the visual state.

## Context Surface

The context surface should answer "what matters about this selection or operation?" rather than duplicate the full folder tree.

Good context content:

- selected folder or file name;
- path;
- artifact type;
- child counts;
- relevant warnings;
- recent activity;
- context-package preview and result;
- safe actions that apply to the current selection.

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
- Write operations must use a consistent write-operation indicator and confirmation pattern before execution.

For Electron menus and shortcuts, prefer native menu roles and cross-platform accelerators where possible.

## Write Operations

Read-only inspection is the default mode. Any action that writes to disk must be visually and verbally explicit.

Write-operation requirements:

- Show that the action writes to disk before the user confirms.
- Show what will be written, copied, generated, or changed.
- Show the target folder or file path.
- Show overwrite status when relevant.
- Use calm warning treatment, not alarming destructive styling, unless data loss is possible.
- Show success with the resulting path or changed object.
- Rescan or refresh affected project information after successful writes when the operation changes the project folder.

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
