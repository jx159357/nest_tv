export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
        timestamp: string;
        id?: string;
    } | null;
    timestamp: string;
    requestId?: string;
    message?: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    debug?: {
        method: string;
        url: string;
        userAgent: string;
        processingTime: number;
    };
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare class SuccessResponse<T = any> implements ApiResponse<T> {
    readonly data?: T | undefined;
    readonly success = true;
    readonly error: null;
    readonly timestamp: string;
    readonly requestId?: string;
    readonly message?: string;
    readonly pagination?: any;
    readonly debug?: any;
    constructor(data?: T | undefined, options?: {
        message?: string;
        pagination?: any;
        requestId?: string;
    });
    static create<T>(data?: T, message?: string): SuccessResponse<T>;
    static paginated<T>(data: T[], pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }, message?: string): SuccessResponse<PaginatedResponse<T>>;
    static empty(message?: string): SuccessResponse;
}
export declare class ErrorResponse implements ApiResponse {
    readonly success = false;
    readonly data: null;
    readonly timestamp: string;
    readonly error: {
        code: string;
        message: string;
        details?: any;
        timestamp: string;
        id?: string;
    };
    readonly requestId?: string;
    constructor(errorCode: string, message: string, options?: {
        details?: any;
        requestId?: string;
        errorId?: string;
    });
    static create(errorCode: string, message: string, details?: any): ErrorResponse;
    static validation(message: string, details?: any): ErrorResponse;
    static notFound(resource?: string): ErrorResponse;
    static forbidden(message?: string): ErrorResponse;
    static unauthorized(message?: string): ErrorResponse;
    static serverError(message?: string, details?: any): ErrorResponse;
}
