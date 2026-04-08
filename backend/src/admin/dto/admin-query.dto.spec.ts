import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DownloadTaskStatus, DownloadTaskType } from '../../entities/download-task.entity';
import {
  AdminDownloadTasksQueryDto,
  AdminLogsQueryDto,
  AdminPlaySourcesQueryDto,
} from './admin-query.dto';

describe('admin query DTOs', () => {
  it('transforms numeric and enum download-task query params before validation', () => {
    const dto = plainToInstance(AdminDownloadTasksQueryDto, {
      page: '2',
      limit: '20',
      status: DownloadTaskStatus.DOWNLOADING,
      type: DownloadTaskType.MAGNET,
      userId: '8',
      mediaResourceId: '15',
      search: 'demo',
      clientId: 'task-21',
      hash: 'hash-demo',
      taskId: '21',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(20);
    expect(dto.userId).toBe(8);
    expect(dto.mediaResourceId).toBe(15);
    expect(dto.clientId).toBe('task-21');
    expect(dto.hash).toBe('hash-demo');
    expect(dto.taskId).toBe(21);
  });

  it('rejects invalid admin log status values', () => {
    const dto = plainToInstance(AdminLogsQueryDto, {
      status: 'done',
    });

    const errors = validateSync(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('transforms numeric download-task log metadata filters before validation', () => {
    const dto = plainToInstance(AdminLogsQueryDto, {
      action: 'retry',
      resource: 'download_task',
      clientId: 'task-21',
      hash: 'hash-demo',
      downloadTaskId: '21',
      logId: '7',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.downloadTaskId).toBe(21);
    expect(dto.hash).toBe('hash-demo');
    expect(dto.logId).toBe(7);
  });

  it('rejects unsupported play-source sort values', () => {
    const dto = plainToInstance(AdminPlaySourcesQueryDto, {
      sortBy: 'updatedAt',
      sortOrder: 'DOWN',
    });

    const errors = validateSync(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
