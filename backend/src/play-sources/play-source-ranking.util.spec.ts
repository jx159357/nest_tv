import { PlaySource, PlaySourceStatus, PlaySourceType } from '../entities/play-source.entity';
import { comparePlaySources, isPlaySourceFresh } from './play-source-ranking.util';

describe('play-source-ranking util', () => {
  const now = new Date('2025-01-01T12:00:00.000Z');

  const createSource = (overrides: Partial<PlaySource> = {}): PlaySource =>
    ({
      id: 1,
      url: 'https://example.com/video.m3u8',
      type: PlaySourceType.STREAM,
      status: PlaySourceStatus.ACTIVE,
      priority: 1,
      isAds: false,
      playCount: 0,
      isActive: true,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      mediaResourceId: 1,
      mediaResource: {} as never,
      configuredBy: [],
      ...overrides,
    }) as PlaySource;

  it('prefers directly playable sources over magnet links', () => {
    const streamSource = createSource({
      id: 1,
      type: PlaySourceType.STREAM,
      url: 'https://example.com/video.m3u8',
      lastCheckedAt: new Date('2025-01-01T11:30:00.000Z'),
    });
    const magnetSource = createSource({
      id: 2,
      type: PlaySourceType.MAGNET,
      url: 'magnet:?xt=urn:btih:1234567890abcdef1234567890abcdef12345678',
      lastCheckedAt: new Date('2025-01-01T11:30:00.000Z'),
    });

    const ordered = [magnetSource, streamSource].sort((left, right) =>
      comparePlaySources(left, right, now),
    );

    expect(ordered[0].id).toBe(streamSource.id);
  });

  it('prefers freshly validated sources within the same type', () => {
    const freshSource = createSource({
      id: 1,
      type: PlaySourceType.ONLINE,
      lastCheckedAt: new Date('2025-01-01T10:00:00.000Z'),
    });
    const staleSource = createSource({
      id: 2,
      type: PlaySourceType.ONLINE,
      lastCheckedAt: new Date('2024-12-31T10:00:00.000Z'),
    });

    const ordered = [staleSource, freshSource].sort((left, right) =>
      comparePlaySources(left, right, now),
    );

    expect(ordered[0].id).toBe(freshSource.id);
  });

  it('treats unchecked sources as not fresh', () => {
    expect(isPlaySourceFresh(createSource({ lastCheckedAt: undefined }), 12, now)).toBe(false);
  });
});
