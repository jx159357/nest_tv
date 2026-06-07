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
import { InitializationModule } from './initialization/initialization.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ProxyPoolModule } from './modules/proxy-pool/proxy-pool.module';
import { DownloadTasksModule } from './download-tasks/download-tasks.module';
import { DanmakuModule } from './danmaku/danmaku.module';
import { StorageModule } from './storage/storage.module';
import { WatchRoomModule } from './watch-room/watch-room.module';
import { SourceScriptModule } from './source-script/source-script.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { User } from './entities/user.entity';
import { MediaResource } from './entities/media-resource.entity';
import { PlaySource } from './entities/play-source.entity';
import { WatchHistory } from './entities/watch-history.entity';
import { Recommendation } from './entities/recommendation.entity';
import { IPTVChannel } from './entities/iptv-channel.entity';
import { ChannelLogo } from './entities/channel-logo.entity';
import { ParseProvider } from './entities/parse-provider.entity';
import { AdminRole } from './entities/admin-role.entity';
import { AdminPermission } from './entities/admin-permission.entity';
import { AdminLog } from './entities/admin-log.entity';
import { SearchHistory } from './entities/search-history.entity';
import { DownloadTask } from './entities/download-task.entity';
import { SourceScript } from './entities/source-script.entity';
import { CrawlerTarget } from './entities/crawler-target.entity';
import { Danmaku } from './danmaku/entities/danmaku.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';

function getBooleanConfig(
  configService: ConfigService,
  key: string,
  defaultValue: boolean,
): boolean {
  const value = configService.get<string | boolean>(key);
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

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
      useFactory: (configService: ConfigService) => {
        const dbLogging = getBooleanConfig(configService, 'DB_LOGGING', false);

        return {
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
            Danmaku,
            AdminRole,
            AdminPermission,
            AdminLog,
            IPTVChannel,
            ChannelLogo,
            ParseProvider,
            DownloadTask,
            SourceScript,
            CrawlerTarget,
          ], // 所有实体类

          // 连接池优化配置（仅使用 mysql2 pool 支持的选项）
          extra: {
            connectionLimit: Math.max(
              parseInt(configService.get<string>('DB_POOL_MIN', '5')),
              Math.min(
                parseInt(configService.get<string>('DB_POOL_MAX', '50')),
                Math.ceil(
                  process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT) : 25,
                ),
              ),
            ),
            queueLimit: parseInt(configService.get<string>('DB_QUEUE_LIMIT', '30')),
            waitForConnections: true,
            connectTimeout: parseInt(
              configService.get<string>('DB_CONNECTION_CHECK_TIMEOUT', '30000'),
              10,
            ),
            ssl: configService.get<boolean>('DB_SSL', false)
              ? { rejectUnauthorized: false }
              : false,
            charset: 'utf8mb4',
            timezone: '+00:00',
            enableKeepAlive: true,
            keepAliveInitialDelay: 10000,
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

          // 数据库迁移配置 - 使用编译后的JS文件避免ES Module问题
          migrationsRun: false, // 禁用自动运行迁移
          dropSchema: false, // 禁用自动删除数据库
          migrations: ['dist/migrations/*.js'], // 使用编译后的JS文件

          // 日志和调试配置
          logging: dbLogging,
          logger: 'advanced-console', // 高级控制台日志
          loggerOptions: {
            warnLevel: 'warn',
            infoLevel: 'info',
            logLevel: dbLogging ? 'info' : 'warn',
          },

          // 生产环境配置
          synchronize: configService.get<boolean>(
            'DB_SYNCHRONIZE',
            process.env.NODE_ENV === 'development',
          ),
        };
      },
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

    // 初始化模块 - 默认数据和配置初始化
    InitializationModule,

    // 调度模块 - 定时任务和调度功能
    SchedulerModule,

    // 代理池模块 - 代理IP管理和轮换
    ProxyPoolModule,

    // 下载任务模块 - 用户下载任务同步
    DownloadTasksModule,

    // 弹幕模块 - 弹幕接口与实时房间统计
    DanmakuModule,

    // 存储模块 - 文件存储适配器
    StorageModule,

    // 一起看模块 - 同步观看功能
    WatchRoomModule,

    // 源脚本模块 - 自定义视频源插件系统
    SourceScriptModule,

    // AI 推荐模块 - 智能影片推荐
    AiChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
