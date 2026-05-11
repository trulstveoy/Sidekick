param(
  [string]$Subject = "CN=Sidekick Local Code Signing",
  [string]$OutputDirectory = (Join-Path $HOME "SidekickSigning"),
  [int]$YearsValid = 3,
  [switch]$SkipPfxExport
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$certificate = New-SelfSignedCertificate `
  -Subject $Subject `
  -Type CodeSigningCert `
  -CertStoreLocation "Cert:\CurrentUser\My" `
  -KeyExportPolicy Exportable `
  -KeyUsage DigitalSignature `
  -NotAfter (Get-Date).AddYears($YearsValid)

$safeName = ($Subject -replace "^CN=", "" -replace "[^A-Za-z0-9._-]", "-").ToLowerInvariant()
$cerPath = Join-Path $OutputDirectory "$safeName.cer"

Export-Certificate -Cert $certificate -FilePath $cerPath -Force | Out-Null

Write-Host "Created certificate:"
Write-Host "  Subject:    $($certificate.Subject)"
Write-Host "  Thumbprint: $($certificate.Thumbprint)"
Write-Host "  Store:      Cert:\CurrentUser\My\$($certificate.Thumbprint)"
Write-Host "  Public CER: $cerPath"

if (-not $SkipPfxExport) {
  $pfxPath = Join-Path $OutputDirectory "$safeName.pfx"
  $pfxPassword = Read-Host "Enter a strong password for the exported PFX" -AsSecureString

  Export-PfxCertificate `
    -Cert $certificate `
    -FilePath $pfxPath `
    -Password $pfxPassword `
    -Force | Out-Null

  Write-Host "  Private PFX: $pfxPath"
  Write-Host ""
  Write-Host "Keep the PFX and password private. Do not commit them to git."
}

