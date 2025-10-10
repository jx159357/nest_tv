import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';

export class WatchHistoryQueryDto {
  @ApiProperty({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ description: '用户ID', required: false })
  @IsOptional()
  @IsNumber()
  userId?: number;

  @ApiProperty({ description: '影视资源ID', required: false })
  @IsOptional()
  @IsNumber()
  mediaResourceId?: number;

  @ApiProperty({ description: '是否已看完', required: false })
  @IsOptional()
  isCompleted?: boolean;

  @ApiProperty({ description: '排序字段', default: 'updatedAt' })
  @IsOptional()
  sortBy?: string = 'updatedAt';

  @ApiProperty({ description: '排序方式', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
