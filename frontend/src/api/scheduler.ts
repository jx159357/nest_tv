import ApiClient from './index';

export interface DailySourceValidationSummary {
  checked: number;
  active: number;
  inactive: number;
}

export interface DailySourceCollectionSourceSummary {
  sourceName: string;
  attempted: number;
  succeeded: number;
  failed: number;
  createdMedia: number;
  createdPlaySources: number;
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

export const schedulerApi = {
  getDailySourceCollectionSummary: () =>
    ApiClient.get<DailySourceCollectionRunSummary>(
      '/scheduler/daily-source-collection/summary',
      undefined,
      false,
    ),

  runDailySourceCollection: () =>
    ApiClient.post<DailySourceCollectionRunSummary>('/scheduler/daily-source-collection/run', {}),
};
