import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import axios from 'axios';
import { CacheService } from '../common/cache/cache.service';
import { Cacheable, CacheEvict } from '../common/decorators/cache.decorator';

export interface LogoMatchResult {
  channelId: number;
  channelName: string;
  logoUrl: string | null;
  matched: boolean;
}

export interface LogoData {
  id: number;
  name: string;
  url: string;
  category: string | null;
  country: string | null;
  region: string | null;
  isVerified: boolean;
  isActive: boolean;
  usageCount: number;
  source: string | null;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryStatRow {
  category: string | null;
  count: number;
}

const PRESET_LOGOS: Array<{ name: string; url: string; category: string; aliases?: string[] }> = [
  {
    name: 'CCTV-1 综合',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv1.png',
    category: 'cctv',
    aliases: ['CCTV1', '央视一套', '央视综合'],
  },
  {
    name: 'CCTV-2 财经',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv2.png',
    category: 'cctv',
    aliases: ['CCTV2', '央视二套', '央视财经'],
  },
  {
    name: 'CCTV-3 综艺',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv3.png',
    category: 'cctv',
    aliases: ['CCTV3', '央视三套', '央视综艺'],
  },
  {
    name: 'CCTV-4 中文国际',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv4.png',
    category: 'cctv',
    aliases: ['CCTV4', '央视四套', '央视国际'],
  },
  {
    name: 'CCTV-5 体育',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv5.png',
    category: 'cctv',
    aliases: ['CCTV5', '央视五套', '央视体育'],
  },
  {
    name: 'CCTV-6 电影',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv6.png',
    category: 'cctv',
    aliases: ['CCTV6', '央视六套', '央视电影'],
  },
  {
    name: 'CCTV-7 国防军事',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv7.png',
    category: 'cctv',
    aliases: ['CCTV7', '央视七套', '央视军事'],
  },
  {
    name: 'CCTV-8 电视剧',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv8.png',
    category: 'cctv',
    aliases: ['CCTV8', '央视八套', '央视电视剧'],
  },
  {
    name: 'CCTV-9 纪录',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv9.png',
    category: 'cctv',
    aliases: ['CCTV9', '央视九套', '央视纪录'],
  },
  {
    name: 'CCTV-10 科教',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv10.png',
    category: 'cctv',
    aliases: ['CCTV10', '央视十套', '央视科教'],
  },
  {
    name: 'CCTV-11 戏曲',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv11.png',
    category: 'cctv',
    aliases: ['CCTV11', '央视十一套', '央视戏曲'],
  },
  {
    name: 'CCTV-12 社会与法',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv12.png',
    category: 'cctv',
    aliases: ['CCTV12', '央视十二套', '央视社会与法'],
  },
  {
    name: 'CCTV-13 新闻',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv13.png',
    category: 'cctv',
    aliases: ['CCTV13', '央视十三套', '央视新闻'],
  },
  {
    name: 'CCTV-14 少儿',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv14.png',
    category: 'cctv',
    aliases: ['CCTV14', '央视十四套', '央视少儿'],
  },
  {
    name: 'CCTV-15 音乐',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv15.png',
    category: 'cctv',
    aliases: ['CCTV15', '央视十五套', '央视音乐'],
  },
  {
    name: 'CCTV-16 奥林匹克',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv16.png',
    category: 'cctv',
    aliases: ['CCTV16', '央视十六套', '央视奥林匹克'],
  },
  {
    name: 'CCTV-17 农业农村',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/cctv17.png',
    category: 'cctv',
    aliases: ['CCTV17', '央视十七套', '央视农业农村'],
  },
  {
    name: '湖南卫视',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/hunan.png',
    category: 'satellite',
    aliases: ['芒果台'],
  },
  {
    name: '浙江卫视',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/zhejiang.png',
    category: 'satellite',
    aliases: ['蓝台'],
  },
  {
    name: '东方卫视',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/dongfang.png',
    category: 'satellite',
    aliases: ['番茄台'],
  },
  {
    name: '江苏卫视',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/jiangsu.png',
    category: 'satellite',
    aliases: ['荔枝台'],
  },
  {
    name: '北京卫视',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/beijing.png',
    category: 'satellite',
    aliases: [],
  },
  {
    name: '天津卫视',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/tianjin.png',
    category: 'satellite',
    aliases: [],
  },
  {
    name: '山东卫视',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/shandong.png',
    category: 'satellite',
    aliases: [],
  },
  {
    name: '广东卫视',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/guangdong.png',
    category: 'satellite',
    aliases: [],
  },
  {
    name: '深圳卫视',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/shenzhen.png',
    category: 'satellite',
    aliases: [],
  },
  {
    name: '湖北卫视',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/hubei.png',
    category: 'satellite',
    aliases: [],
  },
  {
    name: '安徽卫视',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/anhui.png',
    category: 'satellite',
    aliases: [],
  },
  {
    name: '河北卫视',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/hebei.png',
    category: 'satellite',
    aliases: [],
  },
  {
    name: '重庆卫视',
    url: 'https://raw.githubusercontent.com/fanmingming/live/main/tv/chongqing.png',
    category: 'satellite',
    aliases: [],
  },
];

function parseAliases(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toStringValue(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'string') return raw;
  if (
    typeof raw === 'number' ||
    typeof raw === 'boolean' ||
    typeof raw === 'bigint' ||
    typeof raw === 'symbol'
  ) {
    return raw.toString();
  }
  if (raw instanceof Date) return raw.toISOString();

  return JSON.stringify(raw) ?? '';
}

function toNullableString(raw: unknown): string | null {
  const value = toStringValue(raw).trim();
  return value || null;
}

function mapRow(row: Record<string, unknown>): LogoData {
  return {
    id: Number(row.id),
    name: toStringValue(row.name),
    url: toStringValue(row.url),
    category: toNullableString(row.category),
    country: toNullableString(row.country),
    region: toNullableString(row.region),
    isVerified: Boolean(row.isVerified),
    isActive: Boolean(row.isActive),
    usageCount: Number(row.usageCount),
    source: toNullableString(row.source),
    aliases: parseAliases(row.aliases),
    createdAt: toStringValue(row.createdAt),
    updatedAt: toStringValue(row.updatedAt),
  };
}

@Injectable()
export class ChannelLogoService {
  private readonly logger = new Logger(ChannelLogoService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
  ) {}

  async initPresetLogos(): Promise<number> {
    let count = 0;
    for (const preset of PRESET_LOGOS) {
      const existing = await this.dataSource.query<Record<string, unknown>[]>(
        'SELECT * FROM channel_logos WHERE name = ? LIMIT 1',
        [preset.name],
      );
      if (existing.length === 0) {
        await this.dataSource.query(
          'INSERT INTO channel_logos (name, url, category, aliases, isVerified, isActive, usageCount, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            preset.name,
            preset.url,
            preset.category,
            JSON.stringify(preset.aliases || []),
            true,
            true,
            0,
            'preset',
          ],
        );
        count++;
      }
    }
    this.logger.log(`初始化 ${count} 个预置台标`);
    return count;
  }

  @Cacheable({
    keyGenerator: (...args: unknown[]) => `logo:all:${(args[0] as string) || 'all'}`,
    ttl: 1800,
  })
  async findAll(category?: string): Promise<LogoData[]> {
    let sql = 'SELECT * FROM channel_logos WHERE isActive = 1';
    const params: unknown[] = [];
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY name ASC';
    const rows = await this.dataSource.query<Record<string, unknown>[]>(sql, params);
    return rows.map(mapRow);
  }

  async search(keyword: string): Promise<LogoData[]> {
    const rows = await this.dataSource.query<Record<string, unknown>[]>(
      'SELECT * FROM channel_logos WHERE isActive = 1 AND (name LIKE ? OR aliases LIKE ?) ORDER BY usageCount DESC',
      [`%${keyword}%`, `%${keyword}%`],
    );
    return rows.map(mapRow);
  }

  @CacheEvict({ all: true, key: 'logo:*' })
  async create(data: Record<string, unknown>): Promise<LogoData> {
    const name = toStringValue(data.name);
    const url = toStringValue(data.url);
    const category = toNullableString(data.category);
    const aliases = Array.isArray(data.aliases) ? JSON.stringify(data.aliases) : '[]';
    const source = toNullableString(data.source);
    const result = await this.dataSource.query<{ insertId: number }>(
      'INSERT INTO channel_logos (name, url, category, aliases, isVerified, isActive, usageCount, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, url, category, aliases, false, true, 0, source],
    );
    const rows = await this.dataSource.query<Record<string, unknown>[]>(
      'SELECT * FROM channel_logos WHERE id = ?',
      [result[0].insertId],
    );
    return mapRow(rows[0]);
  }

  @CacheEvict({ all: true, key: 'logo:*' })
  async update(id: number, data: Record<string, unknown>): Promise<LogoData> {
    const existing = await this.dataSource.query<Record<string, unknown>[]>(
      'SELECT * FROM channel_logos WHERE id = ?',
      [id],
    );
    if (existing.length === 0) {
      throw new NotFoundException('台标不存在');
    }
    const fields: string[] = [];
    const params: unknown[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (key === 'aliases' && Array.isArray(value)) {
        fields.push(`${key} = ?`);
        params.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }
    if (fields.length > 0) {
      params.push(id);
      await this.dataSource.query(
        `UPDATE channel_logos SET ${fields.join(', ')} WHERE id = ?`,
        params,
      );
    }
    const rows = await this.dataSource.query<Record<string, unknown>[]>(
      'SELECT * FROM channel_logos WHERE id = ?',
      [id],
    );
    return mapRow(rows[0]);
  }

  @CacheEvict({ all: true, key: 'logo:*' })
  async remove(id: number): Promise<void> {
    const existing = await this.dataSource.query<Record<string, unknown>[]>(
      'SELECT * FROM channel_logos WHERE id = ?',
      [id],
    );
    if (existing.length === 0) {
      throw new NotFoundException('台标不存在');
    }
    await this.dataSource.query('DELETE FROM channel_logos WHERE id = ?', [id]);
  }

  async matchLogosForChannels(): Promise<LogoMatchResult[]> {
    const channels = await this.dataSource.query<Record<string, unknown>[]>(
      'SELECT id, name, logo, isActive FROM iptv_channels WHERE isActive = 1',
    );
    const logos = await this.dataSource.query<Record<string, unknown>[]>(
      'SELECT * FROM channel_logos WHERE isActive = 1',
    );
    const parsedLogos = logos.map(mapRow);
    const results: LogoMatchResult[] = [];

    for (const channel of channels) {
      const matchedLogo = this.findBestMatch(String(channel.name), parsedLogos);
      if (matchedLogo) {
        await this.dataSource.query('UPDATE iptv_channels SET logo = ? WHERE id = ?', [
          matchedLogo.url,
          channel.id,
        ]);
        await this.dataSource.query(
          'UPDATE channel_logos SET usageCount = usageCount + 1 WHERE id = ?',
          [matchedLogo.id],
        );
        results.push({
          channelId: Number(channel.id),
          channelName: String(channel.name),
          logoUrl: matchedLogo.url,
          matched: true,
        });
      } else {
        results.push({
          channelId: Number(channel.id),
          channelName: String(channel.name),
          logoUrl: null,
          matched: false,
        });
      }
    }

    const matchedCount = results.filter(r => r.matched).length;
    this.logger.log(`台标匹配完成: ${matchedCount}/${channels.length} 个频道匹配成功`);
    return results;
  }

  private findBestMatch(channelName: string, logos: LogoData[]): LogoData | null {
    const normalizedName = this.normalizeChannelName(channelName);
    for (const logo of logos) {
      if (this.normalizeChannelName(logo.name) === normalizedName) return logo;
    }
    for (const logo of logos) {
      for (const alias of logo.aliases) {
        if (this.normalizeChannelName(alias) === normalizedName) return logo;
      }
    }
    for (const logo of logos) {
      const logoName = this.normalizeChannelName(logo.name);
      if (normalizedName.includes(logoName) || logoName.includes(normalizedName)) return logo;
    }
    return null;
  }

  private normalizeChannelName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[-_]/g, '')
      .replace(/(高清|标清|hd|sd|fhd|超清|4k)$/i, '')
      .replace(/(频道|台)$/i, '')
      .trim();
  }

  @Cacheable({ key: 'logo:stats', ttl: 1800 })
  async getStats(): Promise<{
    totalLogos: number;
    verifiedLogos: number;
    categories: Record<string, number>;
    mostUsed: LogoData[];
  }> {
    const totalResult = await this.dataSource.query<{ cnt: number }[]>(
      'SELECT COUNT(*) as cnt FROM channel_logos WHERE isActive = 1',
    );
    const verifiedResult = await this.dataSource.query<{ cnt: number }[]>(
      'SELECT COUNT(*) as cnt FROM channel_logos WHERE isVerified = 1 AND isActive = 1',
    );
    const categoryStats = await this.dataSource.query<CategoryStatRow[]>(
      'SELECT category, COUNT(*) as count FROM channel_logos WHERE isActive = 1 GROUP BY category',
    );
    const categories: Record<string, number> = {};
    for (const stat of categoryStats) {
      categories[stat.category || '未分类'] = Number(stat.count);
    }
    const mostUsedRows = await this.dataSource.query<Record<string, unknown>[]>(
      'SELECT * FROM channel_logos WHERE isActive = 1 ORDER BY usageCount DESC LIMIT 10',
    );
    return {
      totalLogos: Number(totalResult[0].cnt),
      verifiedLogos: Number(verifiedResult[0].cnt),
      categories,
      mostUsed: mostUsedRows.map(mapRow),
    };
  }

  async verifyLogoUrl(url: string): Promise<boolean> {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const contentType = response.headers['content-type'] || '';
      return response.status >= 200 && response.status < 400 && contentType.startsWith('image/');
    } catch {
      return false;
    }
  }

  async verifyAllLogos(): Promise<{ verified: number; failed: number }> {
    const logos = await this.dataSource.query<Record<string, unknown>[]>(
      'SELECT * FROM channel_logos WHERE isActive = 1',
    );
    let verified = 0;
    let failed = 0;
    for (const logo of logos) {
      const logoData = mapRow(logo);
      const isValid = await this.verifyLogoUrl(logoData.url);
      await this.dataSource.query('UPDATE channel_logos SET isVerified = ? WHERE id = ?', [
        isValid,
        logoData.id,
      ]);
      if (isValid) {
        verified++;
      } else {
        failed++;
        this.logger.warn(`台标验证失败: ${logoData.name} (${logoData.url})`);
      }
    }
    return { verified, failed };
  }
}
