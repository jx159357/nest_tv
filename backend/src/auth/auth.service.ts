import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/user.service';
import { JwtResponseDto } from './dtos/jwt-response.dto';

/**
 * 认证服务
 * 处理JWT令牌相关的业务逻辑
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * 验证用户
   * @param identifier 用户名或邮箱
   * @param pass 密码
   * @returns 用户信息或null
   */
  async validateUser(identifier: string, pass: string): Promise<Record<string, any> | null> {
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
  async login(user: Record<string, any>): Promise<JwtResponseDto> {
    try {
      // 验证用户状态
      if (!user || !user.id || !user.username) {
        throw new UnauthorizedException('无效的用户信息');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('用户已被禁用');
      }

      const now = Date.now();
      const jwtExpiration = this.configService.get<number>('JWT_EXPIRATION', 3600); // 1小时
      const refreshExpiration = this.configService.get<number>('JWT_REFRESH_EXPIRATION', 604800); // 7天

      // 构建JWT载荷
      const payload = {
        username: user.username,
        sub: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(now / 1000), // 签发时间
        jti: this.generateTokenId(), // 令牌ID
      };

      // JWT选项
      const accessTokenOptions = {
        expiresIn: jwtExpiration,
        audience: this.configService.get<string>('JWT_AUDIENCE', 'nest-tv-client'),
        issuer: this.configService.get<string>('JWT_ISSUER', 'nest-tv-server'),
        algorithm: 'HS256' as const,
      };

      const refreshTokenOptions = {
        expiresIn: refreshExpiration,
        audience: this.configService.get<string>('JWT_AUDIENCE', 'nest-tv-client'),
        issuer: this.configService.get<string>('JWT_ISSUER', 'nest-tv-server'),
        algorithm: 'HS256' as const,
      };

      // 生成令牌
      const accessToken = this.jwtService.sign(payload, accessTokenOptions);
      const refreshToken = this.jwtService.sign(payload, refreshTokenOptions);

      // 记录登录日志
      this.logger.log(`用户登录成功: ${user.username} (ID: ${user.id})`);

      return {
        accessToken,
        refreshToken,
        expiresIn: jwtExpiration,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`登录失败: ${errorMessage}`, errorStack);
      throw new UnauthorizedException('登录失败，请重试');
    }
  }

  /**
   * 生成令牌ID
   */
  private generateTokenId(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }
}
