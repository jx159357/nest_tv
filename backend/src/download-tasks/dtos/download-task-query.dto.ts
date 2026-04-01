import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { DownloadTaskStatus, DownloadTaskType } from '../../entities/download-task.entity';

export class DownloadTaskQueryDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Page size', required: false, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  limit?: number = 100;

  @ApiProperty({ description: 'Task status', required: false, enum: DownloadTaskStatus })
  @IsOptional()
  @IsEnum(DownloadTaskStatus)
  status?: DownloadTaskStatus;

  @ApiProperty({ description: 'Task type', required: false, enum: DownloadTaskType })
  @IsOptional()
  @IsEnum(DownloadTaskType)
  type?: DownloadTaskType;

  @ApiProperty({ description: 'Media resource id', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mediaResourceId?: number;

  @ApiProperty({ description: 'Search keyword', required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
