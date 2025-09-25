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
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const app_logger_service_1 = require("../../common/services/app-logger.service");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger;
    appLogger;
    constructor(appLogger) {
        this.logger = new common_1.Logger(GlobalExceptionFilter_1.name);
        this.appLogger = appLogger;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        this.logError(exception, request);
        const errorResponse = this.buildErrorResponse(exception);
        response
            .status(errorResponse.statusCode)
            .json(errorResponse);
    }
    logError(exception, request) {
        const requestId = request.headers['x-request-id'] || 'unknown';
        const { method, originalUrl, ip, headers } = request;
        const errorInfo = {
            requestId,
            method,
            url: originalUrl,
            ip: this.getClientIp(request),
            userAgent: headers['user-agent'],
            timestamp: new Date().toISOString(),
        };
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const response = exception.getResponse();
            this.appLogger.error(`HTTP Exception: ${response?.message || exception.message}`, `HTTP_ERROR | Status: ${status}`, JSON.stringify({ ...errorInfo, error: response }));
        }
        else {
            const error = exception;
            this.appLogger.error(`Unhandled Exception: ${error.message}`, 'UNHANDLED_ERROR', JSON.stringify({
                ...errorInfo,
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                },
            }));
        }
    }
    buildErrorResponse(exception) {
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const response = exception.getResponse();
            const message = response?.message || exception.message;
            return {
                success: false,
                statusCode: status,
                message,
                timestamp: new Date().toISOString(),
                path: exception instanceof common_1.HttpException ? undefined : undefined,
                data: response?.data || null,
            };
        }
        const error = exception;
        return {
            success: false,
            statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Internal Server Error',
            timestamp: new Date().toISOString(),
            path: undefined,
            data: process.env.NODE_ENV === 'development' ? {
                error: error.name,
                message: error.message,
                stack: error.stack,
            } : null,
        };
    }
    getClientIp(request) {
        const forwarded = request.headers['x-forwarded-for'];
        const realIp = request.headers['x-real-ip'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        if (realIp) {
            return realIp;
        }
        return request.ip || request.connection.remoteAddress || '';
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [app_logger_service_1.AppLoggerService])
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map