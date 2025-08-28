/**
 * 用户信息响应DTO
 * 用于向客户端返回用户信息（不包含敏感信息）
 */
export class UserResponseDto {
  id: number;
  username: string;
  email: string;
  phone?: string;
  nickname?: string;
  role: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}