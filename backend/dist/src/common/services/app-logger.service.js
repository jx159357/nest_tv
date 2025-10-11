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
    contextStore = new Map();
    constructor() {
        this.logger = new common_1.Logger('NestTV');
    }
    setContext(requestId, context) {
        this.contextStore.set(requestId, context);
    }
    getContext(requestId) {
        return this.contextStore.get(requestId);
    }
    clearContext(requestId) {
        this.contextStore.delete(requestId);
    }
    log(message, context) {
        this.logger.log(message, context);
    }
    error(message, context, trace, requestId) {
        const logContext = this.buildContext(context, requestId);
        this.logger.error(message, trace || '', logContext);
    }
    warn(message, context, requestId) {
        const logContext = this.buildContext(context, requestId);
        this.logger.warn(message, logContext);
    }
    debug(message, context, requestId) {
        const logContext = this.buildContext(context, requestId);
        this.logger.debug(message, logContext);
    }
    buildContext(baseContext, requestId) {
        const contextParts = [];
        if (baseContext) {
            contextParts.push(baseContext);
        }
        if (requestId) {
            const requestContext = this.getContext(requestId);
            if (requestContext) {
                contextParts.push(`RequestID: ${requestId}`);
                if (requestContext.userId) {
                    contextParts.push(`UserID: ${requestContext.userId}`);
                }
                if (requestContext.module) {
                    contextParts.push(`Module: ${requestContext.module}`);
                }
            }
        }
        return contextParts.join(' | ');
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
    logOperation(action, resource, userId, metadata, status = 'success', requestId) {
        const logMessage = `${action.toUpperCase()}: ${resource}`;
        const baseContext = [
            `USER_ID: ${userId || 'Anonymous'}`,
            `STATUS: ${status}`,
            `METADATA: ${JSON.stringify(metadata || {})}`,
        ].join(' | ');
        const fullContext = this.buildContext(baseContext, requestId);
        if (status === 'error') {
            this.logger.error(logMessage, 'BUSINESS_OPERATION');
        }
        else if (status === 'warning') {
            this.logger.warn(logMessage, fullContext);
        }
        else {
            this.logger.log(logMessage, fullContext);
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
    logSecurity(event, userId, details, requestId) {
        const logMessage = `SECURITY_EVENT: ${event}`;
        const baseContext = [
            `USER: ${userId || 'Anonymous'}`,
            `DETAILS: ${JSON.stringify(details || {})}`,
        ].join(' | ');
        const fullContext = this.buildContext(baseContext, requestId);
        this.logger.warn(logMessage, fullContext);
    }
    logDatabaseError(operation, error, query, params, requestId) {
        const logMessage = `DATABASE_ERROR: ${operation} failed`;
        const baseContext = [
            `ERROR: ${error.message}`,
            `QUERY: ${query || 'Unknown'}`,
            `PARAMS: ${JSON.stringify(params || [])}`,
        ].join(' | ');
        const fullContext = this.buildContext(baseContext, requestId);
        this.logger.error(logMessage, error.stack, fullContext);
    }
    logExternalServiceError(service, operation, error, url, requestId) {
        const logMessage = `EXTERNAL_SERVICE_ERROR: ${service} - ${operation}`;
        const baseContext = [
            `ERROR: ${error.message}`,
            `URL: ${url || 'Unknown'}`,
        ].join(' | ');
        const fullContext = this.buildContext(baseContext, requestId);
        this.logger.error(logMessage, error.stack, fullContext);
    }
    logValidationError(field, value, validationErrors, requestId) {
        const logMessage = `VALIDATION_ERROR: ${field}`;
        const baseContext = [
            `VALUE: ${JSON.stringify(value)}`,
            `ERRORS: ${validationErrors.join(', ')}`,
        ].join(' | ');
        const fullContext = this.buildContext(baseContext, requestId);
        this.logger.warn(logMessage, fullContext);
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