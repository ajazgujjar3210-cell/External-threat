@echo off
echo ========================================
echo   EASM PLATFORM - QUICK SETUP
echo   After Cloning from GitHub
echo ========================================
echo.

cd /d %~dp0

echo [Step 1/4] Starting Docker Services...
call START_DOCKER_SERVICES.bat
if %errorlevel% neq 0 (
    echo WARNING: Docker services may not have started properly.
    echo Please check Docker Desktop is running.
)
echo.
timeout /t 3 /nobreak >nul

echo [Step 2/4] Setting up Backend...
cd backend
call setup.bat
cd ..
echo.

echo [Step 3/4] Setting up Frontend...
cd frontend
call setup.bat
cd ..
echo.

echo [Step 4/4] Creating Superuser (if needed)...
cd backend
set /p CREATE_SUPERUSER="Do you want to create a superuser now? (y/n): "
if /i "%CREATE_SUPERUSER%"=="y" (
    python manage.py createsuperuser
)
cd ..
echo.

echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo To start all services, run:
echo   START_ALL_SERVICES.bat
echo.
echo Or start manually:
echo   Backend:  cd backend ^&^& python manage.py runserver
echo   Frontend: cd frontend ^&^& npm run dev
echo   Celery Worker: cd backend ^&^& celery -A config worker --loglevel=info --pool=solo
echo   Celery Beat: cd backend ^&^& celery -A config beat --loglevel=info
echo.
pause

