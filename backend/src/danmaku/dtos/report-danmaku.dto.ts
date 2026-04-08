import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReportDanmakuDto {
  @ApiProperty({ description: '举报原因', example: '剧透' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: '举报原因必须是字符串' })
  @IsNotEmpty({ message: '举报原因不能为空' })
  @MaxLength(100, { message: '举报原因不能超过100个字符' })
  reason: string;

  @ApiPropertyOptional({ description: '补充说明', example: '提前透露了结局内容' })
  @Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  })
  @IsOptional()
  @IsString({ message: '举报说明必须是字符串' })
  @MaxLength(500, { message: '举报说明不能超过500个字符' })
  description?: string;
}
