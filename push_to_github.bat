@echo off
echo.
echo ===========================================
echo WakeLock Alarm - GitHub Push Helper
echo ===========================================
echo.

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed!
    echo Please download and install Git from: https://git-scm.com/download/win
    echo.
    pause
    exit /b
)

echo [1/4] Initializing Git...
git init

echo [2/4] Adding files...
git add .

echo [3/4] Committing changes...
git commit -m "Play Store Ready Version v2.0 - Multiple Alarms & Advanced Tasks"

echo [4/4] Adding remote and pushing...
git remote add origin https://github.com/krishnakudale1005-hash/alarm.git
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Push failed. 
    echo This usually happens if the remote already exists or you are not logged in.
    echo Trying to push without adding remote again...
    git push -u origin main
)

echo.
echo ===========================================
echo Done! Your code should now be on GitHub.
echo ===========================================
pause
