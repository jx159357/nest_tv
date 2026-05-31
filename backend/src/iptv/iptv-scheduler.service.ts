import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StreamQualityTester } from './stream-quality-tester.service';
import { IptvSourceCollector } from './iptv-source-collector.service';
import { ChannelLogoService } from './channel-logo.service';

@Injectable()
export class IptvScheduler {
  private readonly logger = new Logger(IptvScheduler.name);
  private isRunning = false;

  constructor(
    private readonly qualityTester: StreamQualityTester,
    private readonly sourceCollector: IptvSourceCollector,
    private readonly logoService: ChannelLogoService,
  ) {}

  /**
   * 每天凌晨2点执行频道质量测试
   */
  @Cron('0 2 * * *')
  async handleQualityTest() {
    if (this.isRunning) {
      this.logger.log('IPTV定时任务正在执行中，跳过本次');
      return;
    }

    this.isRunning = true;
    this.logger.log('开始执行IPTV频道质量定时测试');

    try {
      // 测试所有活跃频道
      const result = await this.qualityTester.testAllActiveChannels();
      this.logger.log(
        `频道质量测试完成: ${result.available} 可用, ${result.unavailable} 不可用, 耗时 ${result.duration}ms`,
      );

      // 禁用低质量频道
      const disabledCount = await this.qualityTester.disableLowQualityChannels(30);
      if (disabledCount > 0) {
        this.logger.log(`已禁用 ${disabledCount} 个低质量频道`);
      }
    } catch (error: unknown) {
      this.logger.error(`频道质量测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 每天凌晨4点执行直播源收集
   */
  @Cron('0 4 * * *')
  async handleSourceCollection() {
    if (this.isRunning) {
      this.logger.log('IPTV定时任务正在执行中，跳过本次');
      return;
    }

    this.isRunning = true;
    this.logger.log('开始执行直播源自动收集');

    try {
      const result = await this.sourceCollector.collectFromAllSources();
      this.logger.log(
        `直播源收集完成: ${result.successSources} 成功, ${result.failedSources} 失败, ` +
          `共 ${result.totalChannels} 个频道, ${result.newChannels} 个新增`,
      );
    } catch (error: unknown) {
      this.logger.error(`直播源收集失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 每周日凌晨3点执行台标匹配
   */
  @Cron('0 3 * * 0')
  async handleLogoMatch() {
    this.logger.log('开始执行台标自动匹配');

    try {
      const results = await this.logoService.matchLogosForChannels();
      const matchedCount = results.filter(r => r.matched).length;
      this.logger.log(`台标匹配完成: ${matchedCount}/${results.length} 个频道匹配成功`);
    } catch (error: unknown) {
      this.logger.error(`台标匹配失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 每6小时测试问题频道
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleProblematicChannels() {
    this.logger.log('开始测试问题频道');

    try {
      const result = await this.qualityTester.testProblematicChannels();
      this.logger.log(`问题频道测试完成: ${result.available} 可用, ${result.unavailable} 不可用`);
    } catch (error: unknown) {
      this.logger.error(`问题频道测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 手动触发所有定时任务
   */
  async triggerAll(): Promise<{
    qualityTest: { total: number; available: number; unavailable: number; duration: number };
    sourceCollection: { totalSources: number; successSources: number; newChannels: number };
    logoMatch: { total: number; matched: number };
  }> {
    this.logger.log('手动触发所有IPTV定时任务');

    const qualityTest = await this.qualityTester.testAllActiveChannels();
    const sourceCollection = await this.sourceCollector.collectFromAllSources();
    const logoResults = await this.logoService.matchLogosForChannels();

    return {
      qualityTest: {
        total: qualityTest.total,
        available: qualityTest.available,
        unavailable: qualityTest.unavailable,
        duration: qualityTest.duration,
      },
      sourceCollection: {
        totalSources: sourceCollection.totalSources,
        successSources: sourceCollection.successSources,
        newChannels: sourceCollection.newChannels,
      },
      logoMatch: {
        total: logoResults.length,
        matched: logoResults.filter(r => r.matched).length,
      },
    };
  }

  /**
   * 获取任务状态
   */
  getStatus(): {
    isRunning: boolean;
    nextQualityTest: string;
    nextSourceCollection: string;
    nextLogoMatch: string;
  } {
    return {
      isRunning: this.isRunning,
      nextQualityTest: '每天凌晨2点',
      nextSourceCollection: '每天凌晨4点',
      nextLogoMatch: '每周日凌晨3点',
    };
  }
}
