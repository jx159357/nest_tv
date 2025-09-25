import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsNumber,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { MediaType, MediaQuality } from '../../entities/media-resource.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMediaResourceDto {
  @ApiProperty({ description: '影视标题' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: '简介', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '影视类型', enum: MediaType })
  @IsEnum(MediaType)
  type: MediaType;

  @ApiProperty({ description: '导演', required: false })
  @IsOptional()
  @IsString()
  director?: string;

  @ApiProperty({ description: '主演', required: false })
  @IsOptional()
  @IsString()
  actors?: string;

  @ApiProperty({ description: '类型标签', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @ApiProperty({ description: '上映日期', required: false })
  @IsOptional()
  @IsDate()
  releaseDate?: Date;

  @ApiProperty({ description: '视频质量', enum: MediaQuality, default: MediaQuality.HD })
  @IsOptional()
  @IsEnum(MediaQuality)
  quality?: MediaQuality = MediaQuality.HD;

  @ApiProperty({ description: '海报URL', required: false })
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiProperty({ description: '背景图URL', required: false })
  @IsOptional()
  @IsString()
  backdrop?: string;

  @ApiProperty({ description: '评分', minimum: 0, maximum: 10, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  rating?: number = 0;

  @ApiProperty({ description: '来源平台', required: false })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ description: '剧集数', required: false })
  @IsOptional()
  @IsNumber()
  episodeCount?: number;

  @ApiProperty({ description: '下载链接', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  downloadUrls?: string[];
}
