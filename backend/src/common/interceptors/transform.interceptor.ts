import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request, Response } from 'express';
import { Reflector } from '@nestjs/core';
import { ensureRequestId } from '../utils/request-id.util';

export const SKIP_TRANSFORM_KEY = 'skipTransform';

export interface StandardResponse<T> {
  success: true;
  data: T;
  message?: string;
  requestId: string;
  timestamp: string;
}

/**
 * 全局响应转换拦截器
 * 将所有成功响应统一包装为 { success, data, message?, requestId, timestamp }
 *
 * 自动跳过：
 * - 已有 success 字段的响应（避免重复包装）
 * - StreamableFile / Buffer / 流式响应
 * - SSE (text/event-stream) 响应
 * - void / undefined / null 响应
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, StandardResponse<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T> | T> {
    const skipTransform = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipTransform) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();
    const requestId = ensureRequestId(request, response);

    const contentType = response.getHeader('content-type');
    if (
      typeof contentType === 'string' &&
      (contentType.includes('text/event-stream') ||
        contentType.includes('application/octet-stream') ||
        contentType.includes('text/plain'))
    ) {
      return next.handle();
    }

    return next.handle().pipe(
      map(data => {
        if (data === undefined || data === null) {
          return data;
        }

        if (data instanceof StreamableFile || Buffer.isBuffer(data)) {
          return data;
        }

        if (typeof data === 'string') {
          return data;
        }

        if (data !== null && typeof data === 'object' && 'success' in data) {
          return data;
        }

        return {
          success: true as const,
          data,
          requestId,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
