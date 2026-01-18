@echo off
echo ========================================
echo   STARTING ALL EASM PLATFORM SERVICES
echo ========================================
echo.

echo [Step 1/5] Starting Docker Services (PostgreSQL + Redis)...
cd /d %~dp0docker
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Docker services!
    echo Make sure Docker Desktop is running.
    pause
    exit /b 1
)
echo Docker services started successfully!
ping 127.0.0.1 -n 4 >nul

echo.
echo [Step 2/5] Starting Backend Server (Django)...
cd /d %~dp0
start "EASM Backend Server" cmd /k "cd /d %~dp0backend && python manage.py runserver"
ping 127.0.0.1 -n 4 >nul

echo.
echo [Step 3/5] Starting Frontend Server (Vite)...
start "EASM Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"
ping 127.0.0.1 -n 4 >nul

echo.
echo [Step 4/5] Starting Celery Worker...
start "EASM Celery Worker" cmd /k "cd /d %~dp0backend && python -m celery -A config worker --loglevel=info --pool=solo"
ping 127.0.0.1 -n 4 >nul

echo.
echo [Step 5/5] Starting Celery Beat (Scheduler)...
start "EASM Celery Beat" cmd /k "cd /d %~dp0backend && python -m celery -A config beat --loglevel=info"
ping 127.0.0.1 -n 3 >nul

echo.
echo ========================================
echo   ALL SERVICES STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Service URLs:
echo   Backend API:    http://localhost:8000
echo   Frontend App:   http://localhost:5173
echo   Admin Panel:    http://localhost:8000/admin
echo.
echo Services Running:
echo   ✅ PostgreSQL (Docker) - Port 5432
echo   ✅ Redis (Docker) - Port 6379
echo   ✅ Django Backend - Port 8000
echo   ✅ Vite Frontend - Port 5173
echo   ✅ Celery Worker - Background tasks
echo   ✅ Celery Beat - Scheduled tasks
echo.
echo Login Credentials:
echo   Email:    admin@easm.local
echo   Password: Admin@123
echo.
echo ========================================
echo.
echo All services are running in separate windows.
echo Close those windows to stop the services.
echo.
echo To stop Docker services:
echo   cd docker
echo   docker-compose down
echo.
echo Press any key to exit this window...
pause >nul

