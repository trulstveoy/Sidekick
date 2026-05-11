# Windows Self-Signed Signing

This document describes Sidekick's first Windows signing workflow.

This is a maintainer-only trust workflow. It is not public-trust code signing.

## Trust Model

Self-signed signing has two parts:

1. Sidekick artifacts are signed with a private key controlled by the maintainer.
2. The maintainer's Windows machine explicitly trusts the public certificate.

After the public certificate is trusted locally, downloaded Sidekick installers signed by the matching private key should verify with:

```powershell
Get-AuthenticodeSignature .\Sidekick-Setup.exe
```

Expected local maintainer result:

```text
Status: Valid
```

Other machines will not automatically trust these artifacts. Each machine must explicitly trust the same public certificate before Windows can validate the self-signed chain.

Self-signed signing may still leave Microsoft Defender or SmartScreen reputation warnings. The acceptance target for this workflow is a valid local Authenticode signature on the maintainer's trusted Windows machine, not public SmartScreen reputation.

## Create A Certificate

Run this on the Windows machine where you want to create and control the certificate:

```powershell
npm run signing:create-self-signed-cert
```

This can be run from Windows PowerShell or from WSL when Windows interop is enabled. The npm script calls `powershell.exe` because the certificate commands use the Windows certificate store.

The script creates:

- a code-signing certificate in `Cert:\CurrentUser\My`;
- a public `.cer` file;
- a password-protected private `.pfx` file unless `-SkipPfxExport` is used.

Default output location:

```text
%USERPROFILE%\SidekickSigning
```

For example:

```text
C:\Users\trutve\SidekickSigning
```

If the Windows username is different, replace `trutve` with that username in the commands below.

The default subject is:

```text
CN=Sidekick Local Code Signing
```

Keep the `.pfx` file and its password private. Do not commit them to git.

## Trust The Public Certificate Locally

Import the public `.cer` into the current user's trusted root and trusted publisher stores:

```powershell
$cerPath = "C:\Users\trutve\SidekickSigning\sidekick-local-code-signing.cer"

Import-Certificate -FilePath $cerPath -CertStoreLocation Cert:\CurrentUser\Root
Import-Certificate -FilePath $cerPath -CertStoreLocation Cert:\CurrentUser\TrustedPublisher
```

Only do this for a certificate that you created and control.

The CurrentUser stores are the default Sidekick workflow. Importing into LocalMachine stores affects all users on the machine and should be treated as an advanced manual choice.

## Export GitHub Secret Material

GitHub Actions needs the private `.pfx` as a base64 string.

```powershell
$pfxPath = "C:\Users\trutve\SidekickSigning\sidekick-local-code-signing.pfx"
$outPath = "C:\Users\trutve\SidekickSigning\sidekick-local-code-signing.pfx.base64.txt"

[Convert]::ToBase64String([IO.File]::ReadAllBytes($pfxPath)) | Set-Content -NoNewline $outPath
```

Add these GitHub repository secrets:

- `SIDEKICK_SIGNING_PFX_BASE64`: contents of `sidekick-local-code-signing.pfx.base64.txt`
- `SIDEKICK_SIGNING_PASSWORD`: password used when exporting the `.pfx`

The `.pfx`, password, and base64 text file are private signing material. Keep them outside git.

Optional GitHub secret or variable:

- `SIDEKICK_SIGNING_TIMESTAMP_URL`: timestamp server URL

Recommended GitHub repository variables:

- `SIDEKICK_REQUIRE_WINDOWS_SIGNING`: `true`
- `SIDEKICK_SIGNING_EXPECTED_SUBJECT`: `CN=Sidekick Local Code Signing`

Optional GitHub repository variable:

- `SIDEKICK_SIGNING_EXPECTED_THUMBPRINT`: certificate thumbprint

When `SIDEKICK_REQUIRE_WINDOWS_SIGNING=true`, the Windows release job fails if signing secrets are missing or signature verification fails.

## Local Signed Build

To make a signed Windows package locally, set signing environment variables before running `npm run make`:

```powershell
$env:SIDEKICK_REQUIRE_WINDOWS_SIGNING = "true"
$env:SIDEKICK_SIGNING_PFX_PATH = "C:\Users\trutve\SidekickSigning\sidekick-local-code-signing.pfx"
$env:SIDEKICK_SIGNING_PASSWORD = "<pfx-password>"
$env:SIDEKICK_SIGNING_EXPECTED_SUBJECT = "CN=Sidekick Local Code Signing"

npm run make
npm run verify:windows-signatures
```

Sidekick passes the signing certificate to Electron Forge's Squirrel.Windows maker during `npm run make`. Do not rely on post-processing already generated Squirrel output as the primary release signing path.

If you use timestamping:

```powershell
$env:SIDEKICK_SIGNING_TIMESTAMP_URL = "http://timestamp.digicert.com"
```

Use a timestamp server only when appropriate for the certificate and release policy.

## GitHub Release Signing

The release workflow runs on tags matching `v*`.

For the Windows package job:

1. GitHub Actions decodes `SIDEKICK_SIGNING_PFX_BASE64` into a temporary `.pfx`.
2. The workflow sets `SIDEKICK_SIGNING_PFX_PATH` and `SIDEKICK_SIGNING_PASSWORD`.
3. `npm run make` runs with those variables set.
4. Electron Forge/Squirrel.Windows signs Windows artifacts while creating them.
5. `npm run verify:windows-signatures` checks every `.exe` under `out/make`.
6. The temporary `.pfx` is deleted before artifacts are uploaded.

If signing secrets are absent and `SIDEKICK_REQUIRE_WINDOWS_SIGNING` is not true, the workflow may still publish unsigned prerelease Windows artifacts.

## Verification

On GitHub-hosted runners, signature verification has two levels:

- signed by expected certificate;
- trusted by this machine.

GitHub-hosted runners are fresh virtual machines. They do not automatically trust the Sidekick self-signed certificate. CI should always verify that artifacts are signed by the expected certificate. CI should expect `Status = Valid` only if the workflow also imports the public certificate into the runner's trust stores.

The verification script scans every `.exe` under `out/make` by default. These are the release artifacts that GitHub uploads. It logs all executable signatures and enforces the expected Sidekick signer on Squirrel release executables.

The final trust check is on the maintainer's Windows machine:

```powershell
Get-AuthenticodeSignature .\Sidekick-Setup.exe | Format-List Status,StatusMessage,SignerCertificate,Path
```

Expected result after local trust setup:

```text
Status : Valid
```

If the status is not `Valid`, check:

- the `.cer` was imported into `Cert:\CurrentUser\Root`;
- the `.cer` was imported into `Cert:\CurrentUser\TrustedPublisher`;
- the signer subject or thumbprint matches the certificate you trust;
- the installer was downloaded from the expected GitHub release.

## Remove Local Trust

To remove trust for the Sidekick certificate, use the certificate thumbprint printed by the creation script or visible in certificate manager.

```powershell
$thumbprint = "<certificate-thumbprint>"

Remove-Item -Path "Cert:\CurrentUser\Root\$thumbprint" -ErrorAction SilentlyContinue
Remove-Item -Path "Cert:\CurrentUser\TrustedPublisher\$thumbprint" -ErrorAction SilentlyContinue
```

If you also want to remove the private certificate from the CurrentUser personal store:

```powershell
Remove-Item -Path "Cert:\CurrentUser\My\$thumbprint" -ErrorAction SilentlyContinue
```

Removing trust means previously downloaded self-signed Sidekick artifacts may no longer verify as trusted on that machine.

## Rotation

Create a new certificate when the old certificate expires or if the `.pfx` may have leaked.

A new certificate has a different thumbprint. Machines that trust only the old certificate will not automatically trust artifacts signed with the new one.
