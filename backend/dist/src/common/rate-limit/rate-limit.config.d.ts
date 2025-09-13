export declare const RATE_LIMIT_CONFIG: {
    readonly default: {
        readonly windowMs: number;
        readonly maxRequests: 100;
        readonly skipSuccessfulRequests: false;
        readonly skipFailedRequests: false;
    };
    readonly endpoints: {
        readonly auth: {
            readonly windowMs: number;
            readonly maxRequests: 5;
            readonly message: "登录尝试过于频繁，请稍后重试";
        };
        readonly media: {
            readonly windowMs: number;
            readonly maxRequests: 100;
            readonly message: "请求过于频繁，请稍后重试";
        };
        readonly search: {
            readonly windowMs: number;
            readonly maxRequests: 30;
            readonly message: "搜索请求过于频繁，请稍后重试";
        };
        readonly user: {
            readonly windowMs: number;
            readonly maxRequests: 1000;
            readonly message: "操作过于频繁，请稍后重试";
        };
        readonly admin: {
            readonly windowMs: number;
            readonly maxRequests: 50;
            readonly message: "管理操作过于频繁，请稍后重试";
        };
    };
    readonly roles: {
        readonly admin: {
            readonly skipLimit: false;
            readonly multiplier: 2;
        };
        readonly vip: {
            readonly skipLimit: false;
            readonly multiplier: 1.5;
        };
        readonly free: {
            readonly skipLimit: false;
            readonly multiplier: 1;
        };
    };
    readonly ipWhitelist: readonly ["127.0.0.1", "localhost", "::1"];
    readonly pathWhitelist: readonly ["/api/health", "/api/metrics", "/api/docs", "/api/swagger.json"];
    readonly errorMessages: {
        readonly default: "请求过于频繁，请稍后重试";
        readonly auth: "登录尝试过于频繁，请15分钟后重试";
        readonly search: "搜索请求过于频繁，请1分钟后重试";
        readonly user: "操作过于频繁，请1小时后重试";
        readonly admin: "管理操作过于频繁，请5分钟后重试";
    };
    readonly responseHeaders: {
        readonly enabled: true;
        readonly includeResetTime: true;
        readonly includeRemaining: true;
        readonly includeLimit: true;
    };
};
