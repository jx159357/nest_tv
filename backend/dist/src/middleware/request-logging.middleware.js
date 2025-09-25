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
exports.RequestLoggingMiddleware = void 0;
const common_1 = require("@nestjs/common");
const app_logger_service_1 = require("../common/services/app-logger.service");
let RequestLoggingMiddleware = class RequestLoggingMiddleware {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    use(req, res, next) {
        const startTime = Date.now();
        const { method, originalUrl, ip, headers } = req;
        const logger = this.logger;
        logger.logRequest({
            method,
            url: originalUrl,
            ip: this.getClientIp(req),
            userAgent: headers['user-agent'],
            timestamp: new Date().toISOString(),
        });
        const originalEnd = res.end;
        res.end = function (chunk, encoding) {
            const responseTime = Date.now() - startTime;
            const { statusCode } = res;
            try {
                logger.logResponse({
                    method,
                    url: originalUrl,
                    statusCode,
                    responseTime,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                console.error('Failed to log response:', error);
            }
            return originalEnd.call(this, chunk, encoding);
        };
        next();
    }
    getClientIp(req) {
        const forwarded = req.headers['x-forwarded-for'];
        const realIp = req.headers['x-real-ip'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        if (realIp) {
            return realIp;
        }
        return req.ip || req.connection.remoteAddress || '';
    }
};
exports.RequestLoggingMiddleware = RequestLoggingMiddleware;
exports.RequestLoggingMiddleware = RequestLoggingMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_logger_service_1.AppLoggerService])
], RequestLoggingMiddleware);
//# sourceMappingURL=request-logging.middleware.js.map