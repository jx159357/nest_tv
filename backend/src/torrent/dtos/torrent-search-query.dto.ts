import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class TorrentSearchQueryDto {
  @ApiProperty({ description: '搜索关键词', required: false, example: '沙丘' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '分类', required: false, example: 'movie' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;
}

