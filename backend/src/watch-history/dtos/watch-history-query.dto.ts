import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class WatchHistoryQueryDto {
  @ApiProperty({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Page size', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ description: 'User id', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiProperty({ description: 'Media resource id', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mediaResourceId?: number;

  @ApiProperty({ description: 'Completed status', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isCompleted?: boolean;

  @ApiProperty({ description: 'Sort field', default: 'updatedAt' })
  @IsOptional()
  @IsIn(['updatedAt', 'createdAt', 'currentTime'])
  sortBy?: string = 'updatedAt';

  @ApiProperty({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
