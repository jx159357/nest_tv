# 环境配置指南

## 概述
本文档详细说明了 NestTV 项目的环境配置，包括开发环境、生产环境的搭建和配置。

## 开发环境要求

### 系统要求
- **操作系统**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **Node.js**: >= 18.0.0 (推荐使用 LTS 版本)
- **npm**: >= 8.0.0
- **MySQL**: >= 8.0.0
- **Redis**: >= 6.0.0

### 开发工具推荐
- **IDE**: VS Code
- **数据库管理**: MySQL Workbench, DBeaver
- **Redis管理**: Redis Desktop Manager, AnotherRedisDesktopManager
- **API测试**: Postman, Insomnia
- **版本控制**: Git

---

## 1. 开发环境搭建

### 1.1 安装 Node.js 和 npm
#### Windows
```bash
# 下载并安装 Node.js LTS 版本
# 访问 https://nodejs.org/download/

# 验证安装
node --version
npm --version
```

#### macOS
```bash
# 使用 Homebrew 安装
brew install node

# 验证安装
node --version
npm --version
```

#### Ubuntu/Debian
```bash
# 添加 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 安装 Node.js
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 1.2 安装 MySQL
#### Windows
```bash
# 下载 MySQL Installer
# 访问 https://dev.mysql.com/downloads/installer/

# 安装过程中设置 root 密码
# 推荐字符集：utf8mb4

# 验证安装
mysql --version
mysql -u root -p
```

#### macOS
```bash
# 使用 Homebrew 安装
brew install mysql

# 启动 MySQL 服务
brew services start mysql

# 安全配置
mysql_secure_installation

# 验证安装
mysql --version
```

#### Ubuntu/Debian
```bash
# 更新包列表
sudo apt update

# 安装 MySQL
sudo apt install mysql-server

# 安全配置
sudo mysql_secure_installation

# 验证安装
sudo systemctl status mysql
mysql --version
```

### 1.3 安装 Redis
#### Windows
```bash
# 下载 Redis for Windows
# 访问 https://github.com/microsoftarchive/redis/releases

# 解压并运行 redis-server.exe

# 验证安装
redis-cli ping
# 应返回: PONG
```

#### macOS
```bash
# 使用 Homebrew 安装
brew install redis

# 启动 Redis 服务
brew services start redis

# 验证安装
redis-cli ping
# 应返回: PONG
```

#### Ubuntu/Debian
```bash
# 安装 Redis
sudo apt install redis-server

# 启动 Redis 服务
sudo systemctl start redis

# 设置开机自启
sudo systemctl enable redis

# 验证安装
redis-cli ping
# 应返回: PONG
```

---

## 2. 项目初始化

### 2.1 克隆项目
```bash
# 克隆项目到本地
git clone https://github.com/jx159357/nest_tv.git

# 进入项目目录
cd nest_tv

# 查看项目结构
ls -la
```

### 2.2 后端项目初始化
```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 全局安装 NestJS CLI (可选)
npm install -g @nestjs/cli
```

### 2.3 前端项目初始化
```bash
# 进入前端目录
cd frontend/tv-frontend

# 安装依赖
npm install
```

---

## 3. 环境变量配置

### 3.1 后端环境变量
创建 `backend/.env` 文件：

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑环境变量文件
nano backend/.env  # 或使用 VS Code 打开
```

#### 环境变量配置示例
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=nest_tv

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT 配置
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=1h

# 应用配置
APP_PORT=3000
APP_NAME=NestTV
APP_ENV=development

# 日志配置
LOG_LEVEL=debug
LOG_FORMAT=combined

# 文件上传配置
UPLOAD_MAX_SIZE=10MB
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,gif,mp4,avi,mkv

# 邮件配置（可选）
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

### 3.2 前端环境变量
创建 `frontend/tv-frontend/.env` 文件：

```env
# API 配置
VITE_API_BASE_URL=http://localhost:3000
VITE_API_VERSION=v1

# 应用配置
VITE_APP_TITLE=NestTV
VITE_APP_DESCRIPTION=影视管理系统

# 功能开关
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK=false

# 第三方服务配置
VITE_ANALYTICS_ID=your_analytics_id
```

---

## 4. 数据库初始化

### 4.1 创建数据库
```bash
# 连接到 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE IF NOT EXISTS nest_tv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建专用用户（推荐）
CREATE USER 'nesttv_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON nest_tv.* TO 'nesttv_user'@'localhost';
FLUSH PRIVILEGES;

# 退出 MySQL
EXIT;
```

### 4.2 验证数据库连接
```bash
# 进入后端目录
cd backend

# 运行数据库连接测试
npm run test:connection

# 或者启动项目自动创建表
npm run start:dev
```

### 4.3 数据库表结构
项目启动后，TypeORM 会自动创建以下表：

- `users` - 用户信息表
- `media_resources` - 影视资源表
- `play_sources` - 播放源表
- `watch_history` - 观看历史表
- `user_favorites_media_resources` - 用户收藏关联表
- `users_configured_play_sources` - 用户播放源配置表

---

## 5. 启动项目

### 5.1 启动后端服务
```bash
# 进入后端目录
cd backend

# 开发模式启动（热重载）
npm run start:dev

# 或者生产模式启动
npm run start:prod
```

#### 后端服务信息
- 服务地址: `http://localhost:3000`
- API 文档: `http://localhost:3000/api` (Swagger 计划中)
- 健康检查: `http://localhost:3000/health`

### 5.2 启动前端服务
```bash
# 进入前端目录
cd frontend/tv-frontend

# 开发模式启动
npm run dev

# 或者构建后启动
npm run build
npm run preview
```

#### 前端服务信息
- 开发地址: `http://localhost:5173`
- 构建输出: `dist/` 目录

### 5.3 验证服务启动
```bash
# 测试后端 API
curl http://localhost:3000

# 测试前端页面
curl http://localhost:5173

# 或者使用浏览器访问对应地址
```

---

## 6. 生产环境部署

### 6.1 服务器要求
- **CPU**: 2核心+
- **内存**: 4GB+
- **存储**: 50GB+ SSD
- **网络**: 10Mbps+
- **操作系统**: Ubuntu 20.04+ LTS

### 6.2 使用 Docker 部署
#### 创建 Docker Compose 文件
```yaml
# docker-compose.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: nesttv-mysql
    environment:
      MYSQL_ROOT_PASSWORD: your_root_password
      MYSQL_DATABASE: nest_tv
      MYSQL_USER: nesttv_user
      MYSQL_PASSWORD: your_user_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    container_name: nesttv-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: nesttv-backend
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USERNAME: nesttv_user
      DB_PASSWORD: your_user_password
      DB_DATABASE: nest_tv
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: your_production_jwt_secret
    ports:
      - "3000:3000"
    depends_on:
      - mysql
      - redis
    restart: unless-stopped

  frontend:
    build: ./frontend/tv-frontend
    container_name: nesttv-frontend
    environment:
      VITE_API_BASE_URL: https://your-domain.com
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
```

#### 启动服务
```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 6.3 使用 PM2 部署
#### 安装 PM2
```bash
# 全局安装 PM2
npm install -g pm2

# 安装 PM2 日志轮转
pm2 install pm2-logrotate
```

#### 创建 PM2 配置文件
```json
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'nesttv-backend',
      script: 'dist/main.js',
      cwd: './backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        DB_HOST: 'localhost',
        DB_PORT: 3306,
        DB_USERNAME: 'nesttv_user',
        DB_PASSWORD: 'your_password',
        DB_DATABASE: 'nest_tv',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
        JWT_SECRET: 'your_production_jwt_secret',
        PORT: 3000
      }
    },
    {
      name: 'nesttv-frontend',
      script: 'npm',
      args: 'run preview',
      cwd: './frontend/tv-frontend/dist',
      instances: 1,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
```

#### 启动应用
```bash
# 构建后端
cd backend
npm run build

# 构建前端
cd ../frontend/tv-frontend
npm run build

# 回到项目根目录
cd ../..

# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

---

## 7. 常见问题解决

### 7.1 端口冲突
```bash
# 查看端口占用
netstat -ano | findstr :3000  # Windows
lsof -i :3000  # macOS/Linux

# 杀死占用进程
taskkill /PID <pid> /F  # Windows
kill -9 <pid>  # macOS/Linux
```

### 7.2 数据库连接失败
```bash
# 检查 MySQL 服务状态
sudo systemctl status mysql  # Ubuntu/Debian
brew services list | grep mysql  # macOS

# 检查连接配置
mysql -u root -p -h localhost -e "SHOW DATABASES;"

# 检查防火墙设置
sudo ufw status  # Ubuntu/Debian
```

### 7.3 Redis 连接失败
```bash
# 检查 Redis 服务状态
sudo systemctl status redis  # Ubuntu/Debian
brew services list | grep redis  # macOS

# 测试 Redis 连接
redis-cli ping

# 检查配置文件
sudo cat /etc/redis/redis.conf
```

### 7.4 依赖安装失败
```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install
```

### 7.5 TypeScript 编译错误
```bash
# 检查 TypeScript 配置
npx tsc --noEmit

# 检查语法错误
npm run lint

# 格式化代码
npm run format
```

---

## 8. 开发工具配置

### 8.1 VS Code 配置
创建 `.vscode/settings.json`：
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.preferTypeOnlyAutoImports": true,
  "files.associations": {
    "*.env": "ini"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
```

### 8.2 推荐 VS Code 扩展
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **TypeScript Vue Plugin (Volar)**: Vue 3 支持
- **UnoCSS**: UnoCSS 支持
- **PostCSS**: CSS 处理
- **Tailwind CSS IntelliSense**: 样式提示
- **GitLens**: Git 增强
- **Docker**: Docker 支持

### 8.3 Git 配置
```bash
# 配置用户信息
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 配置默认分支名
git config --global init.defaultBranch main

# 配置凭证存储
git config --global credential.helper store

# 配换行符
git config --global core.autocrlf true  # Windows
git config --global core.autocrlf input  # macOS/Linux
```

---

## 9. 性能优化

### 9.1 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_media_resources_type ON media_resources(type);
CREATE INDEX idx_watch_history_user_id ON watch_history(userId);
CREATE INDEX idx_play_sources_media_id ON play_sources(mediaResourceId);

-- 优化查询性能
SET GLOBAL innodb_buffer_pool_size = 1G;
SET GLOBAL query_cache_size = 64M;
```

### 9.2 Redis 优化
```conf
# redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 9.3 Node.js 优化
```bash
# 增加内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 启用集群模式
pm2 scale nesttv-backend max
```

---

## 10. 监控和日志

### 10.1 应用监控
```bash
# PM2 监控
pm2 monit

# 查看应用状态
pm2 status

# 查看日志
pm2 logs nesttv-backend

# 重启应用
pm2 restart nesttv-backend
```

### 10.2 系统监控
```bash
# 系统资源使用
htop  # 或 top
df -h  # 磁盘使用
free -h  # 内存使用

# 网络连接
netstat -tuln

# 进程监控
ps aux | grep node
```

### 10.3 日志管理
```bash
# 日志轮转配置
pm2 install pm2-logrotate

# 查看错误日志
pm2 logs nesttv-backend --err

# 清理日志
pm2 flush
```

---

*文档最后更新时间：2024年8月28日*