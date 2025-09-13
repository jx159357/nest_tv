import { IsString, IsOptional, IsNumber, Min, Max, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MediaType, MediaQuality } from '../../entities/media-resource.entity';

export class CreateSearchHistoryDto {
  @ApiProperty({ description: '搜索关键词' })
  @IsString()
  keyword: string;

  @ApiProperty({ description: '搜索结果数量', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  resultCount?: number;

  @ApiProperty({ description: '搜索耗时（秒）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  searchTime?: number;

  @ApiProperty({ description: '搜索过滤器', required: false })
  @IsOptional()
  filters?: {
    types?: MediaType[];
    genres?: string[];
    quality?: MediaQuality[];
    minRating?: number;
    maxRating?: number;
    yearRange?: [number, number];
  };
}

export class UpdateSearchHistoryDto {
  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '搜索结果数量', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  resultCount?: number;

  @ApiProperty({ description: '搜索耗时（秒）', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  searchTime?: number;

  @ApiProperty({ description: '是否活跃', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: '搜索过滤器', required: false })
  @IsOptional()
  filters?: {
    types?: MediaType[];
    genres?: string[];
    quality?: MediaQuality[];
    minRating?: number;
    maxRating?: number;
    yearRange?: [number, number];
  };
}

export class SearchHistoryQueryDto {
  @ApiProperty({ description: '页码', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;

  @ApiProperty({ description: '是否只包含活跃记录', required: false })
  @IsOptional()
  @IsBoolean()
  onlyActive?: boolean = true;

  @ApiProperty({ description: '关键词过滤', required: false })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiProperty({ description: '开始日期', required: false })
  @IsOptional()
  startDate?: Date;

  @ApiProperty({ description: '结束日期', required: false })
  @IsOptional()
  endDate?: Date;
}