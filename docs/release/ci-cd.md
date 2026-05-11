# Sidekick CI/CD

Sidekick uses GitHub Actions for verification, package builds, workflow artifacts, and tag-based prereleases.

## Push Builds

Every push to `main` runs the CI workflow:

- lint and typecheck
- unit and integration tests
- UI smoke tests
- production dependency audit
- Linux package build
- Windows package build
- packaged context-package smoke verification

The CI workflow verifies packaged context-package generation before uploading Linux and Windows packages as GitHub Actions artifacts. These artifacts are attached to the workflow run and are useful for testing builds from a specific commit.

To find them:

1. Open the repository on GitHub.
2. Go to **Actions**.
3. Open the latest **CI** workflow run for `main`.
4. Download the artifacts named `sidekick-linux-...` or `sidekick-windows-...`.

## Local Linux Packaging

On Ubuntu, local Linux packaging requires DEB/RPM tooling before `npm run make` can produce both package formats:

```bash
sudo apt-get install -y fakeroot rpm
```

## Release Builds

GitHub Releases are created only from version tags matching `v*`.

The first planned release tag is:

```bash
v0.1.0
```

The release workflow verifies that the tag matches the version in `package.json`. For example, package version `0.1.0` must be released with tag `v0.1.0`.

The release workflow also verifies that the tag points to a commit reachable from `main`.

## Windows Signing

Windows release artifacts support optional self-signed signing for maintainer prereleases.

The supported signing modes are:

- unsigned: allowed for early prereleases when signing is not required;
- self-signed: allowed for maintainer prereleases after signing secrets are configured;
- public-trust signed: deferred to a future release process.

Self-signed signing is controlled by GitHub repository configuration:

- secret `SIDEKICK_SIGNING_PFX_BASE64`
- secret `SIDEKICK_SIGNING_PASSWORD`
- optional secret or variable `SIDEKICK_SIGNING_TIMESTAMP_URL`
- variable `SIDEKICK_REQUIRE_WINDOWS_SIGNING`

When `SIDEKICK_REQUIRE_WINDOWS_SIGNING=true`, the Windows release job must sign and verify Windows artifacts before upload. If signing secrets are missing or verification fails, the job fails before the GitHub prerelease is published.

When `SIDEKICK_REQUIRE_WINDOWS_SIGNING` is not true and signing secrets are missing, Windows prerelease artifacts may remain unsigned.

Signing material is provided to Electron Forge before `npm run make`, so Squirrel.Windows signs artifacts while creating them. The workflow then verifies generated `.exe` signatures before uploading release assets.

Self-signed artifacts are trusted only on machines where the maintainer has installed the matching public certificate. See `docs/release/windows-self-signed-signing.md` for the certificate, trust, verification, and removal procedure.

## Creating A Release

Use this flow after the release workflow has been merged and the CI workflow passes on `main`:

```bash
git status
git pull --ff-only origin main
git tag v0.1.0
git push origin v0.1.0
```

Pushing the tag starts the release workflow. If it passes, GitHub creates a prerelease named `Sidekick v0.1.0` and attaches the Linux and Windows package assets.

## Version Bumps

For later releases, update `package.json` and `package-lock.json` without creating a tag immediately:

```bash
npm version 0.1.1 --no-git-tag-version
git add package.json package-lock.json
git commit -m "Bump version to 0.1.1"
git push origin main
```

After CI passes on `main`, create and push the matching release tag:

```bash
git tag v0.1.1
git push origin v0.1.1
```

## Current Release Limits

The first release pipeline intentionally does not include:

- macOS packages
- notarization
- automatic app updates
- store distribution

Windows packages are unsigned unless the self-signed maintainer workflow is configured for the release. Users may see operating system warnings when running unsigned installers or self-signed installers on machines that do not trust the Sidekick certificate.

Linux output includes DEB and RPM packages when Electron Forge can produce both in CI.
