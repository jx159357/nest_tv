import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export enum DanmakuFilterRuleLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

const normalizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return value as undefined;
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .filter((item, index, list) => list.indexOf(item) === index);
};

export class UpdateDanmakuFilterRulesDto {
  @ApiPropertyOptional({ type: [String], description: 'Sensitive word list' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizeStringArray(value))
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  sensitiveWords?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Spam pattern list' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => normalizeStringArray(value))
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  spamPatterns?: string[];

  @ApiPropertyOptional({ enum: DanmakuFilterRuleLevel, description: 'Rule level' })
  @IsOptional()
  @IsEnum(DanmakuFilterRuleLevel)
  level?: DanmakuFilterRuleLevel;

  @ApiPropertyOptional({ description: 'Whether to auto-block filtered danmaku' })
  @IsOptional()
  @IsBoolean()
  autoBlock?: boolean;
}
