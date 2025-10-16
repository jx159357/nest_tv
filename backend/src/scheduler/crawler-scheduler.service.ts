import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CrawlerService } from '../crawler/crawler.service';
import { CRAWLER_TARGETS } from '../crawler/crawler.config';
import { MediaResourceService } from '../media/media-resource.service';
import { AppLoggerService } from '../common/services/app-logger.service';

/**
 * 爬虫任务结果接口
 */
interface CrawlTaskResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  savedCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * 爬虫定时任务服务
 * 负责定时从各个网站爬取最新的影视资源
 */
@Injectable()
export class CrawlerSchedulerService {
  private readonly logger = new Logger(CrawlerSchedulerService.name);
  private readonly retryAttempts = 3;
  private readonly retryDelay = 5000; // 5秒重试延迟
  private readonly timeout = 30000; // 30秒超时

  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly mediaResourceService: MediaResourceService,
    private readonly appLogger: AppLoggerService,
  ) {}

  /**
   * 每6小时执行一次电影天堂爬虫任务
   * 爬取最新的电影资源并保存到数据库
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleMovieHeavenCrawl() {
    const targetName = '电影天堂';
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      this.appLogger.setContext(requestId, {
        module: 'CRAWLER_SCHEDULER',
        function: 'handleMovieHeavenCrawl',
        requestId,
      });

      this.logger.log(`开始执行电影天堂定时爬取任务`);
      this.appLogger.log(`开始定时爬取任务: ${targetName}`, 'CRAWLER_SCHEDULE_START');

      // 执行带重试机制的爬取任务
      const result = await this.executeWithRetry(
        () => this.crawlTargetWithTimeout(targetName),
        targetName,
        requestId,
      );

      const duration = Date.now() - startTime;
      const summaryMessage = `电影天堂定时爬取完成: 总计${result.successCount + result.failureCount}个，成功${result.successCount}个，失败${result.failureCount}个，保存${result.savedCount}个，耗时${duration}ms`;

      this.logger.log(summaryMessage);

      if (result.errors.length > 0) {
        this.logger.warn(`爬取过程中遇到错误: ${result.errors.join('; ')}`);
      }

      this.appLogger.logOperation(
        'CRAWLER_SCHEDULE_COMPLETE',
        targetName,
        undefined,
        {
          targetName,
          totalUrls: result.successCount + result.failureCount,
          successCount: result.successCount,
          failureCount: result.failureCount,
          savedCount: result.savedCount,
          errors: result.errors,
          warnings: result.warnings,
          duration,
          crawlTime: new Date().toISOString(),
        },
        result.errors.length > 0 ? 'warning' : 'success',
        requestId,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = `电影天堂定时爬取任务失败: ${error.message}`;
      this.logger.error(errorMessage, error.stack);

      this.appLogger.logOperation(
        'CRAWLER_SCHEDULE_ERROR',
        targetName,
        undefined,
        {
          targetName,
          error: error.message,
          stack: error.stack,
          duration,
          crawlTime: new Date().toISOString(),
        },
        'error',
        requestId,
      );
    } finally {
      this.appLogger.clearContext(requestId);
    }
  }

  /**
   * 每天凌晨2点执行一次全量爬虫任务
   * 爬取所有启用的数据源
   */
  @Cron('0 2 * * *') // 每天凌晨2点
  async handleFullCrawl() {
    this.logger.log('开始执行全量爬取任务');
    this.appLogger.log('开始全量爬取任务', 'CRAWLER_FULL_SCHEDULE_START');

    const enabledTargets = CRAWLER_TARGETS.filter(t => t.enabled);
    let totalSuccess = 0;
    let totalFailure = 0;

    for (const target of enabledTargets) {
      try {
        this.logger.log(`正在爬取目标: ${target.name}`);

        // 为每个目标执行爬取
        const result = await this.crawlTarget(target);

        if (result.success) {
          totalSuccess += result.successCount;
          totalFailure += result.failureCount;
        } else {
          totalFailure++;
        }
      } catch (error) {
        this.logger.error(`爬取目标 ${target.name} 失败: ${error.message}`);
        totalFailure++;
      }

      // 目标间的延迟
      await this.delay(5000); // 5秒间隔
    }

    this.logger.log(`全量爬取任务完成: 成功${totalSuccess}个，失败${totalFailure}个`);
    this.appLogger.log(
      `全量爬取完成: 成功${totalSuccess}, 失败${totalFailure}`,
      'CRAWLER_FULL_SCHEDULE_COMPLETE',
    );
  }

  /**
   * 爬取单个目标
   */
  private async crawlTarget(
    target: any,
  ): Promise<{ success: boolean; successCount: number; failureCount: number }> {
    try {
      const crawlUrls = await this.discoverCrawlUrls(target.baseUrl, target.name);
      const maxCrawlCount = 5; // 每个目标最多爬取5个
      const urlsToCrawl = crawlUrls.slice(0, maxCrawlCount);

      let successCount = 0;
      let failureCount = 0;

      for (const url of urlsToCrawl) {
        try {
          const result = await this.crawlerService.crawlWebsite(target.name, url);

          if (result.success && result.data) {
            try {
              await this.saveToDatabase(result.data, target.name);
              successCount++;
            } catch (saveError) {
              this.logger.warn(`保存失败: ${saveError.message}`);
              successCount++;
            }
          } else {
            failureCount++;
          }

          await this.delay(target.requestDelay || 2000);
        } catch (error) {
          failureCount++;
          this.logger.warn(`单个URL爬取失败: ${error.message}`);
        }
      }

      return { success: true, successCount, failureCount };
    } catch (error) {
      this.logger.error(`爬取目标 ${target.name} 失败: ${error.message}`);
      return { success: false, successCount: 0, failureCount: 1 };
    }
  }

  /**
   * 发现可爬取的URL列表
   */
  private async discoverCrawlUrls(baseUrl: string, targetName: string): Promise<string[]> {
    try {
      // 根据不同的目标网站实现不同的URL发现逻辑

      if (targetName === '电影天堂') {
        // 电影天堂的URL发现逻辑
        const commonPaths = [
          '/html/gndy/dyzz/index.html', // 最新电影
          '/html/gndy/jddy/index.html', // 经典电影
          '/html/tv/hytv/index.html', // 电视剧
          '/html/dongman/index.html', // 动漫
        ];

        const urls: string[] = [];

        for (const path of commonPaths) {
          urls.push(new URL(path, baseUrl).href);
        }

        return urls;
      }

      if (targetName === '阳光电影') {
        // 阳光电影的URL发现逻辑
        const commonPaths = [
          '/html/gndy/dyzz/index.html', // 电影
          '/html/tv/hytv/index.html', // 电视剧
          '/html/dongman/index.html', // 动漫
          '/html/zongyi/index.html', // 综艺
          '/html/jilup/index.html', // 记录片
        ];

        const urls: string[] = [];

        for (const path of commonPaths) {
          urls.push(new URL(path, baseUrl).href);
        }

        return urls;
      }

      if (targetName === '人人影视') {
        // 人人影视的URL发现逻辑
        const commonPaths = [
          '/html/gndy/dyzz/index.html', // 电影
          '/html/tv/hytv/index.html', // 电视剧
          '/html/dongman/index.html', // 动漫
          '/html/zongyi/index.html', // 综艺
          '/html/jilup/index.html', // 纪录片
        ];

        const urls: string[] = [];

        for (const path of commonPaths) {
          urls.push(new URL(path, baseUrl).href);
        }

        return urls;
      }

      // 通用URL发现逻辑
      const commonPaths = ['/', '/latest', '/new', '/movies', '/tv', '/anime', '/variety'];

      return commonPaths.map(path => new URL(path, baseUrl).href);
    } catch (error) {
      this.logger.error(`发现URL失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 保存数据到数据库
   */
  private async saveToDatabase(data: any, source: string): Promise<void> {
    if (!data || !data.title) {
      throw new Error('无效的爬取数据：缺少标题');
    }

    // 检查是否已存在相同标题的资源（模糊匹配）
    const existingMedia = await this.mediaResourceService.findByTitle(data.title);
    if (existingMedia) {
      this.logger.log(`资源已存在，跳过: ${data.title}`);
      return;
    }

    // 转换数据格式
    const mediaData = {
      title: data.title.trim(),
      description: (data.description || '').trim().substring(0, 1000), // 限制描述长度
      type: this.mapMediaType(data.type) as any,
      director: (data.director || '').trim(),
      actors: (data.actors || '').trim(),
      genres: this.arrayFromString(data.genres),
      releaseDate: data.releaseDate ? new Date(data.releaseDate) : undefined,
      quality: this.mapQuality(data.quality) as any,
      poster: (data.poster || '').trim(),
      backdrop: (data.backdrop || '').trim(),
      rating: this.parseRating(data.rating),
      viewCount: 0,
      isActive: true,
      source: source,
      metadata: {
        ...data.metadata,
        crawledAt: new Date(),
        source,
      },
      duration: data.duration ? parseInt(data.duration) : undefined,
      episodeCount: data.episodeCount ? parseInt(data.episodeCount) : undefined,
      downloadUrls: Array.isArray(data.downloadUrls)
        ? data.downloadUrls.filter(url => url && url.trim().length > 0)
        : [],
    };

    // 保存到数据库
    await this.mediaResourceService.create(mediaData);
    this.logger.log(`成功保存资源: ${data.title}`);
  }

  /**
   * 映射媒体类型
   */
  private mapMediaType(type: string): string {
    const typeMap: Record<string, string> = {
      电影: 'movie',
      电视剧: 'tv_series',
      综艺: 'variety',
      动漫: 'anime',
      纪录片: 'documentary',
      movie: 'movie',
      tv_series: 'tv_series',
      variety: 'variety',
      anime: 'anime',
      documentary: 'documentary',
    };

    return typeMap[type] || 'movie';
  }

  /**
   * 映射质量
   */
  private mapQuality(quality: string): string {
    const qualityMap: Record<string, string> = {
      高清: 'hd',
      超清: 'full_hd',
      蓝光: 'blue_ray',
      标清: 'sd',
      hd: 'hd',
      full_hd: 'full_hd',
      blue_ray: 'blue_ray',
      sd: 'sd',
    };

    return qualityMap[quality] || 'hd';
  }

  /**
   * 解析评分
   */
  private parseRating(rating: any): number {
    if (typeof rating === 'number') {
      return Math.max(0, Math.min(10, rating));
    }

    if (typeof rating === 'string') {
      const parsed = parseFloat(rating);
      if (!isNaN(parsed)) {
        return Math.max(0, Math.min(10, parsed));
      }
    }

    return 7.5; // 默认评分
  }

  /**
   * 从字符串创建数组
   */
  private arrayFromString(str: string | string[]): string[] {
    if (Array.isArray(str)) {
      return str.filter(item => item && item.trim().length > 0);
    }

    if (!str || typeof str !== 'string') {
      return [];
    }

    return str
      .split(/[,，、]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `scheduler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 带重试机制的执行器
   */
  private async executeWithRetry<T>(
    task: () => Promise<T>,
    targetName: string,
    requestId: string,
    maxAttempts: number = this.retryAttempts,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await task();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          const delay = this.retryDelay * attempt; // 递增延迟
          this.logger.warn(
            `${targetName} 爬取失败，第${attempt}次重试，${delay}ms后重试: ${error.message}`,
          );
          await this.delay(delay);
        } else {
          this.logger.error(`${targetName} 爬取失败，已达最大重试次数: ${error.message}`);
        }
      }
    }

    throw lastError || new Error('未知错误');
  }

  /**
   * 带超时的目标爬取
   */
  private async crawlTargetWithTimeout(targetName: string): Promise<CrawlTaskResult> {
    const result: CrawlTaskResult = {
      success: true,
      successCount: 0,
      failureCount: 0,
      savedCount: 0,
      errors: [],
      warnings: [],
    };

    try {
      // 检查爬虫目标是否可用
      const target = CRAWLER_TARGETS.find(t => t.name === targetName && t.enabled);
      if (!target) {
        throw new Error(`爬虫目标未启用或不存在: ${targetName}`);
      }

      // 测试连接（带超时）
      const connectionOk = await Promise.race([
        this.crawlerService.testConnection(targetName),
        new Promise<boolean>((_, reject) =>
          setTimeout(() => reject(new Error('连接测试超时')), 10000),
        ),
      ]);

      if (!connectionOk) {
        throw new Error(`无法连接到目标网站: ${targetName}`);
      }

      // 获取首页URL列表进行爬取（带超时）
      const crawlUrls = await Promise.race([
        this.discoverCrawlUrls(target.baseUrl, targetName),
        new Promise<string[]>((_, reject) =>
          setTimeout(() => reject(new Error('URL发现超时')), 15000),
        ),
      ]);

      if (crawlUrls.length === 0) {
        result.warnings.push('未发现可爬取的URL列表');
        return result;
      }

      this.logger.log(`发现 ${crawlUrls.length} 个URL进行爬取`);

      // 限制爬取数量，避免过于频繁的请求
      const maxCrawlCount = 10; // 每次最多爬取10个
      const urlsToCrawl = crawlUrls.slice(0, maxCrawlCount);

      // 批量爬取（带超时）
      for (let i = 0; i < urlsToCrawl.length; i++) {
        const url = urlsToCrawl[i];

        try {
          this.logger.log(`正在爬取 (${i + 1}/${urlsToCrawl.length}): ${url}`);

          const crawlResult = await Promise.race([
            this.crawlerService.crawlWebsite(targetName, url),
            new Promise<any>((_, reject) =>
              setTimeout(() => reject(new Error('单个URL爬取超时')), this.timeout),
            ),
          ]);

          if (crawlResult.success && crawlResult.data) {
            // 尝试保存到数据库（带重试）
            try {
              await this.saveToDatabaseWithRetry(crawlResult.data, targetName);
              result.savedCount++;
              result.successCount++;
              this.logger.log(`成功爬取并保存: ${crawlResult.data.title}`);
            } catch (saveError) {
              result.warnings.push(
                `爬取成功但保存失败 (${crawlResult.data.title}): ${saveError.message}`,
              );
              result.successCount++; // 爬取仍然算成功，只是保存失败
            }
          } else {
            result.failureCount++;
            result.errors.push(`爬取失败 (${url}): ${crawlResult.error}`);
          }

          // 遵守爬虫的请求延迟
          if (target.requestDelay && i < urlsToCrawl.length - 1) {
            await this.delay(target.requestDelay);
          }
        } catch (error) {
          result.failureCount++;
          result.errors.push(`爬取过程出错 (${url}): ${error.message}`);
        }
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`目标爬取失败: ${error.message}`);
      return result;
    }
  }

  /**
   * 带重试机制的数据保存
   */
  private async saveToDatabaseWithRetry(
    data: any,
    source: string,
    maxAttempts: number = 3,
  ): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.saveToDatabase(data, source);
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          const delay = this.retryDelay * attempt;
          this.logger.warn(`数据保存失败，第${attempt}次重试，${delay}ms后重试: ${error.message}`);
          await this.delay(delay);
        } else {
          this.logger.error(`数据保存失败，已达最大重试次数: ${error.message}`);
        }
      }
    }

    throw lastError || new Error('保存数据失败');
  }
}
