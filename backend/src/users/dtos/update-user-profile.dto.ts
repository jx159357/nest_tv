import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import {
  RecommendationFreshnessBias,
  type UserRecommendationSettings,
} from './user-recommendation-settings.interface';

export class UpdateUserProfileDto {
  @ApiProperty({ description: '昵称', required: false, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @ApiProperty({ description: '手机号', required: false, maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({ description: '头像 URL', required: false })
  @IsOptional()
  @IsUrl({ require_tld: false })
  avatar?: string;

  @ApiProperty({ description: '推荐偏好设置', required: false, type: Object })
  @IsOptional()
  recommendationSettings?: UserRecommendationSettings;
}

export class UpdateRecommendationSettingsDto implements UserRecommendationSettings {
  @ApiProperty({ description: '偏好类型', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  preferredTypes?: string[];

  @ApiProperty({ description: '偏好标签', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  preferredGenres?: string[];

  @ApiProperty({ description: '排除标签', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  excludedGenres?: string[];

  @ApiProperty({ description: '偏好关键词', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  preferredKeywords?: string[];

  @ApiProperty({ description: '新鲜度偏好', required: false, enum: RecommendationFreshnessBias })
  @IsOptional()
  @IsEnum(RecommendationFreshnessBias)
  freshnessBias?: RecommendationFreshnessBias;
}
