import { IsNumber, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWatchHistoryDto {
  @ApiProperty({ description: '用户ID' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ description: '影视资源ID' })
  @IsNumber()
  @IsNotEmpty()
  mediaResourceId: number;

  @ApiProperty({ description: '当前观看时间（秒）', default: 0 })
  @IsOptional()
  @IsNumber()
  currentTime?: number = 0;

  @ApiProperty({ description: '总时长（秒）', required: false })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiProperty({ description: '当前播放的剧集号', required: false })
  @IsOptional()
  @IsNumber()
  episodeNumber?: number;

  @ApiProperty({ description: '是否已看完', default: false })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean = false;

  @ApiProperty({ description: '播放设备', required: false })
  @IsOptional()
  device?: string;

  @ApiProperty({ description: '播放质量', required: false })
  @IsOptional()
  quality?: string;

  @ApiProperty({ description: '备注', required: false })
  @IsOptional()
  note?: string;
}
