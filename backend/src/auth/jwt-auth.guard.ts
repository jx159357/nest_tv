import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT认证守卫
 * 使用JWT策略进行认证
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
