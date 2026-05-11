param(
  [string]$ArtifactsRoot = "out",
  [bool]$RequireSigned = (($env:SIDEKICK_REQUIRE_WINDOWS_SIGNING -eq "true") -or ($env:SIDEKICK_SIGNING_ENABLED -eq "true")),
  [bool]$RequireTrusted = ($env:SIDEKICK_REQUIRE_WINDOWS_TRUSTED_SIGNATURE -eq "true"),
  [string]$ExpectedSubject = $env:SIDEKICK_SIGNING_EXPECTED_SUBJECT,
  [string]$ExpectedThumbprint = $env:SIDEKICK_SIGNING_EXPECTED_THUMBPRINT
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ArtifactsRoot)) {
  throw "Artifacts root does not exist: $ArtifactsRoot"
}

$executables = @(Get-ChildItem -Path $ArtifactsRoot -Recurse -File -Filter "*.exe" | Sort-Object FullName)

if ($executables.Count -eq 0) {
  if ($RequireSigned) {
    throw "No .exe files found under $ArtifactsRoot, but signing verification is required."
  }

  Write-Host "No .exe files found under $ArtifactsRoot."
  exit 0
}

function Test-RequiresSidekickSigner {
  param([string]$Path)

  $normalizedPath = $Path -replace "\\", "/"

  return ($normalizedPath -match "/out/make/.+\.exe$") -or ($normalizedPath -match "/sidekick\.exe$")
}

function Get-SignatureInfo {
  param([string]$Path)

  try {
    $authenticodeSignature = Get-AuthenticodeSignature -FilePath $Path

    return [PSCustomObject]@{
      Status = $authenticodeSignature.Status.ToString()
      Signer = $authenticodeSignature.SignerCertificate
      Source = "Get-AuthenticodeSignature"
      Trusted = $authenticodeSignature.Status -eq "Valid"
    }
  } catch {
    try {
      $certificate = [System.Security.Cryptography.X509Certificates.X509Certificate2]::CreateFromSignedFile($Path)

      return [PSCustomObject]@{
        Status = "SignedTrustNotEvaluated"
        Signer = $certificate
        Source = "X509Certificate2.CreateFromSignedFile"
        Trusted = $false
      }
    } catch {
      return [PSCustomObject]@{
        Status = "NotSigned"
        Signer = $null
        Source = "X509Certificate2.CreateFromSignedFile"
        Trusted = $false
      }
    }
  }
}

$failed = $false

foreach ($file in $executables) {
  $signature = Get-SignatureInfo -Path $file.FullName
  $signer = $signature.Signer
  $signed = $null -ne $signer -and $signature.Status -ne "NotSigned"
  $trusted = $signature.Trusted
  $requiresSidekickSigner = Test-RequiresSidekickSigner -Path $file.FullName
  $subject = if ($signer) { $signer.Subject } else { "<none>" }
  $thumbprint = if ($signer) { $signer.Thumbprint } else { "<none>" }

  Write-Host "Signature check:"
  Write-Host "  File:       $($file.FullName)"
  Write-Host "  Status:     $($signature.Status)"
  Write-Host "  Signed:     $signed"
  Write-Host "  Trusted:    $trusted"
  Write-Host "  Sidekick:   $requiresSidekickSigner"
  Write-Host "  Source:     $($signature.Source)"
  Write-Host "  Subject:    $subject"
  Write-Host "  Thumbprint: $thumbprint"

  if ($RequireSigned -and -not $signed) {
    Write-Host "ERROR: Expected a signature, but file is not signed: $($file.FullName)"
    $failed = $true
  }

  if ($signed -and $requiresSidekickSigner -and $ExpectedSubject -and $subject -notlike "*$ExpectedSubject*") {
    Write-Host "ERROR: Signer subject does not match expected subject '$ExpectedSubject': $($file.FullName)"
    $failed = $true
  }

  if ($signed -and $requiresSidekickSigner -and $ExpectedThumbprint -and ($thumbprint -ne $ExpectedThumbprint)) {
    Write-Host "ERROR: Signer thumbprint does not match expected thumbprint '$ExpectedThumbprint': $($file.FullName)"
    $failed = $true
  }

  if ($RequireTrusted -and -not $trusted) {
    Write-Host "ERROR: Expected a locally trusted signature, but status was '$($signature.Status)' from '$($signature.Source)': $($file.FullName)"
    $failed = $true
  }
}

if ($failed) {
  throw "Windows signature verification failed."
}

Write-Host "Windows signature verification completed."
