import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUrl,
} from 'class-validator';
import { PlaySourceType, PlaySourceStatus } from '../../entities/play-source.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePlaySourceDto {
  @ApiProperty({ description: '播放链接' })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url: string;

  @ApiProperty({ description: '播放源类型', enum: PlaySourceType })
  @IsEnum(PlaySourceType)
  type: PlaySourceType;

  @ApiProperty({
    description: '播放源状态',
    enum: PlaySourceStatus,
    default: PlaySourceStatus.CHECKING,
  })
  @IsOptional()
  @IsEnum(PlaySourceStatus)
  status?: PlaySourceStatus = PlaySourceStatus.CHECKING;

  @ApiProperty({ description: '分辨率', required: false })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiProperty({ description: '视频格式', required: false })
  @IsOptional()
  @IsString()
  format?: string;

  @ApiProperty({ description: '字幕链接', required: false })
  @IsOptional()
  @IsUrl()
  subtitleUrl?: string;

  @ApiProperty({ description: '优先级', default: 0 })
  @IsOptional()
  @IsNumber()
  priority?: number = 0;

  @ApiProperty({ description: '是否有广告', default: true })
  @IsOptional()
  @IsBoolean()
  isAds?: boolean = true;

  @ApiProperty({ description: '描述信息', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '来源名称', required: false })
  @IsOptional()
  @IsString()
  sourceName?: string;

  @ApiProperty({ description: '请求头信息', required: false })
  @IsOptional()
  headers?: any;

  @ApiProperty({ description: '过期时间', required: false })
  @IsOptional()
  expireDate?: Date;

  @ApiProperty({ description: '剧集号', required: false })
  @IsOptional()
  @IsNumber()
  episodeNumber?: number;

  @ApiProperty({ description: '关联的影视资源ID' })
  @IsNumber()
  @IsNotEmpty()
  mediaResourceId: number;
}
