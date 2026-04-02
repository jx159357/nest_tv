# API 接口文档

## 概述
本文档详细描述了 NestTV 影视管理系统的 API 接口，包括用户认证、影视资源管理、播放源处理和观看历史等功能。

## 基础信息

### 服务地址
- 开发环境: 默认 `http://localhost:3334`
- 生产环境: `https://api.nesttv.com`

> 当前后端默认监听 `3334`；如果端口被占用，会自动顺延到下一个可用端口，请以启动日志为准。

### 认证方式
- **JWT Token**: 在请求头中添加 `Authorization: Bearer <token>`
- **Token 类型**: Access Token（当前登录接口返回 `accessToken`）

### 响应格式
当前实现没有强制统一的 `statusCode/message/data` 外层包装。

- 用户资料接口通常直接返回 DTO 对象
- 搜索建议 / 搜索历史通常直接返回数组或简单对象
- 下载任务接口通常直接返回分页对象或任务对象

### 错误码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 500 | 服务器内部错误 |

---

## 1. 用户认证模块

### 1.1 用户注册
**POST** `/users/register`

**请求参数：**
```json
{
  "username": "string",     // 用户名，3-50字符
  "password": "string",     // 密码，6-30字符
  "email": "string",       // 邮箱，有效邮箱格式
  "phone": "string",       // 手机号，可选
  "nickname": "string"     // 昵称，可选
}
```

**响应示例：**
```json
{
  "id": 1,
  "username": "mediauser",
  "email": "media@streaming-platform.com",
  "phone": "13800138000",
  "nickname": "测试用户",
  "role": "user",
  "isActive": true,
  "createdAt": "2024-08-28T12:00:00.000Z"
}
```

### 1.2 用户登录
**POST** `/users/login`

**请求参数：**
```json
{
  "identifier": "string",   // 用户名或邮箱
  "password": "string"     // 密码
}
```

**响应示例：**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

### 1.3 获取用户信息
**GET** `/users/profile`

**请求头：**
```
Authorization: Bearer <access_token>
```

**响应示例：**
```json
{
  "id": 1,
  "username": "mediauser",
  "email": "media@streaming-platform.com",
  "phone": "13800138000",
  "nickname": "测试用户",
  "role": "user",
  "isActive": true,
  "avatar": "https://cdn.streaming-platform.com/avatars/user1.jpg",
  "lastLoginAt": "2024-08-28T12:00:00.000Z",
  "createdAt": "2024-08-28T10:00:00.000Z"
}
```

### 1.4 更新用户资料与推荐偏好
**PUT** `/users/profile`

**请求头：**
```
Authorization: Bearer <access_token>
```

**请求参数：**
```json
{
  "nickname": "星际影迷",
  "phone": "13800000000",
  "avatar": "https://example.com/avatar.png",
  "recommendationSettings": {
    "preferredTypes": ["movie", "tv_series"],
    "preferredGenres": ["科幻", "悬疑"],
    "excludedGenres": ["恐怖"],
    "preferredKeywords": ["太空", "时间循环"],
    "freshnessBias": "balanced"
  }
}
```

### 1.5 修改密码
**PUT** `/users/change-password`

**请求头：**
```
Authorization: Bearer <access_token>
```

**请求参数：**
```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

---

## 2. 媒体 / 搜索 / 推荐 / 下载任务模块（当前实现）

### 2.1 获取媒体列表
**GET** `/media`

**常用查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize / limit | number | 否 | 每页数量 |
| type | string | 否 | 影视类型 |
| keyword | string | 否 | 关键词过滤 |

### 2.2 获取媒体详情
**GET** `/media/:id`

### 2.3 媒体搜索与收藏
- **GET** `/media/search?keyword=沙丘`
- **GET** `/media/favorites?page=1&limit=12`（需要 JWT）
- **POST** `/media/:id/favorites`（需要 JWT）
- **DELETE** `/media/:id/favorites`（需要 JWT）
- **GET** `/media/:id/favorites/status`（需要 JWT）

### 2.4 搜索建议与搜索历史（需要 JWT）
- **GET** `/search/suggestions?keyword=沙丘&limit=6`
- **GET** `/search/popular-keywords?limit=8`
- **GET** `/search/history?limit=8`
- **POST** `/search/history`
- **DELETE** `/search/history`
- **GET** `/search/related-keywords/沙丘?limit=6`
- **POST** `/search/advanced`
- **POST** `/search/smart?query=2024%20科幻片`

### 2.5 推荐接口
- **GET** `/recommendations/personalized?limit=8`（需要 JWT）
- **GET** `/recommendations/personalized-detailed?limit=8`（需要 JWT）
- **GET** `/recommendations/profile`（需要 JWT）
- **GET** `/recommendations/trending?limit=8`（当前控制器同样挂在 JWT 守卫下）
- **GET** `/recommendations/latest?limit=8`（当前控制器同样挂在 JWT 守卫下）
- **GET** `/recommendations/top-rated?limit=8`（当前控制器同样挂在 JWT 守卫下）

### 2.6 下载任务接口（需要 JWT）
- **GET** `/download-tasks/user/me?page=1&limit=20`
- **GET** `/download-tasks/user/me/stats`
- **POST** `/download-tasks`
- **PATCH** `/download-tasks/:clientId`
- **DELETE** `/download-tasks/:clientId`
- **DELETE** `/download-tasks/user/me/completed`

---

## 3. 播放源模块（当前实现）

### 3.1 获取播放源列表
**GET** `/play-sources`

**常用查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，从 1 开始 |
| pageSize | number | 否 | 每页数量 |
| mediaResourceId | number | 否 | 媒体资源 ID |
| type | string | 否 | 播放源类型 |
| quality / resolution | string | 否 | 清晰度筛选 |
| isActive | boolean | 否 | 是否启用 |
| search | string | 否 | URL / 描述模糊搜索 |

### 3.2 获取媒体的播放源与最佳源
- **GET** `/play-sources/media/:mediaId`
- **GET** `/play-sources/media/:mediaId/best`

### 3.3 管理播放源（需要 JWT）
- **POST** `/play-sources`
- **PUT** `/play-sources/:id`
- **DELETE** `/play-sources/:id`
- **PUT** `/play-sources/:id/validate`
- **PATCH** `/play-sources/:id/validate`

---

## 4. 观看历史模块（当前实现）

### 4.1 创建或更新观看历史（需要 JWT）
**POST** `/watch-history`

**请求体示例：**
```json
{
  "mediaResourceId": 1,
  "currentTime": 1800,
  "duration": 3600,
  "isCompleted": false
}
```

### 4.2 获取观看历史与继续观看（需要 JWT）
- **GET** `/watch-history/user/me?page=1&limit=10`
- **GET** `/watch-history/user/me/continue?limit=10`
- **GET** `/watch-history/user/me/completed?page=1&limit=10`
- **GET** `/watch-history/user/me/stats`

### 4.3 更新进度 / 完成状态 / 清空历史（需要 JWT）
- **PATCH** `/watch-history/progress?mediaResourceId=1&currentTime=1800&duration=3600`
- **PATCH** `/watch-history/:id`
- **PATCH** `/watch-history/:id/complete`
- **DELETE** `/watch-history/:id`
- **DELETE** `/watch-history/user/me/all`

### 4.4 管理态查询
- **GET** `/watch-history`
- **GET** `/watch-history/:id`
- **GET** `/watch-history/user/:userId/media/:mediaResourceId`

---

## 5. 收藏与媒体互动（已并入媒体模块）

当前实现没有独立的 `/favorites` 控制器，收藏能力统一挂在 `/media/*` 路由下：

- **GET** `/media/favorites?page=1&limit=12`（需要 JWT）
- **POST** `/media/:id/favorites`（需要 JWT）
- **DELETE** `/media/:id/favorites`（需要 JWT）
- **GET** `/media/:id/favorites/status`（需要 JWT）
- **GET** `/media/:id/similar?limit=6`
- **PUT** `/media/:id/views`
- **GET** `/media/statistics`

---

## 6. 管理员模块（当前实现，需 JWT + AdminRoleGuard）

### 6.1 系统与权限管理
- **GET** `/admin/stats`
- **GET** `/admin/health`
- **POST** `/admin/roles`
- **GET** `/admin/roles`
- **PATCH** `/admin/roles/:id`
- **POST** `/admin/permissions`
- **GET** `/admin/permissions`
- **PATCH** `/admin/permissions/:id`

### 6.2 后台列表与运维查询
- **GET** `/admin/logs?page=1&limit=20`
- **GET** `/admin/users?page=1&limit=20&search=keyword`
- **GET** `/admin/media?page=1&limit=20&type=movie&search=keyword`
- **GET** `/admin/play-sources?page=1&limit=20&search=keyword`
- **GET** `/admin/watch-history?page=1&limit=20&userId=1`
- **GET** `/admin/download-tasks?page=1&limit=20&status=downloading`

### 6.3 管理员模块说明
- 当前 `admin` 控制器以后台统计、角色权限、日志、用户、媒体、播放源、观看历史、下载任务查询为主。
- 这些接口当前偏“运营台 / 运维台”用途，适合前端后台页做排查与只读分析。

---

## 7. 弹幕 / 实时相关接口（当前以 REST 为主）

### 7.1 弹幕核心接口
- **POST** `/danmaku`
- **POST** `/danmaku/bulk`
- **GET** `/danmaku`
- **POST** `/danmaku/search`
- **GET** `/danmaku/:id`
- **DELETE** `/danmaku/:id`
- **DELETE** `/danmaku/:id/hard`
- **DELETE** `/danmaku/clean`

### 7.2 弹幕查询与分析接口
- **GET** `/danmaku/popular`
- **GET** `/danmaku/user/me`
- **GET** `/danmaku/media/:mediaResourceId`
- **GET** `/danmaku/stats`
- **POST** `/danmaku/import`
- **POST** `/danmaku/advanced-search`
- **GET** `/danmaku/trends`
- **GET** `/danmaku/leaderboard/users`
- **GET** `/danmaku/keywords/cloud`
- **GET** `/danmaku/suggestions`
- **GET** `/danmaku/health`

### 7.3 实时与管理相关接口
- **GET** `/danmaku/realtime/rooms/:videoId`
- **PUT** `/danmaku/:id/highlight`
- **GET** `/danmaku/:id/reports`
- **POST** `/danmaku/:id/report`
- **GET** `/danmaku/filter/rules`
- **PUT** `/danmaku/filter/rules`

### 7.4 当前实时能力说明
- 仓库里存在弹幕实时房间信息与健康状态接口，但完整 WebSocket 网关尚未完全接好。
- `GET /danmaku/realtime/rooms/:videoId` 当前更像占位/桥接接口，返回结构存在，但真实在线人数和消息数仍待网关集成。
- 因此当前文档应理解为“弹幕 REST 能力已存在，WebSocket 实时推送仍是半集成状态”。

---

## 8. 错误处理

### 8.1 标准错误响应
```json
{
  "statusCode": 400,
  "message": "参数验证失败",
  "error": "Bad Request",
  "details": [
    {
      "property": "username",
      "message": "用户名不能为空"
    }
  ]
}
```

### 8.2 常见错误
| 错误码 | 错误信息 | 说明 |
|--------|----------|------|
| 400001 | 用户名已存在 | 注册时用户名重复 |
| 400002 | 邮箱已存在 | 注册时邮箱重复 |
| 400003 | 密码格式错误 | 密码不符合要求 |
| 401001 | 用户名或密码错误 | 登录失败 |
| 401002 | Token 已过期 | 需要重新登录 |
| 401003 | Token 无效 | Token 格式错误 |
| 404001 | 影视资源不存在 | 查询的影视资源不存在 |
| 404002 | 播放源不存在 | 查询的播放源不存在 |
| 409001 | 用户已收藏 | 重复收藏操作 |

---

## 9. 接口版本控制

### 9.1 版本路径
- 当前实现: 业务接口没有统一的 `/api/v1` 前缀
- Swagger 入口: `/api`
- 示例: `GET /media`

### 9.2 版本兼容性
- 主要版本号变更可能导致不兼容
- 次要版本号向后兼容
- 修订版本号修复bug

---

## 10. 接口测试

### 10.1 测试工具
推荐使用 Postman 或 curl 进行接口测试

### 10.2 测试示例
```bash
# 用户注册
curl -X POST http://localhost:3334/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456","email":"test@example.com"}'

# 用户登录
curl -X POST http://localhost:3334/users/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test","password":"123456"}'

# 获取媒体列表
curl -X GET http://localhost:3334/media \
  -H "Authorization: Bearer <token>"

# 获取搜索建议
curl -X GET "http://localhost:3334/search/suggestions?keyword=%E6%B2%99%E4%B8%98&limit=6" \
  -H "Authorization: Bearer <token>"
```

---

## 11. 性能优化

### 11.1 分页
- 所有列表接口支持分页
- 默认每页10条，最大100条

### 11.2 缓存
- 影视资源列表缓存5分钟
- 播放源状态缓存1分钟
- 用户信息缓存30分钟

### 11.3 压缩
- 响应数据启用gzip压缩
- 大文件支持分片传输

---

*本文档已按当前仓库实现校对；后续若有差异，请以控制器代码与 Swagger 输出为准。*
