import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class KeywordQueryDto {
  @ApiProperty({ description: '搜索关键词' })
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ description: '返回数量限制', default: 8, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

export class LimitQueryDto {
  @ApiPropertyOptional({ description: '返回数量限制', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

export class DaysQueryDto {
  @ApiPropertyOptional({ description: '统计天数', default: 7, minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  days?: number;
}

export class StreamSearchQueryDto {
  @ApiProperty({ description: '搜索关键词' })
  @IsString()
  keyword: string;

  @ApiPropertyOptional({ description: '媒体类型' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '返回数量限制', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
