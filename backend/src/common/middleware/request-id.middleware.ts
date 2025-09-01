import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 请求ID中间件
 * 为每个请求生成唯一ID，便于追踪和调试
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 生成请求ID
    const requestId = this.generateRequestId();
    
    // 添加到请求头
    req.requestId = requestId;
    req.headers['x-request-id'] = requestId;
    
    // 记录开始时间
    req.startTime = Date.now();
    
    // 添加响应头
    res.setHeader('X-Request-ID', requestId);
    
    // 添加到日志上下文
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(`[${requestId}]`, ...args);
    };
    
    // 响应结束时记录处理时间
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any): any {
      const processingTime = Date.now() - req.startTime;
      console.log(`[${requestId}] Response time: ${processingTime}ms`);
      return originalEnd.call(this, chunk, encoding);
    };
    
    next();
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const counter = (this.getCounter() % 0xFFFFF).toString(36).padStart(5, '0');
    return `req_${timestamp}_${random}_${counter}`;
  }

  /**
   * 获取计数器
   */
  private getCounter(): number {
    const counterKey = 'request_counter';
    const counter = global[counterKey] || 0;
    global[counterKey] = counter + 1;
    return counter;
  }
}

/**
 * 全局扩展接口
 */
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}