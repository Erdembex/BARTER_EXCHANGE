# Passla DNS doğrulama
# Usage: .\scripts\verify-passla-dns.ps1
param(
  [string]$ExpectedIp = "150.230.158.219"
)

$fail = 0

function Test-Dns($HostName) {
  try {
    $result = Resolve-DnsName -Name $HostName -Type A -ErrorAction Stop | Where-Object { $_.Type -eq 'A' } | Select-Object -First 1
    $ip = $result.IPAddress
    if ($ip -eq $ExpectedIp) {
      Write-Host "[OK] $HostName -> $ip" -ForegroundColor Green
    } else {
      Write-Host "[FAIL] $HostName -> $ip (beklenen: $ExpectedIp)" -ForegroundColor Red
      Write-Host "       Cloudflare DNS duzenle: docs/CLOUDFLARE_SETUP.md" -ForegroundColor Yellow
      $script:fail++
    }
  } catch {
    Write-Host "[FAIL] $HostName cozulemedi ($_)" -ForegroundColor Red
    $script:fail++
  }
}

Write-Host "==> Passla DNS kontrolu (hedef IP: $ExpectedIp)" -ForegroundColor Cyan
Test-Dns "passla.com.tr"
Test-Dns "api.passla.com.tr"

if ($fail -eq 0) {
  Write-Host "`nDNS hazir. SSL icin:" -ForegroundColor Green
  Write-Host "  .\scripts\deploy-passla-website-oracle.ps1"
  exit 0
} else {
  Write-Host "`n$fail kayit hatali. Cloudflare DNS veya Natro nameserver kontrol et (docs/CLOUDFLARE_SETUP.md)." -ForegroundColor Red
  exit 1
}
