import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../entities/user.entity';

/**
 * 获取当前用户的装饰器
 */
export const GetCurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;
    
    if (data) {
      return user[data];
    }
    
    return user;
  },
);

/**
 * 获取当前用户ID的装饰器
 */
export const GetCurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;
    
    if (!user || typeof user.id !== 'number') {
      throw new Error('无法获取用户ID');
    }
    
    return user.id;
  },
);