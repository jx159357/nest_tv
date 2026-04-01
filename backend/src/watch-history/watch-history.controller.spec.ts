import { Test, TestingModule } from '@nestjs/testing';
import { WatchHistoryController } from './watch-history.controller';
import { WatchHistoryService } from './watch-history.service';

describe('WatchHistoryController', () => {
  const watchHistoryService = {
    findAll: jest.fn(),
  };

  let controller: WatchHistoryController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WatchHistoryController],
      providers: [
        {
          provide: WatchHistoryService,
          useValue: watchHistoryService,
        },
      ],
    }).compile();

    controller = module.get<WatchHistoryController>(WatchHistoryController);
  });

  it('forces current user id into my-history queries while preserving filters', async () => {
    const payload = { data: [], total: 0, page: 2, limit: 10, totalPages: 0 };
    watchHistoryService.findAll.mockResolvedValue(payload);

    await expect(
      controller.findMyHistory(7, {
        page: 2,
        limit: 10,
        isCompleted: false,
        sortBy: 'createdAt',
        sortOrder: 'ASC',
      }),
    ).resolves.toEqual(payload);

    expect(watchHistoryService.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      isCompleted: false,
      sortBy: 'createdAt',
      sortOrder: 'ASC',
      userId: 7,
    });
  });
});
