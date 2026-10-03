@echo off
setlocal EnableExtensions
title HS Education - Windows Launcher

echo ================================================
echo   HS Education - Local Launcher (Windows)
echo ================================================
echo.

set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend\js"
set "FRONTEND_DIR=%ROOT%frontend"
set "PUBLIC_DIR=%BACKEND_DIR%\public"
set "PORT=3000"

rem ---- 1. Check for Node.js -------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js was not found on this machine.
    echo Please install the LTS version from https://nodejs.org and run this file again.
    pause
    exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm was not found on this machine ^(it ships with Node.js^).
    echo Please reinstall Node.js from https://nodejs.org and run this file again.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set "NODE_VERSION=%%v"
echo Using Node.js %NODE_VERSION%
echo.

rem ---- 2. Install backend dependencies ---------------------------------
echo [1/5] Installing backend dependencies...
pushd "%BACKEND_DIR%" || goto :fail
if not exist node_modules (
    call npm install
    if errorlevel 1 goto :fail
) else (
    echo     Already installed - skipping.
)
popd
echo.

rem ---- 3. Install frontend dependencies --------------------------------
echo [2/5] Installing frontend dependencies...
pushd "%FRONTEND_DIR%" || goto :fail
if not exist node_modules (
    call npm install --legacy-peer-deps
    if errorlevel 1 goto :fail
) else (
    echo     Already installed - skipping.
)
echo.

rem ---- 4. Build the frontend for production -----------------------------
echo [3/5] Building the frontend...
call npm run build
if errorlevel 1 goto :fail
popd
echo.

rem ---- 5. Publish the build into the backend's public folder -----------
echo [4/5] Publishing build to backend...
if not exist "%PUBLIC_DIR%" mkdir "%PUBLIC_DIR%"
robocopy "%FRONTEND_DIR%\build" "%PUBLIC_DIR%" /MIR /NFL /NDL /NJH /NJS >nul
echo.

rem ---- 6. Start the unified server (serves API + website on one port) --
echo [5/5] Starting HS Education server on http://localhost:%PORT% ...
echo.
start "HS Education Server" cmd /k "cd /d "%BACKEND_DIR%" && set PORT=%PORT%&& node server.js"

timeout /t 3 /nobreak >nul
start "" "http://localhost:%PORT%"

echo.
echo The app is running in a separate window titled "HS Education Server".
echo   Website : http://localhost:%PORT%
echo   API     : http://localhost:%PORT%/api/programs
echo   Health  : http://localhost:%PORT%/healthz
echo.
echo Closing THIS window will NOT stop the server.
echo To stop the app, close the "HS Education Server" window.
echo.
pause
exit /b 0

:fail
echo.
echo [ERROR] Setup failed - see the messages above for details.
popd 2>nul
pause
exit /b 1
