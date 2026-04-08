import type { Repository } from 'typeorm';
import {
  DownloadTask,
  DownloadTaskStatus,
  DownloadTaskType,
} from '../entities/download-task.entity';
import { DownloadTasksService } from './download-tasks.service';

describe('DownloadTasksService', () => {
  const queryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const downloadTaskRepository = {
    createQueryBuilder: jest.fn(() => queryBuilder),
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  } as unknown as Repository<DownloadTask> & {
    createQueryBuilder: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
    remove: jest.Mock;
  };

  const service = new DownloadTasksService(downloadTaskRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    downloadTaskRepository.createQueryBuilder.mockReturnValue(queryBuilder);
    queryBuilder.leftJoinAndSelect.mockImplementation(() => queryBuilder);
    queryBuilder.where.mockImplementation(() => queryBuilder);
    queryBuilder.andWhere.mockImplementation(() => queryBuilder);
    queryBuilder.orderBy.mockImplementation(() => queryBuilder);
    queryBuilder.skip.mockImplementation(() => queryBuilder);
    queryBuilder.take.mockImplementation(() => queryBuilder);
    queryBuilder.getMany.mockResolvedValue([]);
  });

  it('applies filters and pagination when listing my tasks', async () => {
    const tasks = [{ id: 1, clientId: 'task-1' }] as DownloadTask[];
    queryBuilder.getMany.mockResolvedValue(tasks);

    const result = await service.findMine(7, {
      page: 2,
      limit: 2,
      status: DownloadTaskStatus.DOWNLOADING,
      type: DownloadTaskType.MAGNET,
      mediaResourceId: 11,
      search: ' magnet ',
    });

    expect(downloadTaskRepository.createQueryBuilder).toHaveBeenCalledWith('downloadTask');
    expect(queryBuilder.where).toHaveBeenCalledWith('downloadTask.userId = :userId', { userId: 7 });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('downloadTask.status = :status', {
      status: DownloadTaskStatus.DOWNLOADING,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('downloadTask.type = :type', {
      type: DownloadTaskType.MAGNET,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'downloadTask.mediaResourceId = :mediaResourceId',
      { mediaResourceId: 11 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('downloadTask.fileName LIKE :search'),
      { search: '%magnet%' },
    );
    expect(result).toEqual({
      data: tasks,
      total: 1,
      page: 1,
      limit: 2,
      totalPages: 1,
    });
  });

  it('deduplicates same-hash magnet tasks when listing my tasks', async () => {
    queryBuilder.getMany.mockResolvedValue([
      {
        id: 2,
        clientId: 'task-new',
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-b',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.DOWNLOADING,
        fileName: '新磁力任务',
        updatedAt: new Date('2025-05-01T10:00:00.000Z'),
      },
      {
        id: 1,
        clientId: 'task-old',
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-a',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.PENDING,
        fileName: '旧磁力任务',
        updatedAt: new Date('2025-05-01T09:00:00.000Z'),
      },
    ] as DownloadTask[]);

    const result = await service.findMine(7, { page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.clientId).toBe('task-new');
  });

  it('aggregates my task stats by status group', async () => {
    downloadTaskRepository.find.mockResolvedValue([
      { status: DownloadTaskStatus.PENDING, type: DownloadTaskType.DIRECT, id: 1, url: 'https://example.com/a' },
      { status: DownloadTaskStatus.DOWNLOADING, type: DownloadTaskType.DIRECT, id: 2, url: 'https://example.com/b' },
      { status: DownloadTaskStatus.COMPLETED, type: DownloadTaskType.DIRECT, id: 3, url: 'https://example.com/c' },
      { status: DownloadTaskStatus.ERROR, type: DownloadTaskType.DIRECT, id: 4, url: 'https://example.com/d' },
      { status: DownloadTaskStatus.CANCELLED, type: DownloadTaskType.DIRECT, id: 5, url: 'https://example.com/e' },
    ] as DownloadTask[]);

    const result = await service.getMineStats(3);

    expect(downloadTaskRepository.find).toHaveBeenCalledWith({ where: { userId: 3 } });
    expect(result).toEqual({
      total: 5,
      active: 2,
      completed: 1,
      failed: 2,
    });
  });

  it('deduplicates same-hash magnet tasks before computing stats', async () => {
    downloadTaskRepository.find.mockResolvedValue([
      {
        id: 11,
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-a',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.PENDING,
        updatedAt: new Date('2025-05-01T09:00:00.000Z'),
      },
      {
        id: 12,
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-b',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.DOWNLOADING,
        updatedAt: new Date('2025-05-01T10:00:00.000Z'),
      },
    ] as DownloadTask[]);

    const result = await service.getMineStats(3);

    expect(result).toEqual({
      total: 1,
      active: 1,
      completed: 0,
      failed: 0,
    });
  });

  it('creates a new task with normalized progress and owner id', async () => {
    const createdTask = {
      id: 5,
      clientId: 'task-5',
      userId: 8,
      progress: 100,
      url: 'https://example.com/file.zip',
      fileName: 'file.zip',
      status: DownloadTaskStatus.PENDING,
    } as DownloadTask;

    downloadTaskRepository.findOne.mockResolvedValue(null);
    downloadTaskRepository.create.mockReturnValue(createdTask);
    downloadTaskRepository.save.mockResolvedValue(createdTask);

    const result = await service.upsertMine(8, {
      clientId: 'task-5',
      url: 'https://example.com/file.zip',
      fileName: 'file.zip',
      progress: 145.4,
      status: DownloadTaskStatus.PENDING,
    });

    expect(downloadTaskRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'task-5',
        userId: 8,
        progress: 100,
      }),
    );
    expect(result).toBe(createdTask);
  });

  it('updates an existing task and forces completed state to 100 percent', async () => {
    const existingTask = {
      id: 9,
      clientId: 'task-9',
      userId: 2,
      url: 'magnet:?xt=urn:btih:test',
      fileName: 'Example',
      progress: 40,
      status: DownloadTaskStatus.DOWNLOADING,
    } as DownloadTask;

    downloadTaskRepository.findOne.mockResolvedValue(existingTask);
    downloadTaskRepository.save.mockImplementation(
      (task: DownloadTask): Promise<DownloadTask> => Promise.resolve(task),
    );

    const result = await service.updateMine(2, 'task-9', {
      status: DownloadTaskStatus.COMPLETED,
      progress: 52,
    });

    expect(downloadTaskRepository.findOne).toHaveBeenCalledWith({
      where: { userId: 2, clientId: 'task-9' },
      relations: ['mediaResource'],
    });
    const saveCalls = downloadTaskRepository.save.mock.calls as Array<[DownloadTask]>;
    const savedTask = saveCalls[0]?.[0];

    expect(savedTask).toBeDefined();
    if (!savedTask) {
      throw new Error('Expected updated task to be saved');
    }

    expect(savedTask.clientId).toBe('task-9');
    expect(savedTask.progress).toBe(100);
    expect(savedTask.status).toBe(DownloadTaskStatus.COMPLETED);
    expect(savedTask.completedAt).toBeInstanceOf(Date);
    expect(result.clientId).toBe('task-9');
    expect(result.progress).toBe(100);
    expect(result.status).toBe(DownloadTaskStatus.COMPLETED);
    expect(result.completedAt).toBeInstanceOf(Date);
  });

  it('reuses an existing magnet task when the infoHash matches but clientId differs', async () => {
    const existingMagnetTask = {
      id: 10,
      clientId: 'task-old',
      userId: 4,
      url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-a',
      fileName: '旧磁力任务',
      status: DownloadTaskStatus.PENDING,
      type: DownloadTaskType.MAGNET,
      progress: 0,
    } as DownloadTask;

    downloadTaskRepository.findOne.mockResolvedValue(null);
    downloadTaskRepository.find.mockResolvedValue([existingMagnetTask]);
    downloadTaskRepository.save.mockImplementation(
      (task: DownloadTask): Promise<DownloadTask> => Promise.resolve(task),
    );

    const result = await service.upsertMine(4, {
      clientId: 'task-new',
      url: 'magnet:?dn=Demo&xt=urn:btih:HASH-DEMO&tr=udp://tracker-b',
      fileName: '新磁力任务',
      type: DownloadTaskType.MAGNET,
      sourceLabel: '磁力页',
      status: DownloadTaskStatus.DOWNLOADING,
    });

    expect(downloadTaskRepository.create).not.toHaveBeenCalled();
    expect(downloadTaskRepository.find).toHaveBeenCalledWith({
      where: { userId: 4, type: DownloadTaskType.MAGNET },
    });
    expect(result.id).toBe(10);
    expect(result.clientId).toBe('task-new');
    expect(result.fileName).toBe('新磁力任务');
    expect(result.url).toContain('tracker-b');
    expect(result.status).toBe(DownloadTaskStatus.DOWNLOADING);
  });

  it('cleans up older duplicate magnet rows after saving the keeper task', async () => {
    const newestTask = {
      id: 21,
      clientId: 'task-newest',
      userId: 6,
      url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-b',
      fileName: '新磁力任务',
      status: DownloadTaskStatus.DOWNLOADING,
      type: DownloadTaskType.MAGNET,
      progress: 50,
    } as DownloadTask;
    const olderTask = {
      id: 20,
      clientId: 'task-older',
      userId: 6,
      url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-a',
      fileName: '旧磁力任务',
      status: DownloadTaskStatus.PENDING,
      type: DownloadTaskType.MAGNET,
      progress: 0,
    } as DownloadTask;

    downloadTaskRepository.findOne.mockResolvedValue(null);
    downloadTaskRepository.find.mockResolvedValue([newestTask, olderTask]);
    downloadTaskRepository.save.mockImplementation(
      (task: DownloadTask): Promise<DownloadTask> => Promise.resolve(task),
    );
    downloadTaskRepository.delete.mockResolvedValue({ affected: 1 });

    const result = await service.upsertMine(6, {
      clientId: 'task-fresh',
      url: 'magnet:?dn=Fresh&xt=urn:btih:hash-demo&tr=udp://tracker-c',
      fileName: '最新磁力任务',
      type: DownloadTaskType.MAGNET,
      status: DownloadTaskStatus.DOWNLOADING,
    });

    expect(result.id).toBe(21);
    expect(downloadTaskRepository.delete).toHaveBeenCalledWith([20]);
  });

  it('clears failed and cancelled tasks together', async () => {
    downloadTaskRepository.find.mockResolvedValue([
      {
        id: 71,
        userId: 5,
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-b',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.ERROR,
        updatedAt: new Date('2025-06-01T10:00:00.000Z'),
      },
      {
        id: 70,
        userId: 5,
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-a',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.COMPLETED,
        updatedAt: new Date('2025-06-01T09:00:00.000Z'),
      },
      {
        id: 72,
        userId: 5,
        url: 'https://example.com/direct.mp4',
        type: DownloadTaskType.DIRECT,
        status: DownloadTaskStatus.CANCELLED,
        updatedAt: new Date('2025-06-01T08:00:00.000Z'),
      },
    ] as DownloadTask[]);
    downloadTaskRepository.delete.mockResolvedValue({ affected: 3 });

    const result = await service.clearFailedMine(5);

    expect(downloadTaskRepository.delete).toHaveBeenCalledTimes(1);
    expect(downloadTaskRepository.delete).toHaveBeenCalledWith([71, 70, 72]);
    expect(result).toEqual({ deleted: 3 });
  });

  it('clears completed groups based on the latest visible snapshot', async () => {
    downloadTaskRepository.find.mockResolvedValue([
      {
        id: 81,
        userId: 6,
        url: 'magnet:?xt=urn:btih:hash-finished&tr=udp://tracker-b',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.COMPLETED,
        updatedAt: new Date('2025-06-02T10:00:00.000Z'),
      },
      {
        id: 80,
        userId: 6,
        url: 'magnet:?xt=urn:btih:hash-finished&tr=udp://tracker-a',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.ERROR,
        updatedAt: new Date('2025-06-02T09:00:00.000Z'),
      },
      {
        id: 82,
        userId: 6,
        url: 'https://example.com/pending.mp4',
        type: DownloadTaskType.DIRECT,
        status: DownloadTaskStatus.PENDING,
        updatedAt: new Date('2025-06-02T08:00:00.000Z'),
      },
    ] as DownloadTask[]);
    downloadTaskRepository.delete.mockResolvedValue({ affected: 2 });

    const result = await service.clearCompletedMine(6);

    expect(downloadTaskRepository.delete).toHaveBeenCalledWith([81, 80]);
    expect(result).toEqual({ deleted: 2 });
  });

  it('removes all duplicate magnet rows when deleting a visible magnet task', async () => {
    const visibleTask = {
      id: 51,
      clientId: 'task-visible',
      userId: 9,
      url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-b',
      type: DownloadTaskType.MAGNET,
      fileName: '当前磁力任务',
    } as DownloadTask;
    const hiddenTask = {
      id: 50,
      clientId: 'task-hidden',
      userId: 9,
      url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-a',
      type: DownloadTaskType.MAGNET,
      fileName: '旧磁力任务',
    } as DownloadTask;

    downloadTaskRepository.findOne.mockResolvedValue(visibleTask);
    downloadTaskRepository.find.mockResolvedValue([visibleTask, hiddenTask]);
    downloadTaskRepository.delete.mockResolvedValue({ affected: 2 });

    await service.removeMine(9, 'task-visible');

    expect(downloadTaskRepository.delete).toHaveBeenCalledWith([51, 50]);
    expect(downloadTaskRepository.remove).not.toHaveBeenCalled();
  });

  it('falls back to removing the single task when deleting a non-magnet task', async () => {
    const task = {
      id: 61,
      clientId: 'task-direct',
      userId: 10,
      url: 'https://example.com/video.mp4',
      type: DownloadTaskType.DIRECT,
      fileName: '直链任务',
    } as DownloadTask;

    downloadTaskRepository.findOne.mockResolvedValue(task);
    downloadTaskRepository.remove.mockResolvedValue(task);

    await service.removeMine(10, 'task-direct');

    expect(downloadTaskRepository.delete).not.toHaveBeenCalled();
    expect(downloadTaskRepository.remove).toHaveBeenCalledWith(task);
  });
});
