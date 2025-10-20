import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 生产环境日志服务
 * 支持文件日志、日志轮转、结构化日志等生产级功能
 */
@Injectable()
export class ProductionLoggerService {
  private readonly logger: Logger;
  private readonly logDirectory: string;
  private readonly maxLogSize: number;
  private readonly maxLogFiles: number;
  private readonly logToFile: boolean;

  constructor(private configService: ConfigService) {
    this.logger = new Logger('ProductionLogger');
    this.logToFile = this.configService.get<boolean>('LOG_TO_FILE', false);
    this.logDirectory = this.configService.get<string>('LOG_FILE_PATH', './logs');
    this.maxLogSize = this.parseSize(this.configService.get<string>('LOG_MAX_SIZE', '10MB'));
    this.maxLogFiles = parseInt(this.configService.get<string>('LOG_MAX_FILES', '5'));

    // 确保日志目录存在
    if (this.logToFile) {
      this.ensureLogDirectory();
    }
  }

  /**
   * 解析文件大小字符串
   */
  private parseSize(sizeStr: string): number {
    const units: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
    };

    const match = sizeStr.match(/^(\d+)(B|KB|MB|GB)$/i);
    if (!match) {
      return 10 * 1024 * 1024; // 默认10MB
    }

    const [, size, unit] = match;
    return parseInt(size) * (units[unit.toUpperCase()] || 1024 * 1024);
  }

  /**
   * 确保日志目录存在
   */
  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  /**
   * 获取日志文件路径
   */
  private getLogFilePath(type: string): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDirectory, `${type}-${date}.log`);
  }

  /**
   * 检查并轮转日志文件
   */
  private rotateLogFile(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const stats = fs.statSync(filePath);
    if (stats.size < this.maxLogSize) {
      return;
    }

    // 轮转日志文件
    for (let i = this.maxLogFiles - 1; i > 0; i--) {
      const oldFile = `${filePath}.${i}`;
      const newFile = `${filePath}.${i + 1}`;
      
      if (fs.existsSync(oldFile)) {
        if (i === this.maxLogFiles - 1) {
          fs.unlinkSync(oldFile); // 删除最老的日志文件
        } else {
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // 重命名当前日志文件
    fs.renameSync(filePath, `${filePath}.1`);
  }

  /**
   * 写入文件日志
   */
  private writeToFile(level: string, message: string, context?: string, timestamp?: string): void {
    if (!this.logToFile) {
      return;
    }

    const filePath = this.getLogFilePath(level.toLowerCase());
    this.rotateLogFile(filePath);

    const logEntry = {
      timestamp: timestamp || new Date().toISOString(),
      level,
      message,
      context,
      pid: process.pid,
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(filePath, logLine, 'utf8');
  }

  /**
   * 记录信息日志
   */
  log(message: any, context?: string): void {
    this.logger.log(message, context);
    this.writeToFile('INFO', message, context);
  }

  /**
   * 记录错误日志
   */
  error(message: any, context?: string, trace?: string): void {
    this.logger.error(message, trace, context);
    this.writeToFile('ERROR', message, context);
    if (trace) {
      this.writeToFile('ERROR', trace, context);
    }
  }

  /**
   * 记录警告日志
   */
  warn(message: any, context?: string): void {
    this.logger.warn(message, context);
    this.writeToFile('WARN', message, context);
  }

  /**
   * 记录调试日志
   */
  debug(message: any, context?: string): void {
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(message, context);
      this.writeToFile('DEBUG', message, context);
    }
  }

  /**
   * 记录访问日志
   */
  logAccess(method: string, url: string, statusCode: number, responseTime: number, userId?: string): void {
    const accessLog = {
      method,
      url,
      statusCode,
      responseTime,
      userId,
      userAgent: 'user-agent', // 在实际使用中从请求获取
      ip: 'client-ip', // 在实际使用中从请求获取
    };

    this.writeToFile('ACCESS', JSON.stringify(accessLog), 'HTTP_ACCESS');
  }

  /**
   * 记录性能日志
   */
  logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    const perfLog = {
      operation,
      duration,
      metadata,
      timestamp: new Date().toISOString(),
    };

    this.writeToFile('PERF', JSON.stringify(perfLog), 'PERFORMANCE');
  }

  /**
   * 记录安全事件
   */
  logSecurity(event: string, details: Record<string, any>, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'): void {
    const securityLog = {
      event,
      severity,
      details,
      timestamp: new Date().toISOString(),
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
    };

    this.writeToFile('SECURITY', JSON.stringify(securityLog), 'SECURITY_EVENT');
    
    // 高严重级别事件同时记录到错误日志
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      this.error(`安全事件: ${event}`, 'SECURITY', JSON.stringify(details));
    }
  }

  /**
   * 清理过期日志文件
   */
  cleanupOldLogs(): void {
    if (!this.logToFile) {
      return;
    }

    try {
      const files = fs.readdirSync(this.logDirectory);
      const now = Date.now();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30天

      files.forEach(file => {
        const filePath = path.join(this.logDirectory, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          this.log(`删除过期日志文件: ${file}`, 'CLEANUP');
        }
      });
    } catch (error) {
      this.error('清理过期日志文件失败', 'CLEANUP', error instanceof Error ? error.stack : undefined);
    }
  }
}