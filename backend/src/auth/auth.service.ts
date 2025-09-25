import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import { JwtResponseDto } from './dtos/jwt-response.dto';

/**
 * 认证服务
 * 处理JWT令牌相关的业务逻辑
 */
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  /**
   * 验证用户
   * @param identifier 用户名或邮箱
   * @param pass 密码
   * @returns 用户信息或null
   */
  async validateUser(identifier: string, pass: string): Promise<any> {
    try {
      // 调用UserService的登录方法来验证用户
      const result = await this.userService.login({ identifier, password: pass });
      return result.user;
    } catch {
      return null;
    }
  }

  /**
   * 登录并生成JWT令牌
   * @param user 用户信息
   * @returns JWT令牌信息
   */
  async login(user: any): Promise<JwtResponseDto> {
    const payload = {
      username: (user as any).username,
      sub: (user as any).id,
      email: (user as any).email,
      role: (user as any).role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      expiresIn: 3600, // 1小时
      user: {
        id: (user as any).id,
        username: (user as any).username,
        email: (user as any).email,
        role: (user as any).role,
      },
    };
  }
}
