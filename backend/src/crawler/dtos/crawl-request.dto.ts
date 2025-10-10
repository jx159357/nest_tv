import { IsString, IsUrl, IsArray, ArrayNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { CRAWLER_TARGETS } from '../crawler.config';

// 从配置中提取允许的目标名称
const ALLOWED_TARGETS = CRAWLER_TARGETS.map(target => target.name);

export class CrawlRequestDto {
  @IsString()
  @IsEnum(ALLOWED_TARGETS, {
    message: `目标网站必须是: ${ALLOWED_TARGETS.join('、')}`,
  })
  targetName: string;

  @IsString()
  @IsUrl({}, { message: 'URL格式不正确' })
  url: string;
}

export class BatchCrawlRequestDto {
  @IsString()
  @IsEnum(ALLOWED_TARGETS, {
    message: `目标网站必须是: ${ALLOWED_TARGETS.join('、')}`,
  })
  targetName: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'URL列表不能为空' })
  @IsString({ each: true, message: 'URL列表中的每项都必须是字符串' })
  urls: string[];
}

export class CrawlAndSaveDto {
  @IsString()
  @IsUrl({}, { message: 'URL格式不正确' })
  url: string;

  @IsOptional()
  @IsEnum(ALLOWED_TARGETS, {
    message: `目标网站必须是: ${ALLOWED_TARGETS.join('、')}`,
  })
  targetName?: string;
}
