@echo off
chcp 65001 >nul 2>&1
setlocal

:: Setup fnm-managed Node.js (use direct path so child windows inherit it)
set "PATH=%APPDATA%\fnm\node-versions\v24.4.1\installation;%PATH%"

echo ========================================
echo   Nest TV Dev Server Launcher
echo ========================================
echo.

echo [1/3] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: node.exe not found in PATH
    echo Please install Node.js 20+ or run: fnm default 24
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do echo   Node.js %%v

echo.
echo [2/3] Installing dependencies (if needed)...
cd /d "%~dp0backend"
if not exist node_modules (
    call npm install
) else (
    echo   backend/node_modules OK
)
cd /d "%~dp0frontend"
if not exist node_modules (
    call npm install
) else (
    echo   frontend/node_modules OK
)

echo.
echo [3/3] Starting servers...
echo.

:: Start backend in a new window (cmd /s /k handles nested quotes correctly)
start "NestTV-Backend" cmd /s /k "cd /d "%~dp0backend" && npm run start:dev"

:: Wait for backend to compile
timeout /t 5 /nobreak >nul

:: Start frontend in a new window
start "NestTV-Frontend" cmd /s /k "cd /d "%~dp0frontend" && npm run dev"

echo ========================================
echo   Backend:  http://localhost:3334
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:3334/api
echo   Admin:    admin / admin123
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
