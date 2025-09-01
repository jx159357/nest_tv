import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';

/**
 * 统一响应拦截器
 * 将所有响应包装为统一的格式
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse> {
    return next.handle().pipe(
      map(data => {
        // 如果数据已经是统一格式，直接返回
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // 获取请求信息
        const request = context.switchToHttp().getRequest();
        const response = {
          success: true,
          data: data || null,
          error: null,
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId(),
        };

        // 添加调试信息（开发环境）
        if (process.env.NODE_ENV === 'development') {
          Object.assign(response, {
            debug: {
              method: request.method,
              url: request.url,
              userAgent: request.get('user-agent'),
              processingTime: Date.now() - request.startTime,
            },
          });
        }

        return response;
      })
    );
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `REQ_${timestamp}_${random}`;
  }
}

/**
 * 成功响应装饰器
 */
export const SuccessResponse = (message?: string) => (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    try {
      const result = await originalMethod.apply(this, args);
      
      // 如果结果包含success属性，说明已经处理过
      if (result && typeof result === 'object' && 'success' in result) {
        return result;
      }
      
      return {
        success: true,
        data: result,
        message: message || '操作成功',
        error: null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // 重新抛出错误，让异常过滤器处理
      throw error;
    }
  };
  
  return descriptor;
};

/**
 * 分页响应装饰器
 */
export const PaginatedResponse = () => (
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    try {
      const result = await originalMethod.apply(this, args);
      
      // 确保结果是分页格式
      if (result && typeof result === 'object' && 
          'data' in result && 
          'total' in result && 
          'page' in result) {
        
        return {
          success: true,
          data: result.data,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
          error: null,
          timestamp: new Date().toISOString(),
        };
      }
      
      return {
        success: true,
        data: result,
        error: null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  };
  
  return descriptor;
};