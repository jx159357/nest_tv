import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User as UserType } from '../entities/user.entity';

/**
 * 用户装饰器
 * 从请求中提取当前用户信息
 */
export const User = createParamDecorator((data: unknown, ctx: ExecutionContext): UserType => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
