import type { Repository } from 'typeorm';
import { AdminService } from './admin.service';
import { AdminLog } from '../entities/admin-log.entity';
import {
  DownloadTask,
  DownloadTaskStatus,
  DownloadTaskType,
} from '../entities/download-task.entity';
import { User } from '../entities/user.entity';

describe('AdminService', () => {
  const sharedDtQb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getQuery: jest.fn().mockReturnValue('subquery'),
    getParameters: jest.fn().mockReturnValue({}),
    getMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
    getRawOne: jest.fn().mockResolvedValue({}),
    getRawMany: jest.fn().mockResolvedValue([]),
  };

  const userQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(0),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const userRepository = {
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(userQueryBuilder),
  } as unknown as Repository<User> & {
    count: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  const adminLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn(),
  } as unknown as Repository<AdminLog> & {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  const mediaResourceRepository = { count: jest.fn() } as unknown as Repository<never> & {
    count: jest.Mock;
  };
  const playSourceRepository = { count: jest.fn() } as unknown as Repository<never> & {
    count: jest.Mock;
  };
  const watchHistoryRepository = { count: jest.fn() } as unknown as Repository<never> & {
    count: jest.Mock;
  };

  const downloadTaskRepository = {
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn().mockReturnValue(sharedDtQb),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn().mockResolvedValue({ affected: 0 }),
  } as unknown as Repository<DownloadTask> & {
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  const crawlerTargetRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  } as unknown as Repository<never> & { find: jest.Mock; findOne: jest.Mock };

  const service = new AdminService(
    {} as never,
    {} as never,
    adminLogRepository,
    userRepository,
    mediaResourceRepository,
    playSourceRepository,
    watchHistoryRepository,
    downloadTaskRepository,
    crawlerTargetRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();

    sharedDtQb.select.mockReturnThis();
    sharedDtQb.addSelect.mockReturnThis();
    sharedDtQb.andWhere.mockReturnThis();
    sharedDtQb.where.mockReturnThis();
    sharedDtQb.groupBy.mockReturnThis();
    sharedDtQb.innerJoin.mockReturnThis();
    sharedDtQb.leftJoinAndSelect.mockReturnThis();
    sharedDtQb.leftJoin.mockReturnThis();
    sharedDtQb.setParameters.mockReturnThis();
    sharedDtQb.orderBy.mockReturnThis();
    sharedDtQb.addOrderBy.mockReturnThis();
    sharedDtQb.skip.mockReturnThis();
    sharedDtQb.take.mockReturnThis();
    sharedDtQb.getQuery.mockReturnValue('subquery');
    sharedDtQb.getParameters.mockReturnValue({});
    sharedDtQb.getMany.mockResolvedValue([]);
    sharedDtQb.getCount.mockResolvedValue(0);
    sharedDtQb.getRawOne.mockResolvedValue({});
    sharedDtQb.getRawMany.mockResolvedValue([]);

    userQueryBuilder.select.mockReturnThis();
    userQueryBuilder.andWhere.mockReturnThis();
    userQueryBuilder.getCount.mockResolvedValue(0);
    userQueryBuilder.orderBy.mockReturnThis();
    userQueryBuilder.skip.mockReturnThis();
    userQueryBuilder.take.mockReturnThis();
    userQueryBuilder.getMany.mockResolvedValue([]);

    downloadTaskRepository.createQueryBuilder.mockReturnValue(sharedDtQb);
    userRepository.createQueryBuilder.mockReturnValue(userQueryBuilder);
    adminLogRepository.find.mockResolvedValue([]);
    downloadTaskRepository.find.mockResolvedValue([]);
    downloadTaskRepository.delete.mockResolvedValue({ affected: 0 });
    adminLogRepository.create.mockImplementation(
      (payload: Partial<AdminLog>): Partial<AdminLog> => payload,
    );
    adminLogRepository.save.mockImplementation(
      (item: Partial<AdminLog>): Promise<Partial<AdminLog>> => Promise.resolve(item),
    );
  });

  it('returns system stats including download task totals and breakdowns', async () => {
    userRepository.count.mockResolvedValue(12);
    mediaResourceRepository.count.mockResolvedValue(34);
    playSourceRepository.count.mockResolvedValue(56);
    watchHistoryRepository.count.mockResolvedValue(78);
    sharedDtQb.getRawOne.mockResolvedValue({
      downloadTaskCount: '3',
      activeDownloadTaskCount: '2',
      completedDownloadTaskCount: '1',
      failedDownloadTaskCount: '0',
    });
    adminLogRepository.find.mockResolvedValue([{ id: 1, action: 'stats_check' }] as AdminLog[]);

    const result = await service.getSystemStats();

    expect(result.userCount).toBe(12);
    expect(result.mediaCount).toBe(34);
    expect(result.playSourceCount).toBe(56);
    expect(result.watchHistoryCount).toBe(78);
    expect(result.downloadTaskCount).toBe(3);
    expect(result.activeDownloadTaskCount).toBe(2);
    expect(result.completedDownloadTaskCount).toBe(1);
    expect(result.failedDownloadTaskCount).toBe(0);
  });

  it('returns paginated admin download tasks with filters', async () => {
    const items = [{ id: 1, clientId: 'task-1' }] as DownloadTask[];
    sharedDtQb.getCount.mockResolvedValue(1);
    sharedDtQb.getRawMany.mockResolvedValue([{ id: 1 }]);
    sharedDtQb.getMany.mockResolvedValue(items);

    const result = await service.getDownloadTasks(
      1,
      10,
      'downloading',
      'magnet',
      8,
      15,
      ' demo ',
      'task-21',
    );

    expect(sharedDtQb.andWhere).toHaveBeenCalledWith('dt.userId = :userId', { userId: 8 });
    expect(sharedDtQb.andWhere).toHaveBeenCalledWith('dt.mediaResourceId = :mediaResourceId', {
      mediaResourceId: 15,
    });
    expect(sharedDtQb.andWhere).toHaveBeenCalledWith('dt.clientId = :clientId', {
      clientId: 'task-21',
    });
    expect(sharedDtQb.andWhere).toHaveBeenCalledWith('dt.status = :status', {
      status: 'downloading',
    });
    expect(sharedDtQb.andWhere).toHaveBeenCalledWith('dt.type = :type', { type: 'magnet' });
    expect(result.data).toEqual(items);
    expect(result.total).toBe(1);
  });

  it('filters admin download tasks by exact magnet hash after dedupe', async () => {
    sharedDtQb.getCount.mockResolvedValue(1);
    sharedDtQb.getRawMany.mockResolvedValue([{ id: 12 }]);
    sharedDtQb.getMany.mockResolvedValue([
      {
        id: 12,
        clientId: 'task-new',
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-b',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.DOWNLOADING,
      },
    ] as DownloadTask[]);

    const result = await service.getDownloadTasks(
      1,
      20,
      undefined,
      'magnet',
      undefined,
      undefined,
      undefined,
      undefined,
      'hash-demo',
    );

    expect(sharedDtQb.andWhere).toHaveBeenCalledWith('dt.dedupKey LIKE :hashPattern', {
      hashPattern: '%hash-demo%',
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.clientId).toBe('task-new');
  });

  it('filters admin download tasks by exact task id', async () => {
    sharedDtQb.getCount.mockResolvedValue(1);
    sharedDtQb.getRawMany.mockResolvedValue([{ id: 21 }]);
    sharedDtQb.getMany.mockResolvedValue([{ id: 21, clientId: 'task-21' } as DownloadTask]);

    const result = await service.getDownloadTasks(
      1,
      20,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      21,
    );

    expect(sharedDtQb.andWhere).toHaveBeenCalledWith('dt.id = :taskId', { taskId: 21 });
    expect(result.data[0]?.id).toBe(21);
  });

  it('filters admin download tasks by exact client id', async () => {
    sharedDtQb.getCount.mockResolvedValue(1);
    sharedDtQb.getRawMany.mockResolvedValue([{ id: 32 }]);
    sharedDtQb.getMany.mockResolvedValue([{ id: 32, clientId: 'task-21' } as DownloadTask]);

    const result = await service.getDownloadTasks(
      1,
      20,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'task-21',
    );

    expect(sharedDtQb.andWhere).toHaveBeenCalledWith('dt.clientId = :clientId', {
      clientId: 'task-21',
    });
    expect(result.data[0]?.clientId).toBe('task-21');
  });

  it('clamps out-of-range admin download-task pages back to the last available page', async () => {
    sharedDtQb.getCount.mockResolvedValue(1);
    sharedDtQb.getRawMany.mockResolvedValue([{ id: 9 }]);
    sharedDtQb.getMany.mockResolvedValue([{ id: 9, clientId: 'task-9' }] as DownloadTask[]);

    const result = await service.getDownloadTasks(5, 2);

    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('deduplicates same-hash magnet tasks in the admin download-task list', async () => {
    sharedDtQb.getCount.mockResolvedValue(1);
    sharedDtQb.getRawMany.mockResolvedValue([{ id: 12 }]);
    sharedDtQb.getMany.mockResolvedValue([
      {
        id: 12,
        clientId: 'task-new',
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-b',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.DOWNLOADING,
      },
    ] as DownloadTask[]);

    const result = await service.getDownloadTasks(1, 20, undefined, 'magnet');

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  it('retries an errored admin download task by resetting its execution state', async () => {
    const task = {
      id: 7,
      clientId: 'error-task',
      url: 'https://example.com/file.mp4',
      type: DownloadTaskType.DIRECT,
      status: DownloadTaskStatus.ERROR,
      progress: 33,
      speed: 99,
      downloaded: 1024,
      error: 'network timeout',
      completedAt: new Date('2025-01-01T00:00:00.000Z'),
    } as DownloadTask;

    downloadTaskRepository.findOne.mockResolvedValue(task);
    downloadTaskRepository.save.mockImplementation((item: DownloadTask) => Promise.resolve(item));

    const result = await service.handleDownloadTaskAction(7, { action: 'retry' as never });

    expect(result.status).toBe(DownloadTaskStatus.PENDING);
    expect(result.progress).toBe(0);
    expect(result.downloaded).toBe(0);
    expect(result.error).toBeUndefined();
    expect(adminLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'retry',
        resource: 'download_task',
      }),
    );
  });

  it('cancels an admin download task and keeps a visible cancellation reason', async () => {
    const task = {
      id: 8,
      clientId: 'downloading-task',
      url: 'https://example.com/file.mp4',
      type: DownloadTaskType.DIRECT,
      status: DownloadTaskStatus.DOWNLOADING,
      progress: 60,
      speed: 2048,
      downloaded: 2048,
      error: undefined,
    } as DownloadTask;

    downloadTaskRepository.findOne.mockResolvedValue(task);
    downloadTaskRepository.save.mockImplementation((item: DownloadTask) => Promise.resolve(item));

    const result = await service.handleDownloadTaskAction(8, { action: 'cancel' as never });

    expect(result.status).toBe(DownloadTaskStatus.CANCELLED);
    expect(result.speed).toBe(0);
    expect(result.error).toBe('管理员手动取消');
  });

  it('cleans up older duplicate magnet rows after admin task handling', async () => {
    const task = {
      id: 28,
      clientId: 'magnet-task',
      url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-a',
      type: DownloadTaskType.MAGNET,
      status: DownloadTaskStatus.ERROR,
      progress: 10,
      speed: 0,
      downloaded: 10,
      userId: 8,
    } as DownloadTask;

    downloadTaskRepository.findOne.mockResolvedValue(task);
    downloadTaskRepository.save.mockImplementation((item: DownloadTask) => Promise.resolve(item));
    downloadTaskRepository.find.mockResolvedValue([task, { id: 27 }]);
    downloadTaskRepository.delete.mockResolvedValue({ affected: 1 });

    await service.handleDownloadTaskAction(28, { action: 'retry' as never });

    expect(downloadTaskRepository.delete).toHaveBeenCalledWith([27]);
  });

  it('handles batch retry actions by delegating to per-task handling', async () => {
    const taskOne = {
      id: 31,
      clientId: 'task-31',
      url: 'https://example.com/a.mp4',
      type: DownloadTaskType.DIRECT,
      userId: 8,
      status: DownloadTaskStatus.ERROR,
      progress: 20,
      speed: 0,
      downloaded: 20,
      error: 'timeout',
    } as DownloadTask;
    const taskTwo = {
      id: 32,
      clientId: 'task-32',
      url: 'https://example.com/b.mp4',
      type: DownloadTaskType.DIRECT,
      userId: 8,
      status: DownloadTaskStatus.CANCELLED,
      progress: 0,
      speed: 0,
      downloaded: 0,
      error: 'manual',
    } as DownloadTask;

    downloadTaskRepository.findOne.mockResolvedValueOnce(taskOne).mockResolvedValueOnce(taskTwo);
    downloadTaskRepository.save.mockImplementation((item: DownloadTask) => Promise.resolve(item));

    const result = await service.handleDownloadTaskBatchAction({
      action: 'retry' as never,
      ids: [31, 32, 31],
    });

    expect(downloadTaskRepository.findOne).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
    expect(result[0]?.status).toBe(DownloadTaskStatus.PENDING);
    expect(result[1]?.status).toBe(DownloadTaskStatus.PENDING);
  });
});
