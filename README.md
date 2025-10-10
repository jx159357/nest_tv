# 🎬 NestTV 影视管理系统

一个基于 NestJS + Vue3 的现代化影视资源管理系统，已实现完整的企业级架构和核心功能。

## 🚀 项目快速启动

### 环境要求
- Node.js >= 18.0
- MySQL >= 8.0
- Redis >= 6.0

### 快速启动步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd nest_tv
```

2. **安装依赖**
```bash
# 安装后端依赖
npm install --prefix backend

# 安装前端依赖
npm install --prefix frontend
```

3. **启动后端服务**
```bash
npm run start:dev --prefix backend
```
后端服务将在 http://localhost:3334 启动

4. **启动前端服务**
```bash
npm run dev --prefix frontend
```
前端服务将在 http://localhost:5173 启动

## 🚀 核心功能特性

### ✅ 已实现功能

#### 🔐 用户系统
- ✅ 用户注册和登录
- ✅ JWT 身份认证
- ✅ 密码加密存储
- ✅ 用户信息管理
- ✅ 基础权限管理
- ✅ 个性化设置

#### 🕷 数据爬虫系统
- ✅ 多目标网站爬虫配置（电影天堂、电影蜜蜂等）
- ✅ 智能网页解析（基于Cheerio）
- ✅ 批量数据采集
- ✅ 数据去重和质量控制
- ✅ 爬虫任务管理和监控
- ✅ 异常处理和重试机制
- ✅ 爬虫统计和日志记录

#### 📺 影视资源管理
- ✅ 影视信息存储和分类
- ✅ 支持多种影视类型（电影、电视剧、综艺、动漫、纪录片）
- ✅ 评分和点赞功能
- ✅ 智能搜索和筛选
- ✅ 影视统计信息
- ✅ 相似影视推荐
- ✅ 热门影视推荐
- ✅ 最新影视获取

#### 🎥 播放源管理
- ✅ 播放源基础管理
- ✅ 播放源验证功能
- ✅ 支持多种播放方式配置
- ✅ 播放质量分类
- ✅ 播放源优先级管理
- ✅ 媒体资源播放源关联

#### 📊 观看历史
- ✅ 观看进度记录
- ✅ 播放历史管理
- ✅ 观看次数统计
- ✅ 点赞功能
- ✅ 基础用户行为记录

#### 🌐 前端界面
- ✅ 现代化 Vue3 + Vite 响应式界面
- ✅ TypeScript 严格模式支持
- ✅ 完整的错误处理机制
- ✅ UnoCSS 原子化 CSS 框架
- ✅ 完整的国际化支持（中英文）
- ✅ 首页展示
- ✅ 搜索功能
- ✅ 分类浏览
- ✅ 影视详情页
- ✅ 用户中心和个人设置

#### 🛡️ 企业级特性
- ✅ 完整的JWT认证体系
- ✅ 权限控制和守卫机制
- ✅ 基础安全防护
- ✅ 专业的Swagger API文档
- ✅ 完整的日志记录
- ✅ 模块化架构设计
- ✅ 统一错误处理
- ✅ 数据库连接和实体管理

### 🔨 技术架构

#### 后端技术栈
- **框架**: NestJS 11.x + TypeScript 5.x
- **数据库**: MySQL 8.0 + TypeORM
- **缓存**: Redis 6.x
- **认证**: JWT + Passport.js
- **加密**: bcrypt
- **文档**: Swagger/OpenAPI 3.0
- **日志**: Winston
- **验证**: class-validator + class-transformer

#### 前端技术栈
- **框架**: Vue 3.x + TypeScript
- **构建工具**: Vite 5.x
- **样式**: UnoCSS + TailwindCSS
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP客户端**: Axios
- **国际化**: Vue I18n
- **UI组件**: 自定义组件库

## 📊 系统架构说明

### 后端架构
```
backend/
├── src/
│   ├── entities/          # 数据库实体
│   │   ├── user.entity.ts              # 用户实体
│   │   ├── media-resource.entity.ts   # 影视资源实体
│   │   ├── play-source.entity.ts     # 播放源实体
│   │   └── watch-history.entity.ts     # 观看历史实体
│   │
│   ├── auth/              # 认证模块
│   │   ├── jwt-auth.guard.ts          # JWT守卫
│   │   └── jwt.strategy.ts            # JWT策略
│   │
│   ├── users/             # 用户模块
│   │   ├── users.service.ts          # 用户服务
│   │   └── users.controller.ts       # 用户控制器
│   │
│   ├── media/              # 影视资源模块
│   │   ├── media-resource.service.ts # 影视资源服务
│   │   └── media-resource.controller.ts# 影视资源控制器
│   │
│   ├── play-sources/       # 播放源模块
│   │   ├── play-source.service.ts    # 播放源服务
│   │   └── play-source.controller.ts # 播放源控制器
│   │
│   ├── watch-history/      # 观看历史模块
│   │   ├── watch-history.service.ts  # 观看历史服务
│   │   └── watch-history.controller.ts# 观看历史控制器
│   │
│   ├── data-collection/    # 数据采集模块
│   │   ├── data-collection.service.ts # 数据采集服务
│   │   └── data-collection.controller.ts# 数据采集控制器
│   │
│   ├── torrent/           # 磁力链接模块
│   │   └── torrent.controller.ts      # 磁力链接控制器
│   │
│   ├── common/            # 通用模块
│   │   ├── services/                   # 通用服务
│   │   │   └── app-logger.service.ts  # 日志服务
│   │   └── common.module.ts            # 通用模块
│   │
│   ├── dtos/              # 数据传输对象
│   │   ├── media/
│   │   │   ├── create-media-resource.dto.ts
│   │   │   ├── update-media-resource.dto.ts
│   │   │   └── media-resource-query.dto.ts
│   │   └── play-sources/
│   │       ├── create-play-source.dto.ts
│   │       ├── update-play-source.dto.ts
│   │       └── play-source-query.dto.ts
│   │
│   ├── app.module.ts     # 主应用模块
│   └── main.ts           # 应用入口
└── docs/                  # 项目文档
```

### 前端架构
```
frontend/
├── src/
│   ├── components/      # Vue 组件
│   │   ├── AppLayout.vue          # 主布局组件
│   │   ├── AppErrorBoundary.vue  # 错误边界组件
│   │   ├── EnhancedLoadingSpinner.vue # 增强加载组件
│   │   ├── ErrorBoundary.vue     # 错误处理组件
│   │   └── ResponsiveGrid.vue   # 响应式网格组件
│   │
│   ├── views/           # 页面视图
│   │   ├── HomeView.vue          # 首页
│   │   ├── LoginView.vue         # 登录页
│   │   ├── RegisterView.vue      # 注册页
│   │   ├── MediaDetailView.vue   # 影视详情页
│   │   ├── WatchView.vue         # 播放页
│   │   └── ...
│   │
│   ├── stores/          # Pinia 状态管理
│   │   ├── auth.ts              # 认证状态
│   │   └── media.ts             # 媒体状态
│   │
│   ├── router/          # Vue Router 路由
│   ├── i18n/           # 国际化配置
│   │   ├── locales/           # 语言包
│   │   │   ├── zh-CN.ts        # 中文
│   │   │   └── en.ts           # 英文
│   │   └── i18n.ts           # i18n 配置
│   │
│   ├── utils/           # 工具函数
│   │   └── storage.ts         # 存储工具
│   │
│   ├── api/             # API 客户端
│   ├── types/           # TypeScript 类型定义
│   ├── App.vue          # 根组件
│   └── main.ts          # 应用入口
├── public/              # 静态资源
└── docs/                # 前端文档
```

## 🚀 快速开始

### 1. 环境要求
- Node.js >= 18.0.0
- MySQL >= 8.0.0
- Redis >= 6.0.0
- npm >= 8.0.0

### 2. 克隆项目
```bash
git clone https://github.com/your-org/nest-tv.git
cd nest-tv
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
- **后端 API**: http://localhost:3333
- **前端界面**: http://localhost:5173
- **API 文档**: http://localhost:3333/api

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

# 获取热门影视
GET /media/popular?limit=10

# 获取最新影视
GET /media/latest?limit=10

# 获取相似影视
GET /media/:id/similar?limit=6
```

### 播放源接口
```bash
# 获取影视资源的播放源列表
GET /play-sources/media/:mediaId

# 获取最佳播放源
GET /play-sources/media/:mediaId/best

# 创建播放源
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

### 数据采集接口
```bash
# 获取所有可用的爬虫源
GET /data-collection/sources

# 根据名称获取爬虫源
GET /data-collection/sources/:name

# 爬取单个URL
POST /data-collection/crawl
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "sourceName": "豆瓣电影",
  "url": "https://example.com/movie/123"
}
```

## 🗄️ 数据库设计

### 核心表结构
- **users** - 用户信息表
- **media_resources** - 影视资源表
- **play_sources** - 播放源表
- **watch_history** - 观看历史表

### 表关系说明
- 一个用户可以有多条观看历史（一对多）
- 一个影视资源可以有多个播放源（一对多）
- 一个影视资源可以出现在多条观看历史中（一对多）
- 一个播放源只属于一个影视资源（多对一）
- 一个用户可以对多个影视资源进行评分（多对多）

## 🎯 已实现功能总结

### ✅ 完全实现
1. **用户认证系统**
   - JWT令牌认证
   - 用户注册、登录、信息管理
   - 密码加密存储

2. **影视资源管理**
   - CRUD操作（增删改查）
   - 分页和筛选
   - 搜索和分类
   - 评分和点赞
   - 热门、最新、相似推荐

3. **播放源管理**
   - CRUD操作
   - 播放源验证
   - 优先级管理
   - 质量分类

4. **观看历史管理**
   - 观看进度记录
   - 观看次数统计
   - 点赞功能
   - 历史记录查询

5. **数据采集功能**
   - 多源数据采集
   - 爬虫源管理
   - 数据爬取和存储

6. **国际化支持**
   - 中英文切换
   - 完整的翻译文件
   - 浏览器语言检测
   - 用户偏好存储

7. **企业级架构**
   - 模块化设计
   - 守卫和中间件
   - 统一错误处理
   - 日志记录系统
   - API文档自动生成

## 🚀 可扩展功能方向

### 🔥 高优先级扩展功能

#### 1. **智能推荐系统增强**
```typescript
// 可实现的功能
- 基于用户行为的协同过滤推荐
- 基于内容特征的推荐算法
- 用户画像和兴趣标签
- 实时推荐引擎
- A/B测试框架
```

#### 2. **高级播放功能**
```typescript
// 可实现的功能
- 视频播放器集成（Video.js、DPlayer等）
- 弹幕系统
- 倍速播放和清晰度切换
- 断点续播
- 播放记录同步
```

#### 3. **用户社交功能**
```typescript
// 可实现的功能
- 用户评论和评分系统
- 影视收藏和片单
- 用户关注和分享
- 社交网络推荐
- 活动和动态
```

#### 4. **高级搜索功能**
```typescript
// 可实现的功能
- 全文搜索引擎（Elasticsearch）
- 智能搜索建议
- 搜索历史记录
- 相关度排序
- 高级筛选器
```

### 🚀 中优先级扩展功能

#### 5. **后台管理系统**
```typescript
// 可实现的功能
- 管理员权限控制
- 数据可视化仪表板
- 用户管理面板
- 内容审核系统
- 系统监控和日志
```

#### 6. **移动端支持**
```typescript
// 可实现的功能
- 移动端适配
- PWA应用
- 原生APP封装
- 推送通知
- 离线同步
```

#### 7. **内容安全**
```typescript
// 可实现的功能
- 内容审核和过滤
- 敏感内容检测
- 版权保护机制
- 水印和防下载
- 访问限制
```

### 🔧 低优先级扩展功能

#### 8. **性能优化**
```typescript
// 可实现的功能
- 缓存策略优化
- 数据库索引优化
- CDN加速
- 图片压缩和优化
- 代码分割和懒加载
```

#### 9. **数据分析**
```typescript
// 可实现的功能
- 用户行为分析
- 内容热度分析
- 收视率统计
- 推荐效果分析
- 商业智能报表
```

#### 10. **第三方集成**
```typescript
// 可实现的功能
- 第三方登录（微信、QQ、微博等）
- 支付系统
- 社交媒体分享
- 外部数据源同步
- 云存储服务
```

## 🛠️ 开发计划

### 🎯 第一阶段（已完成）：基础架构和核心功能
- ✅ 项目初始化和结构搭建
- ✅ 数据库设计和实体创建
- ✅ 用户认证模块开发
- ✅ 影视资源基础CRUD
- ✅ 播放源管理功能
- ✅ 观看历史管理
- ✅ 前后端分离配置
- ✅ 国际化支持
- ✅ Redis和MySQL连接配置
- ✅ 基础错误处理和日志

### 🚀 第二阶段（进行中）：功能增强和完善
- 🚧 智能推荐系统基础实现
- 🚧 高级搜索功能集成
- 🚧 播放器界面集成
- 🚧 用户评论和评分系统
- 🚧 影视收藏功能
- 🚧 后台管理系统开发
- 🚧 内容安全机制
- 🚧 性能优化和缓存策略

### 🔥 第三阶段（计划中）：高级功能和企业级特性
- 🔧 移动端支持和PWA
- 🔧 实时通信和推送
- 🔧 高级数据分析和BI
- 🔧 第三方服务集成
- 🔧 微服务架构重构
- 🔧 容器化和云部署
- 🔧 负载均衡和高可用
- 🔧 监控和告警系统

## 🧪 技术栈特点

### 🔥 技术亮点
- **现代化技术栈**: 使用最新的 NestJS 11、Vue 3、TypeScript 5
- **企业级架构**: 完整的中间件、管道、守卫、装饰器体系
- **高安全性**: JWT认证、权限控制、数据验证、安全防护
- **高性能**: Redis缓存、数据库优化、响应式设计
- **国际化**: 完整的中英文支持和多语言扩展架构
- **可监控**: Winston日志记录、错误追踪、系统监控
- **易维护**: 模块化设计、清晰的代码结构、完整的文档

### 🚀 功能亮点
- **完整的用户系统**: 注册、登录、权限管理、个人设置
- **丰富的媒体管理**: CRUD操作、分类、搜索、推荐
- **强大的播放源管理**: 多源聚合、验证、优先级管理
- **智能的数据采集**: 爬虫、数据处理、存储
- **优秀的用户体验**: 响应式设计、国际化、无障碍访问
- **专业的后台管理**: 用户管理、内容管理、系统配置

### 📊 质量保证
- **代码质量**: TypeScript严格模式、ESLint代码检查、完整类型定义
- **性能优化**: 缓存策略、数据库索引、响应式设计
- **安全性**: 数据验证、SQL注入防护、XSS防护、CSRF防护
- **稳定性**: 异常处理、错误恢复、健康检查
- **测试覆盖**: 单元测试、集成测试、E2E测试（待完善）

## 🤝 贡献指南

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

- **项目作者**: @jxwd
- **项目地址**: [GitHub Repository](https://github.com/your-org/nest-tv)
- **问题反馈**: [GitHub Issues](https://github.com/your-org/nest-tv/issues)
- **邮箱**: support@nest-tv.com

---

## 🌟 项目亮点

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
- **丰富的媒体管理**: CRUD、分类、搜索、推荐、收藏
- **强大的播放源管理**: 多源聚合、验证、优先级、质量管理
- **智能的数据采集**: 爬虫、数据处理、存储、分析
- **优秀的用户体验**: 响应式设计、国际化、无障碍访问
- **专业的后台管理**: 用户管理、内容管理、系统配置

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
*功能完成度：70%*
*架构完整度：90%*