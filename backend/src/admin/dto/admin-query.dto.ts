import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { DownloadTaskStatus, DownloadTaskType } from '../../entities/download-task.entity';

export enum AdminLogStatusQuery {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export enum AdminPlaySourceSortByQuery {
  CREATED_AT = 'createdAt',
  LAST_CHECKED_AT = 'lastCheckedAt',
  PRIORITY = 'priority',
}

export enum AdminSortOrderQuery {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class AdminPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 20, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 20;
}

export class AdminUsersQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminMediaQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Media type filter' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminPlaySourcesQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Source type filter' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Source label filter' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Comma separated sources' })
  @IsOptional()
  @IsString()
  sources?: string;

  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Source status filter' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: AdminPlaySourceSortByQuery, description: 'Sort field' })
  @IsOptional()
  @IsEnum(AdminPlaySourceSortByQuery)
  sortBy?: AdminPlaySourceSortByQuery;

  @ApiPropertyOptional({ enum: AdminSortOrderQuery, description: 'Sort order' })
  @IsOptional()
  @IsEnum(AdminSortOrderQuery)
  sortOrder?: AdminSortOrderQuery;
}

export class AdminWatchHistoryQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ description: 'User id filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;
}

export class AdminDownloadTasksQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ enum: DownloadTaskStatus, description: 'Task status filter' })
  @IsOptional()
  @IsEnum(DownloadTaskStatus)
  status?: DownloadTaskStatus;

  @ApiPropertyOptional({ enum: DownloadTaskType, description: 'Task type filter' })
  @IsOptional()
  @IsEnum(DownloadTaskType)
  type?: DownloadTaskType;

  @ApiPropertyOptional({ description: 'User id filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ description: 'Media id filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mediaResourceId?: number;

  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class AdminLogsQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Action filter' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Resource filter' })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({ enum: AdminLogStatusQuery, description: 'Status filter' })
  @IsOptional()
  @IsEnum(AdminLogStatusQuery)
  status?: AdminLogStatusQuery;

  @ApiPropertyOptional({ description: 'Role id filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId?: number;

  @ApiPropertyOptional({ description: 'Download task client id filter' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Download task id filter' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  downloadTaskId?: number;
}
