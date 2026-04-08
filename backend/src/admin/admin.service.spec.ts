import type { Repository } from 'typeorm';
import { AdminService } from './admin.service';
import { AdminLog } from '../entities/admin-log.entity';
import { DownloadTask, DownloadTaskStatus, DownloadTaskType } from '../entities/download-task.entity';
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
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  } as unknown as Repository<AdminLog> & {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };

  const downloadTaskRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  } as unknown as Repository<DownloadTask> & {
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
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
    const recentActivity = [{ id: 1, action: 'stats_check' }] as AdminLog[];

    userRepository.count.mockResolvedValue(12);
    userRepository.manager.count
      .mockResolvedValueOnce(34)
      .mockResolvedValueOnce(56)
      .mockResolvedValueOnce(78);
    downloadTaskRepository.find.mockResolvedValue([
      {
        id: 1,
        url: 'https://example.com/direct.mp4',
        type: DownloadTaskType.DIRECT,
        status: DownloadTaskStatus.PENDING,
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      },
      {
        id: 2,
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-a',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.ERROR,
        updatedAt: new Date('2025-01-01T01:00:00.000Z'),
      },
      {
        id: 3,
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-b',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.DOWNLOADING,
        updatedAt: new Date('2025-01-01T02:00:00.000Z'),
      },
      {
        id: 4,
        url: 'https://example.com/completed.mp4',
        type: DownloadTaskType.DIRECT,
        status: DownloadTaskStatus.COMPLETED,
        updatedAt: new Date('2025-01-01T03:00:00.000Z'),
      },
    ]);
    adminLogRepository.find.mockResolvedValue(recentActivity);

    const result = await service.getSystemStats();

    expect(result).toEqual({
      userCount: 12,
      mediaCount: 34,
      playSourceCount: 56,
      watchHistoryCount: 78,
      downloadTaskCount: 3,
      activeDownloadTaskCount: 2,
      completedDownloadTaskCount: 1,
      failedDownloadTaskCount: 0,
      recentActivity,
    });
    expect(downloadTaskRepository.find).toHaveBeenCalledTimes(1);
    expect(adminLogRepository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      take: 10,
    });
  });

  it('returns paginated admin download tasks with filters', async () => {
    const items = [{ id: 1, clientId: 'task-1' }] as DownloadTask[];

    downloadTaskQueryBuilder.getMany.mockResolvedValue(items);

    const result = await service.getDownloadTasks(
      2,
      10,
      'downloading',
      'magnet',
      8,
      15,
      ' demo ',
      'task-21',
    );

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
    expect(downloadTaskQueryBuilder.andWhere).toHaveBeenCalledWith('downloadTask.clientId = :clientId', {
      clientId: 'task-21',
    });
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
    expect(downloadTaskQueryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('downloadTask.clientId LIKE :search'),
      { search: '%demo%' },
    );
    expect(result).toEqual({
      data: items,
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('filters admin download tasks by exact magnet hash after dedupe', async () => {
    downloadTaskQueryBuilder.getMany.mockResolvedValue([
      {
        id: 12,
        clientId: 'task-new',
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-b',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.DOWNLOADING,
        updatedAt: new Date('2025-06-01T10:00:00.000Z'),
      },
      {
        id: 13,
        clientId: 'task-other',
        url: 'magnet:?xt=urn:btih:other-hash&tr=udp://tracker-c',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.ERROR,
        updatedAt: new Date('2025-06-01T09:00:00.000Z'),
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

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.clientId).toBe('task-new');
  });

  it('filters admin download tasks by exact task id', async () => {
    downloadTaskQueryBuilder.getMany.mockResolvedValue([
      {
        id: 21,
        clientId: 'task-21',
        url: 'https://example.com/task-21.mp4',
        type: DownloadTaskType.DIRECT,
        status: DownloadTaskStatus.PENDING,
        updatedAt: new Date('2025-06-02T10:00:00.000Z'),
      },
    ] as DownloadTask[]);

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

    expect(downloadTaskQueryBuilder.andWhere).toHaveBeenCalledWith('downloadTask.id = :taskId', {
      taskId: 21,
    });
    expect(result.total).toBe(1);
    expect(result.data[0]?.id).toBe(21);
  });

  it('filters admin download tasks by exact client id', async () => {
    downloadTaskQueryBuilder.getMany.mockResolvedValue([
      {
        id: 32,
        clientId: 'task-21',
        url: 'https://example.com/task-21.mp4',
        type: DownloadTaskType.DIRECT,
        status: DownloadTaskStatus.PENDING,
        updatedAt: new Date('2025-06-02T10:00:00.000Z'),
      },
    ] as DownloadTask[]);

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

    expect(downloadTaskQueryBuilder.andWhere).toHaveBeenCalledWith('downloadTask.clientId = :clientId', {
      clientId: 'task-21',
    });
    expect(result.total).toBe(1);
    expect(result.data[0]?.clientId).toBe('task-21');
  });

  it('filters admin logs by download-task metadata fields', async () => {
    const adminLogQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([{ id: 1 }]),
    };

    adminLogRepository.createQueryBuilder = jest.fn().mockReturnValue(adminLogQueryBuilder);

    const result = await service.getAdminLogs(1, 10, {
      resource: 'download_task',
      action: 'retry',
      clientId: 'task-21',
      hash: 'hash-demo',
      downloadTaskId: 21,
      logId: 7,
    });

    expect(adminLogQueryBuilder.andWhere).toHaveBeenCalledWith('adminLog.resource = :resource', {
      resource: 'download_task',
    });
    expect(adminLogQueryBuilder.andWhere).toHaveBeenCalledWith('adminLog.action = :action', {
      action: 'retry',
    });
    expect(adminLogQueryBuilder.andWhere).toHaveBeenCalledWith(
      "JSON_UNQUOTE(JSON_EXTRACT(adminLog.metadata, '$.clientId')) = :clientId",
      { clientId: 'task-21' },
    );
    expect(adminLogQueryBuilder.andWhere).toHaveBeenCalledWith(
      "JSON_UNQUOTE(JSON_EXTRACT(adminLog.metadata, '$.infoHash')) = :hash",
      { hash: 'hash-demo' },
    );
    expect(adminLogQueryBuilder.andWhere).toHaveBeenCalledWith(
      "JSON_UNQUOTE(JSON_EXTRACT(adminLog.metadata, '$.downloadTaskId')) = :downloadTaskId",
      { downloadTaskId: '21' },
    );
    expect(adminLogQueryBuilder.andWhere).toHaveBeenCalledWith('adminLog.id = :logId', {
      logId: 7,
    });
    expect(result.total).toBe(1);
  });

  it('clamps out-of-range admin download-task pages back to the last available page', async () => {
    const items = [{ id: 9, clientId: 'task-9' }] as DownloadTask[];

    downloadTaskQueryBuilder.getMany.mockResolvedValue(items);

    const result = await service.getDownloadTasks(5, 2);

    expect(result).toEqual({
      data: items,
      total: 1,
      page: 1,
      limit: 2,
      totalPages: 1,
    });
  });

  it('deduplicates same-hash magnet tasks in the admin download-task list', async () => {
    downloadTaskQueryBuilder.getMany.mockResolvedValue([
      {
        id: 12,
        clientId: 'task-new',
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-b',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.DOWNLOADING,
        updatedAt: new Date('2025-06-01T10:00:00.000Z'),
      },
      {
        id: 11,
        clientId: 'task-old',
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-a',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.ERROR,
        updatedAt: new Date('2025-06-01T09:00:00.000Z'),
      },
    ] as DownloadTask[]);

    const result = await service.getDownloadTasks(1, 20, undefined, 'magnet');

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.clientId).toBe('task-new');
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

  it('retries an errored admin download task by resetting its execution state', async () => {
    const task = {
      id: 7,
      clientId: 'error-task',
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

    expect(downloadTaskRepository.findOne).toHaveBeenCalledWith({
      where: { id: 7 },
      relations: ['user', 'mediaResource'],
    });
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
    expect(adminLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'cancel',
        resource: 'download_task',
      }),
    );
  });

  it('records magnet infoHash in admin download-task logs for magnet actions', async () => {
    const task = {
      id: 18,
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

    await service.handleDownloadTaskAction(18, { action: 'retry' as never });

    expect(adminLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          infoHash: 'hash-demo',
        }),
      }),
    );
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
    const duplicateTask = {
      id: 27,
      clientId: 'magnet-task-old',
      url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-b',
      type: DownloadTaskType.MAGNET,
      status: DownloadTaskStatus.PENDING,
      userId: 8,
    } as DownloadTask;

    downloadTaskRepository.findOne.mockResolvedValue(task);
    downloadTaskRepository.save.mockImplementation((item: DownloadTask) => Promise.resolve(item));
    downloadTaskRepository.find.mockResolvedValue([task, duplicateTask]);
    downloadTaskRepository.delete.mockResolvedValue({ affected: 1 });

    await service.handleDownloadTaskAction(28, { action: 'retry' as never });

    expect(downloadTaskRepository.delete).toHaveBeenCalledWith([27]);
  });

  it('handles batch retry actions by delegating to per-task handling', async () => {
    const taskOne = {
      id: 31,
      clientId: 'task-31',
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
