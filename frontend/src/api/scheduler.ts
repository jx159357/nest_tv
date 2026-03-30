import ApiClient from './index';

export interface DailySourceValidationSummary {
  checked: number;
  active: number;
  inactive: number;
}

export interface DailySourceCollectionSourceSummary {
  sourceName: string;
  effectiveDailyLimit?: number;
  attempted: number;
  succeeded: number;
  failed: number;
  createdMedia: number;
  createdPlaySources: number;
  skippedNoPlayableUrls?: number;
  skippedPlaySources: number;
  urls: string[];
  errors: string[];
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
  sourceSummaries: DailySourceCollectionSourceSummary[];
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

export const schedulerApi = {
  getDailySourceCollectionSummary: () =>
    ApiClient.get<DailySourceCollectionRunSummary>(
      '/scheduler/daily-source-collection/summary',
      undefined,
      false,
    ),

  getDailySourceCollectionDashboard: () =>
    ApiClient.get<DailySourceCollectionDashboardSummary>(
      '/scheduler/daily-source-collection/dashboard',
      undefined,
      false,
    ),

  runDailySourceCollection: () =>
    ApiClient.post<DailySourceCollectionRunSummary>('/scheduler/daily-source-collection/run', {}),
};
