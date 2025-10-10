# Nest TV 爬虫功能使用文档

## 概述

Nest TV 项目包含了一个强大的爬虫系统，用于从各种网站自动爬取影视资源信息。该系统支持多种目标网站、批量爬取、数据验证和智能缓存等功能。

## 功能特性

### 🚀 核心功能
- **多目标支持**: 支持同时爬取多个不同结构的网站
- **批量爬取**: 高效的并发控制，支持大批量URL处理
- **智能解析**: 基于CSS选择器的灵活数据提取
- **数据验证**: 自动验证爬取数据的完整性和有效性
- **缓存机制**: 内置缓存系统，避免重复请求

### 🛡️ 安全特性
- **请求限制**: 内置频率控制，防止对目标服务器造成过大压力
- **错误处理**: 完善的错误处理和重试机制
- **URL验证**: 严格的URL过滤和验证规则
- **遵守robots.txt**: 可配置是否遵守目标网站的爬取规则

### 🔧 配置化
- **灵活配置**: 所有爬虫参数都可以通过配置文件调整
- **动态目标**: 可以动态添加或修改爬虫目标
- **自定义规则**: 支持自定义数据提取和验证规则

## API接口

### 1. 获取爬虫目标列表

**接口地址**: `GET /crawler/targets`

**功能描述**: 获取所有可用的爬虫目标网站及其配置信息

**请求参数**: 无

**响应示例**:
```json
{
  "success": true,
  "message": "获取爬虫目标列表成功",
  "data": [
    {
      "name": "示例目标 - 测试用",
      "baseUrl": "https://httpbin.org/html",
      "description": "用于测试爬虫功能的示例目标"
    },
    {
      "name": "IMDB示例",
      "baseUrl": "https://www.imdb.com/title/tt0111161/",
      "description": "IMDB电影信息爬取示例"
    }
  ]
}
```

### 2. 单个资源爬取

**接口地址**: `POST /crawler/crawl`

**功能描述**: 爬取指定URL的影视资源信息

**请求参数**:
```json
{
  "targetName": "示例目标 - 测试用",
  "url": "https://example.com/movie-page"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "爬取并保存成功",
  "data": {
    "id": 123,
    "title": "电影标题",
    "description": "电影描述信息",
    "type": "movie",
    "rating": 8.5,
    "director": "导演姓名",
    "actors": "演员列表",
    "genres": ["动作", "科幻"],
    "releaseDate": "2024-01-01",
    "poster": "https://example.com/poster.jpg",
    "source": "示例目标 - 测试用"
  }
}
```

### 3. 批量资源爬取

**接口地址**: `POST /crawler/batch-crawl`

**功能描述**: 批量爬取多个URL的影视资源信息

**请求参数**:
```json
{
  "targetName": "示例目标 - 测试用",
  "urls": [
    "https://example.com/movie1",
    "https://example.com/movie2",
    "https://example.com/movie3"
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "批量爬取完成，成功 3 条，失败 0 条，保存成功 3 条",
  "data": {
    "crawledData": [
      {
        "title": "电影1",
        "type": "movie",
        "rating": 8.0
      },
      {
        "title": "电影2", 
        "type": "movie",
        "rating": 7.5
      }
    ],
    "successCount": 3,
    "failureCount": 0,
    "savedCount": 3,
    "totalRequested": 3
  }
}
```

### 4. 测试连接

**接口地址**: `GET /crawler/test-connection?targetName=目标名称`

**功能描述**: 测试与指定目标网站的连接状态

**请求参数**:
- `targetName`: 目标网站名称

**响应示例**:
```json
{
  "success": true,
  "message": "连接测试成功",
  "data": {
    "target": "示例目标 - 测试用",
    "status": "connected",
    "responseTime": 1250
  }
}
```

### 5. 获取爬虫统计信息

**接口地址**: `GET /crawler/stats`

**功能描述**: 获取爬虫系统的统计信息

**响应示例**:
```json
{
  "success": true,
  "message": "获取统计信息成功",
  "data": {
    "totalCrawled": 1250,
    "successCount": 1180,
    "failureCount": 70,
    "successRate": 94.4,
    "lastCrawlTime": "2024-01-15T10:30:00.000Z",
    "targetsAvailable": 3,
    "cacheSize": 45
  }
}
```

## 配置说明

### 爬虫目标配置 (`crawler.config.ts`)

```typescript
export const CRAWLER_TARGETS: CrawlerTarget[] = [
  {
    name: '目标网站名称',
    baseUrl: 'https://example.com',
    selectors: {
      title: '标题的CSS选择器',
      description: '描述的CSS选择器', 
      poster: '海报图片的CSS选择器',
      rating: '评分的CSS选择器',
      director: '导演的CSS选择器',
      actors: '演员的CSS选择器',
      genres: ['类型标签的CSS选择器数组'],
      releaseDate: '发布日期的CSS选择器',
      downloadUrls: ['下载链接的CSS选择器数组']
    }
  }
];
```

### 爬虫规则配置

#### 请求配置
- `timeout`: 请求超时时间（毫秒）
- `retries`: 重试次数
- `delay`: 请求间隔（毫秒）
- `maxConcurrentRequests`: 最大并发请求数

#### URL过滤规则
- `allowedExtensions`: 允许的文件扩展名
- `disallowedPaths`: 禁止访问的路径
- `requiredParams`: 必需的URL参数

#### 数据验证规则
- `requiredFields`: 必需的数据字段
- `minContentLength`: 最小内容长度
- `maxContentLength`: 最大内容长度

## 使用示例

### JavaScript/TypeScript 示例

```javascript
// 获取爬虫目标列表
const targets = await fetch('/crawler/targets', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
}).then(res => res.json());

// 单个资源爬取
const crawlResult = await fetch('/crawler/crawl', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    targetName: '示例目标 - 测试用',
    url: 'https://example.com/movie-page'
  })
}).then(res => res.json());

// 批量资源爬取
const batchResult = await fetch('/crawler/batch-crawl', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    targetName: '示例目标 - 测试用',
    urls: [
      'https://example.com/movie1',
      'https://example.com/movie2'
    ]
  })
}).then(res => res.json());
```

### cURL 示例

```bash
# 获取爬虫目标列表
curl -X GET "http://localhost:3335/crawler/targets" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 单个资源爬取
curl -X POST "http://localhost:3335/crawler/crawl" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "targetName": "示例目标 - 测试用",
    "url": "https://example.com/movie-page"
  }'

# 批量资源爬取
curl -X POST "http://localhost:3335/crawler/batch-crawl" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "targetName": "示例目标 - 测试用",
    "urls": ["https://example.com/movie1", "https://example.com/movie2"]
  }'
```

## 注意事项

### ⚠️ 重要提醒

1. **遵守法律法规**: 使用爬虫功能时请确保遵守相关法律法规和目标网站的使用条款
2. **尊重robots.txt**: 建议启用robots.txt遵守功能
3. **合理使用频率**: 设置适当的请求间隔，避免对目标服务器造成过大压力
4. **数据版权**: 爬取的数据可能受版权保护，请合理使用

### 🔒 安全建议

1. **权限控制**: 爬虫接口需要JWT认证，请妥善保管访问令牌
2. **输入验证**: 在调用API前请验证输入参数的有效性
3. **错误处理**: 建议实现完善的错误处理机制
4. **日志记录**: 启用日志记录功能，便于问题排查

### 📈 性能优化

1. **批量处理**: 优先使用批量爬取接口，提高效率
2. **缓存利用**: 合理利用缓存机制，减少重复请求
3. **并发控制**: 根据网络环境调整并发请求数
4. **监控统计**: 定期查看爬虫统计信息，优化爬取策略

## 故障排除

### 常见问题

1. **连接超时**: 检查网络连接和目标网站状态
2. **解析失败**: 检查CSS选择器是否正确匹配目标网站结构
3. **数据验证失败**: 检查爬取的数据是否符合验证规则
4. **保存失败**: 检查数据库连接和权限设置

### 调试建议

1. **启用详细日志**: 设置日志级别为DEBUG查看详细请求信息
2. **测试单个URL**: 先使用单个爬取接口测试，确认功能正常
3. **检查选择器**: 使用浏览器开发者工具验证CSS选择器
4. **监控性能**: 注意请求响应时间和成功率指标

## 扩展开发

### 添加新的爬虫目标

1. 在 `crawler.config.ts` 中添加新的目标配置
2. 定义合适的CSS选择器
3. 测试连接和数据提取
4. 验证数据质量和完整性

### 自定义数据处理器

可以通过扩展 `CrawlerService` 类来实现自定义的数据处理逻辑：

```typescript
export class CustomCrawlerService extends CrawlerService {
  protected async processData(data: CrawledData): Promise<CrawledData> {
    // 自定义数据处理逻辑
    return processedData;
  }
}
```

## 联系支持

如果在使用过程中遇到问题或有改进建议，请通过以下方式联系：

- 提交 Issue 到项目仓库
- 发送邮件到开发团队
- 查看项目文档和FAQ

---

*文档版本: 1.0.0*  
*最后更新: 2024-01-15*