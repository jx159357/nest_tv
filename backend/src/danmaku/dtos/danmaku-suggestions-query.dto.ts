import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum DanmakuSuggestionType {
  POPULAR = 'popular',
  RECENT = 'recent',
  RELEVANT = 'relevant',
}

export class DanmakuSuggestionsQueryDto {
  @ApiPropertyOptional({ description: 'Video id filter' })
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiPropertyOptional({ description: 'Media resource id filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mediaResourceId?: number;

  @ApiPropertyOptional({ enum: DanmakuSuggestionType, description: 'Suggestion strategy' })
  @IsOptional()
  @IsEnum(DanmakuSuggestionType)
  type?: DanmakuSuggestionType;

  @ApiPropertyOptional({ description: 'Suggestion limit', default: 10, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 10;
}
