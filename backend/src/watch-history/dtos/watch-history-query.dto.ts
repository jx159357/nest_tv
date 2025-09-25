import { ApiProperty } from '@nestjs/swagger';

export class WatchHistoryQueryDto {
  @ApiProperty({ description: '页码', default: 1 })
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 10 })
  limit?: number = 10;

  @ApiProperty({ description: '用户ID', required: false })
  userId?: number;

  @ApiProperty({ description: '影视资源ID', required: false })
  mediaResourceId?: number;

  @ApiProperty({ description: '是否已看完', required: false })
  isCompleted?: boolean;

  @ApiProperty({ description: '排序字段', default: 'updatedAt' })
  sortBy?: string = 'updatedAt';

  @ApiProperty({ description: '排序方式', enum: ['ASC', 'DESC'], default: 'DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
