# PowerShell script to stop all EASM Platform services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STOPPING ALL EASM PLATFORM SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to kill process on port
function Stop-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)
    
    Write-Host "[Stopping] $ServiceName (Port $Port)..." -ForegroundColor Yellow
    
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                 Select-Object -ExpandProperty OwningProcess -Unique
    
    if ($processes) {
        foreach ($pid in $processes) {
            try {
                $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "  Killing process $pid ($($proc.ProcessName))..." -ForegroundColor Gray
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            } catch {
                Write-Host "  Could not kill process $pid" -ForegroundColor Red
            }
        }
        Write-Host "[OK] $ServiceName stopped" -ForegroundColor Green
    } else {
        Write-Host "[INFO] $ServiceName not running on port $Port" -ForegroundColor Gray
    }
    Write-Host ""
}

# Stop Frontend (Port 5173)
Stop-ProcessOnPort -Port 5173 -ServiceName "Frontend (Vite)"

# Stop Backend (Port 8000)
Stop-ProcessOnPort -Port 8000 -ServiceName "Backend (Django)"

# Stop Celery Worker processes
Write-Host "[Stopping] Celery Worker..." -ForegroundColor Yellow
$celeryWorkers = Get-Process | Where-Object { 
    $_.ProcessName -eq "python" -or $_.ProcessName -eq "celery" 
} | Where-Object {
    $_.CommandLine -like "*celery*worker*" -or 
    $_.MainWindowTitle -like "*Celery Worker*"
}
if ($celeryWorkers) {
    foreach ($proc in $celeryWorkers) {
        Write-Host "  Killing Celery Worker process $($proc.Id)..." -ForegroundColor Gray
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[OK] Celery Worker stopped" -ForegroundColor Green
} else {
    Write-Host "[INFO] Celery Worker not running" -ForegroundColor Gray
}
Write-Host ""

# Stop Celery Beat processes
Write-Host "[Stopping] Celery Beat..." -ForegroundColor Yellow
$celeryBeat = Get-Process | Where-Object { 
    $_.ProcessName -eq "python" -or $_.ProcessName -eq "celery" 
} | Where-Object {
    $_.CommandLine -like "*celery*beat*" -or 
    $_.MainWindowTitle -like "*Celery Beat*"
}
if ($celeryBeat) {
    foreach ($proc in $celeryBeat) {
        Write-Host "  Killing Celery Beat process $($proc.Id)..." -ForegroundColor Gray
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "[OK] Celery Beat stopped" -ForegroundColor Green
} else {
    Write-Host "[INFO] Celery Beat not running" -ForegroundColor Gray
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ALL SERVICES STOPPED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Stopped Services:" -ForegroundColor White
Write-Host "  - Frontend (Port 5173)" -ForegroundColor Gray
Write-Host "  - Backend Django (Port 8000)" -ForegroundColor Gray
Write-Host "  - Celery Worker" -ForegroundColor Gray
Write-Host "  - Celery Beat" -ForegroundColor Gray
Write-Host ""
Write-Host "Note: Docker services (PostgreSQL, Redis) are still running." -ForegroundColor Yellow
Write-Host "To stop Docker services, run: cd docker; docker-compose down" -ForegroundColor Yellow
Write-Host ""

