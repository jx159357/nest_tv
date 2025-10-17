# API 接口文档

## 概述
本文档详细描述了 NestTV 影视管理系统的 API 接口，包括用户认证、影视资源管理、播放源处理和观看历史等功能。

## 基础信息

### 服务地址
- 开发环境: `http://localhost:3000`
- 生产环境: `https://api.nesttv.com`

### 认证方式
- **JWT Token**: 在请求头中添加 `Authorization: Bearer <token>`
- **Token 类型**: Access Token (1小时有效期) + Refresh Token (7天有效期)

### 响应格式
```json
{
  "statusCode": number,
  "message": string,
  "data": any
}
```

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
  "statusCode": 201,
  "message": "用户注册成功",
  "data": {
    "id": 1,
    "username": "mediauser",
    "email": "media@streaming-platform.com",
    "phone": "13800138000",
    "nickname": "测试用户",
    "role": "user",
    "isActive": true,
    "createdAt": "2024-08-28T12:00:00.000Z"
  }
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
  "statusCode": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "role": "user"
    }
  }
}
```

### 1.3 获取用户信息
**POST** `/users/profile`

**请求头：**
```
Authorization: Bearer <access_token>
```

**响应示例：**
```json
{
  "statusCode": 200,
  "message": "获取用户信息成功",
  "data": {
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
}
```

### 1.4 刷新令牌
**POST** `/users/refresh`

**请求参数：**
```json
{
  "refreshToken": "string"   // 刷新令牌
}
```

---

## 2. 影视资源模块（开发中）

### 2.1 获取影视资源列表
**GET** `/media-resources`

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |
| type | string | 否 | 影视类型 |
| sort | string | 否 | 排序方式 |
| order | string | 否 | 排序方向 |

**响应示例：**
```json
{
  "statusCode": 200,
  "message": "获取影视资源列表成功",
  "data": {
    "items": [
      {
        "id": 1,
        "title": "电影名称",
        "description": "电影简介",
        "type": "movie",
        "director": "导演名",
        "actors": "演员1,演员2",
        "genres": ["动作", "冒险"],
        "releaseDate": "2024-01-01",
        "quality": "hd",
        "poster": "https://example.com/poster.jpg",
        "backdrop": "https://example.com/backdrop.jpg",
        "rating": 8.5,
        "viewCount": 1000,
        "isActive": true,
        "source": "豆瓣",
        "episodeCount": null,
        "createdAt": "2024-08-28T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### 2.2 获取影视资源详情
**GET** `/media-resources/:id`

**路径参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 影视资源ID |

**响应示例：**
```json
{
  "statusCode": 200,
  "message": "获取影视资源详情成功",
  "data": {
    "id": 1,
    "title": "电影名称",
    "description": "详细简介",
    "type": "movie",
    "director": "导演名",
    "actors": "演员1,演员2",
    "genres": ["动作", "冒险"],
    "releaseDate": "2024-01-01",
    "quality": "hd",
    "poster": "https://example.com/poster.jpg",
    "backdrop": "https://example.com/backdrop.jpg",
    "rating": 8.5,
    "viewCount": 1000,
    "isActive": true,
    "source": "豆瓣",
    "metadata": {
      "country": "美国",
      "language": "英语",
      "duration": 120
    },
    "episodeCount": null,
    "downloadUrls": [],
    "createdAt": "2024-08-28T12:00:00.000Z",
    "updatedAt": "2024-08-28T12:00:00.000Z"
  }
}
```

### 2.3 搜索影视资源
**GET** `/media-resources/search`

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |

**响应示例：**
```json
{
  "statusCode": 200,
  "message": "搜索成功",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### 2.4 获取分类资源
**GET** `/media-resources/category/:category`

**路径参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 是 | 分类名称 |

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |

---

## 3. 播放源模块（开发中）

### 3.1 获取影视资源的播放源列表
**GET** `/play/sources/:mediaId`

**路径参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mediaId | number | 是 | 影视资源ID |

**响应示例：**
```json
{
  "statusCode": 200,
  "message": "获取播放源列表成功",
  "data": [
    {
      "id": 1,
      "url": "https://cdn.streaming-platform.com/media/movie1-1080p.mp4",
      "type": "online",
      "status": "active",
      "resolution": "1080p",
      "format": "mp4",
      "subtitleUrl": "https://cdn.streaming-platform.com/subtitles/movie1-zh.vtt",
      "priority": 1,
      "isAds": false,
      "playCount": 100,
      "description": "高清无广告",
      "sourceName": "源站1",
      "isActive": true,
      "headers": {
        "User-Agent": "Mozilla/5.0..."
      },
      "expireDate": null,
      "episodeNumber": null,
      "createdAt": "2024-08-28T12:00:00.000Z",
      "lastCheckedAt": "2024-08-28T12:00:00.000Z"
    }
  ]
}
```

### 3.2 添加播放源
**POST** `/play/sources`

**请求头：**
```
Authorization: Bearer <access_token>
```

**请求参数：**
```json
{
  "mediaResourceId": number,
  "url": "string",
  "type": "online",
  "resolution": "string",
  "format": "string",
  "subtitleUrl": "string",
  "priority": number,
  "isAds": boolean,
  "description": "string",
  "sourceName": "string",
  "headers": object,
  "expireDate": "string",
  "episodeNumber": number
}
```

### 3.3 验证播放源有效性
**POST** `/play/sources/validate`

**请求参数：**
```json
{
  "url": "string",
  "headers": object
}
```

**响应示例：**
```json
{
  "statusCode": 200,
  "message": "验证成功",
  "data": {
    "isValid": true,
    "status": "active",
    "resolution": "1080p",
    "format": "mp4",
    "duration": 3600,
    "filesize": 1000000000
  }
}
```

---

## 4. 观看历史模块（开发中）

### 4.1 获取用户观看历史
**GET** `/watch/history`

**请求头：**
```
Authorization: Bearer <access_token>
```

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |

**响应示例：**
```json
{
  "statusCode": 200,
  "message": "获取观看历史成功",
  "data": {
    "items": [
      {
        "id": 1,
        "progress": {
          "currentTime": 1800,
          "duration": 3600,
          "percentage": 50
        },
        "watchDuration": 1800,
        "isCompleted": false,
        "episodeNumber": 1,
        "playCount": 2,
        "lastPlayedAt": "2024-08-28T12:00:00.000Z",
        "playSettings": {
          "volume": 80,
          "playbackRate": 1.0,
          "quality": "1080p",
          "subtitleLanguage": "zh-CN"
        },
        "notes": "很好看的电影",
        "mediaResource": {
          "id": 1,
          "title": "电影名称",
          "type": "movie",
          "poster": "https://example.com/poster.jpg"
        },
        "createdAt": "2024-08-28T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 20,
      "totalPages": 2
    }
  }
}
```

### 4.2 记录观看进度
**POST** `/watch/progress`

**请求头：**
```
Authorization: Bearer <access_token>
```

**请求参数：**
```json
{
  "mediaResourceId": number,
  "progress": {
    "currentTime": number,
    "duration": number,
    "percentage": number
  },
  "watchDuration": number,
  "isCompleted": boolean,
  "episodeNumber": number,
  "playSettings": {
    "volume": number,
    "playbackRate": number,
    "quality": string,
    "subtitleLanguage": string
  },
  "notes": string
}
```

### 4.3 获取影视资源的观看进度
**GET** `/watch/progress/:mediaId`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mediaId | number | 是 | 影视资源ID |

---

## 5. 收藏功能模块（开发中）

### 5.1 获取用户收藏列表
**GET** `/favorites`

**请求头：**
```
Authorization: Bearer <access_token>
```

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |

### 5.2 添加收藏
**POST** `/favorites`

**请求头：**
```
Authorization: Bearer <access_token>
```

**请求参数：**
```json
{
  "mediaResourceId": number
}
```

### 5.3 取消收藏
**DELETE** `/favorites/:mediaId`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mediaId | number | 是 | 影视资源ID |

### 5.4 检查是否已收藏
**GET** `/favorites/check/:mediaId`

**请求头：**
```
Authorization: Bearer <access_token>
```

**路径参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| mediaId | number | 是 | 影视资源ID |

---

## 6. 管理员模块（计划中）

### 6.1 影视资源管理
- 创建、更新、删除影视资源
- 批量导入影视资源
- 设置影视资源状态

### 6.2 播放源管理
- 审核播放源
- 批量验证播放源
- 设置播放源优先级

### 6.3 用户管理
- 用户列表查看
- 用户状态管理
- 权限分配

---

## 7. WebSocket 接口（计划中）

### 7.1 实时播放进度同步
- 同步多个设备的播放进度
- 实时通知播放状态

### 7.2 弹幕系统
- 发送和接收弹幕
- 弹幕过滤和管理

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
- 当前版本: `/api/v1`
- 示例: `GET /api/v1/media-resources`

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
curl -X POST http://localhost:3000/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456","email":"test@example.com"}'

# 用户登录
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test","password":"123456"}'

# 获取影视资源列表
curl -X GET http://localhost:3000/media-resources \
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

*文档最后更新时间：2024年8月28日*