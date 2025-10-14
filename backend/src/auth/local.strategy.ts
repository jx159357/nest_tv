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
      usernameField: 'username', // 使用username字段作为用户名
      passwordField: 'password',
    });
  }

  /**
   * 验证用户名和密码
   * @param username 用户名
   * @param password 密码
   * @returns 用户信息
   */
  async validate(username: string, password: string): Promise<any> {
    try {
      // 调用AuthService的validateUser方法来验证用户
      const user = await this.authService.validateUser(username, password);
      if (!user) {
        throw new UnauthorizedException('用户名或密码错误');
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException('用户名或密码错误');
    }
  }
}
