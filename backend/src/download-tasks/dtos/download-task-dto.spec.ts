import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DownloadTaskStatus } from '../../entities/download-task.entity';
import { CreateDownloadTaskDto } from './create-download-task.dto';
import { DownloadTaskQueryDto } from './download-task-query.dto';

describe('download-task DTOs', () => {
  it('transforms numeric query params before validation', () => {
    const dto = plainToInstance(DownloadTaskQueryDto, {
      page: '2',
      limit: '200',
      mediaResourceId: '11',
      status: DownloadTaskStatus.DOWNLOADING,
      search: 'magnet',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(200);
    expect(dto.mediaResourceId).toBe(11);
  });

  it('transforms numeric and date payload fields before validation', () => {
    const dto = plainToInstance(CreateDownloadTaskDto, {
      clientId: 'task-1',
      url: 'https://example.com/file.zip',
      fileName: 'file.zip',
      progress: '52',
      speed: '2048',
      downloaded: '1024',
      total: '4096',
      launchCount: '3',
      mediaResourceId: '9',
      status: DownloadTaskStatus.COMPLETED,
      lastLaunchedAt: '2025-01-02T03:04:05.000Z',
      completedAt: '2025-01-02T03:05:05.000Z',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.progress).toBe(52);
    expect(dto.speed).toBe(2048);
    expect(dto.downloaded).toBe(1024);
    expect(dto.total).toBe(4096);
    expect(dto.launchCount).toBe(3);
    expect(dto.mediaResourceId).toBe(9);
    expect(dto.lastLaunchedAt).toBeInstanceOf(Date);
    expect(dto.completedAt).toBeInstanceOf(Date);
  });
});
