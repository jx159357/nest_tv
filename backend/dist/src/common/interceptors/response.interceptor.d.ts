import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiResponse } from '../dto/api-response.dto';
export declare class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse>;
    private generateRequestId;
}
export declare const SuccessResponse: (message?: string) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare const PaginatedResponse: () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
