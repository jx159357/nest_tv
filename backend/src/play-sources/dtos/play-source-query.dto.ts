import { ApiProperty } from '@nestjs/swagger';

export class PlaySourceQueryDto {
  @ApiProperty({ description: '页码', default: 1 })
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 10 })
  limit?: number = 10;

  @ApiProperty({ description: '每页数量', default: 10 })
  pageSize?: number = 10;

  @ApiProperty({ description: '影视资源ID', required: false })
  mediaResourceId?: number;

  @ApiProperty({ description: '播放源类型', required: false })
  type?: string;

  @ApiProperty({ description: '播放源状态', required: false })
  status?: string;

  @ApiProperty({ description: '分辨率', required: false })
  resolution?: string;

  @ApiProperty({ description: '是否只显示启用的播放源', default: true })
  activeOnly?: boolean = true;

  @ApiProperty({ description: '排序字段', default: 'priority' })
  sortBy?: string = 'priority';

  @ApiProperty({ description: '排序方式', enum: ['ASC', 'DESC'], default: 'ASC' })
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}