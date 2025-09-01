import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class IPTVChannelQueryDto {
  @ApiProperty({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @ApiProperty({ description: '频道分组', required: false })
  @IsOptional()
  @IsString()
  group?: string;

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

  @ApiProperty({ description: '分辨率', required: false })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiProperty({ description: '流媒体格式', required: false })
  @IsOptional()
  @IsString()
  streamFormat?: string;

  @ApiProperty({ description: '是否可用', default: true })
  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean = true;

  @ApiProperty({ description: '是否为直播', required: false })
  @IsOptional()
  @IsBoolean()
  isLive?: boolean;

  @ApiProperty({ description: '排序字段', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: '排序方式', default: 'DESC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}