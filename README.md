# 🎬 NestTV 影视管理系统

一个基于 NestJS + Vue3 的现代化影视资源管理系统，支持用户管理、影视资源爬取、多源播放、观看历史等功能。

## 🚀 功能特性

### 🔐 用户系统
- ✅ 用户注册和登录
- ✅ JWT 身份认证
- ✅ 密码加密存储
- ✅ 用户信息管理

### 📺 影视资源管理
- ✅ 影视信息爬取（基础功能完成）
- ✅ 资源存储和分类（完成）
- ✅ 支持多种影视类型（电影、电视剧、综艺、动漫、纪录片）
- ✅ 评分和收藏功能（完成）

### 🎥 播放源管理
- ✅ 多播放源聚合（已完成）
- ✅ 播放源验证和优先级管理（已完成）
- ✅ 支持在线播放、下载、流媒体等多种播放方式（已完成）

### 📊 观看历史
- ✅ 观看进度记录（已完成）
- ✅ 播放历史管理（已完成）
- ✅ 继续观看功能（已完成）
- ✅ 观看统计功能（已完成）
- ✅ 个性化推荐（已完成）

### 🌐 前端界面
- ✅ 现代化 Vue3 + Vite 响应式界面（已完成）
- ✅ UnoCSS 原子化 CSS 框架（已完成）
- ✅ 首页、搜索、分类浏览（已完成）
- ✅ 详情页和播放器（已完成）
- ✅ 播放源管理界面（已完成）
- ✅ 爬虫管理界面（已完成）

## 🏗️ 技术架构

### 后端技术栈
- **框架**: NestJS 10.x + TypeScript
- **数据库**: MySQL 8.0 + TypeORM
- **缓存**: Redis 6.x
- **认证**: JWT + Passport.js
- **加密**: bcrypt
- **文档**: Swagger/OpenAPI

### 前端技术栈
- **框架**: Vue 3.x + TypeScript
- **构建工具**: Vite 5.x
- **样式**: UnoCSS + Sass
- **状态管理**: Pinia (计划中)
- **路由**: Vue Router (计划中)
- **HTTP客户端**: Axios (计划中)

## 📁 项目结构

```
nest_tv/
├── backend/                    # 后端 NestJS 项目
│   ├── src/
│   │   ├── entities/          # 数据库实体
│   │   │   ├── user.entity.ts
│   │   │   ├── media-resource.entity.ts
│   │   │   ├── play-source.entity.ts
│   │   │   └── watch-history.entity.ts
│   │   ├── auth/              # 认证模块
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── users/             # 用户模块
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   └── user.module.ts
│   │   ├── redis/             # Redis 缓存模块
│   │   │   └── redis.module.ts
│   │   ├── crawler/          # 爬虫模块
│   │   │   ├── crawler.service.ts
│   │   │   ├── crawler.controller.ts
│   │   │   ├── crawler.module.ts
│   │   │   └── dtos/
│   │   │       └── crawl-request.dto.ts
│   │   ├── recommendations/  # 个性化推荐模块
│   │   │   ├── recommendation.service.ts
│   │   │   ├── recommendation.controller.ts
│   │   │   ├── recommendation.module.ts
│   │   │   └── dtos/
│   │   ├── app.module.ts     # 主应用模块
│   │   └── main.ts           # 应用入口
│   ├── docs/                  # 数据库设计文档
│   ├── tsconfig.json          # TypeScript 配置
│   ├── nest-cli.json         # NestJS CLI 配置
│   ├── package.json          # 后端依赖配置
│   └── .env                  # 环境变量配置
├── frontend/                   # 前端 Vue3 项目
│       ├── src/
│       │   ├── components/      # Vue 组件
│       │   ├── views/           # 页面视图
│       │   │   ├── HomeView.vue          # 首页
│       │   │   ├── LoginView.vue         # 登录页
│       │   │   ├── RegisterView.vue      # 注册页
│       │   │   ├── MediaDetailView.vue   # 影视详情页
│       │   │   ├── WatchView.vue         # 播放页
│       │   │   ├── ProfileView.vue       # 个人中心页
│       │   │   ├── CrawlerView.vue       # 爬虫管理页
│       │   │   ├── PlaySourcesView.vue   # 播放源管理页
│       │   │   ├── WatchHistoryView.vue  # 观看历史页
│       │   │   └── RecommendationsView.vue # 个性化推荐页
│       │   ├── stores/          # Pinia 状态管理
│       │   ├── router/          # Vue Router 路由
│       │   ├── utils/           # 工具函数
│       │   ├── App.vue          # 根组件
│       │   └── main.ts          # 应用入口
│       ├── public/              # 静态资源
│       ├── uno.config.ts        # UnoCSS 配置
│       ├── vite.config.ts       # Vite 配置
│       ├── tsconfig.json        # TypeScript 配置
│       └── package.json         # 前端依赖配置
├── docs/                       # 项目文档
│   ├── database-schema.md   # 数据库设计文档
│   └── api-guide.md         # API 接口文档（计划中）
├── database-init.sql           # 数据库初始化脚本
└── README.md                   # 项目说明文档
```

## 🛠️ 开发环境要求

### 系统要求
- Node.js >= 18.0.0
- MySQL >= 8.0.0
- Redis >= 6.0.0
- npm >= 8.0.0

### 开发工具（推荐）
- VS Code
- Git
- MySQL Workbench 或 DBeaver
- Redis Desktop Manager

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/jx159357/nest_tv.git
cd nest_tv
```

### 2. 环境配置
复制并配置环境变量文件：
```bash
# 后端配置
cp backend/.env.example backend/.env

# 编辑环境变量
# 主要配置项：
# DB_HOST=localhost
# DB_PORT=3306
# DB_USERNAME=root
# DB_PASSWORD=your_password
# DB_DATABASE=nest_tv
# REDIS_HOST=localhost
# REDIS_PORT=6379
# JWT_SECRET=your-super-secret-jwt-key
```

### 3. 数据库初始化
确保 MySQL 和 Redis 服务已启动，然后：
```bash
# 创建数据库（如果不存在）
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS nest_tv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 启动后端项目（会自动创建表结构）
cd backend
npm install
npm run start:dev
```

### 4. 启动前端项目
```bash
cd frontend
npm install
npm run dev
```

### 5. 访问应用
- 后端 API: http://localhost:3000
- 前端界面: http://localhost:5173
- API 文档: http://localhost:3000/api (计划中）

## 📋 API 接口概览

### 用户认证接口
```bash
# 用户注册
POST /users/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "phone": "13800138000",
  "nickname": "测试用户"
}

# 用户登录
POST /users/login
Content-Type: application/json

{
  "identifier": "testuser", # 用户名或邮箱
  "password": "password123"
}

# 获取用户信息（需要JWT）
POST /users/profile
Authorization: Bearer <JWT_TOKEN>
```

### 影视资源接口（开发中）
```bash
# 获取影视资源列表
GET /media-resources

# 获取影视资源详情
GET /media-resources/:id

# 搜索影视资源
GET /media-resources/search?keyword=关键词

# 获取分类资源
GET /media-resources/category/:category
```

### 爬虫资源接口 ✅
```bash
# 获取可用的爬虫目标列表
GET /crawler/targets
Authorization: Bearer <JWT_TOKEN>

# 爬取单个资源
POST /crawler/crawl
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
{
  "targetName": "电影天堂",
  "url": "https://example.com/movie/123"
}

# 批量爬取资源
POST /crawler/batch-crawl
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
{
  "targetName": "电影天堂",
  "urls": ["https://example.com/movie/123", "https://example.com/movie/456"]
}

# 爬取并保存资源
POST /crawler/crawl-and-save
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
{
  "url": "https://example.com/movie/123",
  "targetName": "电影天堂"
}

# 获取爬虫统计信息
GET /crawler/stats
Authorization: Bearer <JWT_TOKEN>

# 测试爬虫目标连接
GET /crawler/test-connection?targetName=电影天堂
Authorization: Bearer <JWT_TOKEN>
```

### 播放源接口 ✅
```bash
# 获取影视资源的播放源列表
GET /play-sources/media/:mediaId
Authorization: Bearer <JWT_TOKEN>

# 获取所有播放源（支持筛选和分页）
GET /play-sources?page=1&limit=10&mediaResourceId=1&type=online
Authorization: Bearer <JWT_TOKEN>

# 添加播放源
POST /play-sources
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
{
  "mediaResourceId": 1,
  "type": "online",
  "url": "https://example.com/play/123",
  "resolution": "1080p",
  "language": "中文",
  "subtitleUrl": "https://example.com/subtitle.srt",
  "priority": 1,
  "isActive": true
}

# 更新播放源
PATCH /play-sources/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
{
  "url": "https://example.com/play/456",
  "priority": 2
}

# 删除播放源
DELETE /play-sources/:id
Authorization: Bearer <JWT_TOKEN>

# 验证播放源有效性
PATCH /play-sources/:id/validate
Authorization: Bearer <JWT_TOKEN>

# 获取最佳播放源
GET /play-sources/media/:mediaId/best
Authorization: Bearer <JWT_TOKEN>
```

### 观看历史接口 ✅
```bash
# 获取用户的观看历史
GET /watch-history/user/:userId?page=1&limit=10
Authorization: Bearer <JWT_TOKEN>

# 获取用户的继续观看列表
GET /watch-history/user/:userId/continue?limit=10
Authorization: Bearer <JWT_TOKEN>

# 获取用户已看完的影视
GET /watch-history/user/:userId/completed?page=1&limit=10
Authorization: Bearer <JWT_TOKEN>

# 获取用户观看统计
GET /watch-history/user/:userId/stats
Authorization: Bearer <JWT_TOKEN>

# 更新观看进度
PATCH /watch-history/progress?userId=1&mediaResourceId=1&currentTime=300&duration=3600
Authorization: Bearer <JWT_TOKEN>

# 创建观看历史记录
POST /watch-history
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
{
  "userId": 1,
  "mediaResourceId": 1,
  "currentTime": 300,
  "duration": 3600
}

# 标记为已看完
PATCH /watch-history/:id/complete
Authorization: Bearer <JWT_TOKEN>

# 删除观看历史
DELETE /watch-history/:id
Authorization: Bearer <JWT_TOKEN>

# 清空用户观看历史
DELETE /watch-history/user/:userId/all
Authorization: Bearer <JWT_TOKEN>
```

### 个性化推荐接口 ✅
```bash
# 获取用户的个性化推荐
GET /recommendations/user/:userId?limit=10
Authorization: Bearer <JWT_TOKEN>

# 生成用户的个性化推荐
POST /recommendations/generate/:userId
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
{
  "limit": 10
}

# 获取热门推荐
GET /recommendations/trending?limit=10

# 获取编辑推荐
GET /recommendations/editorial?limit=10

# 获取推荐详情
GET /recommendations/:id
```

### 后台管理接口 ✅
```bash
# 获取系统统计数据
GET /admin/stats
Authorization: Bearer <JWT_TOKEN>

# 获取系统健康状态
GET /admin/health
Authorization: Bearer <JWT_TOKEN>

# 创建角色
POST /admin/roles
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
{
  "name": "content_admin",
  "description": "内容管理员",
  "permissions": ["user_read", "media_create", "media_update"]
}

# 获取所有角色
GET /admin/roles
Authorization: Bearer <JWT_TOKEN>

# 创建权限
POST /admin/permissions
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
{
  "code": "user_create",
  "name": "创建用户",
  "description": "允许创建新用户",
  "resource": "user",
  "action": "create"
}

# 获取所有权限
GET /admin/permissions
Authorization: Bearer <JWT_TOKEN>

# 获取管理操作日志
GET /admin/logs?page=1&limit=20&action=create&resource=user&status=success
Authorization: Bearer <JWT_TOKEN>

# 获取用户管理列表
GET /admin/users?page=1&limit=20&search=keyword
Authorization: Bearer <JWT_TOKEN>

# 获取媒体资源管理列表
GET /admin/media?page=1&limit=20&type=movie
Authorization: Bearer <JWT_TOKEN>

# 获取播放源管理列表
GET /admin/play-sources?page=1&limit=20&type=online
Authorization: Bearer <JWT_TOKEN>

# 获取观看历史管理列表
GET /admin/watch-history?page=1&limit=20&userId=1
Authorization: Bearer <JWT_TOKEN>
```


## 🗄️ 数据库设计

### 核心表结构
- **users** - 用户信息表
- **media_resources** - 影视资源表
- **play_sources** - 播放源表
- **watch_history** - 观看历史表
- **recommendations** - 个性化推荐表
- **admin_roles** - 管理员角色表
- **admin_permissions** - 管理员权限表
- **admin_logs** - 管理员操作日志表

### 表关系说明
- 一个用户可以收藏多个影视资源（多对多）
- 一个影视资源可以有多个播放源（一对多）
- 一个用户可以有多条观看历史（一对多）
- 一个用户可以有多条推荐记录（一对多）
- 一个影视资源可以出现在多条推荐记录中（一对多）

详细设计请参考：[数据库设计文档](./docs/database-schema.md)

## 🎯 开发计划

### 阶段一：基础架构 ✅
- [x] 项目初始化和结构搭建
- [x] 数据库设计和实体创建
- [x] 用户认证模块开发
- [x] 前后端分离配置
- [x] Redis和MySQL连接配置

### 阶段二：核心功能（完成）
- [x] 影视资源爬虫开发 ✅
- [x] 影视资源模块开发 ✅
- [x] 播放源模块开发 ✅
- [x] 前端页面开发 ✅
- [x] 用户界面实现 ✅
- [x] API接口完善 ✅

### 阶段三：高级功能（当前）
- [x] 播放源模块开发（已完成） ✅
- [x] 前端页面开发（已完成） ✅
- [x] 观看历史和进度管理（已完成） ✅
- [x] 个性化推荐系统（已完成） ✅
- [x] 后台管理系统（已完成） ✅

### 阶段四：优化和部署（计划）
- [ ] 性能优化
- [ ] 安全加固
- [ ] 单元测试和集成测试
- [ ] 容器化部署
- [ ] 生产环境配置

## 🧪 测试指南

### 后端测试
```bash
# 单元测试
cd backend
npm run test

# 端到端测试
npm run test:e2e

# 代码覆盖率
npm run test:cov
```

### 前端测试（计划中）
```bash
# 单元测试
cd frontend
npm run test

# 端到端测试
npm run test:e2e
```

## 🐛 故障排除

### 常见问题

#### 1. 数据库连接失败
```bash
# 检查MySQL服务是否启动
systemctl status mysql

# 检查数据库连接信息
mysql -u root -p -h localhost -e "SHOW DATABASES;"

# 检查.env文件配置
cat backend/.env
```

#### 2. Redis连接失败
```bash
# 检查Redis服务是否启动
redis-cli ping

# 检查Redis连接配置
redis-cli -h localhost -p 6379 info
```

#### 3. 后端编译错误
```bash
# 清理依赖并重新安装
cd backend
rm -rf node_modules package-lock.json
npm install

# 检查TypeScript配置
npx tsc --noEmit
```

#### 4. 前端启动失败
```bash
# 清理依赖并重新安装
cd frontend
rm -rf node_modules package-lock.json
npm install

# 检查Vite配置
npm run build
```

## 🤝 贡献指南

我们欢迎社区贡献！请按照以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范
- 遵循 TypeScript 严格模式
- 编写清晰的注释和文档
- 提交信息格式：`类型(范围): 简短描述`
- 代码提交前必须通过 lint 检查

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目作者：@jx159357
- 项目地址：[GitHub Repository](https://github.com/jx159357/nest_tv)
- 问题反馈：[GitHub Issues](https://github.com/jx159357/nest_tv/issues)

---

## 🌟 Star History

如果这个项目对您有帮助，请给它一个 ⭐️！您的支持是我们前进的动力！

[![Star History Chart](https://api.star-history.com/svg?repos=jx159357/nest_tv&type=Date)]

---

*最后更新时间：2025年8月30日*