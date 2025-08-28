"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisModule = exports.RedisClientProvider = void 0;
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
        });
        client.on('error', (err) => {
            console.error('Redis客户端错误:', err);
        });
        await client.connect();
        console.log('Redis连接成功');
        return client;
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
        providers: [exports.RedisClientProvider],
        exports: [exports.RedisClientProvider],
    })
], RedisModule);
//# sourceMappingURL=redis.module.js.map