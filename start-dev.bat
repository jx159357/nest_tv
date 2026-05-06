@echo off
chcp 65001 >nul
echo ========================================
echo   Nest TV 开发环境一键启动
echo ========================================
echo.

echo [1/4] 检查 Node.js 环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未安装 Node.js，请先安装 Node.js 20+
    pause
    exit /b 1
)
echo Node.js 版本:
node --version

echo.
echo [2/4] 安装后端依赖...
cd /d "%~dp0backend"
if not exist node_modules (
    call npm install
) else (
    echo 后端依赖已存在，跳过
)

echo.
echo [3/4] 安装前端依赖...
cd /d "%~dp0frontend"
if not exist node_modules (
    call npm install
) else (
    echo 前端依赖已存在，跳过
)

echo.
echo [4/4] 启动服务...
echo.
echo 后端启动中... (端口 3334)
echo 前端启动中... (端口 5173)
echo.
echo 默认管理员账号: admin / admin123
echo.

cd /d "%~dp0"
start "Nest TV Backend" cmd /c "cd backend && npm run start:dev"
timeout /t 3 /nobreak >nul
start "Nest TV Frontend" cmd /c "cd frontend && npm run dev"

echo ========================================
echo   启动完成！
echo   前端: http://localhost:5173
echo   后端: http://localhost:3334
echo   API 文档: http://localhost:3334/api
echo   管理员: admin / admin123
echo ========================================
echo.
echo 按任意键关闭此窗口（服务继续运行）
pause >nul
