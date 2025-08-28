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
   * @param username 用户名
   * @param pass 密码
   * @returns 用户信息或null
   */
  async validateUser(username: string, pass: string): Promise<any> {
    // 这里应该调用UserService来验证用户
    // 为了简化示例，我们直接返回null
    return null;
  }

  /**
   * 登录并生成JWT令牌
   * @param user 用户信息
   * @returns JWT令牌信息
   */
  async login(user: any): Promise<JwtResponseDto> {
    const payload = { 
      username: user.username, 
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      expiresIn: 3600, // 1小时
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}