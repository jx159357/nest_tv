import { IsString, IsUrl, IsArray, ArrayNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CrawlRequestDto {
  @IsString()
  @IsEnum(['电影天堂', 'BT种子'], {
    message: '目标网站必须是 电影天堂 或 BT种子',
  })
  targetName: string;

  @IsString()
  @IsUrl({}, { message: 'URL格式不正确' })
  url: string;
}

export class BatchCrawlRequestDto {
  @IsString()
  @IsEnum(['电影天堂', 'BT种子'], {
    message: '目标网站必须是 电影天堂 或 BT种子',
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
  @IsEnum(['电影天堂', 'BT种子'], {
    message: '目标网站必须是 电影天堂 或 BT种子',
  })
  targetName?: string;
}
