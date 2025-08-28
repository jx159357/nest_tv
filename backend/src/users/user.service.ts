import { Injectable, HttpException, HttpStatus, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { RegisterUserDto } from './dtos/register-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

/**
 * 用户服务
 * 处理用户相关的业务逻辑，包括注册、登录、用户信息管理等
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户注册
   * @param registerUserDto 注册用户信息
   * @returns 用户信息（不包含密码）
   */
  async register(registerUserDto: RegisterUserDto): Promise<UserResponseDto> {
    // 检查用户名是否已存在
    const existingUserByUsername = await this.userRepository.findOne({
      where: { username: registerUserDto.username },
    });

    if (existingUserByUsername) {
      throw new ConflictException('用户名已存在');
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await this.userRepository.findOne({
      where: { email: registerUserDto.email },
    });

    if (existingUserByEmail) {
      throw new ConflictException('邮箱已被注册');
    }

    // 创建新用户
    const newUser = this.userRepository.create({
      ...registerUserDto,
      password: await bcrypt.hash(registerUserDto.password, 10), // 加密密码
    });

    // 保存用户到数据库
    const savedUser = await this.userRepository.save(newUser);

    // 返回用户信息（不包含密码）
    return this.toUserResponseDto(savedUser);
  }

  /**
   * 用户登录
   * @param loginUserDto 登录用户信息
   * @returns JWT令牌和用户信息
   */
  async login(loginUserDto: LoginUserDto): Promise<any> {
    // 根据用户名或邮箱查找用户
    const user = await this.userRepository.findOne({
      where: [
        { username: loginUserDto.identifier },
        { email: loginUserDto.identifier },
      ],
    });

    // 如果用户不存在或密码错误，抛出异常
    if (!user || !(await bcrypt.compare(loginUserDto.password, user.password))) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // 生成JWT令牌
    const payload = { 
      sub: user.id, 
      username: user.username,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: this.toUserResponseDto(user),
    };
  }

  /**
   * 根据ID查找用户
   * @param id 用户ID
   * @returns 用户信息
   */
  async findById(id: number): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    return this.toUserResponseDto(user);
  }

  /**
   * 根据用户名查找用户
   * @param username 用户名
   * @returns 用户信息
   */
  async findByUsername(username: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    return this.toUserResponseDto(user);
  }

  /**
   * 将User实体转换为UserResponseDto
   * @param user User实体
   * @returns UserResponseDto对象
   */
  private toUserResponseDto(user: User): UserResponseDto {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponseDto;
  }
}