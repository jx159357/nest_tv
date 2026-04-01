import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  DownloadTaskHandler,
  DownloadTaskStatus,
  DownloadTaskType,
} from '../../entities/download-task.entity';

export class CreateDownloadTaskDto {
  @ApiProperty({ description: 'Client task id' })
  @IsString()
  clientId: string;

  @ApiProperty({ description: 'Download url' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Task type', enum: DownloadTaskType, required: false })
  @IsOptional()
  @IsEnum(DownloadTaskType)
  type?: DownloadTaskType;

  @ApiProperty({ description: 'Task status', enum: DownloadTaskStatus, required: false })
  @IsOptional()
  @IsEnum(DownloadTaskStatus)
  status?: DownloadTaskStatus;

  @ApiProperty({ description: 'Progress percentage', required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiProperty({ description: 'Download speed', required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  speed?: number;

  @ApiProperty({ description: 'Downloaded bytes', required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  downloaded?: number;

  @ApiProperty({ description: 'Total bytes', required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total?: number;

  @ApiProperty({ description: 'File name' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'Download path', required: false })
  @IsOptional()
  @IsString()
  filePath?: string;

  @ApiProperty({ description: 'Source label', required: false })
  @IsOptional()
  @IsString()
  sourceLabel?: string;

  @ApiProperty({ description: 'Launch handler', enum: DownloadTaskHandler, required: false })
  @IsOptional()
  @IsEnum(DownloadTaskHandler)
  handler?: DownloadTaskHandler;

  @ApiProperty({ description: 'Launch count', required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  launchCount?: number;

  @ApiProperty({ description: 'Media resource id', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mediaResourceId?: number;

  @ApiProperty({ description: 'Latest error message', required: false })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiProperty({ description: 'Metadata payload', required: false, type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: 'Last launched at', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastLaunchedAt?: Date;

  @ApiProperty({ description: 'Completed at', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  completedAt?: Date;
}
