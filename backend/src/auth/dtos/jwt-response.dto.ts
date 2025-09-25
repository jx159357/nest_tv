import { ApiProperty } from '@nestjs/swagger';

/**
 * JWT令牌响应DTO
 * 用于向客户端返回JWT令牌信息
 */
export class JwtResponseDto {
  @ApiProperty({
    description: '访问令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: '刷新令牌',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: '访问令牌过期时间（秒）',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: '用户信息',
    type: 'object',
    properties: {
      id: {
        type: 'number',
        example: 1,
        description: '用户ID',
      },
      username: {
        type: 'string',
        example: 'testuser',
        description: '用户名',
      },
      email: {
        type: 'string',
        example: 'user@example.com',
        description: '邮箱',
      },
      role: {
        type: 'string',
        example: 'user',
        description: '用户角色',
      },
    },
  })
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}
