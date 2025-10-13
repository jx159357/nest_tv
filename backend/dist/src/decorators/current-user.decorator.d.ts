import { User } from '../entities/user.entity';
export declare const GetCurrentUser: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | keyof User | undefined)[]) => ParameterDecorator;
export declare const GetCurrentUserId: (...dataOrPipes: unknown[]) => ParameterDecorator;
