export declare enum ApiErrorCode {
    SUCCESS = 0,
    INTERNAL_ERROR = 1000,
    VALIDATION_ERROR = 1001,
    AUTHENTICATION_ERROR = 1002,
    AUTHORIZATION_ERROR = 1003,
    NOT_FOUND = 1004,
    BAD_REQUEST = 1005,
    CONFLICT = 1006,
    RATE_LIMIT_EXCEEDED = 1007,
    RESOURCE_EXPIRED = 1008,
    USER_NOT_FOUND = 2000,
    USER_ALREADY_EXISTS = 2001,
    USER_INACTIVE = 2002,
    INVALID_CREDENTIALS = 2003,
    TOKEN_EXPIRED = 2004,
    TOKEN_INVALID = 2005,
    PERMISSION_DENIED = 2006,
    MEDIA_NOT_FOUND = 3000,
    MEDIA_ALREADY_EXISTS = 3001,
    MEDIA_INACTIVE = 3002,
    INVALID_MEDIA_TYPE = 3003,
    PLAY_SOURCE_NOT_FOUND = 3004,
    PLAY_SOURCE_INACTIVE = 3005,
    FAVORITE_ALREADY_EXISTS = 3006,
    FAVORITE_NOT_FOUND = 3007,
    DATABASE_ERROR = 4000,
    CACHE_ERROR = 4001,
    EXTERNAL_SERVICE_ERROR = 4002,
    FILE_UPLOAD_ERROR = 4003,
    CONFIGURATION_ERROR = 4004,
    NETWORK_ERROR = 5000,
    TIMEOUT_ERROR = 5001,
    SERVICE_UNAVAILABLE = 5002
}
export declare const ApiErrorMessage: {
    [key in ApiErrorCode]: string;
};
export declare const HttpStatusCodeMap: {
    [key in ApiErrorCode]: number;
};
export declare class ApiException extends Error {
    readonly code: ApiErrorCode;
    readonly details?: any | undefined;
    readonly statusCode?: number | undefined;
    constructor(code: ApiErrorCode, message?: string, details?: any | undefined, statusCode?: number | undefined);
    static userNotFound(details?: any): ApiException;
    static userAlreadyExists(details?: any): ApiException;
    static mediaNotFound(details?: any): ApiException;
    static permissionDenied(details?: any): ApiException;
    static validationError(message?: string, details?: any): ApiException;
    static databaseError(details?: any): ApiException;
    static cacheError(details?: any): ApiException;
    static externalServiceError(details?: any): ApiException;
    static rateLimitExceeded(details?: any): ApiException;
    toJSON(): {
        success: boolean;
        error: {
            code: ApiErrorCode;
            message: string;
            details: any;
            timestamp: string;
        };
        data: null;
    };
}
