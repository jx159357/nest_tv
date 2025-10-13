import { Module, forwardRef } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from './redis/redis.module';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { MediaResourceModule } from './media/media.module';
import { PlaySourceModule } from './play-sources/play-source.module';
import { WatchHistoryModule } from './watch-history/watch-history.module';
import { CrawlerModule } from './crawler/crawler.module';
import { RecommendationModule } from './recommendations/recommendation.module';
import { AdminModule } from './admin/admin.module';
import { IPTVModule } from './iptv/iptv.module';
import { ParseProvidersModule } from './parse-providers/parse-providers.module';
import { TorrentModule } from './torrent/torrent.module';
import { DataCollectionModule } from './data-collection/data-collection.module';
import { CommonModule } from './common/common.module';
import { CacheModule } from './common/cache/cache.module';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { User } from './entities/user.entity';
import { MediaResource } from './entities/media-resource.entity';
import { PlaySource } from './entities/play-source.entity';
import { WatchHistory } from './entities/watch-history.entity';
import { Recommendation } from './entities/recommendation.entity';
import { IPTVChannel } from './entities/iptv-channel.entity';
import { ParseProvider } from './entities/parse-provider.entity';
import { AdminRole } from './entities/admin-role.entity';
import { AdminPermission } from './entities/admin-permission.entity';
import { AdminLog } from './entities/admin-log.entity';
import { SearchHistory } from './entities/search-history.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@ApiTags('系统')
@Module({
  imports: [
    // 配置模块 - 用于环境变量管理
    ConfigModule.forRoot({
      isGlobal: true, // 全局可用
      envFilePath: '.env', // 环境变量文件路径
    }),

    // TypeORM模块 - 用于数据库连接
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          User,
          MediaResource,
          PlaySource,
          WatchHistory,
          Recommendation,
          SearchHistory,
          AdminRole,
          AdminPermission,
          AdminLog,
          IPTVChannel,
          ParseProvider,
        ], // 所有实体类

        // 连接池优化配置
        extra: {
          // 基础连接池设置
          connectionLimit: Math.max(
            5,
            Math.min(
              20,
              Math.ceil(
                process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT) : 10,
              ),
            ),
          ),
          acquireTimeout: 60000, // 增加获取连接超时到60秒
          timeout: 60000, // 增加查询超时到60秒

          // 高级连接池设置
          queueLimit: 20, // 增加等待队列大小

          // SSL配置（安全连接）
          ssl: configService.get<boolean>('DB_SSL', false) ? { rejectUnauthorized: false } : false,

          // 字符集和时区配置
          charset: 'utf8mb4',
          timezone: '+00:00',

          // 连接复用和安全设置
          multipleStatements: false,
          namedPlaceholders: true,

          // 数据类型和性能配置
          bigNumberStrings: false,
          dateStrings: false,
          debug: process.env.NODE_ENV === 'development',

          // 性能优化设置
          supportBigNumbers: true,
          typeCast: function (field: any, next: any) {
            if (field.type === 'TINY' && field.length === 1) {
              return field.string() === '1';
            }
            return next();
          },

          // 连接保活设置
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000, // 保活初始延迟10秒

          // 重连配置 - 增强重连机制
          reconnect: true,
          idleTimeout: 60000, // 空闲超时60秒

          // 连接检测配置
          connectTimeout: 10000, // 连接超时10秒
          socketTimeout: 180000, // Socket超时3分钟

          // 错误恢复配置
          poolPing: true, // 启用连接池健康检查
          poolPingInterval: 30000, // 每30秒检查一次连接
        },

        // 事务和连接管理
        autoSaveEntities: false,
        retryAttempts: configService.get<number>('DB_RETRY_ATTEMPTS', 5), // 增加重试次数
        retryDelay: configService.get<number>('DB_RETRY_DELAY', 5000), // 增加重试延迟

        // 查询性能监控
        maxQueryExecutionTime: configService.get<number>('DB_MAX_QUERY_TIME', 3000), // 增加最大查询时间
        slowQueryLimit: configService.get<number>('DB_SLOW_QUERY_LIMIT', 500), // 增加慢查询阈值

        // 缓存策略 - 禁用TypeORM默认缓存，使用自定义Redis缓存
        cache: false,

        // 监控和订阅者管理
        subscribers: [], // 禁用默认订阅者，防止内存泄漏

        // 数据库迁移配置
        migrationsRun: false, // 禁用自动运行迁移
        dropSchema: false, // 禁用自动删除数据库
        migrations: ['src/migrations/*.ts'], // 迁移文件路径

        // 日志和调试配置
        logging: configService.get<boolean>('DB_LOGGING', process.env.NODE_ENV === 'development'),
        logger: 'advanced-console', // 高级控制台日志
        loggerOptions: {
          warnLevel: 'warn',
          infoLevel: 'info',
          logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
        },

        // 生产环境配置
        synchronize: configService.get<boolean>(
          'DB_SYNCHRONIZE',
          process.env.NODE_ENV === 'development',
        ),
      }),
      inject: [ConfigService],
    }),

    // Redis模块 - 用于缓存和会话管理
    RedisModule,

    // 缓存模块 - 用于性能优化
    CacheModule,

    // 限流模块 - 用于API访问频率控制
    RateLimitModule,

    // 用户模块 - 用户注册、登录等功能
    UserModule,

    // 认证模块 - JWT令牌认证
    forwardRef(() => AuthModule),

    // 影视资源模块 - 影视资源管理
    MediaResourceModule,

    // 播放源模块 - 播放源管理
    PlaySourceModule,

    // 观看历史模块 - 观看历史管理
    WatchHistoryModule,

    // 爬虫模块 - 资源爬取功能
    CrawlerModule,

    // 推荐模块 - 个性化推荐功能
    RecommendationModule,

    // 后台管理模块 - 系统管理功能
    AdminModule,

    // IPTV模块 - 直播频道管理
    IPTVModule,

    // 解析提供商模块 - 解析站资源管理
    ParseProvidersModule,

    // 磁力链接模块 - 磁力链接播放功能
    TorrentModule,

    // 数据采集模块 - 扩展数据采集功能
    DataCollectionModule,

    // 通用模块 - 企业级服务和组件
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
