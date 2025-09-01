"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponse = exports.SuccessResponse = void 0;
class SuccessResponse {
    data;
    success = true;
    error = null;
    timestamp;
    requestId;
    message;
    pagination;
    debug;
    constructor(data, options) {
        this.data = data;
        this.timestamp = new Date().toISOString();
        this.message = options?.message;
        this.pagination = options?.pagination;
        this.requestId = options?.requestId;
    }
    static create(data, message) {
        return new SuccessResponse(data, { message });
    }
    static paginated(data, pagination, message) {
        const response = new SuccessResponse({ data, pagination }, { message, pagination });
        return response;
    }
    static empty(message = '操作成功') {
        return new SuccessResponse(null, { message });
    }
}
exports.SuccessResponse = SuccessResponse;
class ErrorResponse {
    success = false;
    data = null;
    timestamp;
    error;
    requestId;
    constructor(errorCode, message, options) {
        this.error = {
            code: errorCode,
            message,
            details: options?.details,
            timestamp: new Date().toISOString(),
            id: options?.errorId,
        };
        this.timestamp = new Date().toISOString();
        this.requestId = options?.requestId;
    }
    static create(errorCode, message, details) {
        return new ErrorResponse(errorCode, message, { details });
    }
    static validation(message, details) {
        return new ErrorResponse('VALIDATION_ERROR', message, { details });
    }
    static notFound(resource = '资源') {
        return new ErrorResponse('NOT_FOUND', `${resource}不存在`);
    }
    static forbidden(message = '权限不足') {
        return new ErrorResponse('FORBIDDEN', message);
    }
    static unauthorized(message = '未授权') {
        return new ErrorResponse('UNAUTHORIZED', message);
    }
    static serverError(message = '服务器内部错误', details) {
        return new ErrorResponse('INTERNAL_ERROR', message, { details });
    }
}
exports.ErrorResponse = ErrorResponse;
//# sourceMappingURL=api-response.dto.js.map