@echo off
echo ========================================
echo   GIT SETUP AND GITHUB PUSH
echo ========================================
echo.

cd /d %~dp0

echo [Step 1] Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed!
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)
echo Git is installed.
echo.

echo [Step 2] Initializing Git repository...
if exist .git (
    echo Git repository already exists.
) else (
    git init
    echo Git repository initialized.
)
echo.

echo [Step 3] Checking .gitignore...
if exist .gitignore (
    echo .gitignore file exists.
) else (
    echo WARNING: .gitignore file not found!
)
echo.

echo [Step 4] Adding all files to staging...
git add .
echo Files added to staging.
echo.

echo [Step 5] Checking for changes to commit...
git status --short
echo.

set /p HAS_CHANGES="Do you have changes to commit? (y/n): "
if /i "%HAS_CHANGES%"=="y" (
    set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
    if "!COMMIT_MSG!"=="" set COMMIT_MSG=Initial commit: EASM Platform with all features
    
    echo.
    echo [Step 6] Creating commit...
    git commit -m "!COMMIT_MSG!"
    echo Commit created.
    echo.
) else (
    echo Skipping commit.
    echo.
)

echo [Step 7] Setting up GitHub remote...
echo.
echo Please provide your GitHub repository details:
echo.
set /p GITHUB_USERNAME="GitHub Username: "
set /p GITHUB_REPO="Repository Name: "

if "%GITHUB_USERNAME%"=="" (
    echo ERROR: GitHub username is required!
    pause
    exit /b 1
)

if "%GITHUB_REPO%"=="" (
    echo ERROR: Repository name is required!
    pause
    exit /b 1
)

echo.
echo Checking if remote already exists...
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    echo Remote 'origin' already exists.
    set /p UPDATE_REMOTE="Do you want to update it? (y/n): "
    if /i "!UPDATE_REMOTE!"=="y" (
        git remote remove origin
        git remote add origin https://github.com/%GITHUB_USERNAME%/%GITHUB_REPO%.git
        echo Remote updated.
    ) else (
        echo Keeping existing remote.
    )
) else (
    git remote add origin https://github.com/%GITHUB_USERNAME%/%GITHUB_REPO%.git
    echo Remote added.
)
echo.

echo [Step 8] Setting branch to 'main'...
git branch -M main
echo.

echo [Step 9] Ready to push!
echo.
echo Repository URL: https://github.com/%GITHUB_USERNAME%/%GITHUB_REPO%.git
echo.
set /p PUSH_NOW="Do you want to push now? (y/n): "

if /i "!PUSH_NOW!"=="y" (
    echo.
    echo Pushing to GitHub...
    echo Note: You may be prompted for GitHub credentials.
    echo.
    git push -u origin main
    
    if %errorlevel% equ 0 (
        echo.
        echo ========================================
        echo   SUCCESS! Code pushed to GitHub!
        echo ========================================
        echo.
        echo Repository: https://github.com/%GITHUB_USERNAME%/%GITHUB_REPO%
        echo.
    ) else (
        echo.
        echo ERROR: Push failed!
        echo.
        echo Common issues:
        echo 1. Authentication required - use GitHub CLI or Personal Access Token
        echo 2. Repository doesn't exist - create it on GitHub first
        echo 3. Network issues - check your internet connection
        echo.
        echo To push manually, run:
        echo   git push -u origin main
        echo.
    )
) else (
    echo.
    echo To push manually later, run:
    echo   git push -u origin main
    echo.
)

echo.
echo ========================================
echo   SETUP COMPLETE
echo ========================================
echo.
echo Useful Git commands:
echo   git status          - Check repository status
echo   git log             - View commit history
echo   git remote -v       - View remote repositories
echo   git push            - Push changes to GitHub
echo   git pull            - Pull changes from GitHub
echo.
pause

