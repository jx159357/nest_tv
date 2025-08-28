/**
 * JWT令牌响应DTO
 * 用于向客户端返回JWT令牌信息
 */
export class JwtResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}