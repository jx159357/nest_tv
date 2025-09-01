"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLoggerService = exports.LogLevel = void 0;
const common_1 = require("@nestjs/common");
const winston_1 = require("winston");
require("winston-daily-rotate-file");
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
let AppLoggerService = class AppLoggerService {
    logger;
    loggers = new Map();
    constructor() {
        this.logger = (0, winston_1.createLogger)({
            level: process.env.LOG_LEVEL || 'info',
            format: winston_1.format.combine(winston_1.format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss',
            }), winston_1.format.errors({ stack: true }), winston_1.format.json()),
            transports: [
                new winston_1.transports.DailyRotateFile({
                    filename: 'logs/error-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    level: 'error',
                    maxFiles: '30d',
                    maxSize: '20m',
                }),
                new winston_1.transports.DailyRotateFile({
                    filename: 'logs/combined-%DATE%.log',
                    datePattern: 'YYYY-MM-DD',
                    maxFiles: '30d',
                    maxSize: '20m',
                }),
                new winston_1.transports.Console({
                    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.printf(({ timestamp, level, message, context, ...meta }) => {
                        const log = {
                            timestamp,
                            level,
                            message,
                            context: context || 'Application',
                            ...meta,
                        };
                        return JSON.stringify(log);
                    })),
                }),
            ],
        });
    }
    getLogger(context) {
        if (!this.loggers.has(context)) {
            this.loggers.set(context, new common_1.Logger(context));
        }
        return this.loggers.get(context);
    }
    error(message, context, stack) {
        this.log(message, LogLevel.ERROR, context, stack);
    }
    warn(message, context) {
        this.log(message, LogLevel.WARN, context);
    }
    log(message, level, context, stack) {
        let finalLevel = LogLevel.INFO;
        let finalContext = {};
        let finalStack;
        if (typeof level === 'string' && Object.values(LogLevel).includes(level)) {
            finalLevel = level;
            if (context) {
                finalContext = typeof context === 'string' ? { module: context } : context;
            }
            finalStack = stack;
        }
        else if (level) {
            finalContext = typeof level === 'string' ? { module: level } : level;
        }
        const logEntry = {
            level: finalLevel,
            message: typeof message === 'object' ? JSON.stringify(message) : message,
            context: finalContext.module || 'Application',
            ...finalContext,
        };
        if (finalStack) {
            logEntry.stack = finalStack;
        }
        this.logger.log(finalLevel, logEntry.message, logEntry);
        if (finalContext.module) {
            const nestLogger = this.getLogger(finalContext.module);
            switch (finalLevel) {
                case LogLevel.ERROR:
                    nestLogger.error(message, stack);
                    break;
                case LogLevel.WARN:
                    nestLogger.warn(message);
                    break;
                case LogLevel.INFO:
                    nestLogger.log(message);
                    break;
                case LogLevel.DEBUG:
                    nestLogger.debug(message);
                    break;
            }
        }
    }
    debug(message, context) {
        this.log(message, LogLevel.DEBUG, context);
    }
    logRequest(method, url, statusCode, responseTime, context) {
        this.log({
            method,
            url,
            statusCode,
            responseTime,
            type: 'http_request',
        }, LogLevel.INFO, {
            ...context,
            module: 'HTTP',
        });
    }
    logDatabase(operation, table, data, context) {
        this.log({
            operation,
            table,
            data,
            type: 'database_operation',
        }, LogLevel.INFO, {
            ...context,
            module: 'Database',
        });
    }
    logCrawler(target, url, action, data, context) {
        this.log({
            target,
            url,
            action,
            data,
            type: 'crawler_operation',
        }, action === 'error' ? LogLevel.ERROR : LogLevel.INFO, {
            ...context,
            module: 'Crawler',
        });
    }
    logUserAction(userId, action, resource, details, context) {
        this.log({
            userId,
            action,
            resource,
            details,
            type: 'user_action',
        }, LogLevel.INFO, {
            ...context,
            module: 'User',
            userId,
        });
    }
    logPerformance(operation, duration, metadata, context) {
        this.log({
            operation,
            duration,
            metadata,
            type: 'performance',
        }, duration > 1000 ? LogLevel.WARN : LogLevel.INFO, {
            ...context,
            module: 'Performance',
        });
    }
    logTorrent(infoHash, action, data, context) {
        this.log({
            infoHash,
            action,
            data,
            type: 'torrent_operation',
        }, LogLevel.INFO, {
            ...context,
            module: 'Torrent',
        });
    }
    logIPTV(channelId, action, data, context) {
        this.log({
            channelId,
            action,
            data,
            type: 'iptv_operation',
        }, LogLevel.INFO, {
            ...context,
            module: 'IPTV',
        });
    }
    logParseProvider(providerId, action, data, context) {
        this.log({
            providerId,
            action,
            data,
            type: 'parse_provider_operation',
        }, LogLevel.INFO, {
            ...context,
            module: 'ParseProvider',
        });
    }
    logSystemEvent(event, data, level = LogLevel.INFO, context) {
        this.log({
            event,
            data,
            type: 'system_event',
        }, level, {
            ...context,
            module: 'System',
        });
    }
    setLevel(level) {
        this.logger.level = level;
    }
    getActiveLoggers() {
        return Array.from(this.loggers.keys());
    }
};
exports.AppLoggerService = AppLoggerService;
exports.AppLoggerService = AppLoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AppLoggerService);
//# sourceMappingURL=app-logger.service.js.map