import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { DanmakuSuggestionType, DanmakuSuggestionsQueryDto } from './danmaku-suggestions-query.dto';
import {
  DanmakuFilterRuleLevel,
  UpdateDanmakuFilterRulesDto,
} from './update-danmaku-filter-rules.dto';

describe('danmaku DTOs', () => {
  it('transforms and validates suggestion query params', () => {
    const dto = plainToInstance(DanmakuSuggestionsQueryDto, {
      videoId: 'video-1',
      mediaResourceId: '9',
      type: DanmakuSuggestionType.RELEVANT,
      limit: '5',
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.mediaResourceId).toBe(9);
    expect(dto.limit).toBe(5);
  });

  it('normalizes filter-rule string arrays before validation', () => {
    const dto = plainToInstance(UpdateDanmakuFilterRulesDto, {
      sensitiveWords: [' 剧透 ', '广告', '剧透'],
      spamPatterns: [' http ', '', 'http '],
      level: DanmakuFilterRuleLevel.HIGH,
      autoBlock: true,
    });

    const errors = validateSync(dto);

    expect(errors).toHaveLength(0);
    expect(dto.sensitiveWords).toEqual(['剧透', '广告']);
    expect(dto.spamPatterns).toEqual(['http']);
  });

  it('rejects unsupported suggestion type values', () => {
    const dto = plainToInstance(DanmakuSuggestionsQueryDto, {
      type: 'smart',
    });

    const errors = validateSync(dto);

    expect(errors.length).toBeGreaterThan(0);
  });
});
