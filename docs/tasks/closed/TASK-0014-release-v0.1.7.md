# Task: Release v0.1.7

ID: TASK-0014
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-12
Updated: 2026-05-12
Branch: task/TASK-0014-release-v0.1.7
Worktree: ../Sidekick-worktrees/TASK-0014-release-v0.1.7
Base branch: origin/main
Write scope:
- `package.json`
- `package-lock.json`
- `docs/tasks/closed/TASK-0014-release-v0.1.7.md`
Parallel safety: Exclusive

## Summary

Bump Sidekick to `0.1.7` and create matching release tag `v0.1.7` so GitHub Actions can publish updated Windows test artifacts.

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

## Explore Notes

- Existing latest release tag before this task was `v0.1.6`.
- `package.json` version before this task was `0.1.6`.
- The release workflow validates that tag `vX.Y.Z` matches `package.json` version `X.Y.Z`.

## Task Spec

Goal:
- Create a new release tag for an updated Windows test build.

Acceptance criteria:
- `package.json` and `package-lock.json` are bumped to `0.1.7`.
- The version bump is committed to `main`.
- Tag `v0.1.7` points at the committed version bump.
- `main` and `v0.1.7` are pushed to GitHub.

## Implementation Plan

1. Bump npm package version to `0.1.7` without auto-tagging.
2. Commit the version bump and task record.
3. Merge the release commit to `main`.
4. Push `main`.
5. Create and push tag `v0.1.7`.

## Build Log

- 2026-05-12: Created task worktree `../Sidekick-worktrees/TASK-0014-release-v0.1.7`.
- 2026-05-12: Ran `npm version 0.1.7 --no-git-tag-version`.

## Verification Log

- 2026-05-12: Confirmed release workflow requires matching `package.json` version and tag.

## Review Notes

- Scope is limited to version metadata and this task record.

## Documentation Notes

- This task record documents the release tag intent.

## Closeout

Changed:
- Bumped package version to `0.1.7`.

Verified:
- Release tag naming requirement checked against `.github/workflows/release.yml`.

Known gaps:
- GitHub release workflow result must be checked on GitHub after tag push.

Final status:
- Done.
