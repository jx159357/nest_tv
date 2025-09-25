import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * 本地策略
 * 用于用户名密码认证
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'identifier', // 使用identifier字段作为用户名
    });
  }

  /**
   * 验证用户名和密码
   * @param identifier 用户名或邮箱
   * @param password 密码
   * @returns 用户信息
   */
  async validate(identifier: string, password: string): Promise<any> {
    // 这里应该调用AuthService来验证用户
    // 为了简化示例，我们直接返回null
    return null;
  }
}
