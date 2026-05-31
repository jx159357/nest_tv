import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { IPTVChannel } from '../entities/iptv-channel.entity';
import { IPTVService } from './iptv.service';
import axios from 'axios';

export interface IptvSourceConfig {
  name: string;
  url: string;
  group?: string;
  enabled: boolean;
  updateInterval: number; // 小时
  lastUpdated?: Date;
  category?: string;
  description?: string;
}

export interface CollectionResult {
  sourceName: string;
  totalCollected: number;
  newChannels: number;
  updatedChannels: number;
  errors: string[];
  duration: number;
}

export interface BatchCollectionResult {
  totalSources: number;
  successSources: number;
  failedSources: number;
  totalChannels: number;
  newChannels: number;
  results: CollectionResult[];
  duration: number;
}

type ParsedChannel = {
  name: string;
  url: string;
  group: string;
  logo?: string;
  epgId?: string;
  language?: string;
  country?: string;
  streamFormat?: string;
};

/**
 * 预置的IPTV源配置
 */
const IPTV_SOURCES: IptvSourceConfig[] = [
  {
    name: 'fanmingming-live',
    url: 'https://live.fanmingming.com/tv/m3u/ipv6.m3u',
    group: '央视卫视',
    enabled: true,
    updateInterval: 24,
    category: 'cctv',
    description: 'fanmingming IPv6直播源',
  },
  {
    name: 'fanmingming-live-ipv4',
    url: 'https://live.fanmingming.com/tv/m3u/tv.m3u',
    group: '央视卫视',
    enabled: true,
    updateInterval: 24,
    category: 'cctv',
    description: 'fanmingming IPv4直播源',
  },
  {
    name: 'iptv-org',
    url: 'https://iptv-org.github.io/iptv/countries/cn.m3u',
    group: '国际频道',
    enabled: true,
    updateInterval: 48,
    category: 'international',
    description: 'iptv-org 中国频道',
  },
  {
    name: 'iptv-org-hk',
    url: 'https://iptv-org.github.io/iptv/countries/hk.m3u',
    group: '港澳台',
    enabled: true,
    updateInterval: 48,
    category: 'hk_tw',
    description: 'iptv-org 香港频道',
  },
  {
    name: 'iptv-org-tw',
    url: 'https://iptv-org.github.io/iptv/countries/tw.m3u',
    group: '港澳台',
    enabled: true,
    updateInterval: 48,
    category: 'hk_tw',
    description: 'iptv-org 台湾频道',
  },
];

@Injectable()
export class IptvSourceCollector {
  private readonly logger = new Logger(IptvSourceCollector.name);
  private sources: IptvSourceConfig[] = [...IPTV_SOURCES];

  constructor(
    @InjectRepository(IPTVChannel)
    private iptvChannelRepository: Repository<IPTVChannel>,
    private iptvService: IPTVService,
  ) {}

  /**
   * 获取所有源配置
   */
  getSources(): IptvSourceConfig[] {
    return this.sources;
  }

  /**
   * 添加自定义源
   */
  addSource(source: IptvSourceConfig): void {
    const existingIndex = this.sources.findIndex(s => s.name === source.name);
    if (existingIndex >= 0) {
      this.sources[existingIndex] = source;
    } else {
      this.sources.push(source);
    }
    this.logger.log(`添加/更新源: ${source.name}`);
  }

  /**
   * 删除源
   */
  removeSource(name: string): boolean {
    const index = this.sources.findIndex(s => s.name === name);
    if (index >= 0) {
      this.sources.splice(index, 1);
      this.logger.log(`删除源: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 启用/禁用源
   */
  toggleSource(name: string, enabled: boolean): boolean {
    const source = this.sources.find(s => s.name === name);
    if (source) {
      source.enabled = enabled;
      this.logger.log(`${enabled ? '启用' : '禁用'}源: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 从单个源收集频道
   */
  async collectFromSource(source: IptvSourceConfig): Promise<CollectionResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let totalCollected = 0;
    let newChannels = 0;
    let updatedChannels = 0;

    try {
      this.logger.log(`开始从源收集频道: ${source.name} (${source.url})`);

      // 获取M3U内容
      const response = await axios.get(source.url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const m3uContent = response.data;
      if (!m3uContent || typeof m3uContent !== 'string') {
        throw new Error('无效的M3U内容');
      }

      // 解析M3U内容
      const channels = this.dedupeChannels(this.parseM3UContent(m3uContent, source));
      totalCollected = channels.length;

      this.logger.log(`从 ${source.name} 解析到 ${channels.length} 个频道`);

      const urls = channels.map(channel => channel.url);
      const existingChannels =
        urls.length > 0
          ? await this.iptvChannelRepository.find({
              where: { url: In(urls) },
            })
          : [];
      const existingByUrl = new Map(existingChannels.map(channel => [channel.url, channel]));
      const channelsToSave: IPTVChannel[] = [];

      // 保存到数据库
      for (const channelData of channels) {
        try {
          const existing = existingByUrl.get(channelData.url);

          if (existing) {
            // 更新现有频道
            existing.sourceName = source.name;
            existing.sourceUrl = source.url;
            if (channelData.logo && !existing.logo) {
              existing.logo = channelData.logo;
            }
            if (channelData.epgId && !existing.epgId) {
              existing.epgId = channelData.epgId;
            }
            channelsToSave.push(existing);
            updatedChannels++;
          } else {
            // 创建新频道
            channelsToSave.push(
              this.iptvChannelRepository.create({
                ...channelData,
                sourceName: source.name,
                sourceUrl: source.url,
                qualityScore: 50, // 默认评分
                isActive: true,
              }),
            );
            newChannels++;
          }
        } catch (error: unknown) {
          const errorMsg = `保存频道失败 (${channelData.name}): ${
            error instanceof Error ? error.message : '未知错误'
          }`;
          errors.push(errorMsg);
          this.logger.warn(errorMsg);
        }
      }

      if (channelsToSave.length > 0) {
        await this.iptvChannelRepository.save(channelsToSave, { chunk: 100 });
      }

      // 更新源的最后更新时间
      source.lastUpdated = new Date();

      this.logger.log(`源 ${source.name} 收集完成: 新增 ${newChannels}, 更新 ${updatedChannels}`);
    } catch (error: unknown) {
      const errorMsg = `从源 ${source.name} 收集失败: ${
        error instanceof Error ? error.message : '未知错误'
      }`;
      errors.push(errorMsg);
      this.logger.error(errorMsg);
    }

    return {
      sourceName: source.name,
      totalCollected,
      newChannels,
      updatedChannels,
      errors,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 从所有启用的源收集频道
   */
  async collectFromAllSources(): Promise<BatchCollectionResult> {
    const startTime = Date.now();
    const enabledSources = this.sources.filter(s => s.enabled);
    const results: CollectionResult[] = [];
    let totalChannels = 0;
    let newChannels = 0;
    let successSources = 0;
    let failedSources = 0;

    this.logger.log(`开始从 ${enabledSources.length} 个源收集频道`);

    for (const source of enabledSources) {
      // 检查是否需要更新
      if (this.needsUpdate(source)) {
        const result = await this.collectFromSource(source);
        results.push(result);

        if (result.errors.length === 0) {
          successSources++;
        } else {
          failedSources++;
        }

        totalChannels += result.totalCollected;
        newChannels += result.newChannels;
      } else {
        this.logger.log(`源 ${source.name} 尚未到更新时间，跳过`);
      }
    }

    const duration = Date.now() - startTime;
    this.logger.log(
      `频道收集完成: ${successSources} 成功, ${failedSources} 失败, ` +
        `共 ${totalChannels} 个频道, ${newChannels} 个新增, 耗时 ${duration}ms`,
    );

    return {
      totalSources: enabledSources.length,
      successSources,
      failedSources,
      totalChannels,
      newChannels,
      results,
      duration,
    };
  }

  /**
   * 检查源是否需要更新
   */
  private needsUpdate(source: IptvSourceConfig): boolean {
    if (!source.lastUpdated) {
      return true;
    }

    const now = new Date();
    const lastUpdate = new Date(source.lastUpdated);
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

    return hoursSinceUpdate >= source.updateInterval;
  }

  /**
   * 解析M3U内容
   */
  private parseM3UContent(content: string, source: IptvSourceConfig): ParsedChannel[] {
    const channels: ParsedChannel[] = [];

    const lines = content
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('#EXTINF')) continue;

      const extinfLine = lines[i];
      const rawUrlLine = i + 1 < lines.length ? lines[i + 1] : '';
      const urlLine = this.normalizeStreamUrl(rawUrlLine);
      if (!urlLine || rawUrlLine.startsWith('#')) continue;

      // 解析EXTINF属性
      const tvgNameMatch = extinfLine.match(/tvg-name="([^"]*)"/);
      const tvgLogoMatch = extinfLine.match(/tvg-logo="([^"]*)"/);
      const groupMatch = extinfLine.match(/group-title="([^"]*)"/);
      const tvgIdMatch = extinfLine.match(/tvg-id="([^"]*)"/);
      const tvgLanguageMatch = extinfLine.match(/tvg-language="([^"]*)"/);
      const tvgCountryMatch = extinfLine.match(/tvg-country="([^"]*)"/);

      // 提取显示名称（逗号后面的部分）
      const commaIdx = extinfLine.lastIndexOf(',');
      const displayName = commaIdx >= 0 ? extinfLine.slice(commaIdx + 1).trim() : '';

      const name = tvgNameMatch?.[1] || displayName || `频道${channels.length + 1}`;
      const logo = tvgLogoMatch?.[1] || undefined;
      const group = groupMatch?.[1] || source.group || '未分组';
      const epgId = tvgIdMatch?.[1] || undefined;
      const language = tvgLanguageMatch?.[1] || undefined;
      const country = tvgCountryMatch?.[1] || undefined;

      // 判断流格式
      const isHls = urlLine.includes('.m3u8') || urlLine.includes('m3u8');

      channels.push({
        name,
        url: urlLine,
        group,
        logo,
        epgId,
        language,
        country,
        streamFormat: isHls ? 'hls' : 'unknown',
      });
    }

    return channels;
  }

  private normalizeStreamUrl(url: string): string | null {
    const normalized = url.trim();
    if (!normalized || normalized.startsWith('#')) {
      return null;
    }

    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      return null;
    }

    return normalized;
  }

  private dedupeChannels(channels: ParsedChannel[]): ParsedChannel[] {
    const seen = new Set<string>();
    const deduped: ParsedChannel[] = [];

    for (const channel of channels) {
      const key = channel.url;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      deduped.push(channel);
    }

    return deduped;
  }

  /**
   * 获取收集统计信息
   */
  async getCollectionStats(): Promise<{
    totalSources: number;
    enabledSources: number;
    totalChannels: number;
    channelsBySource: Record<string, number>;
    lastCollectionTime: Date | null;
  }> {
    const totalSources = this.sources.length;
    const enabledSources = this.sources.filter(s => s.enabled).length;

    // 统计各源的频道数量
    const channelsBySource: Record<string, number> = {};
    for (const source of this.sources) {
      const count = await this.iptvChannelRepository.count({
        where: { sourceName: source.name },
      });
      channelsBySource[source.name] = count;
    }

    const totalChannels = await this.iptvChannelRepository.count();

    // 获取最后更新时间
    const lastChannel = await this.iptvChannelRepository.findOne({
      where: {},
      order: { updatedAt: 'DESC' },
    });

    return {
      totalSources,
      enabledSources,
      totalChannels,
      channelsBySource,
      lastCollectionTime: lastChannel?.updatedAt || null,
    };
  }
}
