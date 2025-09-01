import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsObject, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIPTVChannelDto {
  @ApiProperty({ description: '频道名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '频道流媒体URL' })
  @IsString()
  url: string;

  @ApiProperty({ description: '频道分组' })
  @IsString()
  group: string;

  @ApiProperty({ description: '频道Logo URL', required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ description: '电子节目单ID', required: false })
  @IsOptional()
  @IsString()
  epgId?: string;

  @ApiProperty({ description: '语言', required: false })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiProperty({ description: '国家', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: '地区', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ description: '频道描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '分辨率', required: false })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiProperty({ description: '是否可用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({ description: '观看次数', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  viewCount?: number = 0;

  @ApiProperty({ description: '扩展元数据', required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({ description: '过期时间', required: false })
  @IsOptional()
  @Type(() => Date)
  expireDate?: Date;

  @ApiProperty({ description: '是否为直播', default: true })
  @IsOptional()
  @IsBoolean()
  isLive?: boolean = true;

  @ApiProperty({ description: '流媒体格式', required: false })
  @IsOptional()
  @IsString()
  streamFormat?: string;

  @ApiProperty({ description: '备用URL列表', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  backupUrls?: string[];
}