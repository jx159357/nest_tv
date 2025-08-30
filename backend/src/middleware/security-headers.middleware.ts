import { Injectable, NestMiddleware, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  constructor(private reflector: Reflector) {}

  async use(context: ExecutionContext, next: () => Promise<void>) {
    const response = context.switchToHttp().getResponse();
    const configService = context.switchToHttp().getRequest().app.get(ConfigService);
    
    // 安全响应头设置
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'SAMEORIGIN');
    response.setHeader('X-XSS-Protection', '1; mode=block');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // CSP策略
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    if (isProduction) {
      response.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' 'data:' https:",
        "font-src 'self'",
        "connect-src 'self' ws: wss:",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '));
    }
    
    // 防止点击劫持
    response.removeHeader('X-Powered-By');
    
    await next();
  }
}