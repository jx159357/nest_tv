"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = exports.RedisSessionProvider = exports.RedisCacheService = exports.RedisClientProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
exports.RedisClientProvider = {
    provide: 'REDIS_CLIENT',
    imports: [config_1.ConfigModule],
    useFactory: async (configService) => {
        const client = (0, redis_1.createClient)({
            url: `redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
            password: configService.get('REDIS_PASSWORD') || undefined,
            socket: {
                host: configService.get('REDIS_HOST'),
                port: configService.get('REDIS_PORT'),
                reconnectStrategy: function (retries) {
                    return Math.min(retries * 50, 1000);
                },
                connectTimeout: 10000,
            },
        });
        client.on('error', err => {
            console.warn('Redis客户端错误:', err.message);
        });
        client.on('connect', () => {
            console.log('Redis连接成功');
        });
        client.on('reconnecting', () => {
            console.log('Redis重连中...');
        });
        client.on('ready', () => {
            console.log('Redis就绪');
        });
        client.on('end', () => {
            console.log('Redis连接结束');
        });
        try {
            await client.connect();
            console.log('Redis连接测试成功');
            return client;
        }
        catch (error) {
            console.warn('Redis连接失败，将使用内存缓存:', error.message);
            return {
                connect: async () => { },
                ping: async () => { throw new Error('Redis不可用'); },
                get: async () => null,
                set: async () => { },
                del: async () => { },
                exists: async () => 0,
                keys: async () => [],
                flushall: async () => { },
                quit: async () => { },
                on: () => { },
                off: () => { },
                once: () => { },
                emit: () => { },
            };
        }
    },
    inject: [config_1.ConfigService],
};
exports.RedisCacheService = {
    provide: 'REDIS_CACHE_SERVICE',
    imports: [config_1.ConfigModule],
    useFactory: async (configService) => {
        const client = (0, redis_1.createClient)({
            url: `redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
            password: configService.get('REDIS_PASSWORD') || undefined,
            socket: {
                reconnectStrategy: function (retries) {
                    return Math.min(retries * 100, 2000);
                },
                connectTimeout: 5000,
            },
        });
        try {
            await client.connect();
            console.log('Redis缓存服务连接成功');
            return client;
        }
        catch (error) {
            console.warn('Redis缓存服务连接失败，将使用内存缓存:', error.message);
            return {
                connect: async () => { },
                ping: async () => { throw new Error('Redis不可用'); },
                get: async () => null,
                set: async () => { },
                del: async () => { },
                exists: async () => 0,
                keys: async () => [],
                flushall: async () => { },
                quit: async () => { },
                on: () => { },
                off: () => { },
                once: () => { },
                emit: () => { },
            };
        }
    },
    inject: [config_1.ConfigService],
};
exports.RedisSessionProvider = {
    provide: 'REDIS_SESSION',
    imports: [config_1.ConfigModule],
    useFactory: async (configService) => {
        const client = (0, redis_1.createClient)({
            url: `redis://${configService.get('REDIS_HOST')}:${configService.get('REDIS_PORT')}`,
            password: configService.get('REDIS_PASSWORD') || undefined,
            socket: {
                reconnectStrategy: function (retries) {
                    return Math.min(retries * 200, 3000);
                },
                connectTimeout: 15000,
            },
        });
        try {
            await client.connect();
            console.log('Redis会话服务连接成功');
            return client;
        }
        catch (error) {
            console.warn('Redis会话服务连接失败，将使用内存会话:', error.message);
            return {
                connect: async () => { },
                ping: async () => { throw new Error('Redis不可用'); },
                get: async () => null,
                set: async () => { },
                del: async () => { },
                exists: async () => 0,
                keys: async () => [],
                flushall: async () => { },
                quit: async () => { },
                on: () => { },
                off: () => { },
                once: () => { },
                emit: () => { },
            };
        }
    },
    inject: [config_1.ConfigService],
};
let RedisModule = class RedisModule {
};
exports.RedisModule = RedisModule;
exports.RedisModule = RedisModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [exports.RedisClientProvider, exports.RedisCacheService, exports.RedisSessionProvider],
        exports: [exports.RedisClientProvider, exports.RedisCacheService, exports.RedisSessionProvider],
    })
], RedisModule);
//# sourceMappingURL=redis.module.js.map