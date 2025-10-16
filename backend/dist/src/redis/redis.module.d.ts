import { ConfigModule, ConfigService } from '@nestjs/config';
export declare const RedisClientProvider: {
    provide: string;
    imports: (typeof ConfigModule)[];
    useFactory: (configService: ConfigService) => Promise<any>;
    inject: (typeof ConfigService)[];
};
export declare const RedisCacheService: {
    provide: string;
    imports: (typeof ConfigModule)[];
    useFactory: (configService: ConfigService) => Promise<any>;
    inject: (typeof ConfigService)[];
};
export declare const RedisSessionProvider: {
    provide: string;
    imports: (typeof ConfigModule)[];
    useFactory: (configService: ConfigService) => Promise<any>;
    inject: (typeof ConfigService)[];
};
export declare class RedisModule {
}
