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
    });

    // 错误处理
    client.on('error', (err) => {
      console.error('Redis客户端错误:', err);
    });

    // 连接Redis
    await client.connect();
    console.log('Redis连接成功');
    
    return client;
  },
  inject: [ConfigService],
};

@Global() // 全局模块，其他模块可以直接注入使用
@Module({
  imports: [ConfigModule],
  providers: [RedisClientProvider],
  exports: [RedisClientProvider], // 导出Redis客户端供其他模块使用
})
export class RedisModule {}