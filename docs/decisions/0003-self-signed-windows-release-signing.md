# Decision: Self-Signed Windows Release Signing

Date: 2026-05-11

## Status

Accepted

## Context

Sidekick currently publishes early Linux and Windows prerelease artifacts from GitHub Actions. Windows artifacts need a practical signing path for maintainer testing, but public-trust signing through Azure Artifact Signing or a commercial certificate is not a good first step for this project.

The maintainer is a private individual and wants GitHub-produced Windows installers to be trusted on the maintainer's own Windows machine.

## Decision

Sidekick will support self-signed Windows signing for maintainer prereleases.

The release workflow may sign Windows artifacts with a maintainer-controlled self-signed code-signing certificate stored in GitHub Secrets. Signing is required for Windows release artifacts only when `SIDEKICK_REQUIRE_WINDOWS_SIGNING=true`.

The maintainer's Windows machine must explicitly trust the public certificate before Windows can validate the self-signed chain.

Public-trust Windows signing remains a future release concern.

## Consequences

Self-signed release artifacts can verify as locally trusted on machines where the public certificate has been installed into trusted stores.

Self-signed release artifacts are not publicly trusted for arbitrary external users.

Microsoft Defender or SmartScreen reputation warnings may remain even when Authenticode verification is valid locally.

The private `.pfx` and password must remain secret. If the private key leaks, the certificate must be rotated and old trust should be removed where appropriate.

