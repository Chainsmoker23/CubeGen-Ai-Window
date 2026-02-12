@echo off
echo ==========================================
echo      CubeGen Windows App Launcher
echo ==========================================

if not exist node_modules (
    echo [INFO] First run detected. Installing dependencies...
    echo [INFO] This might take a few minutes. Please wait.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        echo [TIP] Try running this script as Administrator.
        pause
        exit /b %errorlevel%
    )
)

echo [INFO] Starting Development Server...
call npm run dev
if %errorlevel% neq 0 (
    echo [ERROR] App crashed or failed to start.
    echo [TIP] Check the error message above.
    pause
    exit /b %errorlevel%
)

pause
