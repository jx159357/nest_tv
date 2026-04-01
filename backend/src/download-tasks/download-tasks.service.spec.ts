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
    getManyAndCount: jest.fn(),
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
  });

  it('applies filters and pagination when listing my tasks', async () => {
    const tasks = [{ id: 1, clientId: 'task-1' }] as DownloadTask[];
    queryBuilder.getManyAndCount.mockResolvedValue([tasks, 3]);

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
    expect(queryBuilder.skip).toHaveBeenCalledWith(2);
    expect(queryBuilder.take).toHaveBeenCalledWith(2);
    expect(result).toEqual({
      data: tasks,
      total: 3,
      page: 2,
      limit: 2,
      totalPages: 2,
    });
  });

  it('aggregates my task stats by status group', async () => {
    downloadTaskRepository.find.mockResolvedValue([
      { status: DownloadTaskStatus.PENDING },
      { status: DownloadTaskStatus.DOWNLOADING },
      { status: DownloadTaskStatus.COMPLETED },
      { status: DownloadTaskStatus.ERROR },
      { status: DownloadTaskStatus.CANCELLED },
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
});
