@echo off
chcp 65001 >nul
echo ========================================
echo   Nest TV Docker 一键部署
echo ========================================
echo.

echo [1/3] 检查 Docker 环境...
docker --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未安装 Docker，请先安装 Docker Desktop
    pause
    exit /b 1
)
docker --version

docker compose version >nul 2>&1
if errorlevel 1 (
    docker-compose --version >nul 2>&1
    if errorlevel 1 (
        echo 错误: 未安装 Docker Compose
        pause
        exit /b 1
    )
)

echo.
echo [2/3] 构建并启动服务...
echo 这可能需要几分钟时间，请耐心等待...
echo.

docker compose up -d --build

echo.
echo [3/3] 等待服务就绪...
echo.

:wait_loop
timeout /t 5 /nobreak >nul
docker compose ps | findstr "healthy" >nul 2>&1
if errorlevel 1 (
    echo 等待服务启动中...
    goto wait_loop
)

echo ========================================
echo   部署完成！
echo   前端: http://localhost
echo   后端: http://localhost:3334
echo   API 文档: http://localhost:3334/api
echo   管理员: admin / admin123
echo ========================================
echo.
echo 常用命令:
echo   查看日志: docker compose logs -f
echo   停止服务: docker compose down
echo   重启服务: docker compose restart
echo.
pause
