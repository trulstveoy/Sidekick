# Sidekick Desktop Design Guidelines

Status: Draft

## Purpose

This document defines the desktop UI direction for Sidekick. It should guide new UI work and cleanup of existing screens.

Sidekick should feel like a quiet local workspace for understanding project folders. The interface should reduce visual noise, make folder structure easy to scan, and keep potentially destructive or expensive actions explicit.

## Design Thesis

Visual thesis: Sidekick is a minimalist desktop workspace with calm surfaces, strong alignment, restrained color, and dense but readable project information.

Content thesis: The UI should show the selected project, the folder structure, and the most useful metadata without explaining itself in long text.

Interaction thesis: Common actions should be direct and discoverable through the work surface, menus, context menus, and keyboard shortcuts. Motion should be subtle and functional only.

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

Sidekick uses a three-area desktop workspace:

- Left sidebar: project selection, selected root, and stable project-level signals.
- Center workspace: folder structure and the primary object the user is inspecting.
- Right inspector: summary, metadata, warnings, and actions for the current selection or project.

The center workspace is the main surface. The left and right areas should support it without competing for attention.

The shell should avoid page-like composition. Do not introduce landing-page sections, hero copy, marketing language, or decorative feature cards inside the app.

## Folder Tree

The folder tree is the primary UI element for folder understanding.

Expected behavior:

- Folders can expand and collapse.
- Collapsed folders show only the folder row and relevant summary signals.
- Expanded folders reveal direct child folders and files.
- File rows should be visually quieter than folder rows.
- Selected rows should be obvious without using heavy color blocks.
- Indentation should be consistent and compact.
- Counts and artifact hints should be aligned so the tree remains scannable.
- Long names and paths must truncate or wrap predictably without shifting the layout.

The tree should not show every detail inline. File type, size, modified date, warnings, and generated context-package status can move to the inspector when a row is selected.

## Inspector

The inspector should answer "what matters about this selection?" rather than duplicate the full folder tree.

Good inspector content:

- selected folder or file name;
- path;
- artifact type;
- child counts;
- relevant warnings;
- recent activity;
- context-package preview and result;
- safe actions that apply to the current selection.

Avoid turning the inspector into a dashboard. If many unrelated sections appear, group them behind tabs, disclosure controls, or selection-specific views.

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

Avoid one-note palettes dominated by a single hue. The current warm neutral direction is acceptable, but it should be quieter: fewer filled surfaces, fewer high-contrast blocks, and fewer competing section treatments.

## Controls And Actions

Controls should follow desktop expectations.

- Primary actions should be limited to the current main task.
- Secondary actions should use quiet buttons, icon buttons, menus, or context menus.
- Destructive actions require explicit confirmation and should not be presented as routine toolbar actions.
- Long-running actions need disabled states and progress or pending status.
- Actions that create files, move files, rename files, or overwrite files must clearly show the target path before execution.

For Electron menus and shortcuts, prefer native menu roles and cross-platform accelerators where possible.

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

## Accessibility

Minimal UI must still be accessible.

- Every interactive element needs a visible focus state.
- Tree rows must be keyboard navigable.
- Expand and collapse state must be available to assistive technology.
- Text contrast must remain usable in light and dark operating system themes.
- Hit targets must be large enough for pointer use, even when the visual design is compact.
- Do not rely on color alone for warnings, errors, or selected state.

## Electron Desktop Boundaries

The design should reinforce Sidekick's security model:

- The renderer should never imply arbitrary filesystem access.
- File writes must be explicit, reviewable, and tied to selected project roots.
- External links should open through safe Electron handling, not embedded web content.
- Avoid webview-based UI unless there is a specific reviewed need.
- Native dialogs should be used for folder selection and other OS-level file choices.

## Implementation Checklist

Use this checklist before merging UI changes:

- [ ] The center workspace remains the primary visual focus.
- [ ] The UI uses fewer surfaces, borders, and filled blocks than before.
- [ ] Repeated information has been removed or moved to selection-specific detail.
- [ ] Primary and secondary actions are visually distinct.
- [ ] Long folder names, filenames, and paths behave correctly.
- [ ] Empty, loading, success, warning, and error states are covered.
- [ ] Keyboard navigation and focus states work for new controls.
- [ ] The change does not weaken Electron security boundaries.
- [ ] UI smoke tests or screenshots cover the changed workflow when relevant.

## References

- Electron Application Menu: https://www.electronjs.org/docs/latest/tutorial/application-menu
- Electron Keyboard Shortcuts: https://www.electronjs.org/docs/latest/tutorial/keyboard-shortcuts
- Electron Security: https://www.electronjs.org/docs/latest/tutorial/security
- Windows app design overview: https://learn.microsoft.com/en-us/windows/apps/design/
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines
- GNOME Human Interface Guidelines: https://developer.gnome.org/hig/
