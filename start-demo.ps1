# Start IZO Coach for LAN demo (show to management via your PC's IP)
$Root = $PSScriptRoot

# Find local IPv4 (skip loopback and link-local)
$ip = (
    Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notmatch '^(127|169\.)' -and $_.PrefixOrigin -ne 'WellKnown' } |
    Select-Object -First 1
).IPAddress

if (-not $ip) {
    $ip = "ВАШ-IP"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  IZO Coach — демо для руководства" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Откройте с телефона/ноутбука в той же Wi-Fi сети:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  http://${ip}:5173" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend:  http://127.0.0.1:8000 (только локально)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Если не открывается — разрешите порты 5173 и 8000" -ForegroundColor DarkGray
Write-Host "  в Брандмауэре Windows (см. README)." -ForegroundColor DarkGray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start backend in new window
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$Root\backend'; .\.venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000"
)

Start-Sleep -Seconds 2

# Start frontend (blocks this window)
Set-Location "$Root\frontend"
npm run dev
