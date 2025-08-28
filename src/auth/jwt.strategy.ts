import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/user.service';

/**
 * JWT策略
 * 用于验证JWT令牌并提取用户信息
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default_secret_key_change_in_production',
    });
  }

  /**
   * 验证JWT令牌并返回用户信息
   * @param payload JWT载荷
   * @returns 用户信息
   */
  async validate(payload: any) {
    // 根据用户ID查找用户
    const user = await this.userService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    
    return user;
  }
}