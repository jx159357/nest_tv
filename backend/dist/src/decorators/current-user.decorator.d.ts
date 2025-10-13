import { User } from '../entities/user.entity';
export declare const GetCurrentUser: (...dataOrPipes: (keyof User | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
export declare const GetCurrentUserId: (...dataOrPipes: unknown[]) => ParameterDecorator;
