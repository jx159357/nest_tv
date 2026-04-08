import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class TorrentRankQueryDto {
  @ApiProperty({ description: '返回数量', required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ description: '分类', required: false, example: 'movie' })
  @IsOptional()
  @IsString()
  category?: string;
}

