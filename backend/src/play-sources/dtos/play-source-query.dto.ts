import {
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PlaySourceType } from '../../entities/play-source.entity';

export class PlaySourceQueryDto {
  @ApiProperty({
    description: '页码',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码不能小于1' })
  page?: number = 1;

  @ApiProperty({
    description: '每页数量',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '每页数量必须是数字' })
  @Min(1, { message: '每页数量不能小于1' })
  @Max(100, { message: '每页数量不能超过100' })
  pageSize?: number = 10;

  @ApiProperty({
    description: '媒体资源ID',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '媒体资源ID必须是数字' })
  mediaResourceId?: number;

  @ApiProperty({
    description: '播放源类型',
    enum: PlaySourceType,
    required: false,
  })
  @IsOptional()
  @IsEnum(PlaySourceType, { message: '播放源类型无效' })
  type?: PlaySourceType;

  @ApiProperty({
    description: '分辨率/质量',
    example: '1080p',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '分辨率必须是字符串' })
  resolution?: string;

  @ApiProperty({
    description: '是否启用',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: '启用状态必须是布尔值' })
  isActive?: boolean;

  @ApiProperty({
    description: '搜索关键词',
    example: 'example',
    required: false,
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;
}
