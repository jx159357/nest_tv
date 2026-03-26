import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  CollectedSourceSummary,
  DataCollectionService,
} from '../data-collection/data-collection.service';
import { PlaySourceService } from '../play-sources/play-source.service';

export interface DailySourceValidationSummary {
  checked: number;
  active: number;
  inactive: number;
}

export interface DailySourceCollectionRunSummary {
  status: 'idle' | 'running' | 'success' | 'error' | 'skipped';
  trigger: 'scheduled' | 'manual';
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  totalAttempted: number;
  totalSucceeded: number;
  totalFailed: number;
  totalSkippedNoPlayableUrls: number;
  totalCreatedMedia: number;
  totalCreatedPlaySources: number;
  totalSkippedPlaySources: number;
  sourceSummaries: CollectedSourceSummary[];
  validationSummary?: DailySourceValidationSummary;
  message?: string;
}

@Injectable()
export class DailySourceCollectionService {
  private readonly logger = new Logger(DailySourceCollectionService.name);
  private isRunning = false;
  private lastRunSummary: DailySourceCollectionRunSummary = {
    status: 'idle',
    trigger: 'manual',
    totalAttempted: 0,
    totalSucceeded: 0,
    totalFailed: 0,
    totalSkippedNoPlayableUrls: 0,
    totalCreatedMedia: 0,
    totalCreatedPlaySources: 0,
    totalSkippedPlaySources: 0,
    sourceSummaries: [],
    message: '尚未执行每日播放源采集任务',
  };

  constructor(
    private readonly dataCollectionService: DataCollectionService,
    private readonly playSourceService: PlaySourceService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async collectStablePlaySourcesDaily(): Promise<void> {
    await this.runCollection('scheduled');
  }

  getLastRunSummary(): DailySourceCollectionRunSummary {
    return { ...this.lastRunSummary, sourceSummaries: [...this.lastRunSummary.sourceSummaries] };
  }

  async runCollection(trigger: 'scheduled' | 'manual'): Promise<DailySourceCollectionRunSummary> {
    if (!this.isCollectionEnabled()) {
      this.lastRunSummary = {
        status: 'skipped',
        trigger,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
        totalAttempted: 0,
        totalSucceeded: 0,
        totalFailed: 0,
        totalSkippedNoPlayableUrls: 0,
        totalCreatedMedia: 0,
        totalCreatedPlaySources: 0,
        totalSkippedPlaySources: 0,
        sourceSummaries: [],
        message: '已通过配置禁用每日播放源采集任务',
      };
      return this.getLastRunSummary();
    }

    if (this.isRunning) {
      return {
        ...this.getLastRunSummary(),
        message: '每日播放源采集任务正在运行中',
      };
    }

    const startedAt = new Date();
    const sources = this.dataCollectionService.getDailyCollectionSources();
    const sourceHealthSummaries = await this.dataCollectionService.getSourceHealthSummaries();
    const healthMap = new Map(sourceHealthSummaries.map(summary => [summary.name, summary]));
    const orderedSources = [...sources].sort((left, right) => {
      const leftScore = healthMap.get(left.name)?.qualityScore || 0;
      const rightScore = healthMap.get(right.name)?.qualityScore || 0;
      return rightScore - leftScore;
    });

    if (orderedSources.length === 0) {
      this.logger.log('没有启用的数据采集源，跳过每日播放源采集任务');
      this.lastRunSummary = {
        status: 'skipped',
        trigger,
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 0,
        totalAttempted: 0,
        totalSucceeded: 0,
        totalFailed: 0,
        totalSkippedNoPlayableUrls: 0,
        totalCreatedMedia: 0,
        totalCreatedPlaySources: 0,
        totalSkippedPlaySources: 0,
        sourceSummaries: [],
        message: '没有启用的数据采集源，已跳过任务',
      };
      return this.getLastRunSummary();
    }

    this.isRunning = true;
    this.lastRunSummary = {
      status: 'running',
      trigger,
      startedAt: startedAt.toISOString(),
      totalAttempted: 0,
      totalSucceeded: 0,
      totalFailed: 0,
      totalSkippedNoPlayableUrls: 0,
      totalCreatedMedia: 0,
      totalCreatedPlaySources: 0,
      totalSkippedPlaySources: 0,
      sourceSummaries: [],
      message: `开始执行每日播放源采集任务，数据源数量: ${orderedSources.length}`,
    };

    this.logger.log(`开始每日播放源采集任务，数据源数量: ${orderedSources.length}`);

    let totalAttempted = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;
    let totalSkippedNoPlayableUrls = 0;
    let totalCreatedMedia = 0;
    let totalCreatedPlaySources = 0;
    let totalSkippedPlaySources = 0;
    const sourceSummaries: CollectedSourceSummary[] = [];

    try {
      for (const source of orderedSources) {
        try {
          const perSourceLimit = this.getEffectivePerSourceLimit(
            source.collectionPolicy.dailyLimit,
            healthMap.get(source.name)?.qualityScore,
          );
          const summary = await this.dataCollectionService.collectPopularResources(
            source.name,
            perSourceLimit,
          );

          sourceSummaries.push(summary);
          totalAttempted += summary.attempted;
          totalSucceeded += summary.succeeded;
          totalFailed += summary.failed;
          totalSkippedNoPlayableUrls += summary.skippedNoPlayableUrls;
          totalCreatedMedia += summary.createdMedia;
          totalCreatedPlaySources += summary.createdPlaySources;
          totalSkippedPlaySources += summary.skippedPlaySources;

          if (summary.errors.length > 0) {
            this.logger.warn(`${source.name} 采集出现错误: ${summary.errors.join('; ')}`);
          }
        } catch (error: unknown) {
          this.logger.error(
            `${source.name} 每日播放源采集失败: ${error instanceof Error ? error.message : '未知错误'}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }

      const validationSummary = await this.playSourceService.validateRecentSources(
        this.getValidationLimit(),
      );

      const durationMs = Date.now() - startedAt.getTime();

      this.logger.log(
        `每日播放源采集完成: 尝试 ${totalAttempted}，成功 ${totalSucceeded}，失败 ${totalFailed}，` +
          `因无可播链接跳过 ${totalSkippedNoPlayableUrls}，新建媒体 ${totalCreatedMedia}，` +
          `新建播放源 ${totalCreatedPlaySources}，跳过重复 ${totalSkippedPlaySources}；` +
          `校验播放源 ${validationSummary.checked}，有效 ${validationSummary.active}，失效 ${validationSummary.inactive}`,
      );

      this.lastRunSummary = {
        status: 'success',
        trigger,
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
        durationMs,
        totalAttempted,
        totalSucceeded,
        totalFailed,
        totalSkippedNoPlayableUrls,
        totalCreatedMedia,
        totalCreatedPlaySources,
        totalSkippedPlaySources,
        sourceSummaries,
        validationSummary,
        message: '每日播放源采集任务执行完成',
      };
    } catch (error: unknown) {
      this.lastRunSummary = {
        status: 'error',
        trigger,
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt.getTime(),
        totalAttempted,
        totalSucceeded,
        totalFailed,
        totalSkippedNoPlayableUrls,
        totalCreatedMedia,
        totalCreatedPlaySources,
        totalSkippedPlaySources,
        sourceSummaries,
        message: error instanceof Error ? error.message : '未知错误',
      };
      this.logger.error(
        `每日播放源采集任务执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      this.isRunning = false;
    }

    return this.getLastRunSummary();
  }

  private isCollectionEnabled(): boolean {
    return this.configService.get<string>('DAILY_SOURCE_COLLECTION_ENABLED', 'true') !== 'false';
  }

  private getPerSourceLimit(): number {
    return parseInt(this.configService.get<string>('DAILY_SOURCE_PER_SOURCE_LIMIT', '8'), 10);
  }

  private getValidationLimit(): number {
    return parseInt(this.configService.get<string>('DAILY_SOURCE_VALIDATION_LIMIT', '80'), 10);
  }

  private getEffectivePerSourceLimit(baseLimit: number, qualityScore?: number): number {
    const configuredLimit = Math.max(baseLimit || this.getPerSourceLimit(), 1);

    if (qualityScore === undefined || qualityScore >= 80) {
      return configuredLimit;
    }

    if (qualityScore >= 50) {
      return Math.max(Math.ceil(configuredLimit * 0.75), 1);
    }

    return Math.max(Math.ceil(configuredLimit * 0.5), 1);
  }
}
