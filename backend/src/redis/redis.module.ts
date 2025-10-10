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
        reconnectStrategy: function(retries) {
          // 指数退避重连策略
          return Math.min(retries * 50, 1000);
        },
        connectTimeout: 10000, // 连接超时 10秒
      },
      
      // 高级配置
      disableOfflineQueue: false, // 离线时仍可接收命令
      // enableReadyCheck: true, // 启用就绪检查（暂不支持）
      // enableOfflineQueue: true, // 启用离线队列（暂不支持）
      // retryDelayOnFailover: 100, // 故障转移重试延迟（暂不支持）
      
      // 连接池配置
      // maxRetriesPerRequest: 3, // 每个请求最大重试次数（暂不支持）
      // // lazyConnect: false, // 暂不支持 // 禁用懒连接（暂不支持）
      // keepAlive: true, // 保持连接活跃（暂不支持） // 保持连接活跃
      // noDelay: // 暂不支持 false, // 启用 Nagle 算法
    });

    // 错误处理和监控
    client.on('error', err => {
      console.error('Redis客户端错误:', err);
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

    // 连接Redis
    await client.connect();

    // 测试连接
    try {
      await client.ping();
      console.log('Redis连接测试成功');
    } catch (error) {
      console.error('Redis连接测试失败:', error);
    }

    return client;
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
        reconnectStrategy: function(retries) {
          return Math.min(retries * 100, 2000); // 缓存重连更积极
        },
        connectTimeout: 5000, // 缓存连接超时更短
        // 缓存命令超时更短（移除不支持的commandTimeout）
      },
      
      // 缓存优化配置
      // maxRetriesPerRequest: 1, // 缓存请求重试次数较少（暂不支持）
      // retryDelayOnFailover: 50, // 故障转移重试延迟更短（暂不支持）
      // lazyConnect: false, // 暂不支持
      // keepAlive: true, // 保持连接活跃（暂不支持）
      // noDelay: // 暂不支持 true, // 缓存使用更快的算法
    });

    await client.connect();
    return client;
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
        reconnectStrategy: function(retries) {
          return Math.min(retries * 200, 3000); // 会话重连更保守
        },
        connectTimeout: 15000, // 会话连接超时更长
        // 会话命令超时更长（移除不支持的commandTimeout）
      },
      
      // 会话优化配置
      // maxRetriesPerRequest: 5, // 会话请求重试次数更多（暂不支持）
      // retryDelayOnFailover: 200, // 会话故障转移重试延迟更长（暂不支持）
      // lazyConnect: false, // 暂不支持
      // keepAlive: true, // 保持连接活跃（暂不支持）
      // noDelay: // 暂不支持 false,
    });

    await client.connect();
    return client;
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
