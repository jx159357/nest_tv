import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Recommendation } from '../../entities/recommendation.entity';

export class RecommendationQueryDto {
  @ApiPropertyOptional({ description: '页码，从1开始', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: '返回数量限制', default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '推荐类型' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: '媒体类型',
    enum: ['movie', 'tv_series', 'variety', 'anime', 'documentary'],
  })
  @IsOptional()
  @IsEnum(['movie', 'tv_series', 'variety', 'anime', 'documentary'])
  mediaType?: string;

  @ApiPropertyOptional({ description: '视频质量', enum: ['sd', 'hd', 'full_hd', 'blue_ray'] })
  @IsOptional()
  @IsEnum(['sd', 'hd', 'full_hd', 'blue_ray'])
  quality?: string;

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

  @ApiPropertyOptional({ description: '流派/类型标签' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({
    description: '排序字段',
    default: 'score',
    enum: ['score', 'rating', 'viewCount', 'createdAt', 'priority'],
  })
  @IsOptional()
  @IsEnum(['score', 'rating', 'viewCount', 'createdAt', 'priority'])
  sortBy?: string = 'score';

  @ApiPropertyOptional({ description: '排序方式', default: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export interface PaginatedRecommendations {
  data: Recommendation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface RecommendationFilters {
  type?: string;
  mediaType?: string;
  quality?: string;
  minRating?: number;
  maxRating?: number;
  genre?: string;
}
