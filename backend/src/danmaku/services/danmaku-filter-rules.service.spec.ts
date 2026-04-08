import { DanmakuFilterRulesService } from './danmaku-filter-rules.service';

describe('DanmakuFilterRulesService', () => {
  it('returns a mutable in-memory rules snapshot and applies updates', () => {
    const service = new DanmakuFilterRulesService();

    const initialRules = service.getRules();
    expect(initialRules.level).toBe('medium');
    expect(initialRules.sensitiveWords.length).toBeGreaterThan(0);

    const updatedRules = service.updateRules({
      sensitiveWords: ['剧透'],
      level: 'high',
      autoBlock: true,
    });

    expect(updatedRules).toEqual({
      sensitiveWords: ['剧透'],
      spamPatterns: initialRules.spamPatterns,
      level: 'high',
      autoBlock: true,
    });
    expect(service.getRules()).toEqual(updatedRules);
  });
});
