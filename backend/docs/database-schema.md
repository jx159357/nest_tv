# 数据库表结构设计文档

## 概述
本文档详细描述了影视管理系统nest_tv的数据库表结构设计，包括用户管理、影视资源、播放源和观看历史等核心功能。

## 数据库表总览

### 1. 用户表 (users)
存储用户基本信息和认证信息

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 用户ID |
| username | varchar(50) | UNIQUE, NOT NULL | 用户名 |
| password | varchar(255) | NOT NULL | 密码（加密存储） |
| email | varchar(100) | UNIQUE, NOT NULL | 邮箱 |
| phone | varchar(20) | NULLABLE | 手机号 |
| nickname | varchar(100) | NULLABLE | 昵称 |
| role | varchar(20) | DEFAULT 'user' | 用户角色 |
| isActive | boolean | DEFAULT true | 账号是否激活 |
| avatar | varchar(255) | NULLABLE | 头像URL |
| lastLoginAt | datetime | NULLABLE | 最后登录时间 |
| createdAt | datetime | AUTO | 创建时间 |
| updatedAt | datetime | AUTO | 更新时间 |

### 2. 影视资源表 (media_resources)
存储电影、电视剧等影视资源信息

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 资源ID |
| title | varchar(200) | NOT NULL | 影视标题 |
| description | text | NULLABLE | 简介 |
| type | enum | NOT NULL | 影视类型 |
| director | varchar(100) | NULLABLE | 导演 |
| actors | text | NULLABLE | 主演 |
| genres | json | NULLABLE | 类型标签数组 |
| releaseDate | date | NULLABLE | 上映日期 |
| quality | enum | DEFAULT 'hd' | 视频质量 |
| poster | varchar(500) | NULLABLE | 海报URL |
| backdrop | varchar(500) | NULLABLE | 背景图URL |
| rating | decimal | DEFAULT 0 | 评分（0-10分） |
| viewCount | int | DEFAULT 0 | 观看次数 |
| isActive | boolean | DEFAULT true | 是否可用 |
| source | varchar(50) | NULLABLE | 来源平台 |
| metadata | json | NULLABLE | 扩展元数据 |
| episodeCount | int | NULLABLE | 剧集数 |
| downloadUrls | json | NULLABLE | 下载链接数组 |
| createdAt | datetime | AUTO | 创建时间 |
| updatedAt | datetime | AUTO | 更新时间 |

#### 枚举值定义
- **MediaType**: movie, tv_series, variety, anime, documentary
- **MediaQuality**: hd, full_hd, blue_ray, sd

### 3. 播放源表 (play_sources)
存储影视资源的播放链接信息

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 播放源ID |
| url | varchar(500) | NOT NULL | 播放链接 |
| type | enum | NOT NULL | 播放源类型 |
| status | enum | DEFAULT 'checking' | 播放源状态 |
| resolution | varchar(50) | NULLABLE | 分辨率 |
| format | varchar(50) | NULLABLE | 视频格式 |
| subtitleUrl | text | NULLABLE | 字幕链接 |
| priority | int | DEFAULT 0 | 优先级 |
| isAds | boolean | DEFAULT true | 是否有广告 |
| playCount | int | DEFAULT 0 | 播放次数 |
| description | text | NULLABLE | 描述信息 |
| sourceName | varchar(100) | NULLABLE | 来源名称 |
| isActive | boolean | DEFAULT true | 是否启用 |
| headers | json | NULLABLE | 请求头信息 |
| expireDate | date | NULLABLE | 过期时间 |
| episodeNumber | int | NULLABLE | 剧集号 |
| createdAt | datetime | AUTO | 创建时间 |
| updatedAt | datetime | AUTO | 更新时间 |
| lastCheckedAt | datetime | NULLABLE | 最后检查时间 |
| mediaResourceId | int | FK | 影视资源ID |

#### 枚举值定义
- **PlaySourceType**: online, download, stream, third_party
- **PlaySourceStatus**: active, inactive, error, checking

### 4. 观看历史表 (watch_history)
记录用户的观看历史和进度

| 字段名 | 类型 | 约束 | 描述 |
|--------|------|------|------|
| id | int | PK, AUTO_INCREMENT | 观看记录ID |
| progress | json | NULLABLE | 观看进度信息 |
| watchDuration | int | DEFAULT 0 | 累计观看时长（秒） |
| isCompleted | boolean | DEFAULT false | 是否已看完 |
| episodeNumber | int | NULLABLE | 观看的剧集号 |
| playCount | int | DEFAULT 1 | 播放次数 |
| lastPlayedAt | datetime | NULLABLE | 最后播放时间 |
| playSettings | json | NULLABLE | 播放设置 |
| notes | text | NULLABLE | 用户笔记 |
| createdAt | datetime | AUTO | 创建时间 |
| updatedAt | datetime | AUTO | 更新时间 |
| userId | int | FK | 用户ID |
| mediaResourceId | int | FK | 影视资源ID |

#### JSON字段结构说明
- **progress**: {currentTime: number, duration: number, percentage: number}
- **playSettings**: {volume: number, playbackRate: number, quality: string, subtitleLanguage: string}

## 表关系说明

### 关系图
```
users ──┬─ favorites (多对多) ── media_resources
        │
        ├─ configured_play_sources (多对多) ── play_sources
        │
        └─ watch_history (一对多)

media_resources ── play_sources (一对多)

media_resources ── watch_history (一对多)
```

### 关系详细说明

1. **用户-影视资源** (多对多)
   - 一个用户可以收藏多个影视资源
   - 一个影视资源可以被多个用户收藏
   - 关联表：user_favorites_media_resources

2. **用户-播放源** (多对多)
   - 一个用户可以配置多个播放源
   - 一个播放源可以被多个用户配置
   - 关联表：user_configured_play_sources

3. **用户-观看历史** (一对多)
   - 一个用户有多条观看历史记录
   - 一条观看历史记录只属于一个用户

4. **影视资源-播放源** (一对多)
   - 一个影视资源有多个播放源
   - 一个播放源只属于一个影视资源

5. **影视资源-观看历史** (一对多)
   - 一个影视资源有多条观看历史记录
   - 一条观看历史记录只属于一个影视资源

## 索引设计建议

### 主键索引
所有表的主键id自动创建索引

### 唯一索引
- users.username
- users.email
- media_resources.title (可选，根据业务需求)

### 普通索引
- watch_history.userId
- watch_history.mediaResourceId
- play_sources.mediaResourceId
- play_sources.status
- media_resources.type
- media_resources.isActive

### 复合索引
- watch_history (userId, lastPlayedAt) - 用于查询用户最近观看
- media_resources (type, rating) - 用于按类型和评分排序
- play_sources (mediaResourceId, priority) - 用于查询影视资源的播放源

## 性能优化建议

1. **读写分离**
   - 读操作（查询影视资源、观看历史）使用从库
   - 写操作（用户注册、添加观看历史）使用主库

2. **缓存策略**
   - 热门影视资源缓存到Redis
   - 用户会话信息缓存到Redis
   - 播放源状态缓存到Redis

3. **分表分库**
   - 观看历史表按用户ID分表
   - 影视资源表按类型分库

4. **数据归档**
   - 定期归档过期的观看历史
   - 定期清理无效的播放源

## 安全考虑

1. **敏感数据保护**
   - 用户密码使用bcrypt加密存储
   - 用户个人信息脱敏显示

2. **权限控制**
   - 基于角色的访问控制（RBAC）
   - 敏感操作需要二次验证

3. **数据验证**
   - 所有输入数据进行格式验证
   - 防止SQL注入攻击

4. **审计日志**
   - 记录用户关键操作
   - 记录系统异常情况

## 扩展性考虑

1. **预留字段**
   - 各表都有metadata等JSON字段存储扩展信息
   - 预留足够的VARCHAR长度用于未来需求

2. **模块化设计**
   - 表结构设计支持功能模块化扩展
   - 关系设计支持新的业务场景

3. **国际化支持**
   - 字符集使用utf8mb4支持emoji
   - 时间字段支持时区

4. **版本兼容**
   - 新增字段设置默认值
   - 不删除已有字段，只标记为废弃