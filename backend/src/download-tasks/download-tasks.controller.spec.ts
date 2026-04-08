import { DownloadTasksController } from './download-tasks.controller';

describe('DownloadTasksController', () => {
  const downloadTasksService = {
    findMine: jest.fn(),
    clearCompletedMine: jest.fn(),
    clearFailedMine: jest.fn(),
  };

  let controller: DownloadTasksController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new DownloadTasksController(downloadTasksService as never);
  });

  it('passes the current user id into my-task queries', async () => {
    const payload = { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    downloadTasksService.findMine.mockResolvedValue(payload);

    await expect(
      controller.findMine(7, {
        page: 1,
        limit: 20,
        search: '磁力',
      }),
    ).resolves.toEqual(payload);

    expect(downloadTasksService.findMine).toHaveBeenCalledWith(7, {
      page: 1,
      limit: 20,
      search: '磁力',
    });
  });

  it('clears completed tasks for the current user', async () => {
    downloadTasksService.clearCompletedMine.mockResolvedValue({ deleted: 3 });

    await expect(controller.clearCompletedMine(9)).resolves.toEqual({ deleted: 3 });
    expect(downloadTasksService.clearCompletedMine).toHaveBeenCalledWith(9);
  });

  it('clears failed tasks for the current user', async () => {
    downloadTasksService.clearFailedMine.mockResolvedValue({ deleted: 2 });

    await expect(controller.clearFailedMine(11)).resolves.toEqual({ deleted: 2 });
    expect(downloadTasksService.clearFailedMine).toHaveBeenCalledWith(11);
  });
});
