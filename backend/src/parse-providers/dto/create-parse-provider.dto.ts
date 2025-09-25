import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsObject, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateParseProviderDto {
  @ApiProperty({ description: '解析提供商名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '解析站基础URL' })
  @IsString()
  baseUrl: string;

  @ApiProperty({ description: '解析规则（JSON格式）' })
  @IsString()
  parseRule: string;

  @ApiProperty({ description: 'API接口URL', required: false })
  @IsOptional()
  @IsString()
  apiUrl?: string;

  @ApiProperty({ description: 'API请求方法', required: false })
  @IsOptional()
  @IsString()
  apiMethod?: string = 'GET';

  @ApiProperty({ description: 'API请求头（JSON格式）', required: false })
  @IsOptional()
  @IsString()
  apiHeaders?: string;

  @ApiProperty({ description: '解析提供商描述', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: '是否可用', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiProperty({ description: '成功率', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  successRate?: number = 0;

  @ApiProperty({ description: '请求次数', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  requestCount?: number = 0;

  @ApiProperty({ description: '成功次数', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  successCount?: number = 0;

  @ApiProperty({ description: '扩展配置', required: false })
  @IsOptional()
  @IsObject()
  config?: any;

  @ApiProperty({ description: '扩展元数据', required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({ description: '解析提供商分类', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ description: '支持在线播放', default: true })
  @IsOptional()
  @IsBoolean()
  supportOnlinePlay?: boolean = true;

  @ApiProperty({ description: '支持下载链接', default: true })
  @IsOptional()
  @IsBoolean()
  supportDownload?: boolean = true;

  @ApiProperty({ description: '优先级', required: false, enum: ['high', 'medium', 'low'] })
  @IsOptional()
  @IsEnum(['high', 'medium', 'low'])
  priority?: 'high' | 'medium' | 'low' = 'medium';

  @ApiProperty({ description: '过期时间', required: false })
  @IsOptional()
  @Type(() => Date)
  expireDate?: Date;

  @ApiProperty({ description: '每日请求限制', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dailyRequestLimit?: number = 0;
}
