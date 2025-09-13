"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT_CONFIG = void 0;
exports.RATE_LIMIT_CONFIG = {
    default: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    },
    endpoints: {
        auth: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 5,
            message: '登录尝试过于频繁，请稍后重试',
        },
        media: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 100,
            message: '请求过于频繁，请稍后重试',
        },
        search: {
            windowMs: 1 * 60 * 1000,
            maxRequests: 30,
            message: '搜索请求过于频繁，请稍后重试',
        },
        user: {
            windowMs: 60 * 60 * 1000,
            maxRequests: 1000,
            message: '操作过于频繁，请稍后重试',
        },
        admin: {
            windowMs: 5 * 60 * 1000,
            maxRequests: 50,
            message: '管理操作过于频繁，请稍后重试',
        },
    },
    roles: {
        admin: {
            skipLimit: false,
            multiplier: 2,
        },
        vip: {
            skipLimit: false,
            multiplier: 1.5,
        },
        free: {
            skipLimit: false,
            multiplier: 1,
        },
    },
    ipWhitelist: [
        '127.0.0.1',
        'localhost',
        '::1',
    ],
    pathWhitelist: [
        '/api/health',
        '/api/metrics',
        '/api/docs',
        '/api/swagger.json',
    ],
    errorMessages: {
        default: '请求过于频繁，请稍后重试',
        auth: '登录尝试过于频繁，请15分钟后重试',
        search: '搜索请求过于频繁，请1分钟后重试',
        user: '操作过于频繁，请1小时后重试',
        admin: '管理操作过于频繁，请5分钟后重试',
    },
    responseHeaders: {
        enabled: true,
        includeResetTime: true,
        includeRemaining: true,
        includeLimit: true,
    },
};
//# sourceMappingURL=rate-limit.config.js.map