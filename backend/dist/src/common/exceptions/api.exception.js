"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiException = exports.HttpStatusCodeMap = exports.ApiErrorMessage = exports.ApiErrorCode = void 0;
var ApiErrorCode;
(function (ApiErrorCode) {
    ApiErrorCode[ApiErrorCode["SUCCESS"] = 0] = "SUCCESS";
    ApiErrorCode[ApiErrorCode["INTERNAL_ERROR"] = 1000] = "INTERNAL_ERROR";
    ApiErrorCode[ApiErrorCode["VALIDATION_ERROR"] = 1001] = "VALIDATION_ERROR";
    ApiErrorCode[ApiErrorCode["AUTHENTICATION_ERROR"] = 1002] = "AUTHENTICATION_ERROR";
    ApiErrorCode[ApiErrorCode["AUTHORIZATION_ERROR"] = 1003] = "AUTHORIZATION_ERROR";
    ApiErrorCode[ApiErrorCode["NOT_FOUND"] = 1004] = "NOT_FOUND";
    ApiErrorCode[ApiErrorCode["BAD_REQUEST"] = 1005] = "BAD_REQUEST";
    ApiErrorCode[ApiErrorCode["CONFLICT"] = 1006] = "CONFLICT";
    ApiErrorCode[ApiErrorCode["RATE_LIMIT_EXCEEDED"] = 1007] = "RATE_LIMIT_EXCEEDED";
    ApiErrorCode[ApiErrorCode["RESOURCE_EXPIRED"] = 1008] = "RESOURCE_EXPIRED";
    ApiErrorCode[ApiErrorCode["USER_NOT_FOUND"] = 2000] = "USER_NOT_FOUND";
    ApiErrorCode[ApiErrorCode["USER_ALREADY_EXISTS"] = 2001] = "USER_ALREADY_EXISTS";
    ApiErrorCode[ApiErrorCode["USER_INACTIVE"] = 2002] = "USER_INACTIVE";
    ApiErrorCode[ApiErrorCode["INVALID_CREDENTIALS"] = 2003] = "INVALID_CREDENTIALS";
    ApiErrorCode[ApiErrorCode["TOKEN_EXPIRED"] = 2004] = "TOKEN_EXPIRED";
    ApiErrorCode[ApiErrorCode["TOKEN_INVALID"] = 2005] = "TOKEN_INVALID";
    ApiErrorCode[ApiErrorCode["PERMISSION_DENIED"] = 2006] = "PERMISSION_DENIED";
    ApiErrorCode[ApiErrorCode["MEDIA_NOT_FOUND"] = 3000] = "MEDIA_NOT_FOUND";
    ApiErrorCode[ApiErrorCode["MEDIA_ALREADY_EXISTS"] = 3001] = "MEDIA_ALREADY_EXISTS";
    ApiErrorCode[ApiErrorCode["MEDIA_INACTIVE"] = 3002] = "MEDIA_INACTIVE";
    ApiErrorCode[ApiErrorCode["INVALID_MEDIA_TYPE"] = 3003] = "INVALID_MEDIA_TYPE";
    ApiErrorCode[ApiErrorCode["PLAY_SOURCE_NOT_FOUND"] = 3004] = "PLAY_SOURCE_NOT_FOUND";
    ApiErrorCode[ApiErrorCode["PLAY_SOURCE_INACTIVE"] = 3005] = "PLAY_SOURCE_INACTIVE";
    ApiErrorCode[ApiErrorCode["FAVORITE_ALREADY_EXISTS"] = 3006] = "FAVORITE_ALREADY_EXISTS";
    ApiErrorCode[ApiErrorCode["FAVORITE_NOT_FOUND"] = 3007] = "FAVORITE_NOT_FOUND";
    ApiErrorCode[ApiErrorCode["DATABASE_ERROR"] = 4000] = "DATABASE_ERROR";
    ApiErrorCode[ApiErrorCode["CACHE_ERROR"] = 4001] = "CACHE_ERROR";
    ApiErrorCode[ApiErrorCode["EXTERNAL_SERVICE_ERROR"] = 4002] = "EXTERNAL_SERVICE_ERROR";
    ApiErrorCode[ApiErrorCode["FILE_UPLOAD_ERROR"] = 4003] = "FILE_UPLOAD_ERROR";
    ApiErrorCode[ApiErrorCode["CONFIGURATION_ERROR"] = 4004] = "CONFIGURATION_ERROR";
    ApiErrorCode[ApiErrorCode["NETWORK_ERROR"] = 5000] = "NETWORK_ERROR";
    ApiErrorCode[ApiErrorCode["TIMEOUT_ERROR"] = 5001] = "TIMEOUT_ERROR";
    ApiErrorCode[ApiErrorCode["SERVICE_UNAVAILABLE"] = 5002] = "SERVICE_UNAVAILABLE";
})(ApiErrorCode || (exports.ApiErrorCode = ApiErrorCode = {}));
exports.ApiErrorMessage = {
    [ApiErrorCode.SUCCESS]: '操作成功',
    [ApiErrorCode.INTERNAL_ERROR]: '服务器内部错误',
    [ApiErrorCode.VALIDATION_ERROR]: '数据验证失败',
    [ApiErrorCode.AUTHENTICATION_ERROR]: '身份验证失败',
    [ApiErrorCode.AUTHORIZATION_ERROR]: '权限不足',
    [ApiErrorCode.NOT_FOUND]: '资源不存在',
    [ApiErrorCode.BAD_REQUEST]: '请求参数错误',
    [ApiErrorCode.CONFLICT]: '资源冲突',
    [ApiErrorCode.RATE_LIMIT_EXCEEDED]: '请求频率超限',
    [ApiErrorCode.RESOURCE_EXPIRED]: '资源已过期',
    [ApiErrorCode.USER_NOT_FOUND]: '用户不存在',
    [ApiErrorCode.USER_ALREADY_EXISTS]: '用户已存在',
    [ApiErrorCode.USER_INACTIVE]: '用户已被禁用',
    [ApiErrorCode.INVALID_CREDENTIALS]: '用户名或密码错误',
    [ApiErrorCode.TOKEN_EXPIRED]: '令牌已过期',
    [ApiErrorCode.TOKEN_INVALID]: '令牌无效',
    [ApiErrorCode.PERMISSION_DENIED]: '权限不足',
    [ApiErrorCode.MEDIA_NOT_FOUND]: '媒体资源不存在',
    [ApiErrorCode.MEDIA_ALREADY_EXISTS]: '媒体资源已存在',
    [ApiErrorCode.MEDIA_INACTIVE]: '媒体资源已禁用',
    [ApiErrorCode.INVALID_MEDIA_TYPE]: '无效的媒体类型',
    [ApiErrorCode.PLAY_SOURCE_NOT_FOUND]: '播放源不存在',
    [ApiErrorCode.PLAY_SOURCE_INACTIVE]: '播放源已禁用',
    [ApiErrorCode.FAVORITE_ALREADY_EXISTS]: '已收藏该资源',
    [ApiErrorCode.FAVORITE_NOT_FOUND]: '未收藏该资源',
    [ApiErrorCode.DATABASE_ERROR]: '数据库操作失败',
    [ApiErrorCode.CACHE_ERROR]: '缓存操作失败',
    [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: '外部服务错误',
    [ApiErrorCode.FILE_UPLOAD_ERROR]: '文件上传失败',
    [ApiErrorCode.CONFIGURATION_ERROR]: '配置错误',
    [ApiErrorCode.NETWORK_ERROR]: '网络错误',
    [ApiErrorCode.TIMEOUT_ERROR]: '请求超时',
    [ApiErrorCode.SERVICE_UNAVAILABLE]: '服务不可用',
};
exports.HttpStatusCodeMap = {
    [ApiErrorCode.SUCCESS]: 200,
    [ApiErrorCode.INTERNAL_ERROR]: 500,
    [ApiErrorCode.VALIDATION_ERROR]: 400,
    [ApiErrorCode.AUTHENTICATION_ERROR]: 401,
    [ApiErrorCode.AUTHORIZATION_ERROR]: 403,
    [ApiErrorCode.NOT_FOUND]: 404,
    [ApiErrorCode.BAD_REQUEST]: 400,
    [ApiErrorCode.CONFLICT]: 409,
    [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 429,
    [ApiErrorCode.RESOURCE_EXPIRED]: 410,
    [ApiErrorCode.USER_NOT_FOUND]: 404,
    [ApiErrorCode.USER_ALREADY_EXISTS]: 409,
    [ApiErrorCode.USER_INACTIVE]: 403,
    [ApiErrorCode.INVALID_CREDENTIALS]: 401,
    [ApiErrorCode.TOKEN_EXPIRED]: 401,
    [ApiErrorCode.TOKEN_INVALID]: 401,
    [ApiErrorCode.PERMISSION_DENIED]: 403,
    [ApiErrorCode.MEDIA_NOT_FOUND]: 404,
    [ApiErrorCode.MEDIA_ALREADY_EXISTS]: 409,
    [ApiErrorCode.MEDIA_INACTIVE]: 404,
    [ApiErrorCode.INVALID_MEDIA_TYPE]: 400,
    [ApiErrorCode.PLAY_SOURCE_NOT_FOUND]: 404,
    [ApiErrorCode.PLAY_SOURCE_INACTIVE]: 404,
    [ApiErrorCode.FAVORITE_ALREADY_EXISTS]: 409,
    [ApiErrorCode.FAVORITE_NOT_FOUND]: 404,
    [ApiErrorCode.DATABASE_ERROR]: 500,
    [ApiErrorCode.CACHE_ERROR]: 500,
    [ApiErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
    [ApiErrorCode.FILE_UPLOAD_ERROR]: 400,
    [ApiErrorCode.CONFIGURATION_ERROR]: 500,
    [ApiErrorCode.NETWORK_ERROR]: 500,
    [ApiErrorCode.TIMEOUT_ERROR]: 504,
    [ApiErrorCode.SERVICE_UNAVAILABLE]: 503,
};
class ApiException extends Error {
    code;
    details;
    statusCode;
    constructor(code, message, details, statusCode) {
        super(message || exports.ApiErrorMessage[code]);
        this.code = code;
        this.details = details;
        this.statusCode = statusCode;
        this.name = 'ApiException';
        this.statusCode = statusCode || exports.HttpStatusCodeMap[code];
        Error.captureStackTrace(this, ApiException);
    }
    static userNotFound(details) {
        return new ApiException(ApiErrorCode.USER_NOT_FOUND, undefined, details);
    }
    static userAlreadyExists(details) {
        return new ApiException(ApiErrorCode.USER_ALREADY_EXISTS, undefined, details);
    }
    static mediaNotFound(details) {
        return new ApiException(ApiErrorCode.MEDIA_NOT_FOUND, undefined, details);
    }
    static permissionDenied(details) {
        return new ApiException(ApiErrorCode.PERMISSION_DENIED, undefined, details);
    }
    static validationError(message, details) {
        return new ApiException(ApiErrorCode.VALIDATION_ERROR, message, details);
    }
    static databaseError(details) {
        return new ApiException(ApiErrorCode.DATABASE_ERROR, undefined, details);
    }
    static cacheError(details) {
        return new ApiException(ApiErrorCode.CACHE_ERROR, undefined, details);
    }
    static externalServiceError(details) {
        return new ApiException(ApiErrorCode.EXTERNAL_SERVICE_ERROR, undefined, details);
    }
    static rateLimitExceeded(details) {
        return new ApiException(ApiErrorCode.RATE_LIMIT_EXCEEDED, undefined, details);
    }
    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
                timestamp: new Date().toISOString(),
            },
            data: null,
        };
    }
}
exports.ApiException = ApiException;
//# sourceMappingURL=api.exception.js.map