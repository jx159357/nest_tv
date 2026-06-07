import type { Repository } from 'typeorm';
import {
  DownloadTask,
  DownloadTaskStatus,
  DownloadTaskType,
} from '../entities/download-task.entity';
import { DownloadTasksService } from './download-tasks.service';

describe('DownloadTasksService', () => {
  const createMockQb = () => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getQuery: jest.fn().mockReturnValue('SELECT MAX(dt.id) FROM download_tasks dt'),
    getParameters: jest.fn().mockReturnValue({}),
    getMany: jest.fn().mockResolvedValue([]),
    getCount: jest.fn().mockResolvedValue(0),
    getRawOne: jest.fn().mockResolvedValue({ total: '0', active: '0', completed: '0', failed: '0' }),
  });

  let qbInstances: ReturnType<typeof createMockQb>[];

  const downloadTaskRepository = {
    createQueryBuilder: jest.fn(),
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
    qbInstances = [createMockQb(), createMockQb(), createMockQb(), createMockQb()];
    let callIndex = 0;
    downloadTaskRepository.createQueryBuilder.mockImplementation(() => qbInstances[callIndex++] || createMockQb());
    downloadTaskRepository.find.mockResolvedValue([]);
    downloadTaskRepository.findOne.mockResolvedValue(null);
    downloadTaskRepository.delete.mockResolvedValue({ affected: 0 });
  });

  it('applies filters and pagination when listing my tasks', async () => {
    const tasks = [{ id: 1, clientId: 'task-1' }] as DownloadTask[];
    qbInstances[2].getCount.mockResolvedValue(1);
    qbInstances[3].getMany.mockResolvedValue(tasks);

    const result = await service.findMine(7, {
      page: 1,
      limit: 2,
      status: DownloadTaskStatus.DOWNLOADING,
      type: DownloadTaskType.MAGNET,
      mediaResourceId: 11,
      search: ' magnet ',
    });

    expect(result).toEqual({
      data: tasks,
      total: 1,
      page: 1,
      limit: 2,
      totalPages: 1,
    });
    expect(qbInstances[2].andWhere).toHaveBeenCalledWith('downloadTask.status = :status', {
      status: DownloadTaskStatus.DOWNLOADING,
    });
    expect(qbInstances[2].andWhere).toHaveBeenCalledWith('downloadTask.type = :type', {
      type: DownloadTaskType.MAGNET,
    });
    expect(qbInstances[2].andWhere).toHaveBeenCalledWith(
      'downloadTask.mediaResourceId = :mediaResourceId',
      { mediaResourceId: 11 },
    );
  });

  it('deduplicates same-hash magnet tasks when listing my tasks', async () => {
    qbInstances[2].getCount.mockResolvedValue(1);
    qbInstances[3].getMany.mockResolvedValue([
      {
        id: 2,
        clientId: 'task-new',
        url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-b',
        type: DownloadTaskType.MAGNET,
        status: DownloadTaskStatus.DOWNLOADING,
      },
    ] as DownloadTask[]);

    const result = await service.findMine(7, { page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.clientId).toBe('task-new');
  });

  it('aggregates my task stats by status group using raw SQL', async () => {
    qbInstances[1].getRawOne.mockResolvedValue({
      total: '5',
      active: '2',
      completed: '1',
      failed: '2',
    });

    const result = await service.getMineStats(3);

    expect(result).toEqual({
      total: 5,
      active: 2,
      completed: 1,
      failed: 2,
    });
    expect(downloadTaskRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
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
    expect(result.progress).toBe(100);
    expect(result.status).toBe(DownloadTaskStatus.COMPLETED);
    expect(result.completedAt).toBeInstanceOf(Date);
  });

  it('reuses an existing magnet task when the dedupKey matches', async () => {
    const existingMagnetTask = {
      id: 10,
      clientId: 'task-old',
      userId: 4,
      url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-a',
      fileName: '旧磁力任务',
      status: DownloadTaskStatus.PENDING,
      type: DownloadTaskType.MAGNET,
      progress: 0,
      dedupKey: 'magnet:hash-demo',
    } as DownloadTask;

    downloadTaskRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existingMagnetTask);
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
    expect(result.id).toBe(10);
    expect(result.clientId).toBe('task-new');
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
      dedupKey: 'magnet:hash-demo',
    } as DownloadTask;

    downloadTaskRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(newestTask);
    downloadTaskRepository.find.mockResolvedValue([newestTask, { id: 20 } as DownloadTask]);
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

  it('removes all duplicate rows when deleting a task with dedupKey', async () => {
    const visibleTask = {
      id: 51,
      clientId: 'task-visible',
      userId: 9,
      url: 'magnet:?xt=urn:btih:hash-demo&tr=udp://tracker-b',
      type: DownloadTaskType.MAGNET,
      fileName: '当前磁力任务',
      dedupKey: 'magnet:hash-demo',
    } as DownloadTask;

    downloadTaskRepository.findOne.mockResolvedValue(visibleTask);
    downloadTaskRepository.find.mockResolvedValue([visibleTask, { id: 50 }]);
    downloadTaskRepository.delete.mockResolvedValue({ affected: 2 });

    await service.removeMine(9, 'task-visible');

    expect(downloadTaskRepository.delete).toHaveBeenCalledWith([51, 50]);
    expect(downloadTaskRepository.remove).not.toHaveBeenCalled();
  });

  it('falls back to removing the single task when deleting a task without dedupKey', async () => {
    const task = {
      id: 61,
      clientId: 'task-direct',
      userId: 10,
      url: 'https://example.com/video.mp4',
      type: DownloadTaskType.DIRECT,
      fileName: '直链任务',
      dedupKey: '',
    } as DownloadTask;

    downloadTaskRepository.findOne.mockResolvedValue(task);
    downloadTaskRepository.remove.mockResolvedValue(task);

    await service.removeMine(10, 'task-direct');

    expect(downloadTaskRepository.delete).not.toHaveBeenCalled();
    expect(downloadTaskRepository.remove).toHaveBeenCalledWith(task);
  });
});
