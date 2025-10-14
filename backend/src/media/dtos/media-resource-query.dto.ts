import { ApiProperty } from '@nestjs/swagger';

export class MediaResourceQueryDto {
  @ApiProperty({ description: '页码', default: 1 })
  page?: number = 1;

  @ApiProperty({ description: '每页数量', default: 10 })
  pageSize?: number = 10;

  @ApiProperty({ description: '搜索关键词', required: false })
  search?: string;

  @ApiProperty({ description: '影视类型（可以是单个类型或多个类型）', required: false })
  type?: string | string[];

  @ApiProperty({ description: '类型标签', required: false })
  genre?: string;

  @ApiProperty({ description: '最低评分', required: false })
  minRating?: number;

  @ApiProperty({ description: '最高评分', required: false })
  maxRating?: number;

  @ApiProperty({ description: '视频质量（可以是单个质量或多个质量）', required: false })
  quality?: string | string[];

  @ApiProperty({ description: '标签（可以是单个标签或逗号分隔的多个标签）', required: false })
  tags?: string | string[];

  @ApiProperty({ description: '开始日期', required: false })
  startDate?: Date;

  @ApiProperty({ description: '结束日期', required: false })
  endDate?: Date;

  @ApiProperty({ description: '排序字段', default: 'createdAt' })
  sortBy?: string = 'createdAt';

  @ApiProperty({ description: '排序方式', enum: ['ASC', 'DESC'], default: 'DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
