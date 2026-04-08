import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ReportDanmakuDto } from './report-danmaku.dto';

describe('report danmaku DTO', () => {
  it('trims valid report fields before validation', () => {
    const dto = plainToInstance(ReportDanmakuDto, {
      reason: '  剧透  ',
      description: '  提前透露了结局  ',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.reason).toBe('剧透');
    expect(dto.description).toBe('提前透露了结局');
  });

  it('rejects an empty report reason after trimming', () => {
    const dto = plainToInstance(ReportDanmakuDto, {
      reason: '   ',
    });

    const errors = validateSync(dto);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('drops an empty description instead of persisting whitespace', () => {
    const dto = plainToInstance(ReportDanmakuDto, {
      reason: '垃圾信息',
      description: '   ',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.description).toBeUndefined();
  });
});
