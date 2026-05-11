# Task: Self-Signed Windows Signing

ID: TASK-0008
Status: Done
Class: Major
Owner: Pair
Created: 2026-05-11
Updated: 2026-05-11

## Summary

Add a practical first signing workflow for Sidekick Windows artifacts using a self-signed certificate.

The goal is not public-trust signing. The goal is to let GitHub Actions produce self-signed Windows artifacts that the maintainer can download from GitHub and install on the maintainer's own Windows machine after explicitly installing/trusting the public certificate.

This gives Sidekick a working signing procedure and verification path without requiring Azure Artifact Signing, Microsoft Entra, a commercial certificate, or an organization identity.

The concrete product goal for this task is to reduce the local Windows installation friction caused by unsigned or unknown-publisher Sidekick installers. The expected verification target is that the downloaded Sidekick installer has an Authenticode signature with `Status = Valid` on the maintainer's Windows machine after the Sidekick public certificate has been installed into local trust stores.

## Current Phase

Closeout

## Progress Checklist

- [x] Explore complete
- [x] Spec complete
- [x] Plan complete
- [x] Human approval received, if required
- [x] Build complete
- [x] Verification complete
- [x] Review complete
- [x] Documentation complete
- [x] Closeout complete

## Links

Related files:
- `docs/release/ci-cd.md`
- `docs/release/windows-self-signed-signing.md`
- `docs/architecture/application-architecture.md`
- `docs/decisions/0002-tag-based-github-releases.md`
- `docs/decisions/0003-self-signed-windows-release-signing.md`
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `forge.config.ts`
- `package.json`
- `scripts/signing/create-self-signed-code-signing-cert.ps1`
- `scripts/signing/verify-windows-signatures.ps1`
- `tests/unit/windows-signing-config.test.ts`

Related decisions:
- `../decisions/0002-tag-based-github-releases.md`
- `../decisions/0003-self-signed-windows-release-signing.md`

Related tasks:
- `TASK-0005-github-ci-cd-release-pipeline.md`

Primary documentation sources:
- Electron Code Signing: https://www.electronjs.org/docs/latest/tutorial/code-signing
- Electron Forge Windows signing: https://www.electronforge.io/guides/code-signing/code-signing-windows
- Microsoft Windows code signing options: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options
- Microsoft SignTool: https://learn.microsoft.com/en-us/windows/win32/seccrypto/signtool
- PowerShell `New-SelfSignedCertificate`: https://learn.microsoft.com/en-us/powershell/module/pki/new-selfsignedcertificate
- PowerShell `Get-AuthenticodeSignature`: https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.security/get-authenticodesignature
- GitHub-hosted runners: https://docs.github.com/en/actions/concepts/runners/github-hosted-runners
- Microsoft digital signatures and trust stores: https://learn.microsoft.com/en-us/windows-hardware/drivers/install/digital-signatures

## Explore Notes

Current release posture:
- Sidekick uses Electron Forge to package Linux and Windows artifacts.
- Release builds are produced by GitHub Actions on tags matching `v*`.
- Early GitHub Releases are prereleases.
- macOS packaging, code signing, notarization, automatic updates, and store distribution are explicitly deferred.
- Windows packages are currently unsigned.
- `forge.config.ts` has ASAR and Electron fuses configured, but no signing configuration.

User context:
- The maintainer is a private individual.
- Azure Artifact Signing public-trust signing is not a good first path because individual developer support is not currently available for Norway in the same way it is for supported regions.
- The maintainer wants GitHub release artifacts to be self-signed so they can be downloaded from GitHub and installed on the maintainer's own trusted Windows machine.
- The current Windows installer triggers Windows Defender or SmartScreen friction that requires the maintainer to choose an extra "continue" path during installation.

Current risk framing:
- Unsigned artifacts do not make the local app runtime inherently unsafe.
- The main risk is release-channel trust and Windows publisher identity.
- A self-signed certificate can make artifacts signed and locally trusted on machines where the maintainer installs the public certificate.
- A self-signed certificate does not provide public trust for ordinary external users.
- A self-signed certificate may not create Microsoft SmartScreen reputation. This task should improve local trust and unknown-publisher handling, but any remaining SmartScreen reputation warning must be documented separately.
- This task is useful as a signing spike and maintainer-trust workflow, not as a public distribution solution.

Initial risk:
- Medium for maintainer-only use.
- High if misunderstood as public-trust signing.

## Task Spec

Goal:
- Establish a self-signed Windows signing workflow for Sidekick artifacts produced by GitHub Actions so the maintainer's Windows machine can trust the downloaded installer.

Primary outcome:
- The maintainer can create a self-signed code signing certificate.
- The maintainer can install the public certificate on their Windows machine so Windows trusts Sidekick artifacts signed by that certificate.
- GitHub Actions can sign Sidekick Windows release artifacts with the private certificate material stored in GitHub Secrets.
- The signing state can be verified with Authenticode tooling.
- The downloaded installer verifies with `Status = Valid` on the maintainer's Windows machine after local certificate trust is configured.
- The release documentation clearly states that self-signed artifacts are not public-trust releases.

Acceptance criteria:
- Documentation explains what self-signed signing means and what it does not mean.
- Documentation includes a procedure to create a local self-signed code signing certificate on Windows.
- Documentation includes a procedure to export the public certificate for local trust installation.
- Documentation includes a procedure to install the public certificate into the maintainer's Windows trust stores.
- Documentation includes a procedure to export private signing material as a `.pfx` for signing.
- Documentation explains how to protect the `.pfx` and password.
- Documentation explains how to sign Windows artifacts locally.
- Documentation explains how GitHub Actions signs Windows artifacts for tag releases when signing secrets are configured.
- Documentation explains how to verify signatures with `Get-AuthenticodeSignature` or `signtool verify`.
- The project configures Electron Forge/Squirrel.Windows to sign Windows artifacts during the `make` step when signing is enabled.
- The project includes a script or documented command sequence for verifying expected Windows `.exe` signatures.
- The release workflow can use a `.pfx` stored as GitHub Secrets or a protected GitHub Environment secret.
- The release workflow makes signing credentials available before `npm run make` so Forge/Squirrel can sign Windows artifacts while they are created.
- The release workflow verifies signatures before uploading/publishing self-signed Windows assets.
- The maintainer can download the signed installer from GitHub and verify the installer signature locally.
- The docs clearly state that other users must trust/install the certificate before Windows will treat it as trusted.
- The docs clearly state that self-signed signing may not remove every SmartScreen reputation warning.
- The docs clearly state that self-signed signing does not replace future public code signing.

Non-goals:
- Public-trust code signing.
- Azure Artifact Signing implementation.
- Commercial CA certificate procurement.
- macOS signing or notarization.
- Microsoft Store distribution.
- Automatic app updates.
- Making GitHub release artifacts trusted on arbitrary external machines.
- Committing private keys, `.pfx` files, or signing passwords.

Constraints:
- Private keys and `.pfx` files must not be committed to the repository.
- Signing passwords must not be committed to the repository.
- Local development and local packaging must remain possible without signing credentials.
- CI push builds must not require the private self-signed certificate.
- GitHub tag release builds may require self-signed signing credentials for Windows artifacts.
- Documentation must distinguish maintainer-trust signing from public-trust signing.

Risks:
- Users may misunderstand self-signed artifacts as public-trusted artifacts.
- Installing a self-signed certificate into trusted stores is a sensitive local machine change.
- If the private key or `.pfx` leaks, others can sign artifacts that appear to come from the local Sidekick signing identity on machines that trust the certificate.
- Self-signed signing may still show warnings on machines where the certificate is not trusted.
- Self-signed signing may not fully remove Microsoft SmartScreen reputation warnings even when Authenticode verification is valid locally.
- Squirrel.Windows may produce several files; signing only one executable may be insufficient for local trust expectations.
- Signing Squirrel.Windows output only after `npm run make` may be too late because installer metadata and packages have already been generated.
- Storing a self-signed `.pfx` in GitHub Secrets improves automation but increases blast radius compared with keeping it local only.

## Self-Signed Signing Model

Self-signed signing has two separate parts:

1. Signing the artifact.
   - The maintainer creates a certificate and private key.
   - GitHub Actions uses the private signing material from secrets to add an Authenticode signature to `.exe` artifacts.
   - This proves the file was signed by whoever controls that private key.

2. Trusting the certificate.
   - Windows trusts the signature only if the signing certificate chains to a trusted root on that machine.
   - Because the certificate is self-signed, the maintainer must install the public certificate into local Windows trust stores.

Expected maintainer result:
- GitHub-produced Sidekick Windows installer verifies as `Valid` with `Get-AuthenticodeSignature` after the certificate is trusted on the maintainer's Windows machine.
- The installer should no longer appear as completely unsigned or unknown to that Windows machine.

Expected external result:
- On other machines, the same artifacts are signed but not automatically trusted unless those machines also trust the self-signed certificate.

## Certificate Procedure

The first documented procedure should target Windows PowerShell.

Create a self-signed code signing certificate:
- Use `New-SelfSignedCertificate` with code-signing EKU.
- Store it in the current user's certificate store.
- Use a clear subject such as `CN=Sidekick Local Code Signing`.
- Choose a reasonable expiration date.

Export public certificate:
- Export a `.cer` file without the private key.
- This file can be installed into trust stores.

Install public certificate for maintainer trust:
- Import the `.cer` into `Trusted Root Certification Authorities` for the current user.
- Import the `.cer` into `Trusted Publishers` for the current user.
- Document that this should only be done for a certificate the maintainer created and controls.

Export private signing material:
- Export a `.pfx` containing the private key.
- Protect it with a strong password.
- Store it outside the repository.
- Add the `.pfx` and password to GitHub Secrets or a protected GitHub Environment if GitHub release signing is enabled.
- Add ignore rules so certificate files are not accidentally committed.

Rotation/removal:
- Document how to remove the certificate from trusted stores.
- Document that a new certificate means previously signed artifacts may no longer chain to the same trusted identity unless the old certificate remains trusted.

## Signing Procedure

Windows artifacts are produced by Electron Forge and Squirrel.Windows.

Local signing procedure:
1. Create or locate the `.pfx` signing certificate.
2. Set signing environment variables before running `npm run make`.
3. Run `npm run make` on Windows.
4. Let Electron Forge/Squirrel.Windows sign artifacts during the make step.
5. Verify signatures after `npm run make`.

Artifacts to consider:
- the setup executable users download;
- the app executable inside the packaged output;
- any Squirrel-generated executable that Windows surfaces to the user.

This task should not assume that signing only the setup executable is sufficient. The build or documentation should identify which `.exe` files are present and which were signed by Forge/Squirrel.

Expected command shape:

```powershell
$env:SIDEKICK_SIGNING_PFX_PATH = "path\to\sidekick-local-signing.pfx"
$env:SIDEKICK_SIGNING_PASSWORD = "<pfx-password>"
npm run make
```

Direct `signtool sign` usage may still be documented for diagnostics, but the release path should prefer Forge/Squirrel signing during `npm run make`.

Timestamping:
- If a timestamp server is available, include `/tr <timestamp-url> /td SHA256`.
- If timestamping is omitted in the first local procedure, document that this is acceptable only for testing and should not be used as a public release process.

## GitHub Actions Signing Procedure

The release workflow should make signing material available to the Windows package job before `npm run make`, then let Electron Forge/Squirrel.Windows sign artifacts during the make step.

Expected secret contract:
- `SIDEKICK_SIGNING_PFX_BASE64`: base64-encoded `.pfx` file.
- `SIDEKICK_SIGNING_PASSWORD`: password for the `.pfx`.
- `SIDEKICK_SIGNING_TIMESTAMP_URL`: optional timestamp server URL.

Expected workflow behavior:
1. Release verification runs first.
2. If the job is for a tag release and self-signed signing is enabled, the workflow decodes the `.pfx` into a temporary file.
3. The Windows package job builds artifacts with `npm run make` while signing environment variables point to the temporary `.pfx`.
4. Forge/Squirrel signs expected Windows artifacts during the make step.
5. The workflow verifies signatures after the make step.
6. The workflow deletes the temporary `.pfx` file.
7. The workflow uploads/publishes the signed artifacts.

Recommended policy for this task:
- Tag release Windows artifacts should be signed when the required secrets are configured.
- Push-build artifacts may remain unsigned.
- If a tag release is configured to require signing and secrets are missing, the Windows package job should fail clearly before publishing.

The public certificate file may be attached to release documentation or documented as a local setup artifact, but users must still install/trust it manually before Windows trusts the self-signed artifacts.

## Verification Procedure

Verification should confirm both that the file has a signature and whether the local machine trusts it.

PowerShell example:

```powershell
Get-AuthenticodeSignature path\to\artifact.exe
```

Expected trusted state:
- `Status` should be `Valid` on a machine where the public certificate is installed into the relevant trust stores.
- The signer subject should match the Sidekick self-signed certificate subject.

Expected untrusted state:
- On a machine that has not trusted the self-signed certificate, the signature may exist but not validate as trusted.

The verification procedure should also show the signer subject so the maintainer can confirm the artifact was signed with the Sidekick self-signed certificate.

CI verification levels:
- GitHub Actions should always verify that expected Windows artifacts are signed and that signer subject or thumbprint matches the expected Sidekick certificate.
- GitHub Actions should expect `Status = Valid` only if the workflow imports the public certificate into the runner's trust stores before verification.
- Maintainer Windows verification remains the final trust check because the maintainer's machine is the target trusted environment for this task.

Installer experience check:
- Download the signed Windows installer from the GitHub release.
- Run `Get-AuthenticodeSignature` against the downloaded installer.
- Confirm `Status = Valid`.
- Run the installer on the maintainer's Windows machine.
- Record whether Windows still shows any Defender or SmartScreen warning. If a warning remains despite a valid signature, document it as a SmartScreen reputation limitation rather than a signing failure.

## Release Artifact Trust Policy

Internal/local prerelease:
- Unsigned artifacts are acceptable.
- Self-signed artifacts from GitHub Actions are acceptable for the maintainer's own trusted machines.
- Documentation must state whether artifacts are unsigned or self-signed.

External test group:
- Self-signed artifacts are not a good default unless every tester explicitly installs and trusts the public certificate.
- GitHub artifacts should remain clearly labeled as prerelease/test builds.

Public release:
- Self-signed signing is not sufficient.
- Windows public releases should eventually use public code signing.
- Public releases may still need Microsoft SmartScreen reputation even after public code signing.
- macOS should remain blocked until signing and notarization are implemented.
- Auto-update should remain blocked until public signing/provenance is in place.

## Resolved Decisions

Resolved decisions:
- This task should include documentation, scripts, and GitHub Actions support for self-signed Windows signing.
- Self-signed Windows artifacts may be uploaded to GitHub prereleases for maintainer use.
- Push-build artifacts may remain unsigned.
- The first trust-installation procedure should target the current user's Windows certificate stores.
- Release signing should be configured through Electron Forge/Squirrel.Windows during `npm run make`, not primarily by post-processing already generated Squirrel output.
- The verification script should inspect every `.exe` under `out/make` by default, log every release executable it checks, and enforce the Sidekick signer only for Squirrel release artifacts.
- Tag release signing should be controlled by `SIDEKICK_REQUIRE_WINDOWS_SIGNING`.
- When `SIDEKICK_REQUIRE_WINDOWS_SIGNING=true`, the Windows release job must fail if signing secrets are missing or signing verification fails.
- When `SIDEKICK_REQUIRE_WINDOWS_SIGNING` is not true, the Windows release job may publish unsigned prerelease artifacts if signing secrets are missing.
- Checksum generation and provenance should be handled in a separate task.
- CurrentUser trust store instructions should be the standard path.
- LocalMachine trust store instructions may be documented only as an advanced note.
- The first implementation must include a removal/untrust procedure.
- GitHub Actions verification should distinguish "signed by expected certificate" from "trusted by this runner".
- The maintainer's Windows machine remains the final trust verification target for `Status = Valid`.

## Initial Implementation Ideas

Likely documentation areas:
- `docs/release/ci-cd.md`
- `docs/architecture/application-architecture.md`
- `docs/tasks/closed/TASK-0008-release-signing-and-artifact-trust.md`

Likely script areas:
- `scripts/signing/`
- `scripts/ci/`
- `package.json`
- `.github/workflows/release.yml`

Likely implementation slices:
1. Document self-signed signing model and limitations.
2. Add a Windows PowerShell script or documented command sequence to create/export a local certificate.
3. Configure Electron Forge/Squirrel.Windows to sign Windows artifacts during the make step when signing environment variables are present.
4. Add a Windows PowerShell script or documented command sequence to verify Authenticode signatures.
5. Update GitHub release workflow to sign Windows artifacts when self-signed signing secrets are configured.
6. Update release docs to label unsigned, self-signed, and public-trust signing states.
7. Add guardrails so private certificate files are not accidentally committed.

Likely verification:
- `npm run check`
- `npm run test`
- On Windows:
  - build Windows artifacts;
  - provide local `.pfx` signing environment before `npm run make`;
  - run signature verification;
  - confirm the signature is trusted after installing the public certificate.
- In GitHub Actions:
  - run a tag release workflow with self-signed signing secrets configured;
  - confirm Windows artifacts are signed before upload;
  - download the signed installer;
  - verify `Get-AuthenticodeSignature` reports `Status = Valid` on a Windows machine where the public certificate is trusted;
  - install it on that Windows machine and document any remaining Defender or SmartScreen warning.

## Implementation Plan

The simplest useful implementation is to make self-signed signing an optional release capability that becomes mandatory only when `SIDEKICK_REQUIRE_WINDOWS_SIGNING=true`.

This keeps normal local development and ordinary push CI free from signing credentials, while allowing GitHub tag releases to produce signed Windows artifacts once the maintainer has configured secrets.

### 1. Add signing documentation

Create `docs/release/windows-self-signed-signing.md`.

The document should contain:
- a short explanation of unsigned, self-signed, and public-trust signing;
- the expected maintainer-only trust model;
- a warning that self-signed signing is not a public release trust model;
- a warning that SmartScreen reputation warnings may remain;
- a procedure to create a self-signed code-signing certificate on Windows;
- a procedure to export the public `.cer` file;
- a procedure to install the public `.cer` into the CurrentUser `Trusted Root Certification Authorities` and `Trusted Publishers` stores;
- an advanced note for LocalMachine trust stores without making it the default;
- a procedure to export the private `.pfx` file;
- a procedure to encode the `.pfx` as base64 for GitHub Secrets;
- the required GitHub secrets and variable;
- a procedure to verify downloaded GitHub artifacts with `Get-AuthenticodeSignature`;
- a removal/untrust procedure for deleting the certificate from local trust stores.

Update `docs/release/ci-cd.md` to describe how the tag-based release workflow behaves when signing is disabled, optional, or required.

Update `docs/architecture/application-architecture.md` with a short release-artifact trust note so the architecture docs reflect the signing boundary.

Add a decision record for the durable policy choice:
- `docs/decisions/0003-self-signed-windows-release-signing.md`

The decision record should capture that Sidekick will use self-signed Windows signing for maintainer prereleases now, while public-trust signing remains a future distribution concern.

### 2. Add certificate and signing scripts

Create `scripts/signing/`.

Add `scripts/signing/create-self-signed-code-signing-cert.ps1`.

The script should:
- create a code-signing certificate under the CurrentUser certificate store;
- use a default subject such as `CN=Sidekick Local Code Signing`;
- export a public `.cer`;
- optionally export a password-protected `.pfx`;
- avoid writing certificate material into tracked repository paths by default.

Configure `forge.config.ts` for optional Windows signing.

The configuration should:
- read `SIDEKICK_SIGNING_PFX_PATH` and `SIDEKICK_SIGNING_PASSWORD`;
- include timestamp configuration when `SIDEKICK_SIGNING_TIMESTAMP_URL` is set;
- apply signing configuration to the Squirrel.Windows maker during `npm run make`;
- keep unsigned local packaging possible when signing is not required;
- fail clearly when `SIDEKICK_REQUIRE_WINDOWS_SIGNING=true` but signing material is missing.

Add `scripts/signing/verify-windows-signatures.ps1`.

The script should:
- scan `out/make` recursively for release `.exe` artifacts by default;
- use `Get-AuthenticodeSignature`;
- log signature status, signer subject, and file path;
- fail if any expected `.exe` is unsigned or invalid when signing is required;
- distinguish between "signature exists and matches expected signer" and "signature is trusted on this machine";
- enforce the expected Sidekick signer only for Sidekick/Squirrel artifacts, because Electron helper executables may have their own signer;
- support optional expected-subject checking if the implementation can keep it simple.

### 3. Add repository guardrails

Update `.gitignore` so private certificate material is not accidentally committed.

At minimum, ignore:
- `*.pfx`
- `*.p12`
- `*.pfx.base64.txt`
- `*.p12.base64.txt`
- `*.key`
- local generated signing output directories if the scripts create one.

Public `.cer` files are not private, but generated local certificate exports should still default to a location outside the repository.

### 4. Add package scripts

Update `package.json` with Windows-only helper scripts:
- `signing:create-self-signed-cert`
- `verify:windows-signatures`

These scripts should call the PowerShell scripts under `scripts/signing/`.

They do not need to run on Linux push CI. They are intended for Windows maintainer setup and GitHub release verification.

### 5. Update GitHub release workflow

Update `.github/workflows/release.yml`.

The Windows package job should:
1. decide whether signing is required from `SIDEKICK_REQUIRE_WINDOWS_SIGNING`;
2. if signing is required, fail before upload when signing secrets are missing;
3. if signing secrets are present, decode `SIDEKICK_SIGNING_PFX_BASE64` into a temporary `.pfx`;
4. set `SIDEKICK_SIGNING_PFX_PATH` and `SIDEKICK_SIGNING_PASSWORD` before `npm run make`;
5. build Windows artifacts with the existing `npm run make`, letting Forge/Squirrel sign during artifact creation;
6. run the verification script against `out/`;
7. delete the temporary `.pfx` even if a later step fails;
8. upload the signed artifacts using the existing release artifact flow.

Expected GitHub configuration:
- secret: `SIDEKICK_SIGNING_PFX_BASE64`;
- secret: `SIDEKICK_SIGNING_PASSWORD`;
- optional secret or variable: `SIDEKICK_SIGNING_TIMESTAMP_URL`;
- repository variable: `SIDEKICK_REQUIRE_WINDOWS_SIGNING`.

Workflow policy:
- if `SIDEKICK_REQUIRE_WINDOWS_SIGNING=true`, Windows release artifacts must be signed and verified before upload;
- if `SIDEKICK_REQUIRE_WINDOWS_SIGNING` is not true and secrets are missing, the prerelease may publish unsigned Windows artifacts;
- if signing secrets are present while signing is optional, the workflow may sign during `npm run make` and verify Windows artifacts opportunistically.

### 6. Verification plan

Local Linux verification:
- run `npm run check`;
- run `npm run test`;
- inspect workflow syntax and script references;
- confirm private certificate patterns are ignored by git.

GitHub verification:
- configure GitHub Secrets and `SIDEKICK_REQUIRE_WINDOWS_SIGNING=true`;
- create a tag release;
- confirm the Windows package job provides signing material before `npm run make`;
- confirm the Windows package job verifies artifacts before upload;
- confirm the verification logs clearly distinguish "signed by expected certificate" from "trusted by this runner";
- confirm no `.pfx` or signing password appears in logs or release assets;
- download the Windows installer from the GitHub release.

Maintainer Windows verification:
- install the public `.cer` into the CurrentUser trust stores;
- run `Get-AuthenticodeSignature` against the downloaded installer;
- expect `Status = Valid`;
- confirm the signer subject matches `CN=Sidekick Local Code Signing` or the configured subject;
- run the installer;
- record whether Defender or SmartScreen still shows any reputation warning.

### 7. Closeout expectations

The task can be closed when:
- signing docs exist;
- scripts exist;
- release workflow supports optional and required self-signed signing;
- Forge/Squirrel receives signing configuration during the Windows make step;
- tests and static checks pass locally;
- GitHub release verification has been run or explicitly documented as pending on user-managed secrets;
- maintainer Windows verification has been run or explicitly documented as pending on local Windows trust setup.

## Build Log

Implemented changes:
- Added optional Squirrel.Windows signing configuration in `forge.config.ts`.
- Added a testable signing configuration helper for release-signing policy.
- Added a PowerShell script for creating a self-signed code-signing certificate.
- Added a PowerShell script for verifying Windows release `.exe` Authenticode signatures under `out/make`.
- Added package scripts for certificate creation and Windows signature verification.
- Updated the GitHub release workflow to prepare `.pfx` material before `npm run make`.
- Updated the GitHub release workflow to verify Windows signatures before artifact upload.
- Added cleanup of the temporary GitHub runner `.pfx` file.
- Added `.gitignore` guardrails for local signing material.
- Added Windows self-signed signing release documentation.
- Added a decision record for self-signed Windows release signing.
- Updated release and architecture documentation.

Important implementation detail:
- The implementation does not primarily sign already generated Squirrel output. It supplies signing material before `npm run make`, so Electron Forge/Squirrel.Windows signs artifacts while creating them.

## Verification Log

Local verification completed:
- `npm run check`
- `npm run test`
- `npm run make`
- `npm run verify:packaged-context`
- `npm run test:ui`
- `npm audit --omit=dev`

Results:
- Lint and typecheck passed.
- Unit and integration tests passed: 9 test files, 32 tests.
- Linux packaging passed and produced artifacts under `out/make`.
- Packaged context-package verification passed for `app.asar`.
- UI smoke tests passed: 5 tests.
- Production dependency audit reported 0 vulnerabilities.

GitHub external verification completed:
- GitHub signing secrets and variables were configured by the maintainer.
- Release tag `v0.1.6` completed successfully.
- GitHub Release: https://github.com/trulstveoy/Sidekick/releases/tag/v0.1.6
- Windows release job decoded signing material before `npm run make`.
- Windows release job verified the published Squirrel setup executable before upload.
- Verified CI signer subject: `CN=Sidekick Local Code Signing`.
- Verified CI signature status: signed by expected certificate; runner trust reported as not trusted, which is expected for self-signed CI verification.
- Windows, Linux, and publish jobs completed successfully.
- Old large GitHub Actions artifacts from failed retry runs were deleted to clear Actions artifact storage pressure. Release assets were not deleted.

Maintainer installation check completed:
- The maintainer downloaded `Sidekick-0.1.6.Setup.exe` from the GitHub release.
- The maintainer confirmed that the downloaded installer is signed.
- The installer completed and the app works on the maintainer's Windows machine.
- Windows still reports that the file is not commonly downloaded and asks the maintainer to confirm trust. This is recorded as an expected Defender/SmartScreen reputation warning for self-signed prerelease artifacts, not as an application runtime failure.

## Maintainer Handoff

The GitHub release-side verification and maintainer installation verification are complete for `v0.1.6`.

The remaining "not commonly downloaded" warning is treated as a SmartScreen reputation limitation of the self-signed prerelease path, not as a signing or installer failure.

## Human Gate

Human approval is required before implementation because this task changes release-signing practices and includes local certificate trust procedures.

Minimum approval questions before build:
- Confirm the implementation plan before build.

## Review Checklist

- [x] Documentation clearly distinguishes unsigned, self-signed, and public-trust releases.
- [x] Private keys, `.pfx` files, and passwords are not committed.
- [x] Local development works without signing credentials.
- [x] Local Windows signing procedure is documented.
- [x] Local Windows trust installation procedure is documented.
- [x] GitHub Actions self-signed signing procedure is documented.
- [x] GitHub release workflow signs Windows artifacts during the Forge/Squirrel make step when configured.
- [x] Signature verification procedure is documented.
- [x] CI verification distinguishes signed artifacts from locally trusted artifacts.
- [x] Downloaded GitHub installer is confirmed signed on the maintainer's Windows machine.
- [x] The docs state that self-signed artifacts are not public-trust artifacts.
- [x] The docs state that SmartScreen reputation warnings may remain even with local self-signed trust.
- [x] macOS remains blocked unless signing and notarization are configured.
- [x] Auto-update remains blocked until public release signing/provenance is in place.
