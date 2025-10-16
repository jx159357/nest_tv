# NestJS + Vue3 视频流媒体平台自测文档

## 📋 文档说明

这是一个全面的项目自测文档，涵盖了视频流媒体平台的所有核心功能和性能测试。请按照测试步骤逐一验证，确保项目的完美运行。

**测试环境要求：**
- Node.js 18+ 
- MySQL 8.0+
- Redis 7+
- Docker & Docker Compose (可选)

---

## 🚀 第一部分：环境搭建和配置检查

### 1.1 开发环境准备

#### 1.1.1 检查基础环境
```bash
# 检查 Node.js 版本
node --version  # 应该 >= 18.0.0

# 检查 npm 版本
npm --version   # 应该 >= 8.0.0

# 检查 Git
git --version

# 检查 Docker (可选)
docker --version
docker-compose --version
```

**预期结果：** 所有命令都应该正常返回版本号

#### 1.1.2 克隆和初始化项目
```bash
# 进入项目目录
cd D:\demo_jx\cursor_pro\nest_tv

# 安装后端依赖
cd backend
npm install

# 检查是否有依赖冲突
npm audit

# 安装前端依赖
cd ../frontend
npm install

# 检查前端依赖
npm audit
```

**预期结果：** 
- 所有依赖安装成功，无严重漏洞警告
- 没有 peer dependency 冲突

#### 1.1.3 环境变量配置验证
```bash
# 检查后端环境配置文件
cd backend
cat .env
```

**检查清单：**
- [x] DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD 配置正确
- [x] REDIS_HOST, REDIS_PORT 配置正确 
- [x] JWT_SECRET 已设置且足够复杂
- [x] PORT 设置为 3334
- [x] NODE_ENV 设置正确

### 1.2 数据库和缓存服务验证

#### 1.2.1 使用 Docker 启动服务 (推荐)
```bash
# 启动数据库和缓存服务
docker-compose up -d mysql redis

# 检查服务状态
docker-compose ps

# 查看服务日志
docker-compose logs mysql
docker-compose logs redis
```

**预期结果：**
- MySQL 容器状态为 "healthy"
- Redis 容器状态为 "healthy"
- 没有错误日志

#### 1.2.2 手动启动服务 (备选方案)
```bash
# MySQL 连接测试
mysql -h localhost -P 3306 -u root -p

# Redis 连接测试  
redis-cli ping
```

**预期结果：**
- MySQL 连接成功，能执行 SQL 查询
- Redis 返回 "PONG"

### 1.3 项目构建验证

#### 1.3.1 后端构建测试
```bash
cd backend

# TypeScript 类型检查
npm run type-check

# ESLint 代码检查
npm run lint:check

# 构建项目
npm run build

# 检查构建输出
ls -la dist/
```

**预期结果：**
- 无 TypeScript 类型错误
- 无 ESLint 错误
- 构建成功，dist/ 目录包含编译后的文件

#### 1.3.2 前端构建测试
```bash
cd frontend

# TypeScript 类型检查
npm run type-check

# ESLint 代码检查
npm run lint:check

# 构建项目
npm run build

# 检查构建输出
ls -la dist/
```

**预期结果：**
- 无 TypeScript 类型错误
- 无 ESLint 错误
- 构建成功，dist/ 目录包含静态资源

---

## 🔌 第二部分：数据库和缓存连接测试

### 2.1 数据库连接和表结构验证

#### 2.1.1 启动后端服务
```bash
cd backend
npm run start:dev
```

**观察启动日志：**
- [x] TypeORM 成功连接到 MySQL
- [x] 数据库表自动创建成功
- [x] Redis 连接建立成功
- [x] 服务在端口 3334 启动成功

#### 2.1.2 数据库表结构检查
```bash
# 连接到 MySQL 数据库
mysql -h localhost -P 3306 -u root -p nest_tv

# 查看所有表
SHOW TABLES;

# 检查核心表结构
DESCRIBE users;
DESCRIBE media_resources;
DESCRIBE play_sources;
DESCRIBE watch_histories;
DESCRIBE recommendations;
```

**预期结果：**
- 所有核心表都存在
- 表结构包含必要的字段和索引
- 外键关系配置正确

#### 2.1.3 Redis 缓存功能测试
```bash
# 连接到 Redis
redis-cli

# 查看缓存键
KEYS *

# 测试缓存操作
SET test_key "test_value"
GET test_key
DEL test_key
```

**预期结果：**
- Redis 连接正常
- 缓存读写操作成功

### 2.2 健康检查端点测试

#### 2.2.1 API 健康检查
```bash
# 基础健康检查
curl http://localhost:3334/api

# 数据库健康检查
curl http://localhost:3334/api/health

# 检查 API 文档
curl http://localhost:3334/api-docs
```

**预期结果：**
- API 返回 200 状态码
- 健康检查显示所有服务正常
- Swagger 文档可正常访问

---

## 🔐 第三部分：用户认证系统测试

### 3.1 用户注册功能测试

#### 3.1.1 注册新用户
```bash
# 测试用户注册
curl -X POST http://localhost:3334/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456!"
  }'
```

**预期结果：**
- 返回 201 状态码
- 响应包含用户信息（不包含密码）
- 数据库中创建了新用户记录

#### 3.1.2 注册验证测试
```bash
# 测试重复用户名
curl -X POST http://localhost:3334/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test2@example.com", 
    "password": "Test123456!"
  }'

# 测试重复邮箱
curl -X POST http://localhost:3334/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "email": "test@example.com",
    "password": "Test123456!"
  }'

# 测试无效密码
curl -X POST http://localhost:3334/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser3",
    "email": "test3@example.com",
    "password": "123"
  }'
```

**预期结果：**
- 重复用户名/邮箱返回 409 Conflict
- 无效密码返回 400 Bad Request
- 错误消息明确指出问题

### 3.2 用户登录功能测试

#### 3.2.1 正常登录测试
```bash
# 使用用户名登录
curl -X POST http://localhost:3334/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456!"
  }'

# 保存返回的 token 用于后续测试
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**预期结果：**
- 返回 200 状态码
- 响应包含 JWT token
- token 有效期为 24 小时

#### 3.2.2 登录失败测试
```bash
# 错误密码
curl -X POST http://localhost:3334/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "wrongpassword"
  }'

# 不存在的用户
curl -X POST http://localhost:3334/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nonexistentuser",
    "password": "Test123456!"
  }'
```

**预期结果：**
- 错误登录返回 401 Unauthorized
- 错误消息不泄露敏感信息

### 3.3 JWT Token 验证测试

#### 3.3.1 受保护路由测试
```bash
# 不带 token 访问受保护路由
curl http://localhost:3334/users/profile

# 带有效 token 访问
curl http://localhost:3334/users/profile \
  -H "Authorization: Bearer $JWT_TOKEN"

# 带无效 token 访问
curl http://localhost:3334/users/profile \
  -H "Authorization: Bearer invalid_token"
```

**预期结果：**
- 无 token 访问返回 401
- 有效 token 返回用户信息
- 无效 token 返回 401

#### 3.3.2 Token 过期测试
```bash
# 生成一个过期的 token 进行测试（需要修改 JWT_EXPIRES_IN 为较短时间）
# 等待 token 过期后测试
curl http://localhost:3334/users/profile \
  -H "Authorization: Bearer $EXPIRED_TOKEN"
```

**预期结果：**
- 过期 token 返回 401
- 错误消息指示 token 已过期

---

## 📺 第四部分：媒体资源管理测试

### 4.1 媒体资源创建测试

#### 4.1.1 创建电影资源
```bash
# 创建电影
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "阿凡达2：水之道",
    "description": "杰克·萨利再次回归，继续在潘多拉星球上的冒险故事。",
    "type": "movie",
    "director": "詹姆斯·卡梅隆",
    "actors": "萨姆·沃辛顿,佐伊·索尔达娜,西格妮·韦弗",
    "genres": ["科幻", "冒险", "动作"],
    "releaseDate": "2022-12-16T00:00:00.000Z",
    "quality": "hd",
    "poster": "https://example.com/avatar2-poster.jpg",
    "backdrop": "https://example.com/avatar2-backdrop.jpg",
    "rating": 8.5,
    "source": "示例数据",
    "episodeCount": 1,
    "downloadUrls": ["https://example.com/avatar2-torrent.mp4"]
  }'
```

**预期结果：**
- 返回 201 状态码
- 响应包含创建的媒体资源信息
- 数据库中正确保存了媒体记录

#### 4.1.2 创建电视剧资源
```bash
# 创建电视剧
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "权力的游戏",
    "description": "基于乔治·R·R·马丁的奇幻小说改编的史诗级电视剧。",
    "type": "tv_series",
    "director": "大卫·贝尼奥夫,D·B·威斯",
    "actors": "艾米莉亚·克拉克,基特·哈灵顿,彼特·丁拉基",
    "genres": ["奇幻", "剧情", "冒险"],
    "releaseDate": "2011-04-17T00:00:00.000Z",
    "quality": "hd",
    "poster": "https://example.com/got-poster.jpg",
    "backdrop": "https://example.com/got-backdrop.jpg",
    "rating": 9.2,
    "source": "示例数据",
    "episodeCount": 73,
    "downloadUrls": ["https://example.com/got-s1.torrent"]
  }'
```

#### 4.1.3 数据验证测试
```bash
# 测试必填字段
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "",
    "type": "invalid_type"
  }'

# 测试字段长度限制
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "a".repeat(1000),
    "type": "movie"
  }'
```

**预期结果：**
- 无效数据返回 400 Bad Request
- 错误消息详细说明验证失败的字段

### 4.2 媒体资源查询测试

#### 4.2.1 获取媒体列表
```bash
# 获取所有媒体
curl "http://localhost:3334/media" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 按类型筛选
curl "http://localhost:3334/media?type=movie" \
  -H "Authorization: Bearer $JWT_TOKEN"

curl "http://localhost:3334/media?type=tv_series" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 按评分筛选
curl "http://localhost:3334/media?minRating=8.5" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 分页查询
curl "http://localhost:3334/media?page=1&limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**预期结果：**
- 返回符合条件的媒体列表
- 分页信息正确
- 排序和筛选功能正常

#### 4.2.2 媒体详情查询
```bash
# 获取单个媒体详情
curl "http://localhost:3334/media/1" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 获取不存在的媒体
curl "http://localhost:3334/media/999999" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**预期结果：**
- 存在的媒体返回完整信息
- 不存在的媒体返回 404

#### 4.2.3 热门媒体查询
```bash
# 获取热门媒体
curl "http://localhost:3334/media/popular" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 获取最新媒体
curl "http://localhost:3334/media/latest" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 4.3 媒体资源更新和删除测试

#### 4.3.1 更新媒体信息
```bash
# 更新媒体信息
curl -X PATCH http://localhost:3334/media/1 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 9.0,
    "description": "更新后的描述信息"
  }'
```

#### 4.3.2 删除媒体资源
```bash
# 删除媒体
curl -X DELETE http://localhost:3334/media/1 \
  -H "Authorization: Bearer $JWT_TOKEN"

# 验证删除结果
curl "http://localhost:3334/media/1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**预期结果：**
- 更新成功返回 200
- 删除成功返回 204
- 删除后查询返回 404

### 4.4 收藏功能测试

#### 4.4.1 添加收藏
```bash
# 添加到收藏
curl -X POST http://localhost:3334/media/2/favorites \
  -H "Authorization: Bearer $JWT_TOKEN"

# 获取用户收藏列表
curl "http://localhost:3334/users/favorites" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 4.4.2 取消收藏
```bash
# 取消收藏
curl -X DELETE http://localhost:3334/media/2/favorites \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**预期结果：**
- 收藏操作成功
- 收藏列表正确更新
- 重复收藏应有适当处理

---

## 🎬 第五部分：播放源和视频播放测试

### 5.1 播放源管理测试

#### 5.1.1 创建播放源
```bash
# 为媒体添加播放源
curl -X POST http://localhost:3334/play-sources \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaResourceId": 2,
    "type": "online",
    "name": "高清在线播放",
    "url": "https://example.com/dark-knight-720p.mp4",
    "resolution": "720p",
    "language": "中文",
    "subtitle": "https://example.com/dark-knight.srt",
    "priority": 1,
    "isActive": true,
    "status": "active",
    "playCount": 0
  }'
```

**预期结果：**
- 播放源创建成功
- 返回播放源详细信息

#### 5.1.2 查询播放源
```bash
# 获取指定媒体的播放源
curl "http://localhost:3334/play-sources/media/2" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 获取最佳播放源
curl "http://localhost:3334/play-sources/media/2/best" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 按条件筛选播放源
curl "http://localhost:3334/play-sources?resolution=720p&language=中文" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**预期结果：**
- 返回符合条件的播放源列表
- 最佳播放源选择逻辑正确
- 按优先级和质量排序

#### 5.1.3 播放源状态管理
```bash
# 更新播放源状态
curl -X PATCH http://localhost:3334/play-sources/1 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "inactive"
  }'

# 增加播放次数
curl -X POST http://localhost:3334/play-sources/1/play \
  -H "Authorization: Bearer $JWT_TOKEN"
```

### 5.2 视频播放功能测试

#### 5.2.1 播放记录测试
```bash
# 开始播放
curl -X POST http://localhost:3334/watch-history \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaResourceId": 2,
    "playSourceId": 1,
    "watchedDuration": 0,
    "totalDuration": 7200
  }'

# 更新播放进度
curl -X PATCH http://localhost:3334/watch-history/1 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "watchedDuration": 1800,
    "watchProgress": 0.25
  }'
```

#### 5.2.2 播放历史查询
```bash
# 获取用户播放历史
curl "http://localhost:3334/watch-history/user" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 获取指定媒体的播放历史
curl "http://localhost:3334/watch-history/media/2" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 获取最近播放记录
curl "http://localhost:3334/watch-history/recent" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**预期结果：**
- 播放记录准确保存
- 进度更新正常
- 历史记录查询正确

### 5.3 多种播放源类型测试

#### 5.3.1 在线播放源测试
```bash
# 测试 HTTP/HTTPS 视频链接
curl -X POST http://localhost:3334/play-sources \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaResourceId": 2,
    "type": "online",
    "name": "HTTP 直链",
    "url": "https://example.com/video.mp4",
    "resolution": "1080p"
  }'
```

#### 5.3.2 流媒体播放源测试
```bash
# 测试 HLS 流
curl -X POST http://localhost:3334/play-sources \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaResourceId": 2,
    "type": "hls",
    "name": "HLS 流媒体",
    "url": "https://example.com/video.m3u8",
    "resolution": "adaptive"
  }'

# 测试 DASH 流
curl -X POST http://localhost:3334/play-sources \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaResourceId": 2,
    "type": "dash",
    "name": "DASH 流媒体",
    "url": "https://example.com/video.mpd",
    "resolution": "adaptive"
  }'
```

#### 5.3.3 种子下载源测试
```bash
# 测试磁力链接
curl -X POST http://localhost:3334/play-sources \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaResourceId": 2,
    "type": "torrent",
    "name": "BT 下载",
    "url": "magnet:?xt=urn:btih:example...",
    "resolution": "1080p"
  }'
```

---

## 🎯 第六部分：推荐系统和高级功能测试

### 6.1 推荐算法测试

#### 6.1.1 基于用户行为的推荐
```bash
# 获取个性化推荐
curl "http://localhost:3334/recommendations/user" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 获取基于观看历史的推荐
curl "http://localhost:3334/recommendations/based-on-history" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 获取相似用户推荐
curl "http://localhost:3334/recommendations/similar-users" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 6.1.2 基于内容的推荐
```bash
# 获取相似内容推荐
curl "http://localhost:3334/recommendations/similar/2" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 获取同类型推荐
curl "http://localhost:3334/recommendations/same-genre/2" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 获取相同导演/演员推荐
curl "http://localhost:3334/recommendations/same-director/2" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 6.1.3 推荐结果评估
```bash
# 推荐反馈 - 喜欢
curl -X POST http://localhost:3334/recommendations/feedback \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaResourceId": 2,
    "rating": 5,
    "action": "like"
  }'

# 推荐反馈 - 不感兴趣
curl -X POST http://localhost:3334/recommendations/feedback \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaResourceId": 3,
    "rating": 1,
    "action": "dislike"
  }'
```

**预期结果：**
- 推荐结果合理且多样化
- 推荐算法考虑了用户偏好
- 反馈机制正常工作

### 6.2 高级搜索功能测试

#### 6.2.1 全文搜索测试
```bash
# 搜索电影标题
curl "http://localhost:3334/media/search?query=阿凡达" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 搜索演员
curl "http://localhost:3334/media/search?query=萨姆·沃辛顿" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 搜索导演
curl "http://localhost:3334/media/search?query=詹姆斯·卡梅隆" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 模糊搜索
curl "http://localhost:3334/media/search?query=阿凡" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 6.2.2 高级筛选测试
```bash
# 组合筛选条件
curl "http://localhost:3334/media/advanced-search" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "genres": ["科幻", "动作"],
    "releaseYear": "2022",
    "minRating": 8.0,
    "type": "movie",
    "sortBy": "rating",
    "sortOrder": "desc"
  }'

# 年份范围筛选
curl "http://localhost:3334/media/advanced-search" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "releaseYearRange": {
      "start": "2020",
      "end": "2023"
    },
    "minRating": 7.0
  }'
```

#### 6.2.3 搜索性能测试
```bash
# 大数据量搜索测试
curl "http://localhost:3334/media/search?query=&page=1&limit=100" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 复杂查询性能测试
curl "http://localhost:3334/media/advanced-search" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "genres": ["科幻", "动作", "冒险"],
    "actors": ["萨姆·沃辛顿"],
    "minRating": 7.0,
    "sortBy": "releaseDate",
    "sortOrder": "desc",
    "page": 1,
    "limit": 50
  }'
```

**预期结果：**
- 搜索结果准确且相关
- 响应时间在可接受范围内（< 2秒）
- 分页和排序功能正常

### 6.3 爬虫和数据采集测试

#### 6.3.1 爬虫目标管理
```bash
# 获取爬虫目标列表
curl "http://localhost:3334/crawler/targets" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 添加爬虫目标
curl -X POST http://localhost:3334/crawler/targets \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "示例影视网站",
    "baseUrl": "https://example-movie-site.com",
    "isActive": true,
    "crawlConfig": {
      "selectors": {
        "title": ".movie-title",
        "description": ".movie-desc",
        "poster": ".movie-poster img"
      }
    }
  }'
```

#### 6.3.2 爬虫任务执行
```bash
# 启动爬虫任务
curl -X POST http://localhost:3334/crawler/crawl \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetId": 1,
    "depth": 2,
    "maxPages": 100
  }'

# 获取爬虫任务状态
curl "http://localhost:3334/crawler/tasks/1" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 获取爬虫日志
curl "http://localhost:3334/crawler/tasks/1/logs" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 6.3.3 数据采集结果验证
```bash
# 获取采集到的数据
curl "http://localhost:3334/crawler/results?taskId=1" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 数据质量检查
curl "http://localhost:3334/crawler/data-quality?taskId=1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**预期结果：**
- 爬虫任务正常启动和执行
- 数据采集准确且格式正确
- 错误处理和重试机制正常

---

## 👥 第七部分：管理后台功能测试

### 7.1 管理员认证测试

#### 7.1.1 管理员登录
```bash
# 创建管理员账号（如果不存在）
curl -X POST http://localhost:3334/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin123456!"
  }'

# 管理员登录
curl -X POST http://localhost:3334/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123456!"
  }'

# 保存管理员 token
export ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### 7.1.2 权限验证测试
```bash
# 普通用户访问管理接口应该被拒绝
curl "http://localhost:3334/admin/users" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 管理员访问应该成功
curl "http://localhost:3334/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**预期结果：**
- 普通用户访问管理接口返回 403 Forbidden
- 管理员访问正常返回数据

### 7.2 用户管理功能测试

#### 7.2.1 用户列表和搜索
```bash
# 获取所有用户
curl "http://localhost:3334/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 按用户名搜索
curl "http://localhost:3334/admin/users?search=test" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 按角色筛选
curl "http://localhost:3334/admin/users?role=user" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 分页获取用户
curl "http://localhost:3334/admin/users?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 7.2.2 用户状态管理
```bash
# 禁用用户
curl -X PATCH http://localhost:3334/admin/users/3 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'

# 启用用户
curl -X PATCH http://localhost:3334/admin/users/3 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": true
  }'

# 重置用户密码
curl -X POST http://localhost:3334/admin/users/3/reset-password \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 7.2.3 角色权限管理
```bash
# 修改用户角色
curl -X PATCH http://localhost:3334/admin/users/3 \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "moderator"
  }'

# 获取角色列表
curl "http://localhost:3334/admin/roles" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**预期结果：**
- 用户管理操作正常执行
- 状态变更立即生效
- 权限控制准确

### 7.3 媒体内容管理测试

#### 7.3.1 媒体审核功能
```bash
# 获取待审核媒体
curl "http://localhost:3334/admin/media/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 审核通过
curl -X POST http://localhost:3334/admin/media/2/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 审核拒绝
curl -X POST http://localhost:3334/admin/media/3/reject \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "内容不符合平台规范"
  }'
```

#### 7.3.2 批量管理操作
```bash
# 批量删除媒体
curl -X DELETE http://localhost:3334/admin/media/batch \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaIds": [4, 5, 6]
  }'

# 批量更新媒体状态
curl -X PATCH http://localhost:3334/admin/media/batch \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaIds": [7, 8, 9],
    "status": "published"
  }'
```

#### 7.3.3 内容统计和分析
```bash
# 获取媒体统计信息
curl "http://localhost:3334/admin/media/statistics" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 获取热门内容报告
curl "http://localhost:3334/admin/media/popular-report" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 获取用户行为分析
curl "http://localhost:3334/admin/analytics/user-behavior" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 7.4 系统监控和日志

#### 7.4.1 系统状态监控
```bash
# 获取系统健康状态
curl "http://localhost:3334/admin/system/health" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 获取系统性能指标
curl "http://localhost:3334/admin/system/metrics" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 获取数据库状态
curl "http://localhost:3334/admin/system/database-status" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 7.4.2 日志管理
```bash
# 获取系统日志
curl "http://localhost:3334/admin/logs?level=error&limit=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 获取用户操作日志
curl "http://localhost:3334/admin/logs/user-actions" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 获取API调用日志
curl "http://localhost:3334/admin/logs/api-calls" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**预期结果：**
- 监控数据准确反映系统状态
- 日志记录完整且可查询
- 报告和统计数据正确

---

## ⚡ 第八部分：性能和压力测试

### 8.1 API 性能基准测试

#### 8.1.1 单接口性能测试
使用 `ab` (Apache Bench) 或 `hey` 工具进行测试：

```bash
# 安装性能测试工具
npm install -g artillery

# 测试用户登录接口性能
artillery quick --count 100 --num 10 http://localhost:3334/auth/login

# 测试媒体列表接口性能
artillery quick --count 200 --num 20 "http://localhost:3334/media"

# 测试搜索接口性能
artillery quick --count 100 --num 10 "http://localhost:3334/media/search?query=阿凡达"
```

#### 8.1.2 并发用户测试
创建 `performance-test.yml` 配置文件：

```yaml
config:
  target: 'http://localhost:3334'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: 'User Journey'
    weight: 100
    flow:
      - post:
          url: '/auth/login'
          json:
            username: 'testuser'
            password: 'Test123456!'
      - get:
          url: '/media'
      - get:
          url: '/media/popular'
      - get:
          url: '/recommendations/user'
```

```bash
# 运行性能测试
artillery run performance-test.yml
```

**性能基准要求：**
- 响应时间 < 200ms (90% 请求)
- 吞吐量 > 1000 请求/秒
- 错误率 < 1%

#### 8.1.3 数据库性能测试
```bash
# 测试数据库查询性能
mysql -h localhost -P 3306 -u root -p nest_tv << EOF
-- 测试媒体查询性能
EXPLAIN SELECT * FROM media_resources WHERE type = 'movie' ORDER BY rating DESC LIMIT 20;

-- 测试复杂联表查询
EXPLAIN SELECT mr.*, ps.* FROM media_resources mr 
LEFT JOIN play_sources ps ON mr.id = ps.mediaResourceId 
WHERE mr.genres LIKE '%科幻%' 
ORDER BY mr.rating DESC LIMIT 10;

-- 检查索引使用情况
SHOW INDEX FROM media_resources;
SHOW INDEX FROM play_sources;
SHOW INDEX FROM watch_histories;
EOF
```

### 8.2 内存和资源使用监控

#### 8.2.1 Node.js 内存监控
在后端添加内存监控端点，然后测试：

```bash
# 获取内存使用情况
curl "http://localhost:3334/admin/system/memory" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 监控堆内存使用
curl "http://localhost:3334/admin/system/heap-snapshot" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### 8.2.2 数据库连接池监控
```bash
# 检查 MySQL 连接数
mysql -h localhost -P 3306 -u root -p << EOF
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';
EOF

# 检查 Redis 连接和内存
redis-cli INFO clients
redis-cli INFO memory
```

### 8.3 缓存性能测试

#### 8.3.1 Redis 缓存测试
```bash
# 测试缓存命中率
redis-cli INFO stats | grep keyspace

# 测试缓存性能
redis-cli --latency -h localhost -p 6379

# 测试缓存大小
redis-cli MEMORY USAGE "media:list:popular"
```

#### 8.3.2 应用级缓存测试
```bash
# 第一次请求（缓存未命中）
time curl "http://localhost:3334/media/popular" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 第二次请求（缓存命中）
time curl "http://localhost:3334/media/popular" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 比较响应时间差异
```

**预期结果：**
- 缓存命中时响应时间显著减少
- 缓存命中率 > 80%
- 内存使用稳定，无内存泄漏

---

## 🔒 第九部分：安全性测试

### 9.1 认证和授权安全测试

#### 9.1.1 JWT Token 安全测试
```bash
# 测试 Token 篡改检测
curl "http://localhost:3334/users/profile" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered_payload.signature"

# 测试空 Token
curl "http://localhost:3334/users/profile" \
  -H "Authorization: Bearer "

# 测试格式错误的 Token
curl "http://localhost:3334/users/profile" \
  -H "Authorization: InvalidFormat"
```

#### 9.1.2 密码安全测试
```bash
# 测试弱密码注册
curl -X POST http://localhost:3334/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "weakpasstest",
    "email": "weak@example.com",
    "password": "123"
  }'

# 测试密码复杂度要求
curl -X POST http://localhost:3334/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "strongpasstest",
    "email": "strong@example.com",
    "password": "StrongPassword123!"
  }'
```

#### 9.1.3 权限绕过测试
```bash
# 尝试访问管理员接口（使用普通用户 Token）
curl "http://localhost:3334/admin/users" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 尝试修改其他用户数据
curl -X PATCH http://localhost:3334/users/999 \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hacked@example.com"
  }'
```

**预期结果：**
- 所有权限绕过尝试都应该被拒绝
- 弱密码注册应该被阻止
- Token 篡改应该被检测

### 9.2 输入验证和 SQL 注入测试

#### 9.2.1 SQL 注入测试
```bash
# 测试搜索参数 SQL 注入
curl "http://localhost:3334/media/search?query=' OR 1=1 --" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 测试排序参数注入
curl "http://localhost:3334/media?sortBy=title'; DROP TABLE users; --" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 测试筛选参数注入
curl "http://localhost:3334/media?type=movie' UNION SELECT * FROM users --" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 9.2.2 XSS 防护测试
```bash
# 测试标题字段 XSS
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "<script>alert('XSS')</script>",
    "type": "movie"
  }'

# 测试描述字段 XSS
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试电影",
    "description": "<img src=x onerror=alert('XSS')>",
    "type": "movie"
  }'
```

#### 9.2.3 文件上传安全测试
```bash
# 测试恶意文件上传（如果有文件上传功能）
curl -X POST http://localhost:3334/upload \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@malicious_script.php"

# 测试大文件上传
curl -X POST http://localhost:3334/upload \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@large_file.bin"
```

**预期结果：**
- SQL 注入应该被防护或参数化查询阻止
- XSS 脚本应该被转义或过滤
- 恶意文件上传应该被阻止

### 9.3 API 安全和速率限制测试

#### 9.3.1 API 速率限制测试
```bash
# 快速连续请求测试速率限制
for i in {1..100}; do
  curl -s "http://localhost:3334/media" \
    -H "Authorization: Bearer $JWT_TOKEN" &
done
wait

# 登录接口暴力破解防护
for i in {1..20}; do
  curl -X POST http://localhost:3334/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "username": "testuser",
      "password": "wrongpassword'$i'"
    }'
done
```

#### 9.3.2 CORS 和安全头测试
```bash
# 测试 CORS 配置
curl -H "Origin: http://malicious-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS http://localhost:3334/auth/login

# 检查安全响应头
curl -I http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN"
```

**预期响应头：**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (如果使用 HTTPS)

#### 9.3.3 敏感信息泄露测试
```bash
# 检查错误信息是否泄露敏感信息
curl "http://localhost:3334/nonexistent-endpoint"

# 检查调试信息泄露
curl "http://localhost:3334/media?debug=true" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 检查源码映射文件
curl "http://localhost:3334/main.js.map"
```

**预期结果：**
- 错误信息不应该泄露系统内部信息
- 源码映射文件不应该在生产环境暴露
- 调试接口不应该在生产环境可用

---

## 🐛 第十部分：错误处理和边界测试

### 10.1 系统错误处理测试

#### 10.1.1 数据库连接错误模拟
```bash
# 停止 MySQL 服务来模拟数据库错误
docker-compose stop mysql

# 测试 API 在数据库不可用时的行为
curl "http://localhost:3334/media" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 重启 MySQL 服务
docker-compose start mysql

# 测试服务恢复
curl "http://localhost:3334/media" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 10.1.2 Redis 连接错误模拟
```bash
# 停止 Redis 服务
docker-compose stop redis

# 测试缓存不可用时的降级行为
curl "http://localhost:3334/media/popular" \
  -H "Authorization: Bearer $JWT_TOKEN"

# 重启 Redis 服务
docker-compose start redis
```

#### 10.1.3 第三方服务错误模拟
```bash
# 测试爬虫服务在目标网站不可访问时的处理
curl -X POST http://localhost:3334/crawler/crawl \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUrl": "http://nonexistent-site.com",
    "depth": 1
  }'
```

**预期结果：**
- 系统应该优雅地处理外部依赖失败
- 返回适当的错误信息而不是崩溃
- 具备自动重试和降级机制

### 10.2 边界值和异常输入测试

#### 10.2.1 字符串长度边界测试
```bash
# 测试超长标题
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "'$(python3 -c "print('A' * 1000)")'",
    "type": "movie"
  }'

# 测试空字符串
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "",
    "type": "movie"
  }'

# 测试特殊字符
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🎬🎭🎪🎨🎯🎲🃏🀄",
    "type": "movie"
  }'
```

#### 10.2.2 数值边界测试
```bash
# 测试负数评分
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试电影",
    "type": "movie",
    "rating": -1
  }'

# 测试超大评分
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试电影",
    "type": "movie",
    "rating": 999999
  }'

# 测试浮点数精度
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试电影",
    "type": "movie",
    "rating": 8.123456789012345
  }'
```

#### 10.2.3 日期和时间边界测试
```bash
# 测试无效日期格式
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试电影",
    "type": "movie",
    "releaseDate": "invalid-date"
  }'

# 测试未来日期
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试电影",
    "type": "movie",
    "releaseDate": "2099-12-31T23:59:59.999Z"
  }'

# 测试极早日期
curl -X POST http://localhost:3334/media \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试电影",
    "type": "movie",
    "releaseDate": "1800-01-01T00:00:00.000Z"
  }'
```

### 10.3 并发和竞态条件测试

#### 10.3.1 并发写入测试
```bash
# 多个用户同时收藏同一部电影
for i in {1..10}; do
  curl -X POST http://localhost:3334/media/2/favorites \
    -H "Authorization: Bearer $JWT_TOKEN" &
done
wait

# 检查收藏状态是否正确
curl "http://localhost:3334/users/favorites" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 10.3.2 播放记录并发更新
```bash
# 同时更新播放进度
for i in {1..5}; do
  curl -X PATCH http://localhost:3334/watch-history/1 \
    -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "watchedDuration": '$((i * 300))',
      "watchProgress": 0.'$i'
    }' &
done
wait

# 检查最终播放进度
curl "http://localhost:3334/watch-history/1" \
  -H "Authorization: Bearer $JWT_TOKEN"
```

#### 10.3.3 爬虫任务并发测试
```bash
# 同时启动多个爬虫任务
for i in {1..3}; do
  curl -X POST http://localhost:3334/crawler/crawl \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "targetId": 1,
      "depth": 1,
      "maxPages": 10
    }' &
done
wait

# 检查任务状态
curl "http://localhost:3334/crawler/tasks" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**预期结果：**
- 并发操作不应该导致数据不一致
- 没有竞态条件导致的错误
- 系统能正确处理并发请求

---

## 🔧 第十一部分：前端界面测试

### 11.1 前端环境启动测试

#### 11.1.1 前端开发服务器启动
```bash
cd frontend

# 启动开发服务器
npm run dev

# 检查服务是否正常启动
curl http://localhost:5173

# 检查热重载功能
# 修改一个 Vue 文件并观察浏览器是否自动刷新
```

**预期结果：**
- 前端服务在 5173 端口正常启动
- 页面能够正常加载
- 热重载功能正常工作

#### 11.1.2 前端构建测试
```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 检查构建文件
ls -la dist/
```

**预期结果：**
- 构建无错误和警告
- 生成的文件大小合理
- 预览服务正常启动

### 11.2 用户界面功能测试

#### 11.2.1 登录注册界面测试
使用浏览器访问 `http://localhost:5173` 进行以下测试：

**登录功能测试：**
1. 访问登录页面
2. 输入正确的用户名和密码
3. 点击登录按钮
4. 验证是否跳转到主页面
5. 验证是否显示用户信息

**注册功能测试：**
1. 访问注册页面
2. 填写用户名、邮箱、密码
3. 提交表单
4. 验证注册成功提示
5. 验证是否自动登录

**表单验证测试：**
1. 测试空字段提交
2. 测试无效邮箱格式
3. 测试弱密码
4. 验证错误提示显示

#### 11.2.2 媒体浏览界面测试

**媒体列表页面：**
1. 验证媒体卡片显示正确
2. 测试分页功能
3. 测试筛选功能（类型、评分等）
4. 测试排序功能

**媒体详情页面：**
1. 点击媒体卡片跳转到详情页
2. 验证详情信息显示完整
3. 测试播放源选择
4. 测试收藏功能
5. 测试评分功能

**搜索功能：**
1. 在搜索框输入关键词
2. 验证搜索结果正确
3. 测试搜索建议功能
4. 测试高级搜索筛选

#### 11.2.3 视频播放界面测试

**播放器功能：**
1. 点击播放按钮启动视频
2. 测试暂停/播放控制
3. 测试进度条拖拽
4. 测试音量控制
5. 测试全屏功能
6. 测试字幕显示（如果有）

**播放源切换：**
1. 测试不同播放源切换
2. 验证播放进度保存
3. 测试画质选择
4. 测试播放速度调节

### 11.3 响应式设计测试

#### 11.3.1 不同屏幕尺寸测试
使用浏览器开发者工具测试不同设备：

**桌面端 (1920x1080)：**
- 页面布局正确
- 导航菜单完整显示
- 媒体卡片网格布局合理

**平板端 (768x1024)：**
- 响应式布局生效
- 触摸友好的按钮大小
- 侧边栏自动收起

**手机端 (375x667)：**
- 移动端布局优化
- 汉堡菜单正常工作
- 触摸滑动功能正常

#### 11.3.2 浏览器兼容性测试
在不同浏览器中测试：

**Chrome (最新版)：**
- 所有功能正常
- 播放器兼容性良好
- 性能表现优秀

**Firefox (最新版)：**
- 页面渲染正确
- JavaScript 功能正常
- CSS 样式显示正确

**Safari (最新版)：**
- 移动端表现良好
- 视频播放正常
- 触摸事件响应正确

**Edge (最新版)：**
- 兼容性良好
- 功能完整性验证

### 11.4 用户体验测试

#### 11.4.1 页面加载性能
```bash
# 使用 Lighthouse 进行性能测试
npx lighthouse http://localhost:5173 --output=html --output-path=./lighthouse-report.html

# 分析关键指标：
# - First Contentful Paint (FCP) < 2s
# - Largest Contentful Paint (LCP) < 4s
# - Cumulative Layout Shift (CLS) < 0.1
# - First Input Delay (FID) < 100ms
```

#### 11.4.2 无障碍访问测试
1. 键盘导航测试
   - Tab 键可以遍历所有可交互元素
   - Enter 和 Space 键可以激活按钮
   - Esc 键可以关闭模态框

2. 屏幕阅读器友好性
   - 所有图片都有 alt 属性
   - 表单元素有正确的 label
   - 页面结构使用语义化标签

3. 颜色对比度测试
   - 文字和背景对比度符合 WCAG 标准
   - 重要信息不仅依赖颜色传达

#### 11.4.3 错误处理用户体验
1. 网络错误处理
   - 断网情况下的友好提示
   - 请求超时的重试机制
   - 加载状态的明确显示

2. 表单错误处理
   - 实时验证反馈
   - 明确的错误消息
   - 错误字段高亮显示

3. 异常状态处理
   - 空数据状态的占位图
   - 404 页面的用户引导
   - 权限不足的友好提示

---

## 🔧 第十二部分：故障排除和常见问题

### 12.1 服务启动问题排查

#### 12.1.1 后端启动失败
**问题症状：** `npm run start:dev` 失败

**排查步骤：**
```bash
# 1. 检查 Node.js 版本
node --version  # 确保 >= 18.0.0

# 2. 检查依赖安装
cd backend
npm install
npm audit fix

# 3. 检查环境变量
cat .env
# 确保所有必需的环境变量都已设置

# 4. 检查数据库连接
mysql -h localhost -P 3306 -u root -p
# 测试数据库是否可连接

# 5. 检查端口占用
netstat -an | grep 3334
# 或使用 lsof -i :3334

# 6. 查看详细错误日志
npm run start:dev 2>&1 | tee debug.log
```

**常见解决方案：**
- 端口被占用：更改 PORT 环境变量或停止占用端口的进程
- 数据库连接失败：检查数据库服务状态和连接参数
- TypeScript 编译错误：运行 `npm run build` 查看详细错误

#### 12.1.2 前端启动失败
**问题症状：** `npm run dev` 失败

**排查步骤：**
```bash
# 1. 检查 Node.js 版本兼容性
cd frontend
node --version

# 2. 清理并重新安装依赖
rm -rf node_modules
rm package-lock.json
npm install

# 3. 检查 Vite 配置
cat vite.config.ts

# 4. 检查端口占用
netstat -an | grep 5173

# 5. 检查环境变量
cat .env.local  # 如果有的话
```

**常见解决方案：**
- 依赖版本冲突：检查 `package.json` 中的版本约束
- 端口占用：更改 Vite 配置中的端口
- 模块导入错误：检查 TypeScript 配置和路径映射

#### 12.1.3 数据库连接问题
**问题症状：** TypeORM 连接失败

**排查步骤：**
```bash
# 1. 检查 MySQL 服务状态
docker-compose ps mysql
# 或 systemctl status mysql

# 2. 检查数据库配置
mysql -h localhost -P 3306 -u root -p << EOF
SHOW DATABASES;
SHOW GRANTS FOR 'nest_user'@'%';
EOF

# 3. 检查网络连接
telnet localhost 3306

# 4. 查看 MySQL 错误日志
docker-compose logs mysql
# 或 sudo tail -f /var/log/mysql/error.log
```

**常见解决方案：**
- 用户权限不足：重新授权数据库用户
- 防火墙阻止：开放 3306 端口
- 配置参数错误：检查 .env 文件中的数据库配置

### 12.2 API 接口问题排查

#### 12.2.1 认证相关问题
**问题症状：** 401 Unauthorized 错误

**排查步骤：**
```bash
# 1. 验证 JWT Token 格式
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | base64 -d

# 2. 检查 Token 过期时间
curl http://localhost:3334/auth/verify-token \
  -H "Authorization: Bearer $JWT_TOKEN"

# 3. 验证 JWT 密钥配置
grep JWT_SECRET backend/.env

# 4. 检查用户状态
mysql -h localhost -P 3306 -u root -p nest_tv << EOF
SELECT id, username, email, isActive FROM users WHERE username = 'testuser';
EOF
```

**常见解决方案：**
- Token 过期：重新登录获取新 Token
- JWT 密钥不匹配：检查生产和开发环境密钥一致性
- 用户被禁用：在管理后台启用用户账号

#### 12.2.2 数据查询问题
**问题症状：** 查询结果异常或性能慢

**排查步骤：**
```bash
# 1. 检查数据库查询日志
mysql -h localhost -P 3306 -u root -p << EOF
SET GLOBAL general_log = 'ON';
SHOW VARIABLES LIKE 'general_log%';
EOF

# 2. 分析慢查询
mysql -h localhost -P 3306 -u root -p << EOF
SHOW VARIABLES LIKE 'slow_query_log%';
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
EOF

# 3. 检查索引使用
mysql -h localhost -P 3306 -u root -p nest_tv << EOF
EXPLAIN SELECT * FROM media_resources WHERE type = 'movie' ORDER BY rating DESC;
SHOW INDEX FROM media_resources;
EOF

# 4. 检查表统计信息
mysql -h localhost -P 3306 -u root -p nest_tv << EOF
ANALYZE TABLE media_resources;
SHOW TABLE STATUS LIKE 'media_resources';
EOF
```

**常见解决方案：**
- 缺失索引：为经常查询的字段添加索引
- 查询语句不优化：重写 TypeORM 查询或使用原生 SQL
- 数据量过大：实现分页和缓存机制

#### 12.2.3 文件上传问题
**问题症状：** 文件上传失败或文件损坏

**排查步骤：**
```bash
# 1. 检查文件大小限制
curl -I -X POST http://localhost:3334/upload \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@large_file.bin"

# 2. 检查文件类型限制
file uploaded_file.jpg
curl -X POST http://localhost:3334/upload \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "file=@test.exe"

# 3. 检查存储空间
df -h
ls -la backend/uploads/

# 4. 检查文件权限
ls -la backend/uploads/
```

**常见解决方案：**
- 超过大小限制：调整 `multer` 配置或 nginx 限制
- 文件类型不允许：更新文件类型白名单
- 存储空间不足：清理旧文件或扩容
- 权限问题：修正文件夹权限

### 12.3 性能问题排查

#### 12.3.1 响应时间慢
**问题症状：** API 响应时间超过 2 秒

**排查步骤：**
```bash
# 1. 使用 curl 测量响应时间
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3334/media"

# curl-format.txt 内容：
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                      ----------\n
#           time_total:  %{time_total}\n

# 2. 检查数据库查询时间
mysql -h localhost -P 3306 -u root -p nest_tv << EOF
SET profiling = 1;
SELECT * FROM media_resources ORDER BY rating DESC LIMIT 20;
SHOW PROFILES;
SHOW PROFILE FOR QUERY 1;
EOF

# 3. 检查 Redis 性能
redis-cli --latency -h localhost -p 6379

# 4. 检查服务器资源使用
top -p $(pgrep -f "node.*nest")
iostat -x 1 5
```

**性能优化建议：**
- 数据库优化：添加索引、优化查询语句
- 缓存策略：实现 Redis 缓存热门数据
- 连接池优化：调整数据库连接池大小
- 代码优化：移除 N+1 查询、使用懒加载

#### 12.3.2 内存泄漏排查
**问题症状：** 内存使用持续增长

**排查步骤：**
```bash
# 1. 监控 Node.js 内存使用
curl "http://localhost:3334/admin/system/memory" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 2. 生成内存快照
kill -USR2 $(pgrep -f "node.*nest")  # 如果配置了信号处理
# 或使用 clinic.js
npm install -g clinic
clinic doctor -- node dist/main.js

# 3. 检查事件监听器泄漏
# 在代码中添加监控：
# console.log(process.listenerCount('event_name'));

# 4. 监控数据库连接
mysql -h localhost -P 3306 -u root -p << EOF
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';
EOF
```

**常见内存泄漏原因：**
- 未清理的定时器：确保 `clearInterval` 和 `clearTimeout`
- 事件监听器未移除：使用 `removeListener`
- 数据库连接未关闭：确保使用连接池
- 大对象未释放：避免全局变量引用大对象

### 12.4 部署和生产环境问题

#### 12.4.1 Docker 部署问题
**问题症状：** Docker 容器启动失败

**排查步骤：**
```bash
# 1. 检查 Docker 镜像构建
docker build -t nest-tv-backend ./backend
docker build -t nest-tv-frontend ./frontend

# 2. 检查容器日志
docker-compose logs api
docker-compose logs frontend
docker-compose logs mysql
docker-compose logs redis

# 3. 检查容器网络
docker network ls
docker network inspect nest_tv_nest-network

# 4. 检查端口映射
docker-compose ps
netstat -tlnp | grep docker-proxy

# 5. 进入容器调试
docker-compose exec api bash
docker-compose exec mysql mysql -u root -p
```

**常见解决方案：**
- 构建上下文问题：检查 Dockerfile 和 .dockerignore
- 环境变量不一致：确保 docker-compose.yml 中环境变量正确
- 网络连接问题：检查服务名称和端口配置
- 卷挂载问题：确保宿主机路径存在且有权限

#### 12.4.2 生产环境配置
**问题症状：** 生产环境性能异常

**排查清单：**
```bash
# 1. 环境变量配置
grep NODE_ENV backend/.env  # 应该是 production
grep DB_SYNCHRONIZE backend/.env  # 生产环境应该是 false
grep DB_LOGGING backend/.env  # 生产环境应该是 false

# 2. 安全配置检查
curl -I https://your-domain.com/api
# 检查安全响应头

# 3. SSL 证书检查
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# 4. 负载均衡检查
curl -H "Host: your-domain.com" http://load-balancer-ip/api

# 5. 监控和日志配置
ls -la /var/log/nest-tv/
tail -f /var/log/nest-tv/error.log
```

### 12.5 数据恢复和备份

#### 12.5.1 数据库备份恢复
```bash
# 备份数据库
mysqldump -h localhost -u root -p nest_tv > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
mysql -h localhost -u root -p nest_tv < backup_20231201_120000.sql

# Docker 环境下的备份
docker exec nest-tv-mysql mysqldump -u root -p nest_tv > backup.sql

# Docker 环境下的恢复
docker exec -i nest-tv-mysql mysql -u root -p nest_tv < backup.sql
```

#### 12.5.2 Redis 数据备份恢复
```bash
# Redis 数据备份
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb backup/dump_$(date +%Y%m%d_%H%M%S).rdb

# Docker 环境下的 Redis 备份
docker exec nest-tv-redis redis-cli BGSAVE
docker cp nest-tv-redis:/data/dump.rdb backup/

# 恢复 Redis 数据
systemctl stop redis
cp backup/dump_20231201_120000.rdb /var/lib/redis/dump.rdb
systemctl start redis
```

#### 12.5.3 文件上传数据备份
```bash
# 备份上传文件
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz backend/uploads/

# 恢复上传文件
tar -xzf uploads_backup_20231201_120000.tar.gz
```

---

## ✅ 测试完成检查清单

### 🏗️ 基础环境检查
- [ ] Node.js 版本 >= 18.0.0
- [ ] 数据库连接正常 (MySQL)
- [ ] 缓存服务正常 (Redis)
- [ ] 后端服务启动无错误
- [ ] 前端服务启动无错误
- [ ] 构建过程无错误

### 🔐 认证和安全检查
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] JWT Token 验证正常
- [ ] 权限控制生效
- [ ] 密码安全策略生效
- [ ] API 安全头配置正确

### 📺 核心功能检查
- [ ] 媒体资源创建/查询/更新/删除
- [ ] 播放源管理功能正常
- [ ] 视频播放功能正常
- [ ] 播放记录保存正确
- [ ] 收藏功能正常
- [ ] 搜索功能正常

### 🎯 高级功能检查
- [ ] 推荐系统正常工作
- [ ] 高级搜索功能正常
- [ ] 爬虫功能正常
- [ ] 缓存机制生效
- [ ] 管理后台功能完整

### ⚡ 性能和稳定性检查
- [ ] API 响应时间 < 2秒
- [ ] 并发处理能力满足要求
- [ ] 内存使用稳定
- [ ] 数据库查询性能良好
- [ ] 缓存命中率 > 80%

### 🖥️ 前端界面检查
- [ ] 所有页面正常加载
- [ ] 响应式设计正常
- [ ] 用户体验流畅
- [ ] 错误处理友好
- [ ] 浏览器兼容性良好

### 🔧 错误处理检查
- [ ] 系统错误优雅处理
- [ ] 边界值测试通过
- [ ] 并发安全性验证
- [ ] 故障恢复机制正常

### 🚀 部署和生产检查
- [ ] Docker 部署成功
- [ ] 生产环境配置正确
- [ ] 监控和日志配置完整
- [ ] 备份恢复流程测试通过

---

## 📞 技术支持

如果在测试过程中遇到问题，请按照以下步骤处理：

1. **查看日志文件**
   - 后端日志：`backend/logs/`
   - 前端控制台错误
   - 数据库错误日志

2. **检查配置文件**
   - `backend/.env`
   - `docker-compose.yml`
   - `frontend/vite.config.ts`

3. **重启服务**
   ```bash
   # 重启后端
   cd backend && npm run start:dev
   
   # 重启前端
   cd frontend && npm run dev
   
   # 重启 Docker 服务
   docker-compose restart
   ```

4. **联系开发团队**
   - 提供详细的错误信息
   - 包含复现步骤
   - 附上相关日志文件

---

**测试完成日期：** ___________  
**测试人员：** ___________  
**测试结果：** [ ] 通过 [ ] 需要修复

**备注：**
___________________________________________
___________________________________________
___________________________________________