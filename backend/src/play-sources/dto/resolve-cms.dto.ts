import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveCmsDto {
  @ApiProperty({ description: '影视标题' })
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString({ message: '标题必须是字符串' })
  title: string;

  @ApiPropertyOptional({ description: '集数', minimum: 1 })
  @IsOptional()
  @IsNumber({}, { message: '集数必须是数字' })
  @Min(1, { message: '集数最小为1' })
  @Type(() => Number)
  episodeNumber?: number;
}
