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

  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly mediaResourceService: MediaResourceService,
    private readonly appLogger: AppLoggerService,
  ) {}

  /**
   * 每6小时执行一次定时爬虫任务
   * 爬取最新的影视资源并保存到数据库
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleScheduledCrawl() {
    const targets = CRAWLER_TARGETS.filter(target => target.enabled);
    
    if (targets.length === 0) {
      this.logger.log('没有启用的爬取目标，跳过定时任务');
      return;
    }

    const startTime = Date.now();
    const results: any[] = [];

    try {
      this.logger.log(`开始执行定时爬取任务，共${targets.length}个目标`);

      // 为每个目标执行爬取任务
      for (const target of targets) {
        try {
          this.logger.log(`正在爬取目标: ${target.name}`);
          const result = await this.executeWithRetry(
            () => this.crawlTargetWithTimeout(target.name, target.baseUrl),
            target.name,
          );
          results.push(result);
          this.logger.log(`目标 ${target.name} 爬取完成`);
        } catch (error) {
          this.logger.error(`目标 ${target.name} 爬取失败:`, error);
          // 添加失败结果
          results.push({
            success: false,
            successCount: 0,
            failureCount: 1,
            savedCount: 0,
            errors: [error instanceof Error ? error.message : '未知错误'],
            warnings: []
          });
        }
      }

      const duration = Date.now() - startTime;
      const totalSuccess = results.reduce((sum: number, r: any) => sum + (r.successCount || 0), 0);
      const totalFailure = results.reduce((sum: number, r: any) => sum + (r.failureCount || 0), 0);
      const totalSaved = results.reduce((sum: number, r: any) => sum + (r.savedCount || 0), 0);
      
      const summaryMessage = `定时爬取完成: 总计${totalSuccess + totalFailure}个，成功${totalSuccess}个，失败${totalFailure}个，保存${totalSaved}个，耗时${duration}ms`;

      this.logger.log(summaryMessage);

      const allErrors = results.flatMap(r => r.errors || []);
      if (allErrors.length > 0) {
        this.logger.warn(`爬取过程中遇到错误: ${allErrors.join('; ')}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`定时爬取任务失败: ${errorMessage}`, errorStack);
    }
  }

  /**
   * 带重试机制的执行
   */
  private async executeWithRetry<T>(
    task: () => Promise<T>,
    targetName: string,
    maxRetries: number = 3,
    retryDelay: number = 5000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await task();
      } catch (error: unknown) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        this.logger.warn(`目标 ${targetName} 第${attempt}次尝试失败，${retryDelay}ms后重试`);
        await this.sleep(retryDelay);
      }
    }
    
    throw new Error(`执行任务失败: ${targetName}`);
  }

  /**
   * 爬取指定目标（带超时）
   */
  private async crawlTargetWithTimeout(targetName: string, url: string): Promise<any> {
    try {
      const result = await this.crawlerService.crawlWebsite(targetName, url);
      return {
        success: true,
        successCount: result.success ? 1 : 0,
        failureCount: result.success ? 0 : 1,
        savedCount: result.data ? 1 : 0,
        errors: result.error ? [result.error] : [],
        warnings: []
      };
    } catch (error) {
      return {
        success: false,
        successCount: 0,
        failureCount: 1,
        savedCount: 0,
        errors: [error instanceof Error ? error.message : '未知错误'],
        warnings: []
      };
    }
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 手动触发爬取任务（可用于调试）
   */
  async triggerManualCrawl(targetName?: string): Promise<any> {
    const targets = CRAWLER_TARGETS.filter(target => target.enabled);
    
    if (targets.length === 0) {
      return { success: false, message: '没有启用的爬取目标' };
    }

    const target = targetName 
      ? targets.find(t => t.name === targetName)
      : targets[0];

    if (!target) {
      return { success: false, message: `未找到目标: ${targetName}` };
    }

    try {
      this.logger.log(`开始手动爬取目标: ${target.name}`);
      const result = await this.crawlTargetWithTimeout(target.name, target.baseUrl);
      return { success: true, target: target.name, result };
    } catch (error) {
      this.logger.error(`手动爬取目标 ${target.name} 失败: `, error);
      return { 
        success: false, 
        target: target.name, 
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 测试连接
   */
  async testConnection(targetName?: string): Promise<any> {
    const targets = CRAWLER_TARGETS.filter(target => target.enabled);
    
    if (targets.length === 0) {
      return { success: false, message: '没有启用的爬取目标' };
    }

    if (targetName) {
      const target = targets.find(t => t.name === targetName);
      if (!target) {
        return { success: false, message: `未找到目标: ${targetName}` };
      }

      try {
        await this.crawlerService.testConnection(target.name);
        return { success: true, message: `目标 ${targetName} 连接正常` };
      } catch (error) {
        return { 
          success: false, 
          message: `目标 ${targetName} 连接失败: ${error instanceof Error ? error.message : '未知错误'}`
        };
      }
    } else {
      const results: string[] = [];
      for (const target of targets) {
        try {
          await this.crawlerService.testConnection(target.name);
          results.push(`${target.name}: 正常`);
        } catch (error) {
          results.push(`${target.name}: 失败`);
        }
      }
      
      return { 
        success: true, 
        message: '连接测试完成', 
        targets: results 
      };
    }
  }

  /**
   * 获取爬虫状态
   */
  getCrawlerStatus(): any {
    const targets = CRAWLER_TARGETS;
    return {
      enabled: targets.filter(t => t.enabled).length,
      total: targets.length,
      targets: targets.map(t => ({ name: t.name, enabled: t.enabled || false }))
    };
  }

  /**
   * 启用/禁用爬虫目标
   */
  async toggleTarget(targetName: string, enabled: boolean): Promise<any> {
    const targetIndex = CRAWLER_TARGETS.findIndex(t => t.name === targetName);
    
    if (targetIndex === -1) {
      return { success: false, message: `未找到目标: ${targetName}` };
    }

    CRAWLER_TARGETS[targetIndex].enabled = enabled;
    this.logger.log(`爬虫目标 ${targetName} 已${enabled ? '启用' : '禁用'}`);
    
    return { 
      success: true, 
      message: `爬虫目标 ${targetName} 已${enabled ? '启用' : '禁用'}` 
    };
  }
}