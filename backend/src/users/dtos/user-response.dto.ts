import { ApiProperty } from '@nestjs/swagger';

/**
 * 用户信息响应DTO
 * 用于向客户端返回用户信息（不包含敏感信息）
 */
export class UserResponseDto {
  @ApiProperty({
    description: '用户ID',
    example: 1
  })
  id: number;

  @ApiProperty({
    description: '用户名',
    example: 'testuser'
  })
  username: string;

  @ApiProperty({
    description: '邮箱地址',
    example: 'user@example.com'
  })
  email: string;

  @ApiProperty({
    description: '手机号',
    example: '13800138000',
    required: false
  })
  phone?: string;

  @ApiProperty({
    description: '昵称',
    example: '测试用户',
    required: false
  })
  nickname?: string;

  @ApiProperty({
    description: '用户角色',
    example: 'user',
    enum: ['user', 'admin']
  })
  role: string;

  @ApiProperty({
    description: '头像URL',
    example: 'https://example.com/avatar.jpg',
    required: false
  })
  avatar?: string;

  @ApiProperty({
    description: '创建时间',
    example: '2023-01-01T00:00:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2023-01-01T00:00:00.000Z'
  })
  updatedAt: Date;

  @ApiProperty({
    description: '最后登录时间',
    example: '2023-01-01T00:00:00.000Z',
    required: false
  })
  lastLoginAt?: Date;
}