import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/constants/redis.constants';

type RedisEventHandler = (...args: unknown[]) => void;
type RedisExecResult = [Error | null, unknown][];

interface RedisPipelineFallback {
  set(...args: unknown[]): RedisPipelineFallback;
  expire(...args: unknown[]): RedisPipelineFallback;
  incr(...args: unknown[]): RedisPipelineFallback;
  zremrangebyscore(...args: unknown[]): RedisPipelineFallback;
  zcard(...args: unknown[]): RedisPipelineFallback;
  zadd(...args: unknown[]): RedisPipelineFallback;
  exec(): Promise<RedisExecResult>;
}

interface RedisClientFallback {
  connect(): Promise<void>;
  ping(): Promise<never>;
  get(key: string): Promise<null>;
  set(...args: unknown[]): Promise<'OK'>;
  del(...args: unknown[]): Promise<number>;
  exists(...keys: string[]): Promise<number>;
  scan(cursor: string, ...args: unknown[]): Promise<[string, string[]]>;
  keys(pattern: string): Promise<string[]>;
  flushall(): Promise<'OK'>;
  quit(): Promise<'OK'>;
  disconnect(): void;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  mget(keys: string[]): Promise<null[]>;
  info(): Promise<string>;
  eval(...args: unknown[]): Promise<unknown>;
  pipeline(): RedisPipelineFallback;
  multi(): RedisPipelineFallback;
  on(event: string, handler: RedisEventHandler): void;
  off(event: string, handler: RedisEventHandler): void;
  once(event: string, handler: RedisEventHandler): void;
  emit(event: string, ...args: unknown[]): boolean;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : '未知错误';

const createFallbackPipeline = (): RedisPipelineFallback => {
  const commands: string[] = [];
  const pipeline: RedisPipelineFallback = {
    set: () => {
      commands.push('set');
      return pipeline;
    },
    expire: () => {
      commands.push('expire');
      return pipeline;
    },
    incr: () => {
      commands.push('incr');
      return pipeline;
    },
    zremrangebyscore: () => {
      commands.push('zremrangebyscore');
      return pipeline;
    },
    zcard: () => {
      commands.push('zcard');
      return pipeline;
    },
    zadd: () => {
      commands.push('zadd');
      return pipeline;
    },
    exec: () =>
      Promise.resolve(
        commands.map(command => {
          if (command === 'incr') return [null, 1] as [null, number];
          if (command === 'zcard') return [null, 0] as [null, number];
          if (command === 'set') return [null, 'OK'] as [null, string];
          return [null, 1] as [null, number];
        }),
      ),
  };

  return pipeline;
};

const createFallbackRedisClient = (): RedisClientFallback => ({
  connect: () => Promise.resolve(),
  ping: () => Promise.reject(new Error('Redis不可用')),
  get: () => Promise.resolve(null),
  set: () => Promise.resolve('OK'),
  del: () => Promise.resolve(0),
  exists: () => Promise.resolve(0),
  scan: () => Promise.resolve(['0', []]),
  keys: () => Promise.resolve([]),
  flushall: () => Promise.resolve('OK'),
  quit: () => Promise.resolve('OK'),
  disconnect: () => undefined,
  expire: () => Promise.resolve(0),
  ttl: () => Promise.resolve(-2),
  mget: keys => Promise.resolve(keys.map(() => null)),
  info: () => Promise.resolve(''),
  eval: () => Promise.resolve(null),
  pipeline: () => createFallbackPipeline(),
  multi: () => createFallbackPipeline(),
  on: () => undefined,
  off: () => undefined,
  once: () => undefined,
  emit: () => false,
});

const getNumberConfig = (
  configService: ConfigService,
  key: string,
  defaultValue: number,
): number => {
  const value = configService.get<string | number>(key);
  const parsed = Number(value ?? defaultValue);
  return Number.isFinite(parsed) ? parsed : defaultValue;
};

const createRedisProviderClient = async (
  configService: ConfigService,
  label: string,
  options: {
    reconnectBaseMs: number;
    reconnectMaxMs: number;
    connectTimeout: number;
  },
): Promise<Redis | RedisClientFallback> => {
  const host = configService.get<string>('REDIS_HOST') || 'localhost';
  const port = getNumberConfig(configService, 'REDIS_PORT', 6379);
  const password = configService.get<string>('REDIS_PASSWORD') || undefined;

  const client = new Redis({
    host,
    port,
    password,
    lazyConnect: true,
    connectTimeout: options.connectTimeout,
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    retryStrategy: retries => Math.min(retries * options.reconnectBaseMs, options.reconnectMaxMs),
  });

  client.on('error', (err: unknown) => {
    console.warn(`${label} Redis客户端错误:`, getErrorMessage(err));
  });

  client.on('connect', () => {
    console.log(`${label} Redis连接成功`);
  });

  client.on('reconnecting', () => {
    console.log(`${label} Redis重连中...`);
  });

  client.on('ready', () => {
    console.log(`${label} Redis就绪`);
  });

  client.on('end', () => {
    console.log(`${label} Redis连接结束`);
  });

  try {
    await client.connect();
    await client.ping();
    console.log(`${label} Redis连接测试成功`);
    return client;
  } catch (error: unknown) {
    console.warn(`${label} Redis连接失败，将使用降级客户端:`, getErrorMessage(error));
    client.disconnect();
    return createFallbackRedisClient();
  }
};

export const RedisClientProvider = {
  provide: REDIS_CLIENT,
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) =>
    createRedisProviderClient(configService, '主', {
      reconnectBaseMs: 50,
      reconnectMaxMs: 1000,
      connectTimeout: 10000,
    }),
  inject: [ConfigService],
};

export const RedisCacheService = {
  provide: 'REDIS_CACHE_SERVICE',
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) =>
    createRedisProviderClient(configService, '缓存', {
      reconnectBaseMs: 100,
      reconnectMaxMs: 2000,
      connectTimeout: 5000,
    }),
  inject: [ConfigService],
};

export const RedisSessionProvider = {
  provide: 'REDIS_SESSION',
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) =>
    createRedisProviderClient(configService, '会话', {
      reconnectBaseMs: 200,
      reconnectMaxMs: 3000,
      connectTimeout: 15000,
    }),
  inject: [ConfigService],
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisClientProvider, RedisCacheService, RedisSessionProvider],
  exports: [RedisClientProvider, RedisCacheService, RedisSessionProvider],
})
export class RedisModule {}
