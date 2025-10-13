"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const redis_module_1 = require("./redis/redis.module");
const user_module_1 = require("./users/user.module");
const auth_module_1 = require("./auth/auth.module");
const media_module_1 = require("./media/media.module");
const play_source_module_1 = require("./play-sources/play-source.module");
const watch_history_module_1 = require("./watch-history/watch-history.module");
const crawler_module_1 = require("./crawler/crawler.module");
const recommendation_module_1 = require("./recommendations/recommendation.module");
const admin_module_1 = require("./admin/admin.module");
const iptv_module_1 = require("./iptv/iptv.module");
const parse_providers_module_1 = require("./parse-providers/parse-providers.module");
const torrent_module_1 = require("./torrent/torrent.module");
const data_collection_module_1 = require("./data-collection/data-collection.module");
const common_module_1 = require("./common/common.module");
const cache_module_1 = require("./common/cache/cache.module");
const rate_limit_module_1 = require("./common/rate-limit/rate-limit.module");
const user_entity_1 = require("./entities/user.entity");
const media_resource_entity_1 = require("./entities/media-resource.entity");
const play_source_entity_1 = require("./entities/play-source.entity");
const watch_history_entity_1 = require("./entities/watch-history.entity");
const recommendation_entity_1 = require("./entities/recommendation.entity");
const iptv_channel_entity_1 = require("./entities/iptv-channel.entity");
const parse_provider_entity_1 = require("./entities/parse-provider.entity");
const admin_role_entity_1 = require("./entities/admin-role.entity");
const admin_permission_entity_1 = require("./entities/admin-permission.entity");
const admin_log_entity_1 = require("./entities/admin-log.entity");
const search_history_entity_1 = require("./entities/search-history.entity");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, swagger_1.ApiTags)('系统'),
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'mysql',
                    host: configService.get('DB_HOST'),
                    port: configService.get('DB_PORT'),
                    username: configService.get('DB_USERNAME'),
                    password: configService.get('DB_PASSWORD'),
                    database: configService.get('DB_DATABASE'),
                    entities: [
                        user_entity_1.User,
                        media_resource_entity_1.MediaResource,
                        play_source_entity_1.PlaySource,
                        watch_history_entity_1.WatchHistory,
                        recommendation_entity_1.Recommendation,
                        search_history_entity_1.SearchHistory,
                        admin_role_entity_1.AdminRole,
                        admin_permission_entity_1.AdminPermission,
                        admin_log_entity_1.AdminLog,
                        iptv_channel_entity_1.IPTVChannel,
                        parse_provider_entity_1.ParseProvider,
                    ],
                    extra: {
                        connectionLimit: Math.max(5, Math.min(20, Math.ceil(process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT) : 10))),
                        acquireTimeout: 60000,
                        timeout: 60000,
                        queueLimit: 20,
                        ssl: configService.get('DB_SSL', false) ? { rejectUnauthorized: false } : false,
                        charset: 'utf8mb4',
                        timezone: '+00:00',
                        multipleStatements: false,
                        namedPlaceholders: true,
                        bigNumberStrings: false,
                        dateStrings: false,
                        debug: process.env.NODE_ENV === 'development',
                        supportBigNumbers: true,
                        typeCast: function (field, next) {
                            if (field.type === 'TINY' && field.length === 1) {
                                return field.string() === '1';
                            }
                            return next();
                        },
                        enableKeepAlive: true,
                        keepAliveInitialDelay: 10000,
                        reconnect: true,
                        idleTimeout: 60000,
                        connectTimeout: 10000,
                        socketTimeout: 180000,
                        poolPing: true,
                        poolPingInterval: 30000,
                    },
                    autoSaveEntities: false,
                    retryAttempts: configService.get('DB_RETRY_ATTEMPTS', 5),
                    retryDelay: configService.get('DB_RETRY_DELAY', 5000),
                    maxQueryExecutionTime: configService.get('DB_MAX_QUERY_TIME', 3000),
                    slowQueryLimit: configService.get('DB_SLOW_QUERY_LIMIT', 500),
                    cache: false,
                    subscribers: [],
                    migrationsRun: false,
                    dropSchema: false,
                    migrations: ['src/migrations/*.ts'],
                    logging: configService.get('DB_LOGGING', process.env.NODE_ENV === 'development'),
                    logger: 'advanced-console',
                    loggerOptions: {
                        warnLevel: 'warn',
                        infoLevel: 'info',
                        logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
                    },
                    synchronize: configService.get('DB_SYNCHRONIZE', process.env.NODE_ENV === 'development'),
                }),
                inject: [config_1.ConfigService],
            }),
            redis_module_1.RedisModule,
            cache_module_1.CacheModule,
            rate_limit_module_1.RateLimitModule,
            user_module_1.UserModule,
            (0, common_1.forwardRef)(() => auth_module_1.AuthModule),
            media_module_1.MediaResourceModule,
            play_source_module_1.PlaySourceModule,
            watch_history_module_1.WatchHistoryModule,
            crawler_module_1.CrawlerModule,
            recommendation_module_1.RecommendationModule,
            admin_module_1.AdminModule,
            iptv_module_1.IPTVModule,
            parse_providers_module_1.ParseProvidersModule,
            torrent_module_1.TorrentModule,
            data_collection_module_1.DataCollectionModule,
            common_module_1.CommonModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map