# Nest TV 后端架构设计文档

## 项目概述

Nest TV 是一个基于 NestJS 框架构建的视频流媒体平台后端，提供用户认证、媒体资源管理、多源播放、弹幕互动、IPTV 直播、爬虫采集、推荐系统等完整功能。

## 技术栈

- **框架**: NestJS v11.0.1
- **语言**: TypeScript
- **数据库**: MySQL (TypeORM)
- **缓存**: Redis (3个实例)
- **认证**: JWT + Local Passport 策略
- **实时通信**: Socket.IO (弹幕)
- **视频处理**: HLS.js, WebTorrent
- **爬虫**: Cheerio + Puppeteer
- **日志**: Winston

---

## 一、模块架构

### 1.1 核心模块 (27个模块)

```
AppModule (根模块)
├── 核心基础模块
│   ├── ConfigModule (全局配置 - isGlobal: true)
│   ├── TypeOrmModule (MySQL 数据库连接，连接池优化)
│   ├── RedisModule (Redis 缓存 - 3个实例)
│   ├── CacheModule (缓存管理)
│   ├── RateLimitModule (API 限流)
│   └── CommonModule (通用服务)
│
├── 用户认证模块
│   ├── AuthModule (JWT + Local 认证)
│   └── UserModule (用户管理)
│
├── 媒体内容模块
│   ├── MediaResourceModule (媒体资源 CRUD、搜索、推荐)
│   ├── PlaySourceModule (播放源管理)
│   ├── RecommendationModule (个性化推荐)
│   └── IPTVModule (IPTV 直播：频道管理、质量测试、源收集、EPG、台标、HLS 代理、定时任务)
│
├── 互动功能模块
│   ├── DanmakuModule (弹幕 WebSocket + REST)
│   ├── WatchHistoryModule (观看历史)
│   └── WatchRoomModule (多人同步观影房)
│
├── 内容采集模块
│   ├── CrawlerModule (爬虫核心 + CrawlerTarget 管理)
│   ├── SourceScriptModule (自定义源脚本插件)
│   ├── ParseProvidersModule (解析提供商)
│   ├── DataCollectionModule (数据采集)
│   └── SchedulerModule (定时任务调度)
│
├── 下载功能模块
│   ├── TorrentModule (磁力链接 WebTorrent)
│   └── DownloadTasksModule (下载任务同步)
│
├── 存储与代理模块
│   ├── StorageModule (文件存储适配器 - S3)
│   └── ProxyPoolModule (代理 IP 池)
│
└── 扩展功能模块
    ├── AdminModule (后台管理、角色权限、操作日志)
    ├── AiChatModule (AI 智能推荐对话)
    └── InitializationModule (默认数据初始化)
```

### 1.2 模块依赖关系

```mermaid
graph TD
    A[AppModule] --> B[AuthModule]
    A --> C[MediaResourceModule]
    A --> D[DanmakuModule]
    A --> E[IPTVModule]
    A --> F[CrawlerModule]
    A --> G[AdminModule]
    A --> H[UserModule]
    A --> I[PlaySourceModule]
    A --> J[WatchHistoryModule]
    A --> K[RecommendationModule]
    A --> L[TorrentModule]
    A --> M[DownloadTasksModule]
    A --> N[WatchRoomModule]
    A --> O[SourceScriptModule]
    A --> P[AiChatModule]
    A --> Q[StorageModule]
    A --> R[ProxyPoolModule]
    A --> S[SchedulerModule]
    A --> T[InitializationModule]

    B -->|forwardRef| H
    G --> H
    G --> C
    G --> I

    E --> R
    F --> S
```

---

## 二、数据实体设计

### 2.1 核心实体 (15个实体，定义在 entities/ 目录)

#### 用户相关
- **User** - 用户基础信息
  - id, username, email, password, nickname, avatar
  - role (enum: user/admin/superAdmin), isActive, lastLoginAt

#### 媒体资源
- **MediaResource** - 媒体资源主表
  - id, title, description, type (enum: movie/tv_series/variety/anime/documentary)
  - director, actors, genres (JSON), releaseDate, quality
  - poster, backdrop, rating, viewCount, isActive, episodeCount
  - source, metadata (JSON)
  - playSources (关联 PlaySource[])

- **PlaySource** - 播放源
  - id, url, type, status, resolution, format
  - priority, isAds, playCount, name, sourceName
  - headers (JSON), mediaResourceId

- **CrawlerTarget** - 爬虫目标
  - id, name, baseUrl, parserScript, isActive
  - lastCrawlAt, crawlInterval, config (JSON)

- **SourceScript** - 源脚本
  - id, name, type, script, description
  - isActive, version, config (JSON)

#### 用户行为
- **WatchHistory** - 观看历史
  - id, userId, mediaResourceId, playSourceId
  - episodeNumber, watchProgress, lastWatchedAt, isCompleted

- **Recommendation** - 推荐
  - id, userId, mediaResourceId, score, reason

- **SearchHistory** - 搜索历史
  - id, userId, keyword, resultCount

- **DownloadTask** - 下载任务
  - id, userId, url, type, status, progress, filePath, fileSize

#### 直播相关
- **IPTVChannel** - IPTV频道
  - id, name, url, logo, group, country, language, isActive
  - qualityScore (质量评分 0-100), responseTime (响应时间ms), sourceName, sourceUrl
  - consecutiveFailures (连续失败次数), isIpv6, category (频道分类)
  - streamFormat, resolution, backupUrls (JSON数组), expireDate, isLive
  - epgId, region, viewCount, lastCheckedAt

- **ChannelLogo** - 频道台标
  - id, name, url, category, country, region
  - isVerified, isActive, usageCount, source
  - aliases (JSON数组 - 别名匹配)

- **ParseProvider** - 解析提供商
  - id, name, url, isActive, priority

#### 系统管理
- **AdminRole** - 管理角色
  - id, name, description, permissions (JSON), isSystem

- **AdminPermission** - 权限定义
  - id, name, description, module, action

- **AdminLog** - 管理日志
  - id, userId, action, target, details (JSON), ip

#### 弹幕
- **Danmaku** - 弹幕（定义在 danmaku/entities/）
  - id, content, time, color, type (scroll/top/bottom)
  - userId, mediaResourceId, fontSize, isApproved

### 2.2 实体关系图

```
User 1:N WatchHistory N:1 MediaResource
User 1:N Danmaku
User 1:N SearchHistory
User 1:N DownloadTask
User 1:N Recommendation

MediaResource 1:N PlaySource
MediaResource 1:N Danmaku
MediaResource 1:N Recommendation

CrawlerTarget 1:N MediaResource (source 字段关联)

AdminRole 1:N AdminPermission

ChannelLogo N:1 IPTVChannel (通过 logo URL 关联，非外键)
```

---

## 三、服务层设计

### 3.1 认证服务 (AuthService)

**核心方法:**
- `register(dto: RegisterDto)` - 用户注册，bcrypt 密码加密
- `login(dto: LoginDto)` - 用户登录，返回 JWT token
- `validateUser(identifier, password)` - 验证用户凭据
- `refreshToken(token)` - 刷新访问令牌
- `getProfile(userId)` - 获取用户完整资料

**认证流程:**
```
注册: UserService.create → bcrypt.hash → User entity → JWT.sign
登录: LocalStrategy.validate → AuthService.login → JWT.sign
访问: JwtStrategy.validate → 附加 user 到 request
```

### 3.2 媒体资源服务 (MediaResourceService)

**核心方法:**
- `findAll(query: MediaQueryDto)` - 分页查询，支持类型/评分/排序筛选
- `findById(id)` - 获取详情，包含播放源（自动去重）
- `search(keyword)` - 全文搜索
- `getPopular(limit)` - 热门资源
- `getLatest(limit)` - 最新资源
- `getByCategory(categoryId)` - 按分类查询

**播放源去重逻辑:**
```typescript
// 按 URL 去重，保留优先级最高的
deduplicateByUrl(sources: PlaySource[]): PlaySource[] {
  const seen = new Set<string>();
  return sources.filter(s => {
    if (!s.url || seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}
```

### 3.3 弹幕服务 (DanmakuService)

**核心方法:**
- `create(dto, userId)` - 发送弹幕（需审核）
- `getByMedia(mediaId, timeRange)` - 获取时间范围内弹幕
- `approve(id)` / `reject(id)` - 审核弹幕
- `batchDelete(ids)` - 批量删除

**WebSocket 事件:**
- `danmaku:send` - 发送弹幕
- `danmaku:receive` - 接收弹幕
- `danmaku:history` - 历史弹幕

### 3.4 IPTV 模块

IPTV 模块包含 7 个服务，提供完整的直播频道管理功能。

#### 3.4.1 IPTV 服务 (IPTVService)

**核心方法:**
- `findAll(queryDto)` - 分页查询频道，支持分组/国家/清晰度/搜索筛选
- `findById(id)` - 频道详情
- `create(data)` / `createBulk(data[])` - 创建/批量创建频道
- `update(id, data)` / `remove(id)` - 更新/删除频道
- `importFromM3U(url, group)` - 导入 M3U 播放列表
- `importFromJson(channels, group)` - 导入 JSON 格式频道
- `proxyImage(url, res)` - 图片代理（绕过防盗链）
- `getStats()` - 获取频道统计信息

#### 3.4.2 流质量测试服务 (StreamQualityTester)

**核心方法:**
- `testChannel(channel)` - 测试单个频道流可用性
- `testChannels(channels, concurrency)` - 并发测试多个频道（默认50并发）
- `testAllActiveChannels()` - 测试所有活跃频道
- `testChannelsByGroup(group)` - 测试指定分组
- `testProblematicChannels()` - 测试连续失败的频道
- `getQualityStats()` - 获取质量统计（高/中/低质量频道数、平均响应时间）
- `disableLowQualityChannels(minScore)` - 禁用低质量频道
- `reenableRecoveredChannels()` - 恢复已恢复的频道

**质量评分算法:**
```typescript
// 基础分 100，响应时间扣分，连续失败扣分
score = 100
  - responseTime > 5000 ? 50 : responseTime / 100  // 响应时间
  - consecutiveFailures * 10                         // 连续失败
  + (hasEpg ? 5 : 0)                                // EPG 支持加分
  + (hasLogo ? 5 : 0)                               // 台标加分
  + (isIpv6 ? 2 : 0)                                // IPv6 加分
```

#### 3.4.3 直播源收集服务 (IptvSourceCollector)

**预置源:**
- `fanmingming-live` - fanmingming/live 项目（国内频道）
- `iptv-org-cn` - iptv-org 中国频道
- `iptv-org-hk` - iptv-org 香港频道
- `iptv-org-tw` - iptv-org 台湾频道

**核心方法:**
- `getSources()` - 获取所有源配置
- `addSource(source)` / `removeSource(name)` - 添加/删除源
- `toggleSource(name, enabled)` - 启用/禁用源
- `collectFromSource(source)` - 从指定源收集频道
- `collectFromAllSources()` - 从所有源批量收集
- `getCollectionStats()` - 获取收集统计

**收集流程:**
```
1. 获取 M3U 文件内容
2. 解析 #EXTINF 标签（名称、台标、分组）
3. 与现有频道比对（URL 去重）
4. 新增频道 / 更新已有频道
5. 返回收集结果统计
```

#### 3.4.4 EPG 节目单服务 (EpgService)

**核心方法:**
- `getChannelEpg(channelId, days)` - 获取频道节目单
- `getBatchChannelEpg(channelIds, days)` - 批量获取节目单
- `getCurrentProgram(channelId)` - 获取当前正在播出的节目
- `getUpcomingPrograms(channelId, count)` - 获取即将播出的节目
- `exportXmltv()` - 导出 XMLTV 格式 EPG

**特性:**
- 多 EPG 源支持（iptv-org/epg、diyp 等）
- 6 小时内存缓存
- 模糊频道名称匹配
- 自动清理过期节目数据

#### 3.4.5 频道台标服务 (ChannelLogoService)

**核心方法:**
- `findAll(category)` - 获取所有台标
- `search(keyword)` - 搜索台标（名称 + 别名模糊匹配）
- `create(data)` / `update(id, data)` / `remove(id)` - CRUD 操作
- `initPresetLogos()` - 初始化预置台标（30+ 央视/卫视）
- `matchLogosForChannels()` - 自动匹配频道台标
- `getStats()` - 台标统计信息

**匹配策略:**
```
1. 精确匹配频道名称
2. 别名模糊匹配（去除空格、特殊字符）
3. 关键词包含匹配
4. 匹配成功后更新频道 logo 字段
```

#### 3.4.6 HLS 代理服务 (HlsProxyService)

**核心方法:**
- `proxyHlsStream(url, res, options)` - 代理 M3U8 流
- `proxyKeyRequest(url, res)` - 代理 AES-128 密钥请求
- `getCacheStats()` / `clearCache()` - 缓存管理

**关键特性:**
- M3U8 内容解析与 URL 重写（相对路径 → 绝对路径）
- AES-128 密钥代理
- 分段缓存（Map 存储，自动清理过期）
- 重试逻辑（最多 3 次）
- CORS 头设置

#### 3.4.7 定时任务服务 (IptvScheduler)

**调度计划:**
| 任务 | Cron 表达式 | 说明 |
|------|------------|------|
| 质量测试 | `0 2 * * *` | 每天凌晨 2 点 |
| 源收集 | `0 4 * * *` | 每天凌晨 4 点 |
| 台标匹配 | `0 3 * * 0` | 每周日凌晨 3 点 |
| 问题频道测试 | `0 */6 * * *` | 每 6 小时 |

**核心方法:**
- `handleQualityTest()` - 执行质量测试任务
- `handleSourceCollection()` - 执行源收集任务
- `handleLogoMatch()` - 执行台标匹配任务
- `triggerAll()` - 手动触发所有任务

### 3.5 爬虫服务 (CrawlerService)

**核心方法:**
- `crawl(targetName)` - 执行爬虫任务
- `parseDetail(url, script)` - 解析详情页
- `saveMedia(data)` - 保存到数据库
- `getTargets()` - 获取爬虫目标列表
- `testConnection(targetName)` - 测试连接

---

## 四、控制器与路由

### 4.1 API 路由结构

```
/api
├── /auth
│   POST /register          - 用户注册
│   POST /login             - 用户登录
│   GET  /profile           - 获取个人资料 [需认证]
│
├── /users
│   GET  /                  - 用户列表 [管理员]
│   GET  /:id               - 用户详情
│   PATCH /:id              - 更新用户
│   DELETE /:id             - 删除用户 [管理员]
│
├── /media
│   GET  /                  - 媒体列表 (分页、筛选、排序)
│   GET  /popular           - 热门媒体
│   GET  /latest            - 最新媒体
│   GET  /top-rated         - 高分媒体
│   GET  /categories        - 分类列表
│   GET  /search            - 搜索媒体
│   GET  /:id               - 媒体详情
│   GET  /:id/play-sources  - 播放源列表
│   POST /:id/favorite      - 切换收藏
│   GET  /:id/favorite      - 收藏状态
│
├── /play-sources
│   GET  /                  - 播放源列表 [管理员]
│   POST /                  - 创建播放源 [管理员]
│   PATCH /:id              - 更新播放源 [管理员]
│   DELETE /:id             - 删除播放源 [管理员]
│
├── /danmaku
│   POST /                  - 发送弹幕 [需认证]
│   GET  /media/:id         - 获取弹幕
│   GET  /admin             - 管理列表 [管理员]
│   PATCH /:id/approve      - 审核通过 [管理员]
│   DELETE /:id             - 删除弹幕 [管理员]
│
├── /iptv
│   ├── 频道基础
│   │   GET  /                  - 频道列表 (分页、筛选、排序)
│   │   GET  /stats             - 频道统计
│   │   GET  /groups/list       - 所有分组
│   │   GET  /group/:group      - 按分组查询
│   │   GET  /search/:keyword   - 搜索频道
│   │   GET  /:id               - 频道详情
│   │   GET  /:id/validate      - 验证频道有效性
│   │   POST /                  - 创建频道 [管理员]
│   │   PUT  /:id               - 更新频道 [管理员]
│   │   DELETE /:id             - 删除频道 [管理员]
│   │
│   ├── 导入导出
│   │   POST /import/m3u        - 导入 M3U 播放列表
│   │   POST /import/json       - 导入 JSON 频道列表
│   │   POST /import/txt        - 导入 TXT 频道列表
│   │   GET  /export/m3u        - 导出 M3U 格式
│   │   GET  /export/txt        - 导出 TXT 格式
│   │
│   ├── 流代理
│   │   GET  /stream/proxy      - HLS 流代理 (M3U8)
│   │   GET  /key/proxy         - AES-128 密钥代理
│   │   GET  /image/proxy       - 图片代理 (防盗链绕过)
│   │   GET  /proxy/cache/stats - 代理缓存统计
│   │   POST /proxy/cache/clear - 清除代理缓存
│   │
│   ├── EPG 节目单
│   │   GET  /epg/xml           - 导出 XMLTV 格式
│   │   GET  /:id/epg           - 频道节目单
│   │   GET  /:id/epg/current   - 当前节目
│   │   GET  /:id/epg/upcoming  - 即将播出
│   │
│   ├── 流质量测试
│   │   POST /quality/test/:id      - 测试单个频道
│   │   POST /quality/test-all      - 测试所有活跃频道 [管理员]
│   │   POST /quality/test-group/:g - 测试指定分组 [管理员]
│   │   GET  /quality/stats         - 质量统计
│   │   POST /quality/disable-low   - 禁用低质量频道 [管理员]
│   │
│   ├── 直播源收集
│   │   GET  /sources           - 所有源配置
│   │   POST /sources           - 添加源 [管理员]
│   │   DELETE /sources/:name   - 删除源 [管理员]
│   │   PUT  /sources/:name/toggle - 启用/禁用源 [管理员]
│   │   POST /sources/collect   - 从所有源收集 [管理员]
│   │   POST /sources/collect/:name - 从指定源收集 [管理员]
│   │   GET  /sources/stats     - 收集统计
│   │
│   └── 台标管理
│       GET  /logos             - 所有台标
│       GET  /logos/search/:kw  - 搜索台标
│       POST /logos             - 添加台标 [管理员]
│       PUT  /logos/:id         - 更新台标 [管理员]
│       DELETE /logos/:id       - 删除台标 [管理员]
│       POST /logos/init        - 初始化预置台标 [管理员]
│       POST /logos/match       - 自动匹配台标 [管理员]
│       GET  /logos/stats       - 台标统计
│
├── /crawler
│   POST /trigger           - 触发爬虫 [管理员]
│   GET  /targets           - 目标列表 [管理员]
│   GET  /status            - 爬虫状态 [管理员]
│   POST /crawl-and-save    - 爬取并保存 [管理员]
│   GET  /test-connection   - 测试连接 [管理员]
│
├── /recommendations
│   GET  /top-rated         - 高分推荐
│   GET  /trending          - 趋势推荐
│
├── /search
│   GET  /stream            - 流式搜索 (SSE)
│   GET  /suggestions       - 搜索建议
│   GET  /popular-keywords  - 热门关键词
│   GET  /related-keywords  - 相关关键词
│
├── /watch-history
│   GET  /                  - 观看历史 [需认证]
│   POST /                  - 记录观看 [需认证]
│   DELETE /:id             - 删除记录 [需认证]
│
├── /favorites
│   GET  /                  - 收藏列表 [需认证]
│
├── /torrent
│   POST /add               - 添加种子 [需认证]
│   GET  /status/:id        - 下载状态 [需认证]
│
├── /admin
│   GET  /dashboard         - 仪表盘数据 [管理员]
│   GET  /logs              - 操作日志 [管理员]
│   GET  /users             - 用户管理 [管理员]
│   GET  /roles             - 角色管理 [管理员]
│   GET  /system            - 系统信息 [管理员]
│
├── /watch-room
│   POST /                  - 创建房间 [需认证]
│   GET  /                  - 房间列表
│   GET  /:id               - 房间详情
│
└── /health
    GET  /                  - 健康检查
```

### 4.2 认证与授权

**守卫层次:**
```typescript
@Controller('media')
@UseGuards(JwtAuthGuard)  // 控制器级别
export class MediaController {
  @Get()
  findAll() { }  // 公开路由需用 @Public() 装饰器

  @Delete(':id')
  @Roles('admin')  // 角色限制
  remove() { }
}
```

**守卫类型:**
- `JwtAuthGuard` - JWT 令牌验证
- `RolesGuard` - 角色权限检查
- `ThrottlerGuard` - 请求限流

---

## 五、中间件与管道

### 5.1 全局中间件

- **CorsMiddleware** - CORS 跨域配置
- **LoggerMiddleware** - 请求日志记录
- **HelmetMiddleware** - 安全头设置
- **CompressionMiddleware** - 响应压缩

### 5.2 全局管道

- **ValidationPipe** - DTO 自动验证
- **ParseIntPipe** - 数字参数解析
- **ParseEnumPipe** - 枚举参数解析

### 5.3 异常过滤器

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const status = exception.getStatus();
    const message = exception.getResponse();

    response.status(status).json({
      success: false,
      statusCode: status,
      message: typeof message === 'string' ? message : message['message'],
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## 六、配置管理

### 6.1 环境变量配置

```typescript
// .env 配置项
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=***
DATABASE_NAME=nest_tv

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=***

JWT_SECRET=***
JWT_EXPIRES_IN=7d

AI_API_KEY=***
AI_API_URL=***
```

### 6.2 配置模块结构

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.production'],
      validate: validateConfig,
    }),
  ],
})
export class AppModule {}
```

---

## 七、第三方集成

### 7.1 核心依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| @nestjs/core | 11.0.1 | 框架核心 |
| @nestjs/typeorm | ^11.0.0 | ORM |
| @nestjs/jwt | ^11.0.0 | JWT 认证 |
| @nestjs/passport | ^11.0.0 | 认证策略 |
| @nestjs/platform-socket.io | ^11.0.0 | WebSocket |
| @nestjs/schedule | ^6.0.0 | 定时任务 |
| typeorm | ^0.3.24 | 数据库 ORM |
| ioredis | ^5.6.1 | Redis 客户端 |
| cheerio | ^1.0.0 | HTML 解析 |
| puppeteer | ^24.7.2 | 无头浏览器 |
| webtorrent | ^2.5.1 | 种子下载 |
| winston | ^3.17.0 | 日志系统 |
| bcrypt | ^5.1.1 | 密码加密 |
| class-validator | ^0.14.2 | DTO 验证 |
| class-transformer | ^0.5.1 | 对象转换 |

### 7.2 缓存策略

```typescript
// Redis 缓存配置
CacheModule.registerAsync({
  useFactory: (configService: ConfigService) => ({
    store: 'redis',
    host: configService.get('REDIS_HOST'),
    port: configService.get('REDIS_PORT'),
    ttl: 60 * 60, // 1小时默认 TTL
  }),
  inject: [ConfigService],
})
```

---

## 八、特殊功能模块

### 8.1 IPTV 直播系统

**架构:**
```
IPTVModule
├── IPTVService (频道 CRUD、M3U 导入、图片代理)
├── StreamQualityTester (流质量测试、并发测试、自动禁用)
├── IptvSourceCollector (直播源收集、增量更新)
├── EpgService (节目单、XMLTV 导出)
├── ChannelLogoService (台标管理、自动匹配)
├── HlsProxyService (HLS 代理、M3U8 重写、密钥代理)
└── IptvScheduler (定时任务：质量测试/源收集/台标匹配)
```

**核心特性:**
- 流质量自动测试与评分（0-100 分制）
- 直播源自动收集（预置 4 个开源源）
- EPG 节目单支持（多源、缓存、XMLTV 导出）
- 频道台标自动匹配（精确/别名/关键词匹配）
- HLS 代理与 M3U8 URL 重写
- AES-128 密钥代理
- 定时自动维护任务

### 8.2 推荐系统

**推荐算法:**
- 基于用户观看历史的内容相似度推荐
- 基于热门度的全局推荐
- 基于用户偏好的个性化推荐
- 支持排除特定类型/分类

### 8.2 弹幕系统

**实时通信架构:**
```
Client → WebSocket → DanmakuGateway → DanmakuService → Database
                  ↓
           广播给同房间用户
```

**弹幕类型:**
- 滚动弹幕 (scroll)
- 顶部弹幕 (top)
- 底部弹幕 (bottom)

### 8.3 代理池

**功能:**
- 动态代理 IP 管理
- 自动验证代理可用性
- 按响应速度排序
- 失败自动切换

### 8.4 观影房

**功能:**
- 多人同步观影
- 房主控制播放进度
- 房间内聊天
- 支持密码房间

### 8.5 AI 对话

**实现:**
- SSE (Server-Sent Events) 流式响应
- 支持多轮对话上下文
- 可配置 AI 模型和参数

---

## 九、数据库设计原则

### 9.1 索引策略

```sql
-- 常用查询索引
CREATE INDEX idx_media_type ON media_resource(type);
CREATE INDEX idx_media_rating ON media_resource(rating DESC);
CREATE INDEX idx_media_created ON media_resource(created_at DESC);
CREATE INDEX idx_play_source_media ON play_source(media_resource_id);
CREATE INDEX idx_watch_history_user ON watch_history(user_id);
CREATE INDEX idx_danmaku_media ON danmaku(media_resource_id, time);
```

### 9.2 数据一致性

- 使用事务处理关联操作
- 软删除 (isActive 标记)
- 定期清理过期数据

---

## 十、性能优化

### 10.1 缓存策略

- 热门数据 Redis 缓存
- 查询结果内存缓存
- CDN 静态资源缓存

### 10.2 数据库优化

- 分页查询避免全表扫描
- 批量操作减少数据库往返
- 连接池配置优化

### 10.3 并发处理

- 请求限流 (ThrottlerGuard)
- 异步任务队列
- WebSocket 连接池管理

---

## 十一、安全设计

### 11.1 认证安全

- JWT 令牌过期机制
- 密码 bcrypt 加密
- 登录失败限制

### 11.2 数据安全

- SQL 注入防护 (TypeORM 参数化查询)
- XSS 防护 (输入验证)
- CSRF 防护

### 11.3 接口安全

- 请求限流
- 敏感操作日志记录
- 管理员权限分离

---

## 十二、部署架构

### 12.1 开发环境

```bash
npm run start:dev  # 热重载开发
```

### 12.2 生产环境

```bash
npm run build      # 编译
npm run start:prod # 生产启动
```

### 12.3 Docker 部署

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports: ["3334:3334"]
    depends_on: [mysql, redis]

  mysql:
    image: mysql:8.0
    volumes: [mysql_data:/var/lib/mysql]

  redis:
    image: redis:7-alpine
```

---

## 十三、监控与日志

### 13.1 日志级别

- error: 错误日志
- warn: 警告日志
- info: 信息日志
- debug: 调试日志

### 13.2 监控指标

- API 响应时间
- 数据库查询性能
- Redis 缓存命中率
- WebSocket 连接数

---

## 十四、扩展性设计

### 14.1 模块化扩展

- 新功能通过 Module 添加
- 服务间通过依赖注入解耦
- 支持插件式源脚本

### 14.2 水平扩展

- 无状态服务设计
- Redis 共享会话
- 负载均衡支持

---

*文档版本: v2.0*
*最后更新: 2026-05-23*
