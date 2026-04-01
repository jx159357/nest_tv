import type { Repository } from 'typeorm';
import { AdminService } from './admin.service';
import { AdminLog } from '../entities/admin-log.entity';
import { DownloadTask } from '../entities/download-task.entity';
import { User } from '../entities/user.entity';

describe('AdminService', () => {
  const userQueryBuilder = {
    select: jest.fn(),
    andWhere: jest.fn(),
    getCount: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getMany: jest.fn(),
  };

  const downloadTaskQueryBuilder = {
    leftJoinAndSelect: jest.fn(),
    andWhere: jest.fn(),
    getCount: jest.fn(),
    orderBy: jest.fn(),
    skip: jest.fn(),
    take: jest.fn(),
    getMany: jest.fn(),
  };

  const userRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    manager: {
      count: jest.fn(),
    },
  } as unknown as Repository<User> & {
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
    manager: {
      count: jest.Mock;
    };
  };

  const adminLogRepository = {
    find: jest.fn(),
  } as unknown as Repository<AdminLog> & {
    find: jest.Mock;
  };

  const downloadTaskRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as unknown as Repository<DownloadTask> & {
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  const service = new AdminService(
    {} as never,
    {} as never,
    adminLogRepository,
    userRepository,
    {} as never,
    {} as never,
    {} as never,
    downloadTaskRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.createQueryBuilder.mockReturnValue(userQueryBuilder);
    userQueryBuilder.select.mockImplementation(() => userQueryBuilder);
    userQueryBuilder.andWhere.mockImplementation(() => userQueryBuilder);
    userQueryBuilder.orderBy.mockImplementation(() => userQueryBuilder);
    userQueryBuilder.skip.mockImplementation(() => userQueryBuilder);
    userQueryBuilder.take.mockImplementation(() => userQueryBuilder);
    downloadTaskRepository.createQueryBuilder.mockReturnValue(downloadTaskQueryBuilder);
    downloadTaskQueryBuilder.leftJoinAndSelect.mockImplementation(() => downloadTaskQueryBuilder);
    downloadTaskQueryBuilder.andWhere.mockImplementation(() => downloadTaskQueryBuilder);
    downloadTaskQueryBuilder.orderBy.mockImplementation(() => downloadTaskQueryBuilder);
    downloadTaskQueryBuilder.skip.mockImplementation(() => downloadTaskQueryBuilder);
    downloadTaskQueryBuilder.take.mockImplementation(() => downloadTaskQueryBuilder);
  });

  it('returns system stats including download task totals and breakdowns', async () => {
    const recentActivity = [{ id: 1, action: 'stats_check' }] as AdminLog[];

    userRepository.count.mockResolvedValue(12);
    userRepository.manager.count
      .mockResolvedValueOnce(34)
      .mockResolvedValueOnce(56)
      .mockResolvedValueOnce(78);
    downloadTaskRepository.count
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2);
    adminLogRepository.find.mockResolvedValue(recentActivity);

    const result = await service.getSystemStats();

    expect(result).toEqual({
      userCount: 12,
      mediaCount: 34,
      playSourceCount: 56,
      watchHistoryCount: 78,
      downloadTaskCount: 9,
      activeDownloadTaskCount: 3,
      completedDownloadTaskCount: 4,
      failedDownloadTaskCount: 2,
      recentActivity,
    });
    expect(downloadTaskRepository.count).toHaveBeenCalledTimes(4);
    expect(adminLogRepository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      take: 10,
    });
  });

  it('returns paginated admin download tasks with filters', async () => {
    const items = [{ id: 1, clientId: 'task-1' }] as DownloadTask[];

    downloadTaskQueryBuilder.getCount.mockResolvedValue(30);
    downloadTaskQueryBuilder.getMany.mockResolvedValue(items);

    const result = await service.getDownloadTasks(2, 10, 'downloading', 'magnet', 8, 15, ' demo ');

    expect(downloadTaskRepository.createQueryBuilder).toHaveBeenCalledWith('downloadTask');
    expect(downloadTaskQueryBuilder.andWhere).toHaveBeenCalledWith(
      'downloadTask.userId = :userId',
      {
        userId: 8,
      },
    );
    expect(downloadTaskQueryBuilder.andWhere).toHaveBeenCalledWith(
      'downloadTask.mediaResourceId = :mediaResourceId',
      { mediaResourceId: 15 },
    );
    expect(downloadTaskQueryBuilder.andWhere).toHaveBeenCalledWith(
      'downloadTask.status = :status',
      {
        status: 'downloading',
      },
    );
    expect(downloadTaskQueryBuilder.andWhere).toHaveBeenCalledWith('downloadTask.type = :type', {
      type: 'magnet',
    });
    expect(downloadTaskQueryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('downloadTask.fileName LIKE :search'),
      { search: '%demo%' },
    );
    expect(downloadTaskQueryBuilder.skip).toHaveBeenCalledWith(10);
    expect(downloadTaskQueryBuilder.take).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      data: items,
      total: 30,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });

  it('clamps out-of-range admin download-task pages back to the last available page', async () => {
    const items = [{ id: 9, clientId: 'task-9' }] as DownloadTask[];

    downloadTaskQueryBuilder.getCount.mockResolvedValue(3);
    downloadTaskQueryBuilder.getMany.mockResolvedValue(items);

    const result = await service.getDownloadTasks(5, 2);

    expect(downloadTaskQueryBuilder.skip).toHaveBeenCalledWith(2);
    expect(downloadTaskQueryBuilder.take).toHaveBeenCalledWith(2);
    expect(result).toEqual({
      data: items,
      total: 3,
      page: 2,
      limit: 2,
      totalPages: 2,
    });
  });

  it('normalizes invalid pagination when loading users', async () => {
    const items = [{ id: 3, username: 'demo-user' }] as User[];

    userQueryBuilder.getCount.mockResolvedValue(1);
    userQueryBuilder.getMany.mockResolvedValue(items);

    const result = await service.getUsers('oops' as never, 0 as never, ' demo ');

    expect(userRepository.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(userQueryBuilder.andWhere).toHaveBeenCalledWith(
      '(user.username LIKE :search OR user.email LIKE :search OR user.nickname LIKE :search)',
      { search: '%demo%' },
    );
    expect(userQueryBuilder.skip).toHaveBeenCalledWith(0);
    expect(userQueryBuilder.take).toHaveBeenCalledWith(20);
    expect(result).toEqual({
      data: items,
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
  });

  it('caps oversized admin list page sizes to the shared maximum', async () => {
    const items = [{ id: 4, username: 'limit-user' }] as User[];

    userQueryBuilder.getCount.mockResolvedValue(500);
    userQueryBuilder.getMany.mockResolvedValue(items);

    const result = await service.getUsers(1, 999 as never);

    expect(userQueryBuilder.take).toHaveBeenCalledWith(200);
    expect(result).toEqual({
      data: items,
      total: 500,
      page: 1,
      limit: 200,
      totalPages: 3,
    });
  });
});
