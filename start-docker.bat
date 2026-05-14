@echo off
chcp 65001 >nul 2>&1
setlocal

echo ========================================
echo   Nest TV Docker Deploy
echo ========================================
echo.

echo [1/3] Checking Docker...
where docker >nul 2>&1
if errorlevel 1 (
    echo ERROR: docker.exe not found in PATH
    echo Please install Docker Desktop first
    pause
    exit /b 1
)
docker --version

echo.
echo [2/3] Building and starting services...
echo This may take a few minutes on first run...
echo.

docker compose up -d --build

echo.
echo [3/3] Waiting for services...
echo.

:wait_loop
timeout /t 5 /nobreak >nul
docker compose ps 2>nul | findstr "healthy" >nul 2>&1
if errorlevel 1 (
    echo Waiting for services to start...
    goto wait_loop
)

echo ========================================
echo   Deploy complete!
echo   Frontend:   http://localhost
echo   Backend:    http://localhost:3334
echo   API Docs:   http://localhost:3334/api
echo   Admin:      admin / admin123
echo ========================================
echo.
echo Useful commands:
echo   View logs:   docker compose logs -f
echo   Stop:        docker compose down
echo   Restart:     docker compose restart
echo.
pause
