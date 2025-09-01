import { DynamicModule } from '@nestjs/common';
export declare class CommonModule {
    static forRoot(options?: {
        enableCache?: boolean;
        enableRequestId?: boolean;
    }): DynamicModule;
    static forFeature(): DynamicModule;
}
export { SuccessResponse as SuccessResponseDecorator, PaginatedResponse as PaginatedResponseDecorator, } from './interceptors/response.interceptor';
export { CacheInterceptor, CacheKey, CacheTTL, CacheInvalidate, } from './interceptors/cache.interceptor';
export { ApiErrorCode, ApiErrorMessage, HttpStatusCodeMap, ApiException, } from './exceptions/api.exception';
export type { ApiResponse as ApiResponseDto, PaginatedResponse as PaginatedResponseDto, SuccessResponse as SuccessResponseDto, ErrorResponse as ErrorResponseDto, } from './dto/api-response.dto';
