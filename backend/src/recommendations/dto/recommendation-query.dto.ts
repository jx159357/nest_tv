import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Recommendation } from '../../entities/recommendation.entity';

export class RecommendationQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsEnum(['movie', 'tv_series', 'variety', 'anime', 'documentary'])
  mediaType?: string;

  @IsOptional()
  @IsEnum(['sd', 'hd', 'full_hd', 'blue_ray'])
  quality?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  minRating?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  maxRating?: number;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsEnum(['score', 'rating', 'viewCount', 'createdAt', 'priority'])
  sortBy?: string = 'score';

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
