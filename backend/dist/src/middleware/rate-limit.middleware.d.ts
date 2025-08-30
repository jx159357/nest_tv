import { NestMiddleware, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RateLimitMiddleware implements NestMiddleware {
    private configService;
    private readonly requestCounts;
    constructor(configService: ConfigService);
    use(context: ExecutionContext, next: () => Promise<void>): Promise<void>;
    private getClientId;
    private cleanupExpiredCounters;
}
