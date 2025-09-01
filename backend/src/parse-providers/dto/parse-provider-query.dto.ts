import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class ParseProviderQueryDto {
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

  @ApiProperty({ description: '解析提供商分类', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '优先级', required: false, enum: ['high', 'medium', 'low'] })
  @IsOptional()
  @IsEnum(['high', 'medium', 'low'])
  priority?: 'high' | 'medium' | 'low';

  @ApiProperty({ description: '是否可用', default: true })
  @IsOptional()
  @IsBoolean()
  activeOnly?: boolean = true;

  @ApiProperty({ description: '支持在线播放', required: false })
  @IsOptional()
  @IsBoolean()
  supportOnlinePlay?: boolean;

  @ApiProperty({ description: '支持下载链接', required: false })
  @IsOptional()
  @IsBoolean()
  supportDownload?: boolean;

  @ApiProperty({ description: '最小成功率', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minSuccessRate?: number;

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