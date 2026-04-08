jest.mock(
  'magnet-uri',
  () => ({
    __esModule: true,
    default: {
      decode: (uri: string) => ({
        infoHash: uri.includes('hash-demo') ? 'hash-demo' : 'hash',
        dn: uri.includes('dn=Demo') ? 'Demo' : '',
      }),
    },
  }),
  { virtual: true },
);

import type { Repository } from 'typeorm';
import { PlaySource, PlaySourceType } from '../entities/play-source.entity';
import { TorrentService } from './torrent.service';

describe('TorrentService', () => {
  const queryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
    getMany: jest.fn(),
  };

  const playSourceRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
  } as unknown as Repository<PlaySource> & {
    createQueryBuilder: jest.Mock;
  };

  const service = new TorrentService(playSourceRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    playSourceRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    queryBuilder.leftJoinAndSelect.mockImplementation(() => queryBuilder);
    queryBuilder.where.mockImplementation(() => queryBuilder);
    queryBuilder.andWhere.mockImplementation(() => queryBuilder);
    queryBuilder.orderBy.mockImplementation(() => queryBuilder);
    queryBuilder.skip.mockImplementation(() => queryBuilder);
    queryBuilder.take.mockImplementation(() => queryBuilder);
  });

  it('applies keyword, category, and pagination when searching torrents', async () => {
    const createdAt = new Date('2025-01-01T00:00:00.000Z');
    queryBuilder.getCount.mockResolvedValue(1);
    queryBuilder.getMany.mockResolvedValue([
      {
        url: 'magnet:?xt=urn:btih:hash-demo&dn=Demo',
        sourceName: 'Demo Source',
        name: 'Demo Torrent',
        createdAt,
        mediaResourceId: 9,
        mediaResource: { title: 'Demo Movie', type: 'movie' },
        magnetInfo: { size: 2048, seeders: 10, leechers: 2 },
      },
    ] as PlaySource[]);

    const result = await service.searchTorrents(' Demo ', 2, 5, 'movie');

    expect(playSourceRepository.createQueryBuilder).toHaveBeenCalledWith('playSource');
    expect(queryBuilder.where).toHaveBeenCalledWith('playSource.type = :type', {
      type: PlaySourceType.MAGNET,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('playSource.url LIKE :keyword'),
      { keyword: '%Demo%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('mediaResource.type = :category', {
      category: 'movie',
    });
    expect(queryBuilder.skip).toHaveBeenCalledWith(5);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
    expect(result).toEqual({
      data: [
        {
          infoHash: 'hash-demo',
          name: 'Demo',
          size: 2048,
          seeders: 10,
          leechers: 2,
          added: createdAt.toISOString(),
          category: 'movie',
          mediaResourceId: 9,
          mediaTitle: 'Demo Movie',
        },
      ],
      total: 1,
      page: 2,
      pageSize: 5,
      totalPages: 1,
    });
  });
});
