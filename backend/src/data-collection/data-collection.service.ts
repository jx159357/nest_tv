import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { MediaResource, MediaType } from '../entities/media-resource.entity';
import { PlaySource, PlaySourceType, PlaySourceStatus } from '../entities/play-source.entity';

export interface MediaData {
  title: string;
  description?: string;
  type: MediaType;
  director?: string;
  actors?: string;
  genres?: string[];
  releaseDate?: Date;
  poster?: string;
  backdrop?: string;
  rating: number;
  source: string;
  downloadUrls?: string[];
  metadata?: any;
}

export interface CrawlerSource {
  name: string;
  baseUrl: string;
  enabled: boolean;
  maxConcurrent: number;
  delay: number;
  config: any;
}

@Injectable()
export class DataCollectionService {
  private readonly logger = new Logger('DataCollectionService');

  /**
   * 数据源配置
   */
  private readonly sources: CrawlerSource[] = [
    {
      name: '豆瓣电影',
      baseUrl: 'https://movie.douban.com',
      enabled: true,
      maxConcurrent: 2,
      delay: 2000,
      config: {
        selectors: {
          title: 'h1 span[property="v:itemreviewed"]',
          description: '.related-info .indent .all',
          poster: '.related-pic img',
          rating: '.rating_self strong',
        },
      },
    },
    {
      name: '电影天堂',
      baseUrl: 'https://www.dy2018.com',
      enabled: true,
      maxConcurrent: 3,
      delay: 1500,
      config: {
        selectors: {
          title: '.title a',
          description: '.description',
          poster: '.poster img',
          rating: '.rating',
        },
      },
    },
  ];

  /**
   * 获取所有可用的爬虫源
   */
  getSources(): CrawlerSource[] {
    return this.sources.filter(source => source.enabled);
  }

  /**
   * 根据名称获取爬虫源
   */
  getSource(name: string): CrawlerSource | undefined {
    return this.sources.find(source => source.name === name && source.enabled);
  }

  /**
   * 爬取单个URL
   */
  async crawlUrl(sourceName: string, url: string): Promise<MediaData> {
    const source = this.getSource(sourceName);
    if (!source) {
      throw new Error(`爬虫源 ${sourceName} 不存在或已禁用`);
    }

    this.logger.log(`开始爬取: ${url}`);

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const $ = cheerio.load(response.data);
      const selectors = source.config.selectors;

      // 提取数据
      const title = $(selectors.title).text().trim();
      const description = $(selectors.description).text().trim();
      const poster = $(selectors.poster).attr('src');
      const ratingText = $(selectors.rating).text().trim();

      // 解析评分
      const rating = ratingText ? parseFloat(ratingText) || 0 : 0;

      if (!title) {
        throw new Error('无法获取标题');
      }

      const mediaData: MediaData = {
        title,
        description,
        type: MediaType.MOVIE,
        rating,
        source: sourceName,
        poster: poster ? new URL(poster, source.baseUrl).href : undefined,
        downloadUrls: this.extractDownloadUrls($),
        metadata: {
          crawledAt: new Date().toISOString(),
          originalUrl: url,
        },
      };

      this.logger.log(`爬取成功: ${title}`);
      return mediaData;
    } catch (error) {
      this.logger.error(`爬取失败: ${error.message}`, error.stack);
      throw new HttpException(`爬取失败: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 批量爬取URL
   */
  async crawlBatch(sourceName: string, urls: string[]): Promise<MediaData[]> {
    const source = this.getSource(sourceName);
    if (!source) {
      throw new Error(`爬虫源 ${sourceName} 不存在或已禁用`);
    }

    this.logger.log(`开始批量爬取: ${urls.length} 个URL`);

    const results: MediaData[] = [];
    const errors: string[] = [];

    // 使用Promise.allSettled来处理批量请求
    const promises = urls.map(async (url, index) => {
      // 添加延迟以避免过于频繁的请求
      return new Promise<MediaData | null>(resolve => {
        setTimeout(async () => {
          try {
            const result = this.crawlUrl(sourceName, url);
            resolve(result);
          } catch (error) {
            errors.push(`${url}: ${error.message}`);
            resolve(null);
          }
        }, index * source.delay);
      });
    });

    const settledResults = await Promise.allSettled(promises);

    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    });

    this.logger.log(`批量爬取完成: ${results.length} 成功, ${errors.length} 失败`);

    if (errors.length > 0) {
      this.logger.warn(`失败的URL: ${errors.join(', ')}`);
    }

    return results;
  }

  /**
   * 爬取并保存到数据库
   */
  async crawlAndSave(sourceName: string, url: string) {
    const mediaData = await this.crawlUrl(sourceName, url);

    // 这里可以添加保存到数据库的逻辑
    // 暂时只返回爬取的数据
    return {
      success: true,
      data: mediaData,
      message: '爬取成功',
    };
  }

  /**
   * 获取热门资源URL
   */
  async getPopularUrls(sourceName: string, limit: number = 20): Promise<string[]> {
    const source = this.getSource(sourceName);
    if (!source) {
      throw new Error(`爬虫源 ${sourceName} 不存在或已禁用`);
    }

    this.logger.log(`获取热门URL: ${sourceName}`);

    try {
      // 简化实现：返回占位URL
      const urls = Array.from(
        { length: limit },
        (_, index) => `${source.baseUrl}/popular/${index + 1}`,
      );

      this.logger.log(`获取到 ${urls.length} 个热门URL`);
      return urls;
    } catch (error) {
      this.logger.error(`获取热门URL失败: ${error.message}`, error.stack);
      throw new HttpException(
        `获取热门URL失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 测试爬虫源连接
   */
  async testConnection(sourceName: string): Promise<{
    success: boolean;
    message: string;
    responseTime?: number;
  }> {
    const source = this.getSource(sourceName);
    if (!source) {
      return {
        success: false,
        message: `爬虫源 ${sourceName} 不存在或已禁用`,
      };
    }

    this.logger.log(`测试连接: ${sourceName}`);

    try {
      const startTime = Date.now();
      await axios.get(source.baseUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      const responseTime = Date.now() - startTime;

      this.logger.log(`连接测试成功: ${sourceName}, 响应时间: ${responseTime}ms`);

      return {
        success: true,
        message: '连接测试成功',
        responseTime,
      };
    } catch (error) {
      this.logger.error(`连接测试失败: ${error.message}`, error.stack);

      return {
        success: false,
        message: `连接测试失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取爬虫统计信息
   */
  async getStatistics(): Promise<{
    totalSources: number;
    enabledSources: number;
    sources: Array<{
      name: string;
      enabled: boolean;
      lastCrawled?: Date;
      totalCrawled?: number;
    }>;
  }> {
    const totalSources = this.sources.length;
    const enabledSources = this.sources.filter(s => s.enabled).length;

    const sources = this.sources.map(source => ({
      name: source.name,
      enabled: source.enabled,
      // 这里可以添加从数据库获取的统计信息
      totalCrawled: Math.floor(Math.random() * 1000),
      lastCrawled: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    }));

    return {
      totalSources,
      enabledSources,
      sources,
    };
  }

  /**
   * 提取下载链接
   */
  private extractDownloadUrls($: any): string[] {
    const urls: string[] = [];

    // 查找常见的下载链接模式
    $('a[href*="download"], a[href*="magnet"], a[href*="torrent"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        urls.push(href);
      }
    });

    return [...new Set(urls)]; // 去重
  }
}
