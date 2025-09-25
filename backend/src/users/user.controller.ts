import {
  Controller,
  Post,
  Get,
  Body,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { RegisterUserDto } from './dtos/register-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { JwtResponseDto } from '../auth/dtos/jwt-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 用户控制器
 * 处理用户相关的HTTP请求，包括注册、登录等
 */
@ApiTags('用户管理')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 用户注册接口
   * @param registerUserDto 注册用户信息
   * @returns 注册成功的用户信息
   */
  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({
    status: 201,
    description: '用户注册成功',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '用户数据验证失败',
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Body() registerUserDto: RegisterUserDto): Promise<UserResponseDto> {
    return this.userService.register(registerUserDto);
  }

  /**
   * 用户登录接口
   * @param loginUserDto 登录用户信息
   * @returns JWT令牌和用户信息
   */
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({
    status: 200,
    description: '登录成功，返回JWT令牌',
    type: JwtResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '用户名或密码错误',
  })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() loginUserDto: LoginUserDto): Promise<any> {
    return this.userService.login(loginUserDto);
  }

  /**
   * 获取当前用户信息接口
   * @param req 请求对象
   * @returns 当前用户信息
   */
  @Get('profile')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({
    status: 200,
    description: '成功获取当前用户信息',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '未提供有效的JWT令牌',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: any) {
    return req.user;
  }
}
