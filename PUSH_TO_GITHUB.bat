@echo off
echo ========================================
echo   PUSH TO GITHUB
echo   Repository: External-threat
echo ========================================
echo.

cd /d %~dp0

echo [Step 1] Checking Git status...
git status --short
echo.

echo [Step 2] Adding all changes...
git add .
echo.

echo [Step 3] Checking for changes to commit...
git diff --cached --quiet
if %errorlevel% equ 0 (
    echo No changes to commit.
    set SKIP_COMMIT=1
) else (
    echo Changes detected.
    set SKIP_COMMIT=0
)
echo.

if "%SKIP_COMMIT%"=="0" (
    set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
    if "!COMMIT_MSG!"=="" set COMMIT_MSG=Update project files
    
    echo.
    echo [Step 4] Committing changes...
    git commit -m "!COMMIT_MSG!"
    echo Commit created.
    echo.
) else (
    echo [Step 4] Skipping commit (no changes).
    echo.
)

echo [Step 5] Setting branch to 'main'...
git branch -M main
echo.

echo [Step 6] Pushing to GitHub...
echo Repository: https://github.com/ajazgujjar3210-cell/External-threat.git
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Pushed to GitHub!
    echo ========================================
    echo.
    echo Repository URL:
    echo https://github.com/ajazgujjar3210-cell/External-threat
    echo.
) else (
    echo.
    echo ========================================
    echo   ERROR: Push failed!
    echo ========================================
    echo.
    echo Possible issues:
    echo 1. Authentication required
    echo    - Use GitHub Personal Access Token
    echo    - Or use GitHub CLI: gh auth login
    echo.
    echo 2. Check your internet connection
    echo.
    echo 3. Try manually:
    echo    git push -u origin main
    echo.
)

pause

