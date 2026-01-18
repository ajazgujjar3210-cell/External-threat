# Naabu Installation Script for Windows
# Downloads and installs Naabu port scanner

Write-Host "`n=== Naabu Installation Script ===" -ForegroundColor Cyan
Write-Host ""

$toolsDir = $PSScriptRoot
$naabuPath = Join-Path $toolsDir "naabu.exe"

# Check if already installed
if (Test-Path $naabuPath) {
    Write-Host "Naabu is already installed!" -ForegroundColor Green
    Write-Host "Location: $naabuPath" -ForegroundColor White
    Write-Host ""
    Write-Host "Verifying installation..." -ForegroundColor Yellow
    & $naabuPath -version
    exit 0
}

Write-Host "Naabu not found. Starting download..." -ForegroundColor Yellow
Write-Host ""

# Get latest release URL
$latestReleaseUrl = "https://api.github.com/repos/projectdiscovery/naabu/releases/latest"

try {
    Write-Host "Fetching latest release information..." -ForegroundColor Yellow
    $releaseInfo = Invoke-RestMethod -Uri $latestReleaseUrl -Method Get
    
    # Find Windows 64-bit release
    $windowsAsset = $releaseInfo.assets | Where-Object { $_.name -like "*windows*amd64*" -or $_.name -like "*windows_amd64*" }
    
    if (-not $windowsAsset) {
        Write-Host "Error: Windows release not found!" -ForegroundColor Red
        Write-Host "Please download manually from: https://github.com/projectdiscovery/naabu/releases/latest" -ForegroundColor Yellow
        exit 1
    }
    
    $downloadUrl = $windowsAsset.browser_download_url
    $zipFileName = $windowsAsset.name
    $zipPath = Join-Path $toolsDir $zipFileName
    
    Write-Host "Latest version: $($releaseInfo.tag_name)" -ForegroundColor Green
    Write-Host "Download URL: $downloadUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "Downloading Naabu..." -ForegroundColor Yellow
    
    # Download the file
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
    
    Write-Host "Download complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Extracting..." -ForegroundColor Yellow
    
    # Extract ZIP file
    Expand-Archive -Path $zipPath -DestinationPath $toolsDir -Force
    
    # Find naabu.exe in extracted files
    $extractedFiles = Get-ChildItem -Path $toolsDir -Recurse -Filter "naabu.exe" -ErrorAction SilentlyContinue
    
    if ($extractedFiles) {
        $extractedPath = $extractedFiles[0].FullName
        
        # Move to tools directory if in subdirectory
        if ($extractedPath -ne $naabuPath) {
            Move-Item -Path $extractedPath -Destination $naabuPath -Force
        }
        
        # Clean up extracted directories
        $extractedDir = Split-Path -Parent $extractedFiles[0].FullName
        if ($extractedDir -ne $toolsDir) {
            Remove-Item -Path $extractedDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Clean up ZIP file
    Remove-Item -Path $zipPath -Force -ErrorAction SilentlyContinue
    
    Write-Host "Extraction complete!" -ForegroundColor Green
    Write-Host ""
    
    # Verify installation
    if (Test-Path $naabuPath) {
        Write-Host "Naabu installed successfully!" -ForegroundColor Green
        Write-Host "Location: $naabuPath" -ForegroundColor White
        Write-Host ""
        Write-Host "Verifying installation..." -ForegroundColor Yellow
        & $naabuPath -version
        Write-Host ""
        Write-Host "Installation complete! Naabu is ready to use." -ForegroundColor Green
    } else {
        Write-Host "Error: naabu.exe not found after extraction!" -ForegroundColor Red
        Write-Host "Please check the tools directory manually." -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "Error during installation: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual Installation:" -ForegroundColor Yellow
    Write-Host "1. Visit: https://github.com/projectdiscovery/naabu/releases/latest" -ForegroundColor White
    Write-Host "2. Download: naabu_windows_amd64.zip" -ForegroundColor White
    Write-Host "3. Extract and copy naabu.exe to: $toolsDir" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

