import {
  Controller,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * 认证控制器
 * 处理认证相关的HTTP请求
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 用户登录接口
   * 使用本地认证策略验证用户名和密码
   * @param req 请求对象，包含用户信息
   * @returns JWT令牌信息
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  /**
   * 测试受保护的接口
   * 需要JWT令牌才能访问
   * @param req 请求对象，包含用户信息
   * @returns 受保护的资源信息
   */
  @UseGuards(JwtAuthGuard)
  @Post('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}