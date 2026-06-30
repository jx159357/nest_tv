/**
 * 智能日志系统
 * 生产环境自动禁用调试日志，开发环境保留
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix: string;
}

class Logger {
  private static instance: Logger;
  private config: LoggerConfig;

  private constructor() {
    this.config = {
      enabled: import.meta.env.DEV,
      level: import.meta.env.DEV ? 'debug' : 'error',
      prefix: '[NestTV]',
    };
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 检查是否应该输出日志
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: LogLevel, module: string, message: string): string {
    const timestamp = new Date().toISOString().substr(11, 12);
    return `${this.config.prefix} [${timestamp}] [${level.toUpperCase()}] [${module}] ${message}`;
  }

  /**
   * 调试日志 - 仅开发环境
   */
  debug(module: string, message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', module, message), ...args);
    }
  }

  /**
   * 信息日志 - 仅开发环境
   */
  info(module: string, message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', module, message), ...args);
    }
  }

  /**
   * 警告日志 - 开发和生产环境
   */
  warn(module: string, message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', module, message), ...args);
    }
  }

  /**
   * 错误日志 - 始终输出
   */
  error(module: string, message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', module, message), ...args);
    }
  }

  /**
   * 性能日志 - 仅开发环境
   */
  performance(module: string, message: string, duration: number): void {
    if (this.shouldLog('debug')) {
      const formattedDuration = duration.toFixed(2);
      console.debug(this.formatMessage('debug', module, `${message}: ${formattedDuration}ms`));
    }
  }

  /**
   * 配置日志系统
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// 导出单例实例
export const logger = Logger.getInstance();

// 导出便捷方法
export const log = {
  debug: (module: string, message: string, ...args: any[]) =>
    logger.debug(module, message, ...args),

  info: (module: string, message: string, ...args: any[]) => logger.info(module, message, ...args),

  warn: (module: string, message: string, ...args: any[]) => logger.warn(module, message, ...args),

  error: (module: string, message: string, ...args: any[]) =>
    logger.error(module, message, ...args),

  performance: (module: string, message: string, duration: number) =>
    logger.performance(module, message, duration),

  configure: (config: Partial<LoggerConfig>) => logger.configure(config),

  getConfig: () => logger.getConfig(),
};

// 导出类型
export type { LogLevel, LoggerConfig };
