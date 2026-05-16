import { ApiProperty } from '@nestjs/swagger';

export class MediaResourceDto {
  @ApiProperty({ description: '影视资源ID', example: 1 })
  id: number;

  @ApiProperty({ description: '影视标题', example: '复仇者联盟4' })
  title: string;

  @ApiProperty({ description: '影视描述', example: '经典的超级英雄电影' })
  description?: string;

  @ApiProperty({
    description: '影视类型',
    example: 'movie',
    enum: ['movie', 'tv_series', 'variety', 'anime', 'documentary'],
  })
  type: string;

  @ApiProperty({
    description: '视频质量',
    example: 'hd',
    enum: ['hd', 'full_hd', 'blue_ray', 'sd'],
  })
  quality?: string;

  @ApiProperty({ description: '影视类型/标签', example: ['动作', '科幻'], isArray: true })
  genres?: string[];

  @ApiProperty({
    description: '影视海报URL',
    example: 'https://streaming-platform.com/covers/movie1.jpg',
  })
  poster?: string;

  @ApiProperty({ description: '影视时长（秒）', example: 8820 })
  duration?: number;

  @ApiProperty({ description: '评分', example: 8.7 })
  rating?: number;

  @ApiProperty({ description: '上映日期', example: '2024-01-01' })
  releaseDate?: Date;

  @ApiProperty({ description: '是否激活', example: true })
  isActive: boolean;

  @ApiProperty({ description: '创建时间', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class MediaListResponseDto {
  @ApiProperty({ description: '影视资源列表', type: [MediaResourceDto] })
  data: MediaResourceDto[];

  @ApiProperty({ description: '当前页码', example: 1 })
  page: number;

  @ApiProperty({ description: '每页数量', example: 10 })
  pageSize: number;

  @ApiProperty({ description: '总记录数', example: 100 })
  total: number;

  @ApiProperty({ description: '总页数', example: 10 })
  totalPages: number;

  @ApiProperty({ description: '是否有下一页', example: true })
  hasNext: boolean;

  @ApiProperty({ description: '是否有上一页', example: false })
  hasPrevious: boolean;
}

export class MediaDetailResponseDto {
  @ApiProperty({ description: '影视资源详情' })
  data: MediaResourceDto;

  @ApiProperty({ description: '相关推荐', type: [MediaResourceDto], required: false })
  recommendations?: MediaResourceDto[];

  @ApiProperty({ description: '播放源列表', type: [Object], required: false })
  playSources?: any[];
}

export class ErrorResponse {
  @ApiProperty({ description: '错误码', example: 400 })
  statusCode: number;

  @ApiProperty({ description: '错误消息', example: '请求参数错误' })
  message: string;

  @ApiProperty({
    description: '错误详情',
    example: ['title is required', 'type must be valid'],
    isArray: true,
    required: false,
  })
  errors?: string[];

  @ApiProperty({ description: '时间戳', example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}
