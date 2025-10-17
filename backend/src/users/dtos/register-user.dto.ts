/*
 * @Descripttion:
 * @version:
 * @Author: jxwd
 * @Date: 2025-08-28 11:23:26
 * @LastEditors: jxwd
 * @LastEditTime: 2025-08-28 16:16:55
 */
/*
 * @Descripttion:
 * @version:
 * @Author: jxwd
 * @Date: 2025-08-28 11:23:26
 * @LastEditors: jxwd
 * @LastEditTime: 2025-08-28 16:04:55
 */
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户注册DTO
 * 用于用户注册时的数据验证
 */
export class RegisterUserDto {
  @ApiProperty({
    description: '用户名',
    example: 'mediauser',
    minLength: 3,
    maxLength: 20,
  })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  @Length(3, 20, { message: '用户名长度必须在3-20个字符之间' })
  username: string;

  @ApiProperty({
    description: '密码',
    example: 'password123',
    minLength: 6,
  })
  @IsNotEmpty({ message: '密码不能为空' })
  @Transform(({ value }) => String(value).trim())
  @Matches(/^.{6,}$/, { message: '密码长度不能少于6个字符' })
  password: string;

  @ApiProperty({
    description: '邮箱地址',
    example: 'media@streaming-platform.com',
  })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  @Length(11, 11, { message: '手机号格式不正确' })
  phone?: string;

  @ApiProperty({
    description: '昵称',
    example: '媒体用户',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @Length(1, 50, { message: '昵称长度不能超过50个字符' })
  nickname?: string;
}
