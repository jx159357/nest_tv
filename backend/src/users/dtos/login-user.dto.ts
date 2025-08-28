import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * 用户登录DTO
 * 用于用户登录时的数据验证
 */
export class LoginUserDto {
  @IsNotEmpty({ message: '用户名或邮箱不能为空' })
  @IsString({ message: '用户名或邮箱必须是字符串' })
  identifier: string; // 可以是用户名或邮箱

  @IsNotEmpty({ message: '密码不能为空' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于6个字符' })
  password: string;
}