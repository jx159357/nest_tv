import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/user.service';

interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  role: string;
  iat: number;
  jti: string;
  aud?: string | string[];
  iss?: string;
}

/**
 * JWT策略
 * 用于验证JWT令牌并提取用户信息
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET环境变量未设置');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ['HS256'], // 指定算法
      audience: configService.get<string>('JWT_AUDIENCE', 'nest-tv-client'),
      issuer: configService.get<string>('JWT_ISSUER', 'nest-tv-server'),
    });
  }

  /**
   * 验证JWT令牌并返回用户信息
   * @param payload JWT载荷
   * @returns 用户信息
   */
  async validate(payload: JwtPayload): Promise<Record<string, any>> {
    try {
      // 验证载荷格式
      if (!payload || !payload.sub || typeof payload.sub !== 'number') {
        throw new UnauthorizedException('无效的令牌载荷');
      }

      // 验证令牌签发者和受众
      const audience = this.configService.get<string>('JWT_AUDIENCE', 'nest-tv-client');
      const issuer = this.configService.get<string>('JWT_ISSUER', 'nest-tv-server');

      if (payload.aud && !payload.aud.includes(audience)) {
        throw new UnauthorizedException('令牌受众不匹配');
      }

      if (payload.iss && payload.iss !== issuer) {
        throw new UnauthorizedException('令牌签发者不匹配');
      }

      // 根据用户ID查找用户
      const user = await this.userService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('用户已被禁用');
      }

      // 记录认证成功日志（生产环境可关闭）
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(`用户认证成功: ${user.username} (ID: ${user.id})`);
      }

      return user;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.warn(`JWT验证失败: ${errorMessage}`, errorStack);
      throw new UnauthorizedException('令牌验证失败');
    }
  }
}
