"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let GlobalExceptionFilter = class GlobalExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status;
        let message;
        let error;
        let details;
        if (exception instanceof common_1.HttpException) {
            const exceptionResponse = exception.getResponse();
            status = exception.getStatus();
            message = exceptionResponse.message || exception.message;
            error = exceptionResponse.error || 'HTTP_EXCEPTION';
            details = exceptionResponse.details || null;
        }
        else if (exception instanceof Error) {
            status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = '服务器内部错误';
            error = exception.name;
            details = process.env.NODE_ENV === 'development' ? exception.stack : null;
        }
        else {
            status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = '未知错误';
            error = 'UNKNOWN_ERROR';
            details = null;
        }
        if (exception instanceof Error && exception.name.includes('Database')) {
            status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = '数据库操作失败';
            error = 'DATABASE_ERROR';
            details = process.env.NODE_ENV === 'development' ? exception.message : null;
        }
        if (exception instanceof Error && exception.name.includes('ValidationError')) {
            status = common_1.HttpStatus.BAD_REQUEST;
            message = '数据验证失败';
            error = 'VALIDATION_ERROR';
            details = exception.message;
        }
        if (exception instanceof Error && exception.name.includes('Unauthorized')) {
            status = common_1.HttpStatus.UNAUTHORIZED;
            message = '未授权访问';
            error = 'UNAUTHORIZED';
            details = exception.message;
        }
        const errorId = this.generateErrorId();
        this.logError(errorId, exception, ctx.getRequest());
        const errorResponse = {
            success: false,
            error: {
                id: errorId,
                code: error,
                message,
                details: details || undefined,
                timestamp: new Date().toISOString(),
            },
            data: null,
        };
        response.status(status).json(errorResponse);
    }
    generateErrorId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `ERR_${timestamp}_${random}`;
    }
    logError(errorId, exception, request) {
        const errorInfo = {
            errorId,
            timestamp: new Date().toISOString(),
            method: request.method,
            url: request.url,
            userAgent: request.get('user-agent'),
            ip: request.ip || request.connection.remoteAddress,
            userId: request.user?.id || null,
            exception: {
                name: exception instanceof Error ? exception.name : 'Unknown',
                message: exception instanceof Error ? exception.message : String(exception),
                stack: exception instanceof Error ? exception.stack : null,
            },
        };
        const logLevel = this.getLogLevel(exception);
        switch (logLevel) {
            case 'error':
                console.error('🚨 ERROR:', JSON.stringify(errorInfo, null, 2));
                break;
            case 'warn':
                console.warn('⚠️  WARNING:', JSON.stringify(errorInfo, null, 2));
                break;
            case 'info':
                console.info('ℹ️  INFO:', JSON.stringify(errorInfo, null, 2));
                break;
            default:
                console.log('📝 LOG:', JSON.stringify(errorInfo, null, 2));
        }
    }
    getLogLevel(exception) {
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            if (status >= 500)
                return 'error';
            if (status >= 400)
                return 'warn';
            return 'info';
        }
        if (exception instanceof Error) {
            if (exception.name.includes('Database'))
                return 'error';
            if (exception.name.includes('Validation'))
                return 'warn';
            return 'error';
        }
        return 'error';
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=global-exception.filter.js.map