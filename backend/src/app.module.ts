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
        synchronize: true, // 开发环境下同步数据库结构
        logging: true, // 开启SQL日志
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
