import axios from 'axios';
import { Repository } from 'typeorm';
import { PlaySource, PlaySourceStatus, PlaySourceType } from '../entities/play-source.entity';
import { ParseProvidersService } from '../parse-providers/parse-providers.service';
import { PlaySourceService } from './play-source.service';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    head: jest.fn(),
  },
}));

describe('PlaySourceService', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  let repository: jest.Mocked<Pick<Repository<PlaySource>, 'findOne' | 'save'>>;
  let service: PlaySourceService;

  const createPlaySource = (overrides: Partial<PlaySource> = {}): PlaySource =>
    ({
      id: 1,
      mediaResourceId: 10,
      url: 'https://cdn.example.com/old.m3u8',
      type: PlaySourceType.STREAM,
      status: PlaySourceStatus.ERROR,
      priority: 1,
      isAds: false,
      playCount: 0,
      isActive: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      mediaResource: {} as never,
      configuredBy: [],
      validationInfo: {
        origin: {
          originSite: 'dytt001',
          originDetailUrl: 'https://www.dytt001.com/detail/1.html',
          originPlayPageUrl: 'https://www.dytt001.com/play/1-1-1.html',
          originSourceId: '1',
          episodeNumber: 1,
          resolvedAt: '2026-01-01T00:00:00.000Z',
        },
      },
      ...overrides,
    }) as PlaySource;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = {
      findOne: jest.fn(),
      save: jest.fn(source => Promise.resolve(source)),
    };
    service = new PlaySourceService(
      repository as unknown as Repository<PlaySource>,
      {} as ParseProvidersService,
    );
  });

  it('refreshes a stored source from its origin play page and keeps the old URL in the result', async () => {
    const playSource = createPlaySource();
    repository.findOne.mockResolvedValue(playSource);
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: 'var player_aaaa={"url":"https:\\/\\/cdn.example.com\\/new.m3u8"};',
    });
    mockedAxios.head.mockResolvedValueOnce({
      status: 200,
      headers: {
        'content-type': 'application/vnd.apple.mpegurl',
      },
      request: {
        res: {
          responseUrl: 'https://cdn.example.com/new.m3u8',
        },
      },
    });

    const result = await service.refreshFromOrigin(1);

    expect(result.refreshed).toBe(true);
    expect(result.oldUrl).toBe('https://cdn.example.com/old.m3u8');
    expect(result.newUrl).toBe('https://cdn.example.com/new.m3u8');
    expect(result.playSource?.url).toBe('https://cdn.example.com/new.m3u8');
    expect(result.playSource?.status).toBe(PlaySourceStatus.ACTIVE);
    expect(result.playSource?.isActive).toBe(true);
    expect(result.playSource?.validationInfo?.origin).toMatchObject({
      originPlayPageUrl: 'https://www.dytt001.com/play/1-1-1.html',
      originSourceId: '1',
      episodeNumber: 1,
    });
  });

  it('does not call the origin page when no origin play page was stored', async () => {
    repository.findOne.mockResolvedValue(createPlaySource({ validationInfo: null }));

    const result = await service.refreshFromOrigin(1);

    expect(result.refreshed).toBe(false);
    expect(result.oldUrl).toBe('https://cdn.example.com/old.m3u8');
    expect(mockedAxios.get.mock.calls).toHaveLength(0);
    expect(repository.save.mock.calls).toHaveLength(0);
  });
});
