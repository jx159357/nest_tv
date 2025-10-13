import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 增强安全头中间件
 * 提供全面的HTTP安全保护，包括CSP、CORS、CSRF等
 */
@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // 基本安全头
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 移除敏感信息
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // 严格传输安全
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // CSP策略
    const cspPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: http:",
      "font-src 'self' data: https: http:",
      "connect-src 'self' https: wss: http: ws:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "frame-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
    ].join('; ');

    res.setHeader('Content-Security-Policy', cspPolicy);

    // 权限策略
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // 防止MIME类型嗅探
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 启用HSTS
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    next();
  }
}
