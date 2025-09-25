import { Controller, Post, UseGuards, Request, Body, HttpException, HttpCode, HttpStatus } from '@nestjs/common';
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
  async login(@Request() req: any) {
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
  getProfile(@Request() req: any) {
    return req.user;
  }

  /**
   * 简化登录接口（直接使用body参数）
   * @param loginData 登录数据
   * @returns JWT令牌信息
   */
  @Post('simple-login')
  @HttpCode(HttpStatus.OK)
  async simpleLogin(@Body() loginData: { identifier: string; password: string }) {
    // 这里直接调用UserService来验证用户
    // 为了简化，我们暂时使用AuthService中的validateUser方法
    const user = await this.authService.validateUser(loginData.identifier, loginData.password);

    if (!user) {
      throw new HttpException('用户名或密码错误', HttpStatus.UNAUTHORIZED);
    }

    return this.authService.login(user);
  }
}
