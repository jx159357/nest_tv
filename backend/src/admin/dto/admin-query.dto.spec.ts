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
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(20);
    expect(dto.userId).toBe(8);
    expect(dto.mediaResourceId).toBe(15);
  });

  it('rejects invalid admin log status values', () => {
    const dto = plainToInstance(AdminLogsQueryDto, {
      status: 'done',
    });

    const errors = validateSync(dto);

    expect(errors.length).toBeGreaterThan(0);
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
