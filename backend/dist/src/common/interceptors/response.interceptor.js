"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedResponse = exports.SuccessResponse = exports.ResponseInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let ResponseInterceptor = class ResponseInterceptor {
    intercept(context, next) {
        return next.handle().pipe((0, operators_1.map)(data => {
            if (data && typeof data === 'object' && 'success' in data) {
                return data;
            }
            const request = context.switchToHttp().getRequest();
            const response = {
                success: true,
                data: data || null,
                error: null,
                timestamp: new Date().toISOString(),
                requestId: this.generateRequestId(),
            };
            if (process.env.NODE_ENV === 'development') {
                Object.assign(response, {
                    debug: {
                        method: request.method,
                        url: request.url,
                        userAgent: request.get('user-agent'),
                        processingTime: Date.now() - request.startTime,
                    },
                });
            }
            return response;
        }));
    }
    generateRequestId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `REQ_${timestamp}_${random}`;
    }
};
exports.ResponseInterceptor = ResponseInterceptor;
exports.ResponseInterceptor = ResponseInterceptor = __decorate([
    (0, common_1.Injectable)()
], ResponseInterceptor);
const SuccessResponse = (message) => (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
        try {
            const result = await originalMethod.apply(this, args);
            if (result && typeof result === 'object' && 'success' in result) {
                return result;
            }
            return {
                success: true,
                data: result,
                message: message || '操作成功',
                error: null,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw error;
        }
    };
    return descriptor;
};
exports.SuccessResponse = SuccessResponse;
const PaginatedResponse = () => (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
        try {
            const result = await originalMethod.apply(this, args);
            if (result && typeof result === 'object' &&
                'data' in result &&
                'total' in result &&
                'page' in result) {
                return {
                    success: true,
                    data: result.data,
                    pagination: {
                        page: result.page,
                        limit: result.limit,
                        total: result.total,
                        totalPages: result.totalPages,
                    },
                    error: null,
                    timestamp: new Date().toISOString(),
                };
            }
            return {
                success: true,
                data: result,
                error: null,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            throw error;
        }
    };
    return descriptor;
};
exports.PaginatedResponse = PaginatedResponse;
//# sourceMappingURL=response.interceptor.js.map