# Task: GitHub CI/CD Release Pipeline

ID: TASK-0005
Status: Verifying
Class: Major
Owner: Pair
Created: 2026-05-10
Updated: 2026-05-10

## Summary

Design and implement a GitHub Actions CI/CD pipeline for Sidekick that runs verification on pushed code, builds distributable packages, and makes updated packages available for Linux and Windows. macOS packaging is intentionally deferred.

## Current Phase

Verify

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [x] Human approval received, if required
- [x] Build complete
- [ ] Verification complete
- [ ] Review complete
- [x] Documentation complete
- [ ] Closeout complete

## Links

Related files:
- `AGENTS.md`
- `docs/workflows/agentic-development.md`
- `docs/architecture/application-architecture.md`
- `package.json`
- `package-lock.json`
- `forge.config.ts`
- `playwright.config.ts`
- `docs/release/ci-cd.md`
- `.github/workflows/`

Related decisions:
- `docs/decisions/0002-tag-based-github-releases.md`

Reference sources:
- GitHub Actions artifact documentation: https://docs.github.com/en/actions/tutorials/store-and-share-data
- GitHub Actions `GITHUB_TOKEN` permissions documentation: https://docs.github.com/en/actions/tutorials/authenticate-with-github_token
- GitHub Actions manual workflow documentation: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow
- Electron Forge publishing documentation: https://www.electronforge.io/config/publishers/github
- Electron Forge build/publish overview: https://www.electronforge.io/

## Explore Notes

User goal:
- When code is pushed to GitHub, GitHub should run a CI/CD pipeline.
- The pipeline should run tests and verification.
- After build and verification, updated packages should be made available for Linux and Windows.
- macOS packaging is not needed in this version.

Current repository state:
- The repository uses Electron Forge with Vite and TypeScript.
- There is no `.github/workflows/` directory yet.
- Existing verification commands:
  - `npm run test`
  - `npm run test:ui`
  - `npm run check`
  - `npm run package`
  - `npm audit --omit=dev`
- Existing package command:
  - `npm run package`
- Existing make command:
  - `npm run make`
- Existing publish command:
  - `npm run publish`
- Existing Electron Forge makers:
  - `MakerSquirrel` for Windows
  - `MakerZIP` for macOS
  - `MakerRpm` for Linux RPM
  - `MakerDeb` for Linux DEB
- Electron Forge GitHub publisher is not installed or configured.
- The app is currently private in `package.json`.
- There is no code signing configuration.
- There is no auto-update configuration.
- There is no explicit release/versioning workflow yet.

Primary-source findings:
- GitHub Actions can upload build and test artifacts with `actions/upload-artifact`.
- GitHub Actions artifacts can be used for deployment, debugging, failed test inspection, and downloaded packages.
- GitHub recommends explicitly naming uploaded artifacts.
- GitHub's `GITHUB_TOKEN` should use the least permissions required by each workflow or job.
- Electron Forge can publish artifacts to GitHub Releases through `@electron-forge/publisher-github`.
- Electron Forge recommends using `process.env.GITHUB_TOKEN` for GitHub Publisher authentication.
- Electron Forge notes that publishing through GitHub Actions requires granting write permissions through the workflow `permissions` field.
- GitHub workflows can be manually run with `workflow_dispatch`.

Initial technical direction:
- Use GitHub Actions.
- Use GitHub-hosted runners for each first-version target OS:
  - `ubuntu-latest`
  - `windows-latest`
- Run CI verification before packaging or publishing.
- Build platform-specific packages on their native operating system runner.
- Upload generated distributables as workflow artifacts.
- Add a release path that can publish generated distributables to GitHub Releases after verification passes.

Important distinction:
- Workflow artifacts and GitHub Releases solve different needs.
- Workflow artifacts are suitable for every push because they are attached to a workflow run.
- GitHub Releases are durable public/versioned release records and should usually be created from tags or explicit manual release workflows, not every push to every branch.

Risk level:
- High.

Risk drivers:
- This task changes release infrastructure.
- Publishing packages requires repository write permissions.
- Cross-platform Electron packaging can fail differently on Linux and Windows.
- Windows production-quality distribution normally requires code signing decisions.
- Publishing on every push can create noisy or misleading releases if not scoped carefully.
- Windows packaging can require platform-specific fixes that do not appear on Linux.

## Task Spec

Draft status:
- Initial task goal is known.
- CI verification scope is mostly known.
- First-version platform packaging requirement is known: Linux and Windows only.
- Publishing semantics are decided: push to `main` produces workflow artifacts; version tags matching `v*` produce GitHub Releases.
- Release type is decided: first releases are GitHub prereleases.
- First-version signing is decided: Windows packages may be unsigned.
- Linux package scope is decided: produce both DEB and RPM.
- Versioning is decided: `package.json` remains the package version source, and release tags must match `v<package.json version>`.

Goal:
- Add a GitHub Actions pipeline that verifies Sidekick and produces installable/distributable packages for Linux and Windows.

Initial acceptance criteria:
- A GitHub Actions workflow exists under `.github/workflows/`.
- The workflow runs on pushes to `main`.
- The workflow can also be run manually with `workflow_dispatch`.
- The workflow installs dependencies using `npm ci`.
- The workflow runs `npm run check`.
- The workflow runs `npm run test`.
- The workflow runs `npm run test:ui`.
- The workflow runs `npm audit --omit=dev`.
- The workflow builds or makes platform packages for Linux and Windows.
- The workflow uploads generated packages as GitHub Actions artifacts.
- Linux output includes DEB and RPM artifacts if Electron Forge can produce them in CI.
- Windows output includes the Squirrel Windows artifact generated by the existing Forge maker.
- macOS packaging is not part of the first pipeline.
- Packaging jobs do not run if verification fails.
- The workflow uses least-privilege GitHub token permissions.
- Generated artifacts are named clearly by OS and version or commit.
- Documentation explains how to find packages from a workflow run.
- GitHub Releases are created only from version tags matching `v*`, such as `v0.1.0`.
- The first planned release tag is `v0.1.0`.
- GitHub Releases for this early stage are marked as prereleases.
- Windows packages are unsigned in the first version.
- Linux produces both DEB and RPM packages in the first version.
- The release workflow fails if the pushed tag does not match `v<package.json version>`.
- The first implementation updates the app version to `0.1.0` so it matches the planned `v0.1.0` release tag.

Out of scope until explicitly decided:
- Automatic app updates.
- macOS packaging.
- Code signing.
- Notarization.
- Apple Developer ID configuration.
- Windows Authenticode signing.
- Store distribution.
- Publishing to package registries outside GitHub.
- Release notes generation.
- Semantic version automation.

## Open Questions

Release semantics:
- Decision: every push to `main` uploads workflow artifacts only.
- Decision: GitHub Releases are created from Git version tags matching `v*`.
- Decision: the first release tag should be `v0.1.0`.
- Decision: GitHub Releases should be prereleases in the first version.

Versioning:
- Decision: package version continues to come from `package.json`.
- Decision: release tags must match `v<package.json version>`.
- Decision: workflow artifact names should include platform, package version, run number, and short commit SHA.

Security and permissions:
- Decision: first implementation uses only the built-in `GITHUB_TOKEN`.
- Should release publishing be protected by a GitHub Environment approval gate?

Platform packaging:
- Decision: unsigned Windows packages are acceptable for the first pipeline.
- Decision: Linux should produce both DEB and RPM from the first version.
- Decision: macOS packaging is deferred.

Pipeline cost and runtime:
- Decision: package generation runs on pushes to `main` and release tags.
- Decision: pull requests, if enabled later, should run verification only.

## Proposed First-Version Policy

Recommended first implementation:
- On every push to `main`:
  - run verification;
  - build Linux and Windows packages;
  - upload packages as workflow artifacts.
- On version tag matching `v*`, such as `v0.1.0`:
  - run verification;
  - build Linux and Windows packages;
  - publish packages to GitHub Releases as prereleases.

Reasoning:
- This satisfies "packages are available after push" without creating permanent releases for every commit.
- It keeps early release automation low-risk while the app is still unsigned and pre-release.
- It leaves room to add macOS packaging, code signing, and notarization later.

## Initial Implementation Ideas

Likely files:
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `forge.config.ts`
- `package.json`
- `docs/architecture/application-architecture.md`
- `docs/tasks/TASK-0005-github-ci-cd-release-pipeline.md`

Possible CI workflow shape:
- `verify` job on `ubuntu-latest`:
  - checkout
  - setup Node
  - `npm ci`
  - install Playwright browser dependencies
  - `npm run check`
  - `npm run test`
  - `npm run test:ui`
  - `npm audit --omit=dev`
- `package` matrix job:
  - needs `verify`
  - OS matrix: Linux, Windows
  - checkout
  - setup Node
  - `npm ci`
  - platform prerequisites if needed
  - `npm run make`
  - upload `out/make/**` as artifacts

Possible release workflow shape:
- Triggered by `push` tags matching `v*`.
- Uses the same verification and platform package jobs.
- Adds a publish job only after all package jobs pass.
- Uses GitHub CLI to publish artifacts.
- Uses `permissions: contents: write` only for the publishing job.

## Human Gate

Human approval is required before implementation because this is a Major task that changes release infrastructure and may grant write permissions to GitHub Actions.

Minimum approval questions before build:
- Does the human approve this implementation plan for build?
- Should release publishing require a protected GitHub Environment approval gate now, or can that wait?

## Implementation Plan

### Plan Scope

This plan implements the first GitHub Actions CI/CD pipeline for Linux and Windows.

In scope:
- Add CI workflow for pushes to `main` and manual runs.
- Add release workflow for pushed tags matching `v*`.
- Run verification before packaging.
- Build Linux and Windows packages after verification passes.
- Upload build outputs as GitHub Actions artifacts.
- Publish tag-based GitHub prereleases for `v*` tags.
- Use `GITHUB_TOKEN` with least practical permissions.
- Document how to find artifacts and how to create a release tag.
- Set app version to `0.1.0` to match the planned first release tag `v0.1.0`.

Out of scope:
- macOS packaging.
- Code signing.
- Notarization.
- Auto update.
- Store publishing.
- Release notes curation.
- Protected GitHub Environment approval gate.

### Workflow Files

Add:
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`

### CI Workflow

File:
- `.github/workflows/ci.yml`

Triggers:
- `push` to `main`
- `workflow_dispatch`

Permissions:
- `contents: read`

Jobs:
- `verify`
- `package`

`verify` job:
- runner: `ubuntu-latest`
- steps:
  - `actions/checkout@v6`
  - `actions/setup-node@v6`
  - `npm ci`
  - install Playwright Chromium and Linux browser dependencies
  - `npm run check`
  - `npm run test`
  - `npm run test:ui`
  - `npm audit --omit=dev`

`package` job:
- depends on `verify`
- matrix:
  - Linux on `ubuntu-latest`
  - Windows on `windows-latest`
- steps:
  - `actions/checkout@v6`
  - `actions/setup-node@v6`
  - `npm ci`
  - install Linux packaging prerequisites on Linux runner, including RPM/DEB tooling
  - `npm run make`
  - stage generated distributable files into a platform-specific artifact directory
  - upload the staged artifact directory with `actions/upload-artifact@v7`

Artifact naming:
- `sidekick-linux-v<version>-run-<run_number>-<short_sha>`
- `sidekick-windows-v<version>-run-<run_number>-<short_sha>`

Artifact staging rules:
- Do not upload the whole `out/` directory.
- Prefer concrete distributable files from `out/make/`, such as `.deb`, `.rpm`, `.exe`, `.nupkg`, and RELEASES metadata.
- Preserve enough Windows Squirrel output files for the installer/update package to be usable.

### Release Workflow

File:
- `.github/workflows/release.yml`

Triggers:
- `push` tags matching `v*`

Permissions:
- default: `contents: read`
- release publishing job: `contents: write`

Jobs:
- `verify`
- `package`
- `publish`

`verify` job:
- same verification steps as CI.
- includes a tag/version consistency check:
  - read `version` from `package.json`;
  - require pushed tag to equal `v${version}`;
  - fail early if mismatched.
- checks out with enough history to verify the release tag points at a commit reachable from `origin/main`.
- resolves the tag to its commit before checking reachability, so annotated and lightweight tags are handled correctly.
- fails before packaging if the tag is not reachable from `main`.

`package` job:
- same Linux and Windows matrix as CI.
- uploads platform artifacts for the publish job.

`publish` job:
- depends on all package jobs.
- runner: `ubuntu-latest`
- downloads all package artifacts.
- stages downloaded package files into one release-assets directory.
- creates a GitHub prerelease using GitHub CLI:
  - `gh release create "$GITHUB_REF_NAME" release-assets/* --prerelease --verify-tag --generate-notes --title "Sidekick $GITHUB_REF_NAME"`
- uses `GH_TOKEN: ${{ github.token }}`.

Reasoning:
- A final publish job avoids race conditions from multiple OS jobs trying to create the same release.
- GitHub CLI supports prereleases, tag verification, generated notes, and attaching assets in one command.
- The release job gets write permissions only where publishing actually happens.

### Package Version

Update:
- `package.json`
- `package-lock.json`

Change:
- `version` from `1.0.0` to `0.1.0`.

Reasoning:
- The existing `1.0.0` version came from the template and does not match the planned first release.
- The release workflow should enforce that tag `v0.1.0` matches package version `0.1.0`.
- The version update must not create the `v0.1.0` release tag during implementation. Use a file edit or `npm version 0.1.0 --no-git-tag-version`; create/push the tag only after the release workflow is merged and CI has passed.

### Documentation

Add:
- `docs/release/ci-cd.md`

Document:
- what runs on push to `main`;
- what runs on `v*` release tags;
- where GitHub Actions artifacts are found;
- how to create the first release tag;
- why macOS, code signing, notarization, and auto-update are deferred;
- how to interpret unsigned Windows packages.

Update:
- `docs/architecture/application-architecture.md` with a short release automation section if implementation changes architecture/release docs enough to warrant it.

### Verification Plan

Local verification before commit:
- `npm run check`
- `npm run test`
- `npm run test:ui`
- `npm run make`
- inspect generated `out/make` structure locally on Linux

Repository verification after push:
- GitHub Actions CI workflow completes on `main`.
- Linux artifact is uploaded.
- Windows artifact is uploaded.

Release verification after tag:
- Create/push `v0.1.0` only after CI succeeds.
- Release workflow completes.
- GitHub prerelease `v0.1.0` is created.
- Linux and Windows assets are attached to the release.

### Review Checklist

- [ ] Workflow triggers are scoped correctly.
- [ ] Packaging depends on verification.
- [ ] Release publishing depends on packaging.
- [ ] `GITHUB_TOKEN` permissions are least practical.
- [ ] Release job is tag-only.
- [ ] Release job verifies tag/version consistency.
- [ ] Release job verifies tag commit is reachable from `main`.
- [ ] Artifacts include platform and version identity.
- [ ] Artifact upload stages concrete distributable files, not the whole `out/` directory.
- [ ] No macOS runner is used.
- [ ] No signing secrets are introduced.
- [ ] Documentation explains artifact and release behavior.

### Plan Weakness Review

Identified weaknesses and mitigations:
- A `v*` tag can technically point to any commit, not only a commit on `main`. Mitigation: release workflow must verify that the tag commit is reachable from `origin/main` before publishing.
- Annotated tags can have a tag object SHA separate from the commit SHA. Mitigation: resolve the tag to its commit with `git rev-list -n 1 "$GITHUB_REF_NAME"` before the reachability check.
- Uploading `out/make/**` directly may include noisy or platform-internal files. Mitigation: package jobs should stage concrete distributable files before upload.
- Linux packaging prerequisites were too vague. Mitigation: Linux package job must install RPM/DEB tooling before `npm run make`.
- Updating the package version could accidentally create the release tag too early if `npm version` is used normally. Mitigation: update version without creating a Git tag; create `v0.1.0` only after workflow implementation is merged and CI passes.
- CI and release workflows duplicate verification steps. This is acceptable for the first version, but if the workflows drift, extract reusable workflow pieces later.

## Build Log

Implemented:
- Added `.github/workflows/ci.yml`.
- Added `.github/workflows/release.yml`.
- Set Electron Packager `executableName` to `sidekick` so Linux DEB/RPM makers find the packaged binary consistently.
- Added `scripts/ci/stage-make-artifacts.mjs` for deterministic distributable artifact staging.
- Added unit tests for artifact staging behavior.
- Added `docs/release/ci-cd.md`.
- Updated `docs/architecture/application-architecture.md` with release automation notes.
- Updated `package.json` and `package-lock.json` version from `1.0.0` to `0.1.0` without creating a Git tag.

CI workflow behavior:
- Runs on pushes to `main`.
- Can be run manually with `workflow_dispatch`.
- Runs check, unit/integration tests, UI smoke tests, and production audit before package jobs.
- Builds Linux and Windows packages after verification.
- Uploads staged distributable files as workflow artifacts.

Release workflow behavior:
- Runs only on tags matching `v*`.
- Verifies that the tag matches `v<package.json version>`.
- Resolves the tag to its commit and verifies that commit is reachable from `origin/main`.
- Builds Linux and Windows packages.
- Publishes a GitHub prerelease with downloaded package artifacts.
- Fails clearly if downloaded release assets contain duplicate file names instead of overwriting one asset with another.
- Uses `contents: write` only on the publish job.

## Verification Log

Passed locally:
- `npm run test`
- `npm run check`
- `npm run test:ui`
- `npm run package`
- `npm run make`
- `npm audit --omit=dev`

Additional checks:
- Confirmed no local `v0.1.0` Git tag was created.
- Confirmed `package.json` now reports version `0.1.0`.
- GitHub Actions CI run `#1` started from commit `c832fda` and failed in the `Install dependencies` step before tests or packaging started.
- Updated `package-lock.json` so `@electron/node-gyp` resolves through `git+https://github.com/electron/node-gyp.git` instead of `git+ssh://git@github.com/electron/node-gyp.git`, avoiding SSH authentication during `npm ci` on GitHub-hosted runners.
- GitHub Actions CI run `#2` started from commit `0962d3b` and still failed in the `Install dependencies` step. Public API exposed the failing step but not the private job log details.
- Added workflow Git configuration before `npm ci` so GitHub SSH dependency URLs are rewritten to HTTPS on GitHub-hosted runners.
- `GIT_SSH_COMMAND=false npm ci --cache /tmp/sidekick-npm-cache-https-test --prefer-online`
- `node --check scripts/ci/stage-make-artifacts.mjs`
- `node scripts/ci/stage-make-artifacts.mjs --platform linux --source out/make --target /tmp/sidekick-staged-artifacts`
- `git diff --check`

Local Linux package output:
- `out/make/deb/x64/sidekick_0.1.0_amd64.deb`
- `out/make/rpm/x64/sidekick-0.1.0-1.x86_64.rpm`

Pending remote verification:
- GitHub Actions CI workflow must pass after the package lock fix is committed and pushed to `main`.
- Linux package artifact must be uploaded by the CI workflow.
- Windows package artifact must be uploaded by the CI workflow.
- Release workflow must be tested after CI passes by pushing tag `v0.1.0`.

## Review Notes

Initial implementation review:
- CI package jobs depend on verification.
- Release publish job depends on platform package jobs.
- Release workflow is tag-only.
- Release workflow checks package version and tag reachability from `main`.
- Artifact staging avoids uploading the entire `out/` directory.
- Release asset staging fails on duplicate file names.
- No macOS runner is used.
- No signing secrets are introduced.

Pending review:
- Confirm GitHub-hosted Linux runner has sufficient RPM/DEB tooling after the install step.
- Confirm Windows Squirrel output includes all required files in staged artifacts.
- Confirm GitHub release assets are attached as expected after the first tag run.

## Documentation Notes

Docs updated:
- `docs/release/ci-cd.md`
- `docs/architecture/application-architecture.md`
- `docs/tasks/TASK-0005-github-ci-cd-release-pipeline.md`
- `docs/decisions/0002-tag-based-github-releases.md`

## Closeout

Not closed.
