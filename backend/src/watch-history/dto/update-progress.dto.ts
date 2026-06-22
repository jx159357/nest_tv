import { IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty({ description: '影视资源ID' })
  @IsNumber({}, { message: '影视资源ID必须是数字' })
  @Min(1)
  @Type(() => Number)
  mediaResourceId: number;

  @ApiProperty({ description: '当前观看时间（秒）' })
  @IsNumber({}, { message: '当前观看时间必须是数字' })
  @Min(0)
  @Type(() => Number)
  currentTime: number;

  @ApiPropertyOptional({ description: '总时长（秒）' })
  @IsOptional()
  @IsNumber({}, { message: '总时长必须是数字' })
  @Min(0)
  @Type(() => Number)
  duration?: number;
}
