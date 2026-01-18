# Subfinder Installation Script for Windows
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SUBFINDER INSTALLATION SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$toolsDir = $PSScriptRoot
$subfinderExe = Join-Path $toolsDir "subfinder.exe"

# Check if already installed
if (Test-Path $subfinderExe) {
    Write-Host "Subfinder already exists at: $subfinderExe" -ForegroundColor Green
    Write-Host "Testing..." -ForegroundColor Yellow
    & $subfinderExe -version
    exit 0
}

Write-Host "Step 1: Downloading Subfinder..." -ForegroundColor Yellow
$url = "https://github.com/projectdiscovery/subfinder/releases/latest/download/subfinder_windows_amd64.zip"
$zipFile = Join-Path $toolsDir "subfinder.zip"

try {
    Invoke-WebRequest -Uri $url -OutFile $zipFile -UseBasicParsing
    Write-Host "✓ Download complete!" -ForegroundColor Green
} catch {
    Write-Host "✗ Download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download manually:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://github.com/projectdiscovery/subfinder/releases" -ForegroundColor White
    Write-Host "2. Download: subfinder_windows_amd64.zip" -ForegroundColor White
    Write-Host "3. Extract to: $toolsDir" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Step 2: Extracting..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $zipFile -DestinationPath $toolsDir -Force
    Remove-Item $zipFile -Force
    Write-Host "✓ Extraction complete!" -ForegroundColor Green
} catch {
    Write-Host "✗ Extraction failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Verifying installation..." -ForegroundColor Yellow
if (Test-Path $subfinderExe) {
    Write-Host "✓ Subfinder installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Location: $subfinderExe" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Testing version..." -ForegroundColor Yellow
    & $subfinderExe -version
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  INSTALLATION COMPLETE!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Subfinder is ready to use!" -ForegroundColor Green
    Write-Host "It will be automatically used in Asset Discovery scans." -ForegroundColor Cyan
} else {
    Write-Host "✗ Installation verification failed!" -ForegroundColor Red
    exit 1
}


