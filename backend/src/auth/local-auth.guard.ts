import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 本地认证守卫
 * 使用本地策略进行认证
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}