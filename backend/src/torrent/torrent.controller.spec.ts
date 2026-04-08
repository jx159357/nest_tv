jest.mock(
  'magnet-uri',
  () => ({
    __esModule: true,
    default: {
      decode: () => ({ infoHash: 'hash-demo', dn: 'Demo' }),
    },
  }),
  { virtual: true },
);

import { TorrentController } from './torrent.controller';
import { TorrentService } from './torrent.service';

describe('TorrentController', () => {
  const torrentService = {
    getTorrentInfo: jest.fn(),
    checkTorrentHealth: jest.fn(),
    parseMagnetUri: jest.fn(),
    searchTorrents: jest.fn(),
    getPopularTorrents: jest.fn(),
    getLatestTorrents: jest.fn(),
  } as unknown as TorrentService & {
    getTorrentInfo: jest.Mock;
    checkTorrentHealth: jest.Mock;
    parseMagnetUri: jest.Mock;
    searchTorrents: jest.Mock;
    getPopularTorrents: jest.Mock;
    getLatestTorrents: jest.Mock;
  };

  const controller = new TorrentController(torrentService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards validated search params including category', async () => {
    const payload = { data: [], total: 0, page: 2, pageSize: 5, totalPages: 0 };
    torrentService.searchTorrents.mockResolvedValue(payload);

    await expect(
      controller.searchTorrents({ keyword: '沙丘', category: 'movie', page: 2, pageSize: 5 }),
    ).resolves.toEqual(payload);

    expect(torrentService.searchTorrents).toHaveBeenCalledWith('沙丘', 2, 5, 'movie');
  });

  it('forwards rank params for popular and latest lists', async () => {
    torrentService.getPopularTorrents.mockResolvedValue([{ infoHash: 'popular' }]);
    torrentService.getLatestTorrents.mockResolvedValue([{ infoHash: 'latest' }]);

    await expect(controller.getPopularTorrents({ limit: 8, category: 'anime' })).resolves.toEqual([
      { infoHash: 'popular' },
    ]);
    await expect(controller.getLatestTorrents({ limit: 6, category: 'movie' })).resolves.toEqual([
      { infoHash: 'latest' },
    ]);

    expect(torrentService.getPopularTorrents).toHaveBeenCalledWith(8, 'anime');
    expect(torrentService.getLatestTorrents).toHaveBeenCalledWith(6, 'movie');
  });
});
