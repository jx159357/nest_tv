import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  HttpException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

interface AuthenticatedRequest {
  user: Record<string, any>;
}

/**
 * 认证控制器
 * 处理认证相关的HTTP请求
 */
@ApiTags('用户认证')
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
  @ApiOperation({
    summary: '用户登录',
    description: '使用用户名和密码进行身份验证，返回JWT访问令牌',
  })
  @ApiBody({
    description: '登录请求体',
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: '用户名',
          example: 'admin',
        },
        password: {
          type: 'string',
          description: '密码',
          example: 'password123',
        },
      },
      required: ['username', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT访问令牌',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'admin' },
            email: { type: 'string', example: 'admin@example.com' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '认证失败',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  async login(@Request() req: AuthenticatedRequest) {
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
  @ApiBearerAuth()
  @ApiOperation({
    summary: '获取用户信息',
    description: '获取当前登录用户的详细信息，需要有效的JWT令牌',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        username: { type: 'string', example: 'admin' },
        email: { type: 'string', example: 'admin@example.com' },
        role: { type: 'string', example: 'admin' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未授权访问',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  getProfile(@Request() req: AuthenticatedRequest): Record<string, any> {
    return req.user;
  }

  /**
   * 简化登录接口（直接使用body参数）
   * @param loginData 登录数据
   * @returns JWT令牌信息
   */
  @Post('simple-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '简化登录',
    description: '直接通过请求体传递用户名和密码进行登录，返回JWT访问令牌',
  })
  @ApiBody({
    description: '简化登录请求体',
    schema: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: '用户名或邮箱',
          example: 'admin',
        },
        password: {
          type: 'string',
          description: '密码',
          example: 'password123',
        },
      },
      required: ['identifier', 'password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT访问令牌',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            username: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '用户名或密码错误',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: '用户名或密码错误' },
      },
    },
  })
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
