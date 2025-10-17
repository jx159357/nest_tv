import {
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsUrl,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlaySourceType } from '../../entities/play-source.entity';

export class CreatePlaySourceDto {
  @ApiProperty({
    description: '关联的媒体资源ID',
    example: 1,
  })
  @IsNumber({}, { message: '媒体资源ID必须是数字' })
  mediaResourceId: number;

  @ApiProperty({
    description: '播放源类型',
    enum: PlaySourceType,
    example: PlaySourceType.ONLINE,
  })
  @IsEnum(PlaySourceType, { message: '播放源类型无效' })
  type: PlaySourceType;

  @ApiProperty({
    description: '播放源名称',
    example: '高清在线播放',
  })
  @IsString({ message: '播放源名称必须是字符串' })
  name: string;

  @ApiProperty({
    description: '播放URL',
    example: 'https://streaming-platform.com/videos/movie1.mp4',
  })
  @IsUrl({}, { message: '播放URL格式无效' })
  url: string;

  @ApiProperty({
    description: '分辨率',
    example: '1080p',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '分辨率必须是字符串' })
  resolution?: string;

  @ApiProperty({
    description: '语言',
    example: '中文',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '语言必须是字符串' })
  language?: string;

  @ApiProperty({
    description: '字幕URL',
    example: 'https://streaming-platform.com/subtitles/movie1.srt',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: '字幕URL格式无效' })
  subtitle?: string;

  @ApiProperty({
    description: '优先级',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '优先级必须是数字' })
  @Min(1, { message: '优先级不能小于1' })
  priority?: number;

  @ApiProperty({
    description: '是否启用',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean;
}

export class UpdatePlaySourceDto {
  @ApiProperty({
    description: '播放源名称',
    example: '高清在线播放',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '播放源名称必须是字符串' })
  name?: string;

  @ApiProperty({
    description: '播放URL',
    example: 'https://streaming-platform.com/videos/movie1.mp4',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: '播放URL格式无效' })
  url?: string;

  @ApiProperty({
    description: '分辨率',
    example: '1080p',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '分辨率必须是字符串' })
  resolution?: string;

  @ApiProperty({
    description: '语言',
    example: '中文',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '语言必须是字符串' })
  language?: string;

  @ApiProperty({
    description: '字幕URL',
    example: 'https://streaming-platform.com/subtitles/movie1.srt',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: '字幕URL格式无效' })
  subtitle?: string;

  @ApiProperty({
    description: '优先级',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '优先级必须是数字' })
  @Min(1, { message: '优先级不能小于1' })
  priority?: number;

  @ApiProperty({
    description: '是否启用',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean;
}
