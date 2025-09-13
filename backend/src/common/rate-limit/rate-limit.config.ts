export const RATE_LIMIT_CONFIG = {
  // 默认配置
  default: {
    windowMs: 15 * 60 * 1000, // 15分钟
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },
  
  // 不同API的限流配置
  endpoints: {
    // 公共接口 - 较宽松的限流
    auth: {
      windowMs: 15 * 60 * 1000, // 15分钟
      maxRequests: 5, // 登录接口严格限流
      message: '登录尝试过于频繁，请稍后重试',
    },
    
    // 媒体资源接口 - 中等限流
    media: {
      windowMs: 15 * 60 * 1000, // 15分钟
      maxRequests: 100, // 列表查询较宽松
      message: '请求过于频繁，请稍后重试',
    },
    
    // 搜索接口 - 较严格的限流
    search: {
      windowMs: 1 * 60 * 1000, // 1分钟
      maxRequests: 30, // 搜索请求限流
      message: '搜索请求过于频繁，请稍后重试',
    },
    
    // 用户接口 - 严格的限流
    user: {
      windowMs: 60 * 60 * 1000, // 1小时
      maxRequests: 1000, // 用户操作限流
      message: '操作过于频繁，请稍后重试',
    },
    
    // 管理接口 - 非常严格的限流
    admin: {
      windowMs: 5 * 60 * 1000, // 5分钟
      maxRequests: 50, // 管理操作限流
      message: '管理操作过于频繁，请稍后重试',
    },
  },
  
  // 特殊角色白名单
  roles: {
    admin: {
      skipLimit: false, // 管理员也需要限流，但可以设置较高的限制
      multiplier: 2, // 限流倍数提升
    },
    vip: {
      skipLimit: false,
      multiplier: 1.5, // VIP用户限流倍数提升
    },
    free: {
      skipLimit: false,
      multiplier: 1, // 免费用户正常限流
    },
  },
  
  // IP白名单
  ipWhitelist: [
    '127.0.0.1', // 本地开发环境
    'localhost',
    '::1', // 本地IPv6
  ],
  
  // 路径白名单
  pathWhitelist: [
    '/api/health', // 健康检查
    '/api/metrics', // 监控指标
    '/api/docs', // API文档
    '/api/swagger.json', // OpenAPI文档
  ],
  
  // 错误消息配置
  errorMessages: {
    default: '请求过于频繁，请稍后重试',
    auth: '登录尝试过于频繁，请15分钟后重试',
    search: '搜索请求过于频繁，请1分钟后重试',
    user: '操作过于频繁，请1小时后重试',
    admin: '管理操作过于频繁，请5分钟后重试',
  },
  
  // 响应头配置
  responseHeaders: {
    enabled: true, // 是否启用响应头
    includeResetTime: true, // 是否包含重置时间
    includeRemaining: true, // 是否包含剩余次数
    includeLimit: true, // 是否包含限制值
  },
} as const;