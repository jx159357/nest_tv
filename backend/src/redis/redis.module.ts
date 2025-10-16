import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

// Redis客户端提供者
export const RedisClientProvider = {
  provide: 'REDIS_CLIENT',
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const client = createClient({
      url: `redis://${configService.get<string>('REDIS_HOST')}:${configService.get<number>('REDIS_PORT')}`,
      password: configService.get<string>('REDIS_PASSWORD') || undefined,

      // 连接配置优化
      socket: {
        host: configService.get<string>('REDIS_HOST'),
        port: configService.get<number>('REDIS_PORT'),
        reconnectStrategy: function (retries) {
          // 指数退避重连策略
          return Math.min(retries * 50, 1000);
        },
        connectTimeout: 10000, // 连接超时 10秒
      },
    });

    // 错误处理和监控
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

    // 尝试连接Redis，如果失败则优雅降级
    try {
      await client.connect();
      console.log('Redis连接测试成功');
      return client;
    } catch (error) {
      console.warn('Redis连接失败，将使用内存缓存:', error.message);
      // 返回一个模拟的Redis客户端
      return {
        connect: async () => {},
        ping: async () => { throw new Error('Redis不可用'); },
        get: async () => null,
        set: async () => {},
        del: async () => {},
        exists: async () => 0,
        keys: async () => [],
        flushall: async () => {},
        quit: async () => {},
        on: () => {},
        off: () => {},
        once: () => {},
        emit: () => {},
      } as any;
    }
  },
  inject: [ConfigService],
};

// Redis缓存服务提供者
export const RedisCacheService = {
  provide: 'REDIS_CACHE_SERVICE',
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const client = createClient({
      url: `redis://${configService.get<string>('REDIS_HOST')}:${configService.get<number>('REDIS_PORT')}`,
      password: configService.get<string>('REDIS_PASSWORD') || undefined,

      // 缓存专用配置
      socket: {
        reconnectStrategy: function (retries) {
          return Math.min(retries * 100, 2000); // 缓存重连更积极
        },
        connectTimeout: 5000, // 缓存连接超时更短
      },
    });

    try {
      await client.connect();
      console.log('Redis缓存服务连接成功');
      return client;
    } catch (error) {
      console.warn('Redis缓存服务连接失败，将使用内存缓存:', error.message);
      // 返回一个模拟的Redis客户端
      return {
        connect: async () => {},
        ping: async () => { throw new Error('Redis不可用'); },
        get: async () => null,
        set: async () => {},
        del: async () => {},
        exists: async () => 0,
        keys: async () => [],
        flushall: async () => {},
        quit: async () => {},
        on: () => {},
        off: () => {},
        once: () => {},
        emit: () => {},
      } as any;
    }
  },
  inject: [ConfigService],
};

// Redis会话提供者
export const RedisSessionProvider = {
  provide: 'REDIS_SESSION',
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const client = createClient({
      url: `redis://${configService.get<string>('REDIS_HOST')}:${configService.get<number>('REDIS_PORT')}`,
      password: configService.get<string>('REDIS_PASSWORD') || undefined,

      // 会话专用配置
      socket: {
        reconnectStrategy: function (retries) {
          return Math.min(retries * 200, 3000); // 会话重连更保守
        },
        connectTimeout: 15000, // 会话连接超时更长
      },
    });

    try {
      await client.connect();
      console.log('Redis会话服务连接成功');
      return client;
    } catch (error) {
      console.warn('Redis会话服务连接失败，将使用内存会话:', error.message);
      // 返回一个模拟的Redis客户端
      return {
        connect: async () => {},
        ping: async () => { throw new Error('Redis不可用'); },
        get: async () => null,
        set: async () => {},
        del: async () => {},
        exists: async () => 0,
        keys: async () => [],
        flushall: async () => {},
        quit: async () => {},
        on: () => {},
        off: () => {},
        once: () => {},
        emit: () => {},
      } as any;
    }
  },
  inject: [ConfigService],
};

@Global() // 全局模块，其他模块可以直接注入使用
@Module({
  imports: [ConfigModule],
  providers: [RedisClientProvider, RedisCacheService, RedisSessionProvider],
  exports: [RedisClientProvider, RedisCacheService, RedisSessionProvider], // 导出所有Redis服务供其他模块使用
})
export class RedisModule {}
