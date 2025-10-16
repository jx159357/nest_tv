# 代理池系统使用指南

## 🚀 功能概述

本项目已成功集成了完整的代理池系统，为爬虫功能提供强大的IP轮换和反封锁能力。

## 📋 功能特性

### ✅ 已实现功能
1. **代理池核心服务** - 自动管理代理IP的获取、验证、轮换
2. **免费代理源集成** - 支持快代理、西刺代理、89IP、小幻代理
3. **智能代理选择** - 基于响应时间、成功率的最佳代理选择
4. **健康监控** - 实时监控代理池状态和性能指标
5. **自动故障转移** - 代理失效时自动切换到可用代理
6. **多协议支持** - HTTP/HTTPS/SOCKS4/SOCKS5代理支持
7. **定时验证** - 自动检查代理可用性和响应速度

### 🎯 针对目标网站
- **电影天堂** (dy2018.com) - HTTP代理，延迟3秒
- **阳光电影** (ygdy8.com) - HTTP代理，延迟4秒  
- **人人影视** (rrys2018.com) - HTTPS代理，延迟2秒

## 🔧 API接口

### 代理池管理
```bash
# 获取代理池统计
GET /proxy-pool/stats

# 获取健康状态
GET /proxy-pool/health

# 获取性能指标
GET /proxy-pool/metrics?minutes=60

# 刷新代理池
POST /proxy-pool/refresh

# 清理失效代理
DELETE /proxy-pool/failed
```

### 代理测试
```bash
# 测试特定代理
POST /proxy-pool/test
Content-Type: application/json
{
  "host": "192.168.1.1",
  "port": 8080,
  "protocol": "http"
}
```

### 配置管理
```bash
# 获取配置
GET /proxy-pool/config

# 更新配置
PUT /proxy-pool/config
```

## 📊 监控指标

### 健康评分
- **90-100分**: 优秀 - 代理池运行完美
- **75-89分**: 良好 - 代理池运行正常
- **60-74分**: 一般 - 需要关注某些指标
- **40-59分**: 较差 - 存在明显问题
- **0-39分**: 严重 - 需要立即处理

### 关键指标
- **总代理数量**: 当前池中代理总数
- **可用代理数量**: 验证通过的代理数量
- **成功率**: 代理请求成功百分比
- **平均响应时间**: 代理响应速度
- **每分钟请求数**: 代理池吞吐量

## ⚙️ 配置说明

### 环境变量配置
```env
# 代理池基础配置
PROXY_POOL_ENABLED=true
MAX_PROXIES=100
MIN_WORKING_PROXIES=5

# 验证配置
PROXY_TEST_URL=http://httpbin.org/ip
PROXY_TEST_TIMEOUT=10000
PROXY_VALIDATION_INTERVAL=300000

# 轮换策略
PROXY_ROTATION_STRATEGY=best-response-time
PROXY_SWITCH_AFTER=10
PROXY_FAILURE_THRESHOLD=3
```

### 应用配置 (crawler.config.ts)
```typescript
proxy: {
  enabled: true,
  pool: {
    maxProxies: 100,
    minWorkingProxies: 5,
    validationInterval: 300000,
  },
  rotation: {
    strategy: 'best-response-time',
    switchAfter: 10,
    failureThreshold: 3,
  },
  targetStrategies: {
    '电影天堂': {
      useProxy: true,
      preferredProtocol: 'http',
      requestDelay: 3000,
      maxRetries: 3,
    }
  }
}
```

## 🚀 使用示例

### 1. 启动代理池
```bash
cd backend
npm run start:dev
```

### 2. 查看代理池状态
```bash
curl http://localhost:3334/proxy-pool/health
```

### 3. 刷新代理池
```bash
curl -X POST http://localhost:3334/proxy-pool/refresh
```

### 4. 获取性能报告
```bash
curl "http://localhost:3334/proxy-pool/performance?hours=24"
```

## 🔄 轮换策略

### 支持的策略
1. **round-robin** - 轮询分配
2. **random** - 随机选择
3. **best-response-time** - 最佳响应时间（推荐）
4. **weighted** - 加权选择（基于成功率和响应时间）

### 策略配置
```typescript
rotation: {
  strategy: 'best-response-time', // 推荐使用
  switchAfter: 10,                // 使用10次后切换
  failureThreshold: 3,             // 失败3次后标记失效
}
```

## 📈 性能优化

### 1. 代理池大小优化
- **小型项目**: 20-50个代理
- **中型项目**: 50-100个代理  
- **大型项目**: 100+个代理

### 2. 验证频率优化
- **高频率**: 每5分钟验证（适合动态代理）
- **中频率**: 每30分钟验证（推荐）
- **低频率**: 每2小时验证（稳定代理）

### 3. 超时设置优化
- **快速测试**: 5秒超时
- **标准测试**: 10秒超时（推荐）
- **宽松测试**: 30秒超时

## 🛠️ 故障排除

### 常见问题

#### 1. 代理池为空
```bash
# 检查配置
GET /proxy-pool/config

# 手动刷新
POST /proxy-pool/refresh

# 检查提供商状态
GET /proxy-pool/providers
```

#### 2. 成功率低
```bash
# 查看健康报告
GET /proxy-pool/health

# 检查告警信息
GET /proxy-pool/alerts

# 清理失效代理
DELETE /proxy-pool/failed
```

#### 3. 响应时间慢
```bash
# 查看性能指标
GET /proxy-pool/metrics

# 调整轮换策略
PUT /proxy-pool/config
{
  "rotation": {
    "strategy": "best-response-time"
  }
}
```

## 📝 日志说明

### 日志级别
- **DEBUG**: 详细调试信息
- **INFO**: 一般信息记录
- **WARN**: 警告信息
- **ERROR**: 错误信息

### 关键日志
```
代理池初始化完成，获取到 45 个代理
使用代理 KuaiDailiFree_192.168.1.100_8080 (192.168.1.100:8080) 请求
代理池告警 [HIGH] 代理失败率过高: 35.2%
代理池状态: 无可用代理
```

## 🔮 高级功能

### 1. 自定义代理提供商
```typescript
@Injectable()
export class CustomProxyProvider extends BaseFreeProxyProvider {
  readonly name = 'CustomProxy';
  readonly isActive = true;
  readonly priority = 1;

  async fetchProxies(): Promise<ProxyInfo[]> {
    // 实现自定义代理获取逻辑
    return proxies;
  }
}
```

### 2. 代理评分算法
```typescript
const score = (successRate / 100) / responseTime;
// 成功率越高、响应时间越快，评分越高
```

### 3. 代理告警规则
- 可用代理 < 5个 → 高危告警
- 成功率 < 70% → 中危告警
- 响应时间 > 10秒 → 中危告警
- 代理池为空 → 严重告警

## 📚 最佳实践

1. **定期监控**: 每天检查代理池健康状态
2. **及时清理**: 定期清理失效代理
3. **合理配置**: 根据项目需求调整配置参数
4. **告警处理**: 及时处理告警信息
5. **性能优化**: 根据监控数据优化性能

## 🎉 总结

代理池系统已成功集成到您的视频流媒体平台中，具备以下核心优势：

- ✅ **高可用性** - 多代理源保障
- ✅ **智能选择** - 最佳代理自动选择
- ✅ **实时监控** - 完善的监控体系
- ✅ **自动运维** - 自动化故障处理
- ✅ **灵活配置** - 支持多种配置策略

现在您的爬虫系统可以稳定地获取视频资源，避免IP封锁，提高数据采集效率！🚀