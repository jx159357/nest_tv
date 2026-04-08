import { Injectable } from '@nestjs/common';

export interface DanmakuFilterRules {
  sensitiveWords: string[];
  spamPatterns: string[];
  level: 'low' | 'medium' | 'high';
  autoBlock: boolean;
}

@Injectable()
export class DanmakuFilterRulesService {
  private readonly defaultRules: DanmakuFilterRules = {
    sensitiveWords: ['傻逼', '草泥马', '妈的', '操你', '傻叉'],
    spamPatterns: [
      'http[s]?:\\/\\/|www\\.',
      '(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)',
      '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}',
      '【.*?】.*?【.*?】',
      '关注.*?公众号.*?',
      '加.*?群.*?',
    ],
    level: 'medium',
    autoBlock: false,
  };

  private rules: DanmakuFilterRules = {
    sensitiveWords: [...this.defaultRules.sensitiveWords],
    spamPatterns: [...this.defaultRules.spamPatterns],
    level: this.defaultRules.level,
    autoBlock: this.defaultRules.autoBlock,
  };

  getRules(): DanmakuFilterRules {
    return {
      sensitiveWords: [...this.rules.sensitiveWords],
      spamPatterns: [...this.rules.spamPatterns],
      level: this.rules.level,
      autoBlock: this.rules.autoBlock,
    };
  }

  updateRules(nextRules: Partial<DanmakuFilterRules>): DanmakuFilterRules {
    this.rules = {
      sensitiveWords: nextRules.sensitiveWords
        ? [...nextRules.sensitiveWords]
        : this.rules.sensitiveWords,
      spamPatterns: nextRules.spamPatterns ? [...nextRules.spamPatterns] : this.rules.spamPatterns,
      level: nextRules.level ?? this.rules.level,
      autoBlock: nextRules.autoBlock ?? this.rules.autoBlock,
    };

    return this.getRules();
  }

  resetRules(): DanmakuFilterRules {
    this.rules = {
      sensitiveWords: [...this.defaultRules.sensitiveWords],
      spamPatterns: [...this.defaultRules.spamPatterns],
      level: this.defaultRules.level,
      autoBlock: this.defaultRules.autoBlock,
    };

    return this.getRules();
  }
}
