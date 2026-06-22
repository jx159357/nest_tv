import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新令牌' })
  @IsNotEmpty({ message: '刷新令牌不能为空' })
  @IsString({ message: '刷新令牌必须是字符串' })
  refreshToken: string;
}
