# 🎬 NestTV 影视管理系统

一个基于 NestJS + Vue3 的现代化影视资源管理系统，支持用户管理、影视资源爬取、多源播放、观看历史等功能。

## 🚀 功能特性

### 🔐 用户系统
- ✅ 用户注册和登录
- ✅ JWT 身份认证
- ✅ 密码加密存储
- ✅ 用户信息管理
- ✅ 角色权限管理
- ✅ 个性化设置

### 📺 影视资源管理
- ✅ 影视信息爬取
- ✅ 资源存储和分类
- ✅ 支持多种影视类型（电影、电视剧、综艺、动漫、纪录片）
- ✅ 评分和收藏功能
- ✅ 智能搜索和筛选

### 🎥 播放源管理
- ✅ 多播放源聚合
- ✅ 播放源验证和优先级管理
- ✅ 支持在线播放、下载、流媒体等多种播放方式
- ✅ 播放质量选择
- ✅ 字幕支持

### 📊 观看历史
- ✅ 观看进度记录
- ✅ 播放历史管理
- ✅ 继续观看功能
- ✅ 观看统计功能
- ✅ 个性化推荐

### 🌐 前端界面
- ✅ 现代化 Vue3 + Vite 响应式界面
- ✅ UnoCSS 原子化 CSS 框架
- ✅ 完整的国际化支持（中英文）
- ✅ 首页、搜索、分类浏览
- ✅ 详情页和播放器
- ✅ 播放源管理界面
- ✅ 爬虫管理界面
- ✅ 用户中心和个人设置

### 🛡️ 企业级特性
- ✅ 完整的认证和授权体系
- ✅ 权限控制和角色管理
- ✅ 速率限制和安全防护
- ✅ 完整的日志记录和监控
- ✅ 专业的 API 文档（Swagger）
- ✅ 错误处理和异常管理
- ✅ 缓存和性能优化
- ✅ 安全头部和 CSP 策略

## 🏗️ 技术架构

### 后端技术栈
- **框架**: NestJS 11.x + TypeScript
- **数据库**: MySQL 8.0 + TypeORM
- **缓存**: Redis 6.x
- **认证**: JWT + Passport.js
- **加密**: bcrypt
- **文档**: Swagger/OpenAPI
- **日志**: Winston
- **验证**: class-validator + class-transformer

### 前端技术栈
- **框架**: Vue 3.x + TypeScript
- **构建工具**: Vite 5.x
- **样式**: UnoCSS + TailwindCSS
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP客户端**: Axios
- **国际化**: Vue I18n
- **UI组件**: 自定义组件库

### 企业级组件
- **守卫**: 权限守卫、角色守卫、速率限制守卫、条件守卫等
- **拦截器**: 日志拦截器、响应拦截器、缓存拦截器等
- **中间件**: 安全头部中间件、请求ID中间件等
- **管道**: 数据验证管道、分页管道、排序管道等
- **装饰器**: 30+ 个自定义装饰器支持企业级功能

## 📁 项目结构

```
nest_tv/
├── backend/                    # 后端 NestJS 项目
│   ├── src/
│   │   ├── entities/          # 数据库实体
│   │   │   ├── user.entity.ts
│   │   │   ├── media-resource.entity.ts
│   │   │   ├── play-source.entity.ts
│   │   │   ├── watch-history.entity.ts
│   │   │   └── ...
│   │   ├── auth/              # 认证模块
│   │   ├── users/             # 用户模块
│   │   ├── media/              # 媒体资源模块
│   │   ├── play-sources/       # 播放源模块
│   │   ├── watch-history/      # 观看历史模块
│   │   ├── crawler/           # 爬虫模块
│   │   ├── recommendations/   # 个性化推荐模块
│   │   ├── admin/             # 后台管理模块
│   │   ├── iptv/              # IPTV 直播模块
│   │   ├── parse-providers/   # 解析提供商模块
│   │   ├── torrent/           # 磁力链接模块
│   │   ├── data-collection/    # 数据采集模块
│   │   ├── common/            # 企业级通用模块
│   │   │   ├── guards/           # 各种守卫
│   │   │   ├── interceptors/     # 各种拦截器
│   │   │   ├── middleware/       # 各种中间件
│   │   │   ├── pipes/           # 各种管道
│   │   │   ├── decorators/      # 各种装饰器
│   │   │   ├── services/        # 通用服务
│   │   │   ├── config/          # 配置类
│   │   │   └── common.module.ts
│   │   ├── app.module.ts     # 主应用模块
│   │   └── main.ts           # 应用入口
│   ├── docs/                  # 数据库设计文档
│   ├── tsconfig.json          # TypeScript 配置
│   ├── nest-cli.json         # NestJS CLI 配置
│   └── package.json          # 后端依赖配置
├── frontend/                   # 前端 Vue3 项目
│       ├── src/
│       │   ├── components/      # Vue 组件
│       │   │   ├── AppLayout.vue         # 主布局组件
│       │   │   ├── AppErrorBoundary.vue  # 错误边界组件
│       │   │   └── ...                 # 其他业务组件
│       │   ├── views/           # 页面视图
│       │   │   ├── HomeView.vue          # 首页
│       │   │   ├── LoginView.vue         # 登录页
│       │   │   ├── RegisterView.vue      # 注册页
│       │   │   ├── MediaDetailView.vue   # 影视详情页
│       │   │   ├── WatchView.vue         # 播放页
│       │   │   └── ...                     # 其他页面
│       │   ├── stores/          # Pinia 状态管理
│       │   │   ├── auth.ts              # 认证状态
│       │   │   └── media.ts             # 媒体状态
│       │   ├── router/          # Vue Router 路由
│       │   ├── i18n/           # 国际化配置
│       │   │   ├── locales/           # 语言包
│       │   │   │   ├── zh-CN.ts        # 中文
│       │   │   │   └── en.ts           # 英文
│       │   │   ├── i18n.ts           # i18n 配置
│       │   │   └── ...
│       │   ├── utils/           # 工具函数
│       │   ├── api/             # API 客户端
│       │   ├── App.vue          # 根组件
│       │   └── main.ts          # 应用入口
│       ├── public/              # 静态资源
│       ├── uno.config.ts        # UnoCSS 配置
│       ├── vite.config.ts       # Vite 配置
│       ├── tsconfig.json        # TypeScript 配置
│       └── package.json         # 前端依赖配置
├── docs/                       # 项目文档
│   ├── database-schema.md   # 数据库设计文档
│   └── api-guide.md         # API 接口文档
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
git clone https://github.com/your-org/nest-tv.git
cd nest-tv
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
# PORT=3333
# NODE_ENV=development
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
- 后端 API: http://localhost:3333
- 前端界面: http://localhost:5173
- API 文档: http://localhost:3333/api

## 📋 API 接口概览

### 认证接口
```bash
# 用户注册
POST /auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "nickname": "测试用户"
}

# 用户登录
POST /auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}

# 获取用户信息（需要JWT）
GET /auth/profile
Authorization: Bearer <JWT_TOKEN>
```

### 影视资源接口
```bash
# 获取影视资源列表
GET /media?page=1&pageSize=10

# 获取影视资源详情
GET /media/:id

# 搜索影视资源
GET /media/search?q=关键词

# 获取分类资源
GET /media/category/:category
```

### 播放源接口
```bash
# 获取影视资源的播放源列表
GET /play-sources/media/:mediaId

# 获取最佳播放源
GET /play-sources/media/:mediaId/best

# 添加播放源
POST /play-sources
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "mediaResourceId": 1,
  "type": "online",
  "url": "https://example.com/play/123",
  "resolution": "1080p",
  "priority": 1
}
```

### 观看历史接口
```bash
# 获取用户的观看历史
GET /watch-history?page=1&pageSize=10

# 获取继续观看列表
GET /watch-history/continue

# 更新观看进度
PATCH /watch-history/progress
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "mediaResourceId": 1,
  "currentTime": 300,
  "duration": 3600
}
```

### 爬虫接口
```bash
# 获取可用的爬虫目标
GET /crawler/targets

# 启动爬虫
POST /crawler/start
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "targetName": "电影天堂",
  "url": "https://example.com/movie/123"
}
```

### 个性化推荐接口
```bash
# 获取用户的个性化推荐
GET /recommendations/personalized?limit=10

# 获取热门推荐
GET /recommendations/trending?limit=10

# 获取相似推荐
GET /recommendations/similar/:mediaId
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

### 阶段二：核心功能 ✅
- [x] 影视资源爬虫开发 ✅
- [x] 影视资源模块开发 ✅
- [x] 播放源模块开发 ✅
- [x] 前端页面开发 ✅
- [x] 用户界面实现 ✅
- [x] API接口完善 ✅

### 阶段三：高级功能 ✅
- [x] 观看历史和进度管理 ✅
- [x] 个性化推荐系统 ✅
- [x] 后台管理系统 ✅
- [x] 国际化支持 ✅
- [x] 企业级安全组件 ✅
- [x] 完整的日志和监控 ✅
- [x] API文档完善 ✅

### 阶段四：优化和部署
- [ ] 性能优化和压力测试
- [ ] 安全加固和漏洞扫描
- [ ] 单元测试和集成测试覆盖
- [ ] 容器化部署和CI/CD
- [ ] 生产环境配置和监控

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

# 类型检查
npm run type-check
```

### 前端测试
```bash
# 单元测试
cd frontend
npm run test

# 端到端测试
npm run test:e2e

# 类型检查
npm run type-check
```

### 性能测试
```bash
# 后端性能测试
cd backend
npm run test:performance

# 前端性能测试
cd frontend
npm run test:performance
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

#### 5. 环境变量配置问题
```bash
# 检查必需的环境变量
# 后端：DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, REDIS_HOST, REDIS_PORT, JWT_SECRET, PORT
# 前端：VITE_API_BASE_URL

# 创建环境变量示例文件
echo "DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=nest_tv
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
PORT=3333
NODE_ENV=development" > backend/.env

echo "VITE_API_BASE_URL=http://localhost:3333
VITE_APP_TITLE=NestTV" > frontend/.env
```

## 🤝 贡献指南

我们欢迎社区贡献！请按照以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范
- 遵循 TypeScript 严格模式
- 编写清晰的注释和文档
- 提交信息格式：`类型(范围): 简短描述`
  - feat: 新功能
  - fix: 修复bug
  - docs: 文档更新
  - style: 代码格式化
  - refactor: 代码重构
  - test: 测试相关
  - chore: 构建工具或依赖管理
- 代码提交前必须通过 lint 检查
- 遵循 ESLint 和 Prettier 规范

### 代码规范
- 使用 TypeScript 编写类型安全的代码
- 函数和类需要有清晰的 JSDoc 注释
- 使用有意义的变量名和函数名
- 遵循单一职责原则
- 避免全局变量，使用模块化

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- 项目作者：@jxwd
- 项目地址：[GitHub Repository](https://github.com/your-org/nest-tv)
- 问题反馈：[GitHub Issues](https://github.com/your-org/nest-tv/issues)
- 邮箱：support@nest-tv.com

---

## 🌟 项目特性亮点

### 🔥 技术亮点
- **现代化技术栈**: 使用最新的 NestJS 11、Vue 3、TypeScript 5
- **企业级架构**: 完整的中间件、管道、守卫、装饰器体系
- **高安全性**: JWT认证、权限控制、XSS防护、CSRF防护、CSP策略
- **高性能**: Redis缓存、数据库优化、响应式设计
- **国际化**: 完整的中英文支持和多语言扩展架构
- **可监控**: Winston日志记录、性能监控、错误追踪
- **易维护**: 模块化设计、清晰的代码结构、完整的文档

### 🚀 功能亮点
- **完整的用户系统**: 注册、登录、权限管理、个人设置
- **丰富的媒体管理**: 爬虫、分类、搜索、播放源管理
- **智能推荐**: 个性化推荐、热门推荐、相似推荐
- **优秀的用户体验**: 响应式设计、国际化、无障碍访问
- **强大的后台管理**: 用户管理、内容管理、日志管理、系统配置

### 📊 质量保证
- **代码质量**: TypeScript严格模式、ESLint代码检查、单元测试
- **性能优化**: 缓存策略、数据库索引、响应式设计
- **安全性**: 多层安全防护、输入验证、SQL注入防护
- **稳定性**: 异常处理、错误恢复、健康检查

---

## 🌟 Star History

如果这个项目对您有帮助，请给它一个 ⭐️！您的支持是我们前进的动力！

[![Star History Chart](https://api.star-history.com/svg?repos=your-org/nest-tv&type=Date)]

---

*最后更新时间：2024年1月15日*
*项目版本：v1.0.0*
*维护状态：积极维护中*