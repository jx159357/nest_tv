import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { WatchHistoryQueryDto } from './watch-history-query.dto';

describe('watch-history query DTO', () => {
  it('transforms numeric and boolean query params before validation', () => {
    const dto = plainToInstance(WatchHistoryQueryDto, {
      page: '2',
      limit: '10',
      userId: '7',
      mediaResourceId: '11',
      isCompleted: 'false',
      sortBy: 'createdAt',
      sortOrder: 'ASC',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(10);
    expect(dto.userId).toBe(7);
    expect(dto.mediaResourceId).toBe(11);
    expect(dto.isCompleted).toBe(false);
  });

  it('rejects unsupported sort fields', () => {
    const dto = plainToInstance(WatchHistoryQueryDto, {
      sortBy: 'rating',
      sortOrder: 'DOWN',
    });

    const errors = validateSync(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
