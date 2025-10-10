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
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = exports.ErrorSeverity = exports.ErrorType = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const app_logger_service_1 = require("../services/app-logger.service");
var ErrorType;
(function (ErrorType) {
    ErrorType["UNKNOWN"] = "UNKNOWN_ERROR";
    ErrorType["AUTHENTICATION"] = "AUTHENTICATION_ERROR";
    ErrorType["AUTHORIZATION"] = "AUTHORIZATION_ERROR";
    ErrorType["VALIDATION"] = "VALIDATION_ERROR";
    ErrorType["NOT_FOUND"] = "NOT_FOUND_ERROR";
    ErrorType["CONFLICT"] = "CONFLICT_ERROR";
    ErrorType["INTERNAL"] = "INTERNAL_ERROR";
    ErrorType["EXTERNAL"] = "EXTERNAL_ERROR";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "LOW";
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    ErrorSeverity["HIGH"] = "HIGH";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger;
    appLogger;
    constructor(appLogger) {
        this.logger = new common_2.Logger(GlobalExceptionFilter_1.name);
        this.appLogger = appLogger;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        this.logError(exception, request);
        const errorResponse = this.buildErrorResponse(exception, request);
        response
            .status(errorResponse.statusCode)
            .json(errorResponse);
    }
    classifyError(exception) {
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            if (status === 401) {
                return { type: ErrorType.AUTHENTICATION, severity: ErrorSeverity.MEDIUM };
            }
            else if (status === 403) {
                return { type: ErrorType.AUTHORIZATION, severity: ErrorSeverity.MEDIUM };
            }
            else if (status === 404) {
                return { type: ErrorType.NOT_FOUND, severity: ErrorSeverity.LOW };
            }
            else if (status === 409) {
                return { type: ErrorType.CONFLICT, severity: ErrorSeverity.MEDIUM };
            }
            else if (status >= 400 && status < 500) {
                return { type: ErrorType.VALIDATION, severity: ErrorSeverity.LOW };
            }
            else if (status >= 500 && status < 600) {
                return { type: ErrorType.INTERNAL, severity: ErrorSeverity.HIGH };
            }
        }
        const error = exception;
        if (error.name === 'TypeError' || error.name === 'ReferenceError') {
            return { type: ErrorType.INTERNAL, severity: ErrorSeverity.CRITICAL };
        }
        else if (error.name === 'ValidationError') {
            return { type: ErrorType.VALIDATION, severity: ErrorSeverity.LOW };
        }
        return { type: ErrorType.UNKNOWN, severity: ErrorSeverity.MEDIUM };
    }
    logError(exception, request) {
        const { type, severity } = this.classifyError(exception);
        const errorInfo = {
            requestId: this.generateRequestId(),
            method: request.method,
            url: request.url,
            ip: request.ip,
            userAgent: request.get('user-agent'),
            timestamp: new Date().toISOString(),
        };
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const response = exception.getResponse();
            if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
                this.appLogger.error(`HTTP Exception: ${response?.message || exception.message}`, `${type} | Status: ${status} | Severity: ${severity}`);
            }
            else if (severity === ErrorSeverity.MEDIUM) {
                this.appLogger.warn(`HTTP Exception: ${response?.message || exception.message}`, `${type} | Status: ${status} | Severity: ${severity}`);
            }
            else {
                this.appLogger.log(`HTTP Exception: ${response?.message || exception.message}`, `${type} | Status: ${status} | Severity: ${severity}`);
            }
        }
        else {
            const error = exception;
            if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
                this.appLogger.error(`Unhandled Exception: ${error.message}`, `${type} | Severity: ${severity}`);
            }
            else if (severity === ErrorSeverity.MEDIUM) {
                this.appLogger.warn(`Unhandled Exception: ${error.message}`, `${type} | Severity: ${severity}`);
            }
            else {
                this.appLogger.log(`Unhandled Exception: ${error.message}`, `${type} | Severity: ${severity}`);
            }
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const response = exception.getResponse();
            this.logger.debug(JSON.stringify({
                ...errorInfo,
                error: response,
                httpStatus: status
            }));
        }
        else {
            const error = exception;
            this.logger.debug(JSON.stringify({
                ...errorInfo,
                error: {
                    name: error.name,
                    message: error.message,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                },
            }));
        }
    }
    buildErrorResponse(exception, request) {
        const { type, severity } = this.classifyError(exception);
        const requestId = this.generateRequestId();
        let statusCode = 500;
        let message = '服务器内部错误';
        if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const response = exception.getResponse();
            message = response?.message || exception.message;
        }
        else {
            const error = exception;
            message = error.message;
        }
        return {
            success: false,
            statusCode,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
            requestId,
            type,
            severity,
            data: process.env.NODE_ENV === 'development' ? {
                error: exception instanceof Error ? {
                    name: exception.name,
                    message: exception.message,
                    stack: exception.stack,
                } : exception,
            } : undefined,
        };
    }
    generateRequestId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [app_logger_service_1.AppLoggerService])
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map