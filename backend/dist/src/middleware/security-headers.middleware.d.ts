import { NestMiddleware, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare class SecurityHeadersMiddleware implements NestMiddleware {
    private reflector;
    constructor(reflector: Reflector);
    use(context: ExecutionContext, next: () => Promise<void>): Promise<void>;
}
