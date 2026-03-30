import type { CollectionSourceStatistics } from '@/api/crawler';

export type AttentionSeverity = 'critical' | 'high' | 'medium';
export type CrawlerAlertFilter = 'critical' | 'high' | 'stalled' | 'inactive';
export type AlertActionTarget = 'crawler' | 'play-sources';

export interface AttentionSourceItem {
  source: CollectionSourceStatistics;
  severity: AttentionSeverity;
  score: number;
  reasons: string[];
  highlights: string[];
  recommendedAction: {
    target: AlertActionTarget;
    label: string;
    description: string;
  };
}

export const getAlertFilterRecommendedAction = (filter: CrawlerAlertFilter) => {
  const actionMap: Record<
    CrawlerAlertFilter,
    {
      target: AlertActionTarget;
      label: string;
      description: string;
    }
  > = {
    critical: {
      target: 'play-sources',
      label: '建议先看播放源视图',
      description: '高风险来源通常先要确认失效链接和活跃源恢复情况。',
    },
    high: {
      target: 'crawler',
      label: '建议先看来源视图',
      description: '优先处理往往需要先确认采集链路和来源质量是否异常。',
    },
    stalled: {
      target: 'crawler',
      label: '建议先看来源视图',
      description: '入库停滞通常优先排查采集策略、页面结构和抓取链路。',
    },
    inactive: {
      target: 'play-sources',
      label: '建议先看播放源视图',
      description: '无活跃源时优先检查播放链接本身的失效和校验结果。',
    },
  };

  return actionMap[filter];
};

export const getHoursSince = (timestamp?: string | null) => {
  if (!timestamp) {
    return null;
  }

  const parsed = new Date(timestamp).getTime();
  if (Number.isNaN(parsed)) {
    return null;
  }

  return (Date.now() - parsed) / (1000 * 60 * 60);
};

export const buildAttentionSourceItem = (
  source: CollectionSourceStatistics,
): AttentionSourceItem | null => {
  const reasons: string[] = [];
  const highlights: string[] = [];
  let score = 0;

  if (source.dailyEnabled && source.totalCrawled === 0) {
    reasons.push('已启用日采集但暂无入库媒体');
    score += 5;
  }

  if (source.totalPlaySources > 0 && source.activePlaySources === 0) {
    reasons.push('存在播放源但当前无活跃源');
    highlights.push('0 活跃源');
    score += 6;
  }

  if (source.qualityScore < 55) {
    reasons.push(`质量分偏低（${source.qualityScore}）`);
    highlights.push(`质量 ${source.qualityScore}`);
    score += 5;
  } else if (source.qualityScore < 70) {
    reasons.push(`质量分待提升（${source.qualityScore}）`);
    highlights.push(`质量 ${source.qualityScore}`);
    score += 3;
  } else if (source.qualityScore < 75) {
    reasons.push(`质量分待提升（${source.qualityScore}）`);
    score += 2;
  }

  if (source.extractionCoverage < 40) {
    reasons.push(`提取覆盖偏低（${source.extractionCoverage}%）`);
    highlights.push(`提取 ${source.extractionCoverage}%`);
    score += 3;
  } else if (source.extractionCoverage < 60) {
    reasons.push(`提取覆盖待提升（${source.extractionCoverage}%）`);
    highlights.push(`提取 ${source.extractionCoverage}%`);
    score += 2;
  }

  if (source.activeRate < 35) {
    reasons.push(`可用率偏低（${source.activeRate}%）`);
    highlights.push(`可用率 ${source.activeRate}%`);
    score += 5;
  } else if (source.activeRate < 50) {
    reasons.push(`可用率偏低（${source.activeRate}%）`);
    highlights.push(`可用率 ${source.activeRate}%`);
    score += 3;
  } else if (source.activeRate < 70) {
    reasons.push(`可用率波动（${source.activeRate}%）`);
    score += 2;
  }

  const hoursSinceLastChecked = getHoursSince(source.lastCheckedAt);
  if (source.totalPlaySources > 0 && hoursSinceLastChecked === null) {
    reasons.push('尚未完成播放源稳定性校验');
    highlights.push('未校验');
    score += 4;
  } else if (hoursSinceLastChecked !== null && hoursSinceLastChecked >= 168) {
    reasons.push(`距上次校验已超过 ${Math.floor(hoursSinceLastChecked)} 小时`);
    highlights.push(`${Math.floor(hoursSinceLastChecked)}h 未校验`);
    score += 4;
  } else if (hoursSinceLastChecked !== null && hoursSinceLastChecked >= 72) {
    reasons.push(`距上次校验已超过 ${Math.floor(hoursSinceLastChecked)} 小时`);
    highlights.push(`${Math.floor(hoursSinceLastChecked)}h 未校验`);
    score += 2;
  }

  const hoursSinceLastCrawled = getHoursSince(source.lastCrawled);
  if (source.dailyEnabled && hoursSinceLastCrawled !== null && hoursSinceLastCrawled >= 168) {
    reasons.push(`最近入库已停滞约 ${Math.floor(hoursSinceLastCrawled)} 小时`);
    highlights.push('入库停滞');
    score += 3;
  }

  if (source.dailyEnabled && !source.lastCrawled) {
    reasons.push('近期没有采集入库记录');
    highlights.push('无入库');
    score += 3;
  }

  if (source.dailyEnabled && source.recentMedia7d === 0 && source.totalCrawled > 0) {
    reasons.push('最近 7 天没有新增媒体');
    highlights.push('7d 0 新增');
    score += 2;
  }

  if (source.activeMedia === 0 && source.totalCrawled > 0) {
    reasons.push('已有入库媒体但当前没有活跃媒体');
    score += 2;
  }

  if (reasons.length === 0) {
    return null;
  }

  const needsCrawlerInvestigation =
    (source.dailyEnabled && source.totalCrawled === 0) ||
    (source.dailyEnabled && (!source.lastCrawled || (hoursSinceLastCrawled ?? 0) >= 168)) ||
    source.qualityScore < 70 ||
    (source.activeMedia === 0 && source.totalCrawled > 0);

  const needsPlaySourceInvestigation =
    (source.totalPlaySources > 0 && source.activePlaySources === 0) ||
    source.activeRate < 50 ||
    (source.totalPlaySources > 0 && (hoursSinceLastChecked === null || hoursSinceLastChecked >= 72));

  const recommendedAction =
    needsPlaySourceInvestigation &&
    (!needsCrawlerInvestigation ||
      source.activePlaySources === 0 ||
      source.activeRate < 35 ||
      (hoursSinceLastChecked ?? 0) >= 168)
      ? {
          target: 'play-sources' as const,
          label: '优先排查播放源',
          description: '先检查失效链接、校验时效和活跃源恢复情况。',
        }
      : {
          target: 'crawler' as const,
          label: '优先检查来源策略',
          description: '先核查采集链路、入库停滞和来源抓取质量。',
        };

  return {
    source,
    reasons: reasons.slice(0, 3),
    highlights: highlights.slice(0, 3),
    score,
    severity: score >= 10 ? 'critical' : score >= 6 ? 'high' : 'medium',
    recommendedAction,
  };
};

export const compareAttentionSources = (left: AttentionSourceItem, right: AttentionSourceItem) => {
  return (
    right.score - left.score ||
    (getHoursSince(right.source.lastCheckedAt) ?? -1) -
      (getHoursSince(left.source.lastCheckedAt) ?? -1) ||
    left.source.qualityScore - right.source.qualityScore ||
    left.source.activeRate - right.source.activeRate
  );
};

export const matchesCrawlerAlertFilter = (
  source: CollectionSourceStatistics,
  filter: CrawlerAlertFilter,
) => {
  const attentionItem = buildAttentionSourceItem(source);

  if (filter === 'critical') {
    return attentionItem?.severity === 'critical';
  }

  if (filter === 'high') {
    return attentionItem?.severity === 'high';
  }

  if (filter === 'inactive') {
    return source.totalPlaySources > 0 && source.activePlaySources === 0;
  }

  const hoursSinceLastCrawled = getHoursSince(source.lastCrawled);
  return source.dailyEnabled && (hoursSinceLastCrawled === null || hoursSinceLastCrawled >= 168);
};
