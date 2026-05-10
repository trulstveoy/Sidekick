# 0002: Tag-Based GitHub Releases

## Status

Accepted

## Context

Sidekick needs a GitHub Actions pipeline that verifies pushed code, builds packages, and makes Linux and Windows packages available. macOS packaging is intentionally deferred.

There are two different distribution surfaces:

- GitHub Actions artifacts, which are attached to a workflow run and are suitable for every push.
- GitHub Releases, which are durable release records and should identify a deliberate version.

Publishing a GitHub Release for every push to `main` would create noisy permanent releases and make it unclear which builds are intended release versions.

## Decision

Use tag-based GitHub Releases.

- Pushes to `main` should run verification and upload generated packages as workflow artifacts.
- Git tags matching `v*` should run verification, build packages, and publish a GitHub Release.
- The first planned release tag is `v0.1.0`.
- Release versions should follow SemVer-style tags such as `v0.1.0`, `v0.1.1`, `v0.2.0`, and eventually `v1.0.0`.
- First-version release packages should target Linux and Windows only.
- macOS release packaging should be handled by a later task.
- Early GitHub Releases should be marked as prereleases.
- First-version Windows packages may be unsigned.
- First-version Linux output should include both DEB and RPM packages.
- `package.json` remains the source of the package version.
- Release tags must match `v<package.json version>`.
- The first implementation should set the package version to `0.1.0` so it matches the planned first release tag `v0.1.0`.

## Consequences

- A release points to one explicit commit.
- Normal pushes still produce downloadable workflow artifacts without creating permanent releases.
- Creating a GitHub Release becomes an intentional action: create and push a version tag.
- The release workflow can safely trigger on tags matching `v*`.
- Version bumping must be coordinated with release tagging, normally by updating `package.json` and `package-lock.json` before creating the tag.
- A tag/version mismatch should fail the release workflow before publishing assets.
