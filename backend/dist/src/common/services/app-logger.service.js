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
exports.LogLevel = exports.AppLoggerService = void 0;
const common_1 = require("@nestjs/common");
let AppLoggerService = class AppLoggerService {
    logger;
    requestLogEnabled = true;
    responseLogEnabled = true;
    errorLogEnabled = true;
    constructor() {
        this.logger = new common_1.Logger('NestTV');
    }
    log(message, context) {
        this.logger.log(message, context);
    }
    error(message, context, trace) {
        this.logger.error(message, trace || '', context);
    }
    warn(message, context) {
        this.logger.warn(message, context);
    }
    debug(message, context) {
        this.logger.debug(message, context);
    }
    logRequest(info) {
        if (!this.requestLogEnabled)
            return;
        const logMessage = `${info.method} ${info.url} - IP: ${info.ip}`;
        const context = `HTTP_REQUEST | User-Agent: ${info.userAgent || 'Unknown'}`;
        this.logger.log(logMessage, context);
    }
    logResponse(info) {
        if (!this.responseLogEnabled)
            return;
        const statusColor = info.statusCode >= 400 ? 'ERROR' : 'SUCCESS';
        const logMessage = `${info.method} ${info.url} - ${info.statusCode} (${info.responseTime}ms)`;
        const context = `HTTP_RESPONSE_${statusColor}`;
        if (info.statusCode >= 400) {
            this.logger.warn(logMessage, context);
        }
        else {
            this.logger.log(logMessage, context);
        }
    }
    logOperation(action, resource, userId, metadata, status = 'success') {
        const logMessage = `${action.toUpperCase()}: ${resource}`;
        const context = [
            `USER_ID: ${userId || 'Anonymous'}`,
            `STATUS: ${status}`,
            `METADATA: ${JSON.stringify(metadata || {})}`,
        ].join(' | ');
        if (status === 'error') {
            this.logger.error(logMessage, 'BUSINESS_OPERATION');
        }
        else if (status === 'warning') {
            this.logger.warn(logMessage, 'BUSINESS_OPERATION');
        }
        else {
            this.logger.log(logMessage, 'BUSINESS_OPERATION');
        }
    }
    logPerformance(operation, duration, metadata) {
        const logMessage = `PERFORMANCE: ${operation} took ${duration}ms`;
        const context = metadata ? `METADATA: ${JSON.stringify(metadata)}` : '';
        if (duration > 1000) {
            this.logger.warn(logMessage, context);
        }
        else {
            this.logger.debug(logMessage, context);
        }
    }
    logDatabase(query, parameters, duration) {
        const logMessage = `DATABASE_QUERY: ${query.substring(0, 100)}...`;
        const context = `PARAMS: ${JSON.stringify(parameters)} | DURATION: ${duration}ms`;
        this.logger.debug(logMessage, context);
    }
    logSecurity(event, userId, details) {
        const logMessage = `SECURITY_EVENT: ${event}`;
        const context = [
            `USER: ${userId || 'Anonymous'}`,
            `DETAILS: ${JSON.stringify(details || {})}`,
        ].join(' | ');
        this.logger.warn(logMessage, context);
    }
    setLogTypeEnabled(type, enabled) {
        switch (type) {
            case 'request':
                this.requestLogEnabled = enabled;
                break;
            case 'response':
                this.responseLogEnabled = enabled;
                break;
            case 'error':
                this.errorLogEnabled = enabled;
                break;
        }
    }
    getLogConfig() {
        return {
            request: this.requestLogEnabled,
            response: this.responseLogEnabled,
            error: this.errorLogEnabled,
        };
    }
};
exports.AppLoggerService = AppLoggerService;
exports.AppLoggerService = AppLoggerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AppLoggerService);
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
//# sourceMappingURL=app-logger.service.js.map