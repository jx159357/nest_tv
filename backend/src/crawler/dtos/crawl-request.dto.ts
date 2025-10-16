import { IsString, IsUrl, IsArray, ArrayNotEmpty, IsOptional } from 'class-validator';

export class CrawlRequestDto {
  @IsString()
  targetName: string;

  @IsString()
  @IsUrl({}, { message: 'URL格式不正确' })
  url: string;
}

export class BatchCrawlRequestDto {
  @IsString()
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
  @IsString()
  targetName?: string;
}
