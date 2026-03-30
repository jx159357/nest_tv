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

export interface DailySourceCollectionRunRecord extends DailySourceCollectionRunSummary {
  id: string;
}

export interface DailySourceCollectionDashboardMetrics {
  totalRuns: number;
  successfulRuns: number;
  errorRuns: number;
  skippedRuns: number;
  manualRuns: number;
  scheduledRuns: number;
  successRate: number;
  averageDurationMs: number;
  averageAttempted: number;
  averageCreatedMedia: number;
  averageCreatedPlaySources: number;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  failureStreak: number;
}

export interface DailySourceCollectionIssueSource {
  sourceName: string;
  affectedRuns: number;
  totalFailed: number;
  totalErrors: number;
  latestStatus: DailySourceCollectionRunSummary['status'];
  latestRunAt?: string;
  latestError?: string;
}

export interface DailySourceCollectionDashboardSummary {
  current: DailySourceCollectionRunSummary;
  history: DailySourceCollectionRunRecord[];
  metrics: DailySourceCollectionDashboardMetrics;
  issueSources: DailySourceCollectionIssueSource[];
}

@Injectable()
export class DailySourceCollectionService {
  private readonly logger = new Logger(DailySourceCollectionService.name);
  private readonly historyLimit = 12;
  private isRunning = false;
  private runSequence = 0;
  private runHistory: DailySourceCollectionRunRecord[] = [];
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
    message: 'No daily source collection run has been executed yet.',
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
    return this.cloneRunSummary(this.lastRunSummary);
  }

  getRunHistory(limit = 8): DailySourceCollectionRunRecord[] {
    return this.runHistory.slice(0, limit).map(record => this.cloneRunRecord(record));
  }

  getDashboardSummary(limit = 8): DailySourceCollectionDashboardSummary {
    const history = this.getRunHistory(limit);
    const totalRuns = history.length;
    const successfulRuns = history.filter(run => run.status === 'success').length;
    const errorRuns = history.filter(run => run.status === 'error').length;
    const skippedRuns = history.filter(run => run.status === 'skipped').length;
    const manualRuns = history.filter(run => run.trigger === 'manual').length;
    const scheduledRuns = history.filter(run => run.trigger === 'scheduled').length;
    const finishedRuns = history.filter(run => typeof run.durationMs === 'number');
    const lastSuccessAt = history.find(run => run.status === 'success')?.completedAt;
    const lastErrorAt = history.find(run => run.status === 'error')?.completedAt;

    let failureStreak = 0;
    for (const run of history) {
      if (run.status !== 'error') {
        break;
      }
      failureStreak += 1;
    }

    const issueSourceMap = new Map<string, DailySourceCollectionIssueSource>();
    for (const run of history) {
      for (const summary of run.sourceSummaries) {
        if (summary.failed <= 0 && summary.errors.length === 0) {
          continue;
        }

        const existing = issueSourceMap.get(summary.sourceName);
        if (!existing) {
          issueSourceMap.set(summary.sourceName, {
            sourceName: summary.sourceName,
            affectedRuns: 1,
            totalFailed: summary.failed,
            totalErrors: summary.errors.length,
            latestStatus: run.status,
            latestRunAt: run.completedAt || run.startedAt,
            latestError: summary.errors[0],
          });
          continue;
        }

        existing.affectedRuns += 1;
        existing.totalFailed += summary.failed;
        existing.totalErrors += summary.errors.length;
      }
    }

    return {
      current: this.getLastRunSummary(),
      history,
      metrics: {
        totalRuns,
        successfulRuns,
        errorRuns,
        skippedRuns,
        manualRuns,
        scheduledRuns,
        successRate: totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0,
        averageDurationMs:
          finishedRuns.length > 0
            ? Math.round(
                finishedRuns.reduce((sum, run) => sum + (run.durationMs || 0), 0) /
                  finishedRuns.length,
              )
            : 0,
        averageAttempted:
          totalRuns > 0
            ? Math.round(history.reduce((sum, run) => sum + run.totalAttempted, 0) / totalRuns)
            : 0,
        averageCreatedMedia:
          totalRuns > 0
            ? Math.round(history.reduce((sum, run) => sum + run.totalCreatedMedia, 0) / totalRuns)
            : 0,
        averageCreatedPlaySources:
          totalRuns > 0
            ? Math.round(
                history.reduce((sum, run) => sum + run.totalCreatedPlaySources, 0) / totalRuns,
              )
            : 0,
        lastSuccessAt,
        lastErrorAt,
        failureStreak,
      },
      issueSources: [...issueSourceMap.values()]
        .sort(
          (left, right) =>
            right.affectedRuns - left.affectedRuns ||
            right.totalErrors - left.totalErrors ||
            right.totalFailed - left.totalFailed,
        )
        .slice(0, 6),
    };
  }

  async runCollection(trigger: 'scheduled' | 'manual'): Promise<DailySourceCollectionRunSummary> {
    if (!this.isCollectionEnabled()) {
      return this.finalizeRun({
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
        message: 'Daily source collection is disabled by configuration.',
      });
    }

    if (this.isRunning) {
      return {
        ...this.getLastRunSummary(),
        message: 'Daily source collection is already running.',
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
      this.logger.log('No enabled collection sources were found, skipping daily collection run.');
      return this.finalizeRun({
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
        message: 'No enabled collection sources were available for this run.',
      });
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
      message: `Daily collection started for ${orderedSources.length} sources.`,
    };

    this.logger.log(`Starting daily source collection for ${orderedSources.length} sources.`);

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
        const effectiveDailyLimit = this.getEffectivePerSourceLimit(
          source.collectionPolicy.dailyLimit,
          healthMap.get(source.name)?.qualityScore,
        );

        try {
          const summary = await this.dataCollectionService.collectPopularResources(
            source.name,
            effectiveDailyLimit,
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
            this.logger.warn(
              `${source.name} collection returned errors: ${summary.errors.join('; ')}`,
            );
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `${source.name} daily collection failed: ${message}`,
            error instanceof Error ? error.stack : undefined,
          );

          sourceSummaries.push({
            sourceName: source.name,
            effectiveDailyLimit,
            attempted: 0,
            succeeded: 0,
            failed: 1,
            skippedNoPlayableUrls: 0,
            createdMedia: 0,
            createdPlaySources: 0,
            skippedPlaySources: 0,
            urls: [],
            errors: [message],
          });
          totalFailed += 1;
        }
      }

      const validationSummary = await this.playSourceService.validateRecentSources(
        this.getValidationLimit(),
      );

      const durationMs = Date.now() - startedAt.getTime();

      this.logger.log(
        `Daily source collection completed: attempted ${totalAttempted}, succeeded ${totalSucceeded}, failed ${totalFailed}, ` +
          `skipped-no-playable ${totalSkippedNoPlayableUrls}, created-media ${totalCreatedMedia}, ` +
          `created-play-sources ${totalCreatedPlaySources}, skipped-play-sources ${totalSkippedPlaySources}, ` +
          `validated ${validationSummary.checked} recent sources.`,
      );

      return this.finalizeRun({
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
        message: 'Daily source collection finished successfully.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Daily source collection run failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );

      return this.finalizeRun({
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
        message,
      });
    } finally {
      this.isRunning = false;
    }
  }

  private cloneRunSummary(
    summary: DailySourceCollectionRunSummary,
  ): DailySourceCollectionRunSummary {
    return {
      ...summary,
      sourceSummaries: summary.sourceSummaries.map(sourceSummary => ({
        ...sourceSummary,
        urls: [...sourceSummary.urls],
        errors: [...sourceSummary.errors],
      })),
      validationSummary: summary.validationSummary ? { ...summary.validationSummary } : undefined,
    };
  }

  private cloneRunRecord(record: DailySourceCollectionRunRecord): DailySourceCollectionRunRecord {
    return {
      ...this.cloneRunSummary(record),
      id: record.id,
    };
  }

  private finalizeRun(summary: DailySourceCollectionRunSummary) {
    this.lastRunSummary = this.cloneRunSummary(summary);
    this.runHistory.unshift({
      ...this.cloneRunSummary(summary),
      id: `${Date.now()}-${this.runSequence++}`,
    });
    this.runHistory = this.runHistory.slice(0, this.historyLimit);
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
