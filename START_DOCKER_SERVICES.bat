@echo off
echo ========================================
echo Starting EASM Docker Services
echo ========================================
echo.

cd /d %~dp0docker

echo Starting PostgreSQL and Redis...
docker-compose up -d

echo.
echo Waiting for services to start...
timeout /t 5 /nobreak >nul

echo.
echo Checking service status...
docker-compose ps

echo.
echo ========================================
echo Services Status:
echo ========================================
echo.
echo PostgreSQL: Should be running on port 5432
echo Redis: Should be running on port 6379
echo.
echo To view logs: docker-compose logs -f
echo To stop services: docker-compose down
echo.
pause


