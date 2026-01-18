# PowerShell script to start all EASM Platform services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STARTING ALL EASM PLATFORM SERVICES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = Get-Location
}

# Function to check if port is free
function Test-PortFree {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return (-not $connection)
}

# Check if ports are free
Write-Host "[Checking] Port availability..." -ForegroundColor Yellow
$ports = @{5173 = "Frontend"; 8000 = "Backend"}
foreach ($port in $ports.Keys) {
    if (-not (Test-PortFree -Port $port)) {
        Write-Host "[WARN] Port $port ($($ports[$port])) is already in use!" -ForegroundColor Yellow
        $response = Read-Host "Do you want to stop the process on port $port? (Y/N)"
        if ($response -eq "Y" -or $response -eq "y") {
            $processes = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | 
                         Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($pid in $processes) {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "  Stopped process $pid on port $port" -ForegroundColor Gray
            }
            Start-Sleep -Seconds 2
        }
    }
}
Write-Host ""

# Step 1: Start Frontend (Port 5173)
Write-Host "[Step 1/4] Starting Frontend Server (Vite) on Port 5173..." -ForegroundColor Yellow
$frontendPath = Join-Path $projectRoot "frontend"
if (Test-Path $frontendPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Starting Frontend on Port 5173...' -ForegroundColor Green; npm run dev" -WindowStyle Normal
    Write-Host "[OK] Frontend server starting..." -ForegroundColor Green
    Start-Sleep -Seconds 3
} else {
    Write-Host "[FAIL] Frontend directory not found at: $frontendPath" -ForegroundColor Red
}
Write-Host ""

# Step 2: Start Backend (Django) on Port 8000
Write-Host "[Step 2/4] Starting Backend Server (Django) on Port 8000..." -ForegroundColor Yellow
$backendPath = Join-Path $projectRoot "backend"
if (Test-Path $backendPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Starting Django Backend on Port 8000...' -ForegroundColor Green; python manage.py runserver" -WindowStyle Normal
    Write-Host "[OK] Backend server starting..." -ForegroundColor Green
    Start-Sleep -Seconds 3
} else {
    Write-Host "[FAIL] Backend directory not found at: $backendPath" -ForegroundColor Red
}
Write-Host ""

# Step 3: Start Celery Worker
Write-Host "[Step 3/4] Starting Celery Worker..." -ForegroundColor Yellow
if (Test-Path $backendPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Starting Celery Worker...' -ForegroundColor Green; python -m celery -A config worker --loglevel=info --pool=solo" -WindowStyle Normal
    Write-Host "[OK] Celery Worker starting..." -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "[FAIL] Backend directory not found" -ForegroundColor Red
}
Write-Host ""

# Step 4: Start Celery Beat
Write-Host "[Step 4/4] Starting Celery Beat (Scheduler)..." -ForegroundColor Yellow
if (Test-Path $backendPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Starting Celery Beat...' -ForegroundColor Green; python -m celery -A config beat --loglevel=info" -WindowStyle Normal
    Write-Host "[OK] Celery Beat starting..." -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "[FAIL] Backend directory not found" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ALL SERVICES STARTED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor White
Write-Host "  Frontend:    http://localhost:5173" -ForegroundColor Gray
Write-Host "  Backend API: http://localhost:8000" -ForegroundColor Gray
Write-Host "  Admin Panel: http://localhost:8000/admin" -ForegroundColor Gray
Write-Host ""
Write-Host "Services Running:" -ForegroundColor White
Write-Host "  [OK] Frontend (Vite) - Port 5173" -ForegroundColor Green
Write-Host "  [OK] Backend (Django) - Port 8000" -ForegroundColor Green
Write-Host "  [OK] Celery Worker - Background tasks" -ForegroundColor Green
Write-Host "  [OK] Celery Beat - Scheduled tasks" -ForegroundColor Green
Write-Host ""
Write-Host "Note: All services are running in separate PowerShell windows." -ForegroundColor Yellow
Write-Host "You can close this window, but keep the service windows open." -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop all services, run: .\STOP_ALL_SERVICES.bat" -ForegroundColor Cyan
Write-Host ""

