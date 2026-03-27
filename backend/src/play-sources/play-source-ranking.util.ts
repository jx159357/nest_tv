import { PlaySource, PlaySourceStatus, PlaySourceType } from '../entities/play-source.entity';

const PLAY_SOURCE_TYPE_RANK: Record<PlaySourceType, number> = {
  [PlaySourceType.STREAM]: 8,
  [PlaySourceType.ONLINE]: 7,
  [PlaySourceType.IPTV]: 6,
  [PlaySourceType.PARSER]: 5,
  [PlaySourceType.THIRD_PARTY]: 4,
  [PlaySourceType.WEBDISK]: 3,
  [PlaySourceType.MAGNET]: 2,
  [PlaySourceType.DOWNLOAD]: 1,
};

const PLAY_SOURCE_STATUS_RANK: Record<PlaySourceStatus, number> = {
  [PlaySourceStatus.ACTIVE]: 4,
  [PlaySourceStatus.CHECKING]: 3,
  [PlaySourceStatus.INACTIVE]: 2,
  [PlaySourceStatus.ERROR]: 1,
};

export const DEFAULT_PLAY_SOURCE_FRESH_HOURS = 12;

export function isPlaySourceFresh(
  playSource: Pick<PlaySource, 'lastCheckedAt'>,
  freshnessHours: number = DEFAULT_PLAY_SOURCE_FRESH_HOURS,
  now: Date = new Date(),
): boolean {
  if (!playSource.lastCheckedAt) {
    return false;
  }

  return now.getTime() - playSource.lastCheckedAt.getTime() <= freshnessHours * 60 * 60 * 1000;
}

export function comparePlaySources(
  left: PlaySource,
  right: PlaySource,
  now: Date = new Date(),
): number {
  return (
    compareNumbers(getAvailabilityRank(right), getAvailabilityRank(left)) ||
    compareNumbers(getTypeRank(right), getTypeRank(left)) ||
    compareNumbers(getFreshnessRank(right, now), getFreshnessRank(left, now)) ||
    compareNumbers(getAdsRank(left), getAdsRank(right)) ||
    compareNumbers(getPriorityValue(left), getPriorityValue(right)) ||
    compareNumbers(right.playCount ?? 0, left.playCount ?? 0) ||
    compareNumbers(getTimestamp(right.lastCheckedAt), getTimestamp(left.lastCheckedAt)) ||
    compareNumbers(getTimestamp(right.createdAt), getTimestamp(left.createdAt)) ||
    compareNumbers(left.id ?? Number.MAX_SAFE_INTEGER, right.id ?? Number.MAX_SAFE_INTEGER)
  );
}

function getAvailabilityRank(playSource: PlaySource): number {
  const statusRank = PLAY_SOURCE_STATUS_RANK[playSource.status] ?? 0;
  return statusRank * 10 + (playSource.isActive ? 5 : 0);
}

function getTypeRank(playSource: PlaySource): number {
  return PLAY_SOURCE_TYPE_RANK[playSource.type] ?? 0;
}

function getFreshnessRank(playSource: PlaySource, now: Date): number {
  if (!playSource.lastCheckedAt) {
    return 0;
  }

  if (isPlaySourceFresh(playSource, DEFAULT_PLAY_SOURCE_FRESH_HOURS, now)) {
    return 2;
  }

  return 1;
}

function getAdsRank(playSource: PlaySource): number {
  return playSource.isAds ? 1 : 0;
}

function getPriorityValue(playSource: PlaySource): number {
  return typeof playSource.priority === 'number' ? playSource.priority : Number.MAX_SAFE_INTEGER;
}

function getTimestamp(value?: Date): number {
  return value?.getTime() ?? 0;
}

function compareNumbers(left: number, right: number): number {
  if (left === right) {
    return 0;
  }

  return left > right ? 1 : -1;
}
