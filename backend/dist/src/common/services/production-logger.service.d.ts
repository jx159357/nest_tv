import { ConfigService } from '@nestjs/config';
export declare class ProductionLoggerService {
    private configService;
    private readonly logger;
    private readonly logDirectory;
    private readonly maxLogSize;
    private readonly maxLogFiles;
    private readonly logToFile;
    constructor(configService: ConfigService);
    private parseSize;
    private ensureLogDirectory;
    private getLogFilePath;
    private rotateLogFile;
    private writeToFile;
    log(message: any, context?: string): void;
    error(message: any, context?: string, trace?: string): void;
    warn(message: any, context?: string): void;
    debug(message: any, context?: string): void;
    logAccess(method: string, url: string, statusCode: number, responseTime: number, userId?: string): void;
    logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void;
    logSecurity(event: string, details: Record<string, any>, severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): void;
    cleanupOldLogs(): void;
}
