# Production API smoke test (read-only, hesap olusturmaz)
# Usage: .\scripts\verify-production-api.ps1 [-BaseUrl http://150.230.158.219]

param(
  [string]$BaseUrl = "http://150.230.158.219"
)

$BaseUrl = $BaseUrl.TrimEnd("/")
$fail = 0

function Test-Endpoint($Name, $Url, $ExpectCodes = @(200)) {
  try {
    $code = curl.exe -sS -m 12 -o NUL -w "%{http_code}" $Url
    if ($ExpectCodes -contains [int]$code) {
      Write-Host "[OK] $Name ($code)" -ForegroundColor Green
    } else {
      Write-Host "[FAIL] $Name (HTTP $code, beklenen: $($ExpectCodes -join ','))" -ForegroundColor Red
      $script:fail++
    }
  } catch {
    Write-Host "[FAIL] $Name ($_)" -ForegroundColor Red
    $script:fail++
  }
}

Write-Host "==> Production API: $BaseUrl" -ForegroundColor Cyan

$health = curl.exe -sS -m 12 "$BaseUrl/actuator/health"
Write-Host "Health: $health"
if ($health -notmatch '"status"\s*:\s*"UP"') { $fail++ ; Write-Host "[FAIL] Health UP degil" -ForegroundColor Red }
else { Write-Host "[OK] Health UP" -ForegroundColor Green }

Test-Endpoint "Listings (public)" "$BaseUrl/api/listings" @(200)
Test-Endpoint "Swagger (prod kapali)" "$BaseUrl/swagger-ui.html" @(404, 500, 403)
Test-Endpoint "WebSocket info (auth gerekir)" "$BaseUrl/ws/info" @(401, 403)

Write-Host ""
if ($fail -eq 0) {
  Write-Host "Tum kontroller gecti. APK ile kayit/giris/mesaj testine gecebilirsin." -ForegroundColor Green
  exit 0
} else {
  Write-Host "$fail kontrol basarisiz." -ForegroundColor Red
  exit 1
}
