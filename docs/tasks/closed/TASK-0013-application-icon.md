# Task: Application Icon

ID: TASK-0013
Status: Done
Class: Standard
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0013-application-icon
Worktree: ../Sidekick-worktrees/TASK-0013-application-icon
Base branch: origin/main
Write scope:
- `assets/`
- `scripts/`
- `forge.config.ts`
- `src/main.ts`
- `tests`
- `docs/tasks/closed/TASK-0013-application-icon.md`
Parallel safety: Coordinate

## Summary

Create a Sidekick application icon and configure the Electron app so packaged builds and the application window no longer use the default Electron icon.

## Current Phase

Close

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

Related files:
- `assets/icons/sidekick-icon.svg`
- `assets/icons/generated/`
- `scripts/assets/generate-app-icons.mjs`
- `forge.config.ts`
- `src/main.ts`
- `package.json`
- `tests/unit/app-icon-config.test.ts`

Related docs:
- Electron Forge custom app icon guide
- Electron Forge configuration overview
- Electron Packager options

## Explore Notes

Current state:
- `forge.config.ts` does not configure an app icon.
- `src/main.ts` creates the main `BrowserWindow` without an `icon` option.
- There are no existing project icon assets in the repo.
- The local task worktree does not yet have `node_modules`.

Relevant documentation:
- Electron Forge recommends starting with a 1024x1024 source image.
- Electron Forge uses `packagerConfig.icon` for packaged app icons.
- For Linux, Electron Forge also documents setting the `BrowserWindow` icon.
- Maker-specific installer icons can be configured separately.

Environment notes:
- ImageMagick, `png2icns`, and `icotool` are not installed.
- The implementation should avoid paid tooling and avoid adding unnecessary runtime dependencies.

## Task Spec

Goal:
- Replace the default Electron icon with a Sidekick-specific app icon.

Acceptance criteria:
- The repo contains a durable source icon asset.
- The repo contains generated icon files needed by Electron packaging.
- `forge.config.ts` points packaged app builds at the Sidekick icon.
- The main `BrowserWindow` uses the Sidekick PNG icon where Electron needs an explicit window icon.
- The icon generation path is documented or scripted enough to be repeatable.
- Verification confirms TypeScript and tests still pass.

Non-goals:
- Full brand identity system.
- Marketing logo work.
- Paid icon tooling.
- Changing the application UI layout.

## Implementation Plan

1. Add a vector source icon under `assets/icons/`.
2. Add a small Node script that generates PNG sizes plus `.ico` and `.icns` without paid tooling or new npm dependencies.
3. Add a package script for regenerating app icons.
4. Generate and commit the icon assets.
5. Configure `forge.config.ts` with the generated icon path.
6. Configure `BrowserWindow` to use the generated PNG icon.
7. Add or update tests that assert the icon configuration is present.
8. Run verification.

## Build Log

- 2026-05-12: Created task worktree `../Sidekick-worktrees/TASK-0013-application-icon` on branch `task/TASK-0013-application-icon`.
- 2026-05-12: Ran `npm ci` in the task worktree because the new worktree did not have `node_modules`.
- 2026-05-12: Baseline verification passed before implementation:
  - `npm run check`: passed.
  - `npm run test`: passed, 12 files and 45 tests.
- 2026-05-12: Added `assets/icons/sidekick-icon.svg` as the durable source icon.
- 2026-05-12: Added `scripts/assets/generate-app-icons.mjs` and `npm run icons:generate`.
- 2026-05-12: Generated PNG sizes, `sidekick-icon.ico`, and `sidekick-icon.icns`.
- 2026-05-12: Configured Electron Forge:
  - `packagerConfig.icon` uses the generated Sidekick icon base path;
  - `packagerConfig.extraResource` copies `sidekick-icon.png` to packaged resources for runtime window icon loading;
  - Squirrel setup icon uses the generated `.ico`;
  - RPM and DEB maker icons use the generated `.png`.
- 2026-05-12: Configured `BrowserWindow` to use the Sidekick PNG icon in development and packaged runtime.
- 2026-05-12: Added a unit test for app icon configuration and generated icon file presence.

## Verification Log

- 2026-05-12: `npm run icons:generate`: passed.
- 2026-05-12: Visual check:
  - inspected `assets/icons/generated/sidekick-icon.png`;
  - first version looked too much like a generic plus icon;
  - revised the center mark to a simple Sidekick `S` mark and regenerated assets.
- 2026-05-12: File format check:
  - `sidekick-icon.png`: PNG image data, 512 x 512, RGBA;
  - `sidekick-icon.ico`: Windows icon resource with multiple PNG-backed sizes;
  - `sidekick-icon.icns`: Mac OS X icon.
- 2026-05-12: `npm run check`: passed.
- 2026-05-12: `npm run test`: passed, 13 files and 47 tests.
- 2026-05-12: `npm run package`: passed for Linux x64.
- 2026-05-12: Packaged-resource check:
  - `out/Sidekick-linux-x64/resources/sidekick-icon.png` exists.
- 2026-05-12: `npm run test:ui`: passed, 7 Playwright tests.

## Review Notes

Diff matches goal:
- Yes. The app now has Sidekick-specific icon assets and Electron Forge points packaging at them.

Scope respected:
- Yes. No application behavior, IPC contract, persistence, or security boundary was changed.

Risk notes:
- The `.ico` and `.icns` files are generated by a small repo-local script instead of external icon tooling. The generated files pass basic file-format inspection and package verification.
- Windows installer Control Panel icon URL is not configured because Squirrel's `iconUrl` expects a URL. The packaged executable icon and setup icon are configured locally.

Security notes:
- No new runtime dependency was added.
- No renderer privileges were changed.
- `BrowserWindow` security settings remain unchanged.

## Documentation Notes

Docs updated:
- This task record documents the icon source, generated files, generation command, and verification.

Decision record needed:
- No.
- Reason: this is a contained packaging/asset configuration, not a new durable architecture or security decision.

## Closeout

Changed:
- Added Sidekick app icon source and generated platform icon assets.
- Added `npm run icons:generate`.
- Configured packaged app, Linux makers, Windows setup icon, and window icon loading.
- Added unit coverage for icon configuration and expected generated files.

Verified:
- `npm run icons:generate`: passed.
- `npm run check`: passed.
- `npm run test`: passed.
- `npm run package`: passed.
- `npm run test:ui`: passed.

Known gaps:
- No real Windows/macOS package run was performed from this Linux environment.
- Squirrel `iconUrl` is not configured because it requires a URL, not a local file path.

Final status:
- Done.
