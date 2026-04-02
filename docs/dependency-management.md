# =============================================================================
# Nest TV 项目依赖管理
# =============================================================================

## 📋 目录
- [系统要求](#-系统要求)
- [后端依赖](#-后端依赖)
- [前端依赖](#-前端依赖)
- [数据库依赖](#-数据库依赖)
- [Docker依赖](#-docker依赖)
- [开发工具](#-开发工具)
- [版本兼容性](#-版本兼容性)
- [常见问题](#-常见问题)

## 🔧 系统要求

### 开发环境
- **Node.js**: ≥ 20.0.0 (最新LTS版本)
- **npm**: ≥ 8.0.0 或 **yarn**: ≥ 1.22.0
- **Git**: ≥ 2.30.0
- **Docker**: ≥ 20.10.0 (可选）
- **Docker Compose**: ≥ 2.20.0 (可选）

### 生产环境
- **Node.js**: ≥ 20.0.0
- **Docker**: ≥ 20.10.0
- **Docker Compose**: ≥ 2.20.0
- **操作系统**: Linux (Ubuntu 20.04+), CentOS 7+, macOS 10.15+, Windows Server 2019+

## 🐛 后端依赖

### 核心框架
```bash
# NestJS框架
npm install @nestjs/core@^10.0.0
npm install @nestjs/common@^10.0.0
npm install @nestjs/platform-express@^10.0.0
npm install @nestjs/platform-fastify@^10.0.0

# 配置管理
npm install @nestjs/config@^3.0.0
npm install @nestjs/jwt@^10.0.0
npm install @nestjs/passport@^10.0.0
npm install @nestjs/passport-jwt@^10.0.0
npm install @nestjs/passport-local@^10.0.0

# 数据库
npm install @nestjs/typeorm@^10.0.0
npm install typeorm@^0.3.17
npm install mysql2@^3.6.3

# 缓存
npm install @nestjs/cache-manager@^2.1.0
npm install cache-manager@^5.2.0
npm install cache-manager-redis-store@^3.0.1

# 验证
npm install class-validator@^0.14.0
npm install class-transformer@^0.5.1

# 文件上传
npm install @nestjs/platform-express@^10.0.0
npm install multer@^1.4.5-lts.1

# HTTP工具
npm install axios@^1.6.0
npm install @types/axios@^0.14.0
```

### 开发发依赖
```bash
# 代码质量和格式化
npm install eslint@^8.56.0
npm install @typescript-eslint/eslint-plugin@^6.0.0
npm install eslint-config-prettier@^9.0.0
npm install eslint-plugin-prettier@^5.0.0
npm install prettier@^3.1.0

# 测试框架
npm install @nestjs/testing@^10.0.0
npm install @types/jest@^29.5.0
npm install jest@^29.5.0
npm install ts-jest@^29.1.0
npm install supertest@^6.3.3
npm install @types/supertest@^2.0.16

# 代码分析
npm install husky@^8.0.3
npm install lint-staged@^15.2.0
npm install commitlint@^18.6.0
npm install @commitlint/config-conventional@^18.6.0
```

### 生产依赖
```bash
# 性能监控
npm install @nestjs/terminus@^10.0.0
npm install terminus-prometheus@^2.0.0

# 日志管理
npm install winston@^3.10.0
npm install winston-daily-rotate-file@^5.0.0

# 健康检查
npm install @nestjs/terminus@^10.0.0

# 安全性
npm install helmet@^7.0.0
npm install express-rate-limit@^7.1.0
npm install compression@^1.7.4

# 错误处理
npm install http-errors@^2.0.0
```

## 🌐 前端依赖

### 核心框架
```bash
# Vue3生态系统
npm install vue@^3.3.4
npm install vue-router@^4.2.5
npm install pinia@^2.1.0
npm install vue-tsc@^1.8.22
npm install @vueuse/core@^10.7.0

# 构建工具
npm install vite@^5.0.0
npm install @vitejs/plugin-vue@^4.5.0

# 类型定义
npm install typescript@^5.2.2
npm install @types/node@^20.8.0
```

### UI框架和样式
```bash
# UnoCSS原子化CSS
npm install unocss@^0.58.0
npm install @unocss/preset-uno@^0.58.0
npm install @unocss/preset-attributify@^0.58.0
npm install @unocss/preset-icons@^0.58.0

# UI组件库（可选）
npm install element-plus@^2.4.0
npm install naive-ui@^2.35.0

# 图标库
npm install @iconify/vue@^4.1.0
npm install @iconify/utils@^2.1.0
```

### HTTP客户端
```bash
npm install axios@^1.6.0
npm install axios-mock-adapter@^1.22.0
npm install @types/axios@^0.14.0
```

### 工具库
```bash
# 工具函数
npm install lodash@^4.17.21
npm install @types/lodash@^4.14.200

# 日期处理
npm install dayjs@^1.11.9
npm install @types/dayjs@^1.11.12

# 表单验证
npm install zod@^3.22.0
npm install yup@^1.3.3

# 状态管理工具
npm install @vue/devtools@^6.5.0
```

### 开发发工具
```bash
# 代码检查
npm install eslint@^8.56.0
npm install eslint-plugin-vue@^9.17.0
npm install @typescript-eslint/eslint-plugin@^6.0.0
npm install prettier@^3.1.0
npm install eslint-config-prettier@^9.0.0
npm install eslint-plugin-prettier@^5.0.0

# 测试工具
npm install vitest@^0.34.0
npm install @vitest/ui@^0.34.0
npm install @vue/test-utils@^2.4.0
npm install jsdom@^23.0.0

# 构建优化
npm install vite-plugin-compression@^0.3.0
npm install vite-plugin-imagemin@^0.2.4
npm install vite-plugin-pwa@^0.16.0
```

## 🗄️ 数据库依赖

### MySQL 8.0
```sql
-- 数据库字符集要求
ALTER DATABASE nest_tv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 必要的MySQL配置
SET GLOBAL innodb_buffer_pool_size = 256M;
SET GLOBAL innodb_log_file_size = 256M;
SET GLOBAL innodb_flush_log_at_trx_commit = 1;
SET GLOBAL innodb_flush_method = O_DIRECT;
SET GLOBAL innodb_file_per_table = 1;
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 64M;
SET GLOBAL sort_buffer_size = 2M;
SET GLOBAL read_buffer_size = 1M;
```

### Redis 7.0
```bash
# Redis配置
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1     # 至少1个key在15分钟内改变时保存
save 300 10    # 至少10个key在5分钟内改变时保存
save 60 10000  # 至少10000个key在1分钟内改变时保存
timeout 300
tcp-keepalive 300
tcp-backlog 511
```

### 连接配置
```ini
# MySQL连接池配置（TypeORM）
pool_size: 10
max_pool_size: 20
connection_timeout: 60000
acquire_timeout: 60000
timeout: 60000

# Redis连接配置
host: localhost
port: 6379
password: ""
db: 0
keyPrefix: "nest_tv:"
```

## 🐳 Docker依赖

### 基础镜像版本
```yaml
# 后端基础镜像
FROM node:20-alpine AS builder

# 前端基础镜像  
FROM nginx:alpine AS production

# 数据库镜像
FROM mysql:8.0
FROM redis:7-alpine
```

### 构建依赖
```dockerfile
# 系统依赖（Alpine Linux）
RUN apk add --no-cache \
    python3 \
    make \
    gcc \
    g++ \
    dumb-init \
    curl

# Node.js开发依赖
RUN npm config set registry https://registry.npmjs.org/
RUN npm install -g npm@latest
```

### Docker Compose版本
```yaml
version: '3.8'

services:
  # 支持的Docker Compose特性
  deploy:
    resources:
      limits:
        cpus: '1.0'
        memory: 1G
      reservations:
        cpus: '0.5'
        memory: 512M

  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

## 🛠 开发工具

### VS Code扩展
```json
{
  "recommendations": [
    "Vue.volar",           // Vue3语言支持
    "Vue.vscode-typescript-vue-plugin",  // Vue3 + TypeScript
    "esbenp.prettier-vscode",       // Prettier格式化
    "dbaeumer.vscode-eslint",         // ESLint检查
    "ms-vscode.vscode-typescript-next", // TypeScript支持
    "ms-vscode.vscode-javascript",  // JavaScript支持
    "bradlc.vscode-tailwindcss",    // TailwindCSS/UnoCSS支持
    "ms-vscode.vscode-docker",       // Docker支持
    "humao.rest-client",             // REST API测试
    "eamodio.gitlens",              // Git管理
    "ms-vscode-remote.remote-containers", // Docker容器开发
    "ms-vsliveshare.vsliveshare",    // Live Share协作
    "wakatime.vscode-wakatime",      // 编程时间统计
    "znck.grammarly"                  // 语法检查
  ]
}
```

### 必要的VS Code设置
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue"
  ],
  "typescript.preferences.importModuleSpecifier": "relative",
  "vue.complete.casing.tags": "pascal",
  "vue.complete.casing.props": "camel",
  "volar.completion.autoImportComponent": true,
  "terminal.integrated.fontFamily": "MesloLGS NF",
  "docker.showStartPage": false
}
```

### Git Hooks (Husky配置）
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx,vue}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,yml,yaml,md}": [
      "prettier --write"
    ]
  }
}
```

## 🔀 版本兼容性

### Node.js兼容性
| 包名         | 最低版本 | 推荐版本 | 测试版本 | 说明 |
|--------------|----------|----------|----------|------|
| Node.js      | 20.0.0  | 20.10.0  | 20.10.0 | 使用LTS版本 |
| npm          | 8.0.0   | 10.2.0  | 10.2.0  | npm 8+ |
| yarn         | 1.22.0  | 3.6.0   | 3.6.0   | 可选 |

### 前端兼容性
| 包名          | 最低版本 | 推荐版本 | 测试版本 | 说明 |
|---------------|----------|----------|----------|------|
| Vue           | 3.3.0    | 3.3.4    | 3.3.4    | Composition API |
| Vue Router    | 4.2.0    | 4.2.5    | 4.2.5    | 新版路由 |
| Pinia         | 2.1.0    | 2.1.0    | 2.1.0    | 状态管理 |
| UnoCSS        | 0.58.0    | 0.58.0    | 0.58.0    | 原子化CSS |
| Vite          | 5.0.0    | 5.0.0    | 5.0.0    | 构建工具 |

### 后端兼容性
| 包名                 | 最低版本 | 推荐版本 | 测试版本 | 说明 |
|----------------------|----------|----------|----------|------|
| NestJS              | 10.0.0   | 10.0.0   | 10.0.0   | 主框架 |
| TypeORM             | 0.3.17    | 0.3.17    | 0.3.17    | ORM框架 |
| MySQL2              | 3.6.3     | 3.6.3     | 3.6.3     | MySQL驱动 |
| Redis Driver         | 4.6.7     | 4.6.7     | 4.6.7     | Redis驱动 |

### 数据库兼容性
| 系统          | 最低版本 | 推荐版本 | 测试版本 | 说明 |
|---------------|----------|----------|----------|------|
| MySQL         | 8.0.0     | 8.0.33   | 8.0.33   | 主数据库 |
| Redis         | 7.0.0     | 7.0.12   | 7.0.12   | 缓存存储 |
| Docker        | 20.10.0   | 24.0.0   | 24.0.0   | 容器化 |

### Docker兼容性
| 服务          | 最低版本 | 推荐版本 | 测试版本 | 说明 |
|---------------|----------|----------|----------|------|
| Docker        | 20.10.0   | 24.0.0   | 24.0.0   | 容器运行时 |
| Docker Compose | 2.20.0    | 2.23.0    | 2.23.0    | 容器编排 |
| nginx/alpine   | 1.25.0    | 1.25.0    | 1.25.0    | Web服务器 |

## ❓ 常见问题

### 1. Node.js版本问题
```bash
# 问题：Node.js版本过低
# 解决：升级到Node.js 20+
nvm install 20
nvm use 20

# 问题：npm包安装失败
# 解决：清除npm缓存
npm cache clean --force
npm install

# 问题：全局包与本地包冲突
# 解决：使用npx或项目本地安装
npx eslint --version
```

### 2. 数据库连接问题
```bash
# 问题：MySQL连接失败
# 解决：检查MySQL配置和端口
mysql -u nest_user -pnest_password -h localhost -P 3307

# 问题：TypeORM同步失败
# 解决：检查实体关系和数据库权限
npm run typeorm:sync

# 问题：Redis连接超时
# 解决：检查Redis服务状态
redis-cli ping
```

### 3. Docker问题
```bash
# 问题：Docker容器启动失败
# 解决：检查Dockerfile语法
docker build -t test ./backend

# 问题：端口冲突
# 解决：检查端口占用
netstat -tuln | grep :3334

# 问题：容器网络问题
# 解决：检查Docker网络配置
docker network ls
docker network inspect nest_tv_app-network
```

### 4. 前端构建问题
```bash
# 问题：Vite构建失败
# 解决：检查依赖和TypeScript配置
npm install
npm run build

# 问题：热重载不工作
# 解决：检查Vite配置和浏览器设置
rm -rf node_modules/.vite
npm run dev

# 问题：CSS样式不生效
# 解决：检查UnoCSS配置和导入
# 确保在main.ts中导入虚拟CSS模块
import 'virtual:uno.css'
```

### 5. 安装脚本问题
```bash
# Windows快速安装脚本（install.bat）
@echo off
echo Installing Nest TV project dependencies...

echo Installing Node.js dependencies...
cd backend
call npm install

echo Installing Vue.js dependencies...
cd ../frontend
call npm install

echo Installation complete!
echo.
echo To start the project:
echo   Backend: cd backend && npm run start:dev
echo   Frontend: cd frontend && npm run dev
echo.
echo To run with Docker:
echo   docker-compose up -d

# Linux/macOS快速安装脚本（install.sh）
#!/bin/bash
echo "Installing Nest TV project dependencies..."

echo "Installing Node.js dependencies..."
cd backend
npm install

echo "Installing Vue.js dependencies..."
cd ../frontend
npm install

echo "Installation complete!"
echo ""
echo "To start the project:"
echo "  Backend: cd backend && npm run start:dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "To run with Docker:"
echo "  docker-compose up -d"
```

### 6. 版本升级指南
```bash
# 升级Node.js
nvm install 20
nvm use 20

# 升级npm
npm install -g npm@latest

# 升级项目依赖
cd backend && npm update
cd ../frontend && npm update

# 升级Docker
docker-compose pull
docker-compose up -d --force-recreate
```

### 7. 性能优化配置
```json
{
  "npm": {
    "scripts": {
      "build:analyze": "vite build --mode production && npx vite-bundle-analyzer dist/assets/index-*.js",
      "build:optimized": "vite build --mode production --minify esbuild && node --max-old-space-size=8192 dist/index.js",
      "start:prod": "node --max-old-space-size=8192 dist/main.js",
      "db:migrate": "npm run typeorm:run",
      "db:seed": "node scripts/seed.js",
      "security:audit": "npm audit --audit-level moderate"
    }
  }
}
```

---

## 🎉 依赖管理完成

这份依赖管理文档涵盖了项目的所有依赖关系、版本要求和常见问题解决方案。确保：

1. **遵循版本要求**：使用推荐的版本以获得最佳兼容性
2. **定期更新依赖**：保持依赖包的最新状态，但注意破坏性更新
3. **使用开发工具**：VS Code扩展和配置能显著提升开发效率
4. **监控依赖安全**：使用 `npm audit` 定期检查安全漏洞
5. **备份配置文件**：保存所有重要配置文件的备份

如果遇到文档未覆盖的问题，请：
1. 查看相应包的官方文档
2. 在项目issues中提问
3. 联系技术支持获取帮助

---

**最后更新时间：** 2025年8月30日
**维护人员：** Nest TV 开发团队
