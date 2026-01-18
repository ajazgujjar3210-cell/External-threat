@echo off
echo ========================================
echo   QUICK GIT PUSH TO GITHUB
echo ========================================
echo.

cd /d %~dp0

echo Adding all changes...
git add .

echo.
echo Current status:
git status --short

echo.
set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update project files

echo.
echo Committing changes...
git commit -m "%COMMIT_MSG%"

echo.
echo Pushing to GitHub...
git push

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Pushed to GitHub!
    echo ========================================
) else (
    echo.
    echo ERROR: Push failed!
    echo Make sure you have:
    echo 1. Set up remote: git remote add origin YOUR_REPO_URL
    echo 2. Authenticated with GitHub
    echo.
)

pause

