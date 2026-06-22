import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdvancedSearchDto {
  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '媒体类型', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  type?: string[];

  @ApiPropertyOptional({ description: '画质', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  quality?: string[];

  @ApiPropertyOptional({ description: '类型/标签', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiPropertyOptional({ description: '导演' })
  @IsOptional()
  @IsString()
  director?: string;

  @ApiPropertyOptional({ description: '演员' })
  @IsOptional()
  @IsString()
  actors?: string;

  @ApiPropertyOptional({ description: '最低评分', minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({ description: '最高评分', minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  maxRating?: number;

  @ApiPropertyOptional({ description: '最早年份' })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Type(() => Number)
  minYear?: number;

  @ApiPropertyOptional({ description: '最晚年份' })
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Type(() => Number)
  maxYear?: number;

  @ApiPropertyOptional({ enum: ['relevance', 'rating', 'views', 'date', 'title'] })
  @IsOptional()
  @IsEnum(['relevance', 'rating', 'views', 'date', 'title'])
  sortBy?: 'relevance' | 'rating' | 'views' | 'date' | 'title';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ description: '页码', default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize?: number;

  @ApiPropertyOptional({ description: '是否包含未激活资源' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeInactive?: boolean;
}
