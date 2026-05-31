import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IPTVChannel } from '../entities/iptv-channel.entity';
import axios from 'axios';

export interface EpgProgram {
  start: number;
  end: number;
  title: string;
  description?: string;
  category?: string;
}

export interface EpgSource {
  name: string;
  url: string;
  enabled: boolean;
  lastUpdated?: Date;
}

export interface ChannelEpg {
  channelId: number;
  channelName: string;
  epgId: string | null;
  programs: EpgProgram[];
  lastUpdated: Date;
}

/**
 * 预置的EPG源
 */
const EPG_SOURCES: EpgSource[] = [
  {
    name: 'epg-112114',
    url: 'https://epg.112114.xyz/api/pp.xml',
    enabled: true,
  },
  {
    name: 'epg-iptv-org',
    url: 'https://iptv-org.github.io/epg/guides/cn.epg',
    enabled: true,
  },
];

@Injectable()
export class EpgService {
  private readonly logger = new Logger(EpgService.name);
  private epgSources: EpgSource[] = [...EPG_SOURCES];
  private epgCache: Map<string, { data: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 6 * 60 * 60 * 1000; // 6小时缓存

  constructor(
    @InjectRepository(IPTVChannel)
    private iptvChannelRepository: Repository<IPTVChannel>,
  ) {}

  /**
   * 获取EPG源列表
   */
  getEpgSources(): EpgSource[] {
    return this.epgSources;
  }

  /**
   * 添加EPG源
   */
  addEpgSource(source: EpgSource): void {
    const existingIndex = this.epgSources.findIndex(s => s.name === source.name);
    if (existingIndex >= 0) {
      this.epgSources[existingIndex] = source;
    } else {
      this.epgSources.push(source);
    }
    this.logger.log(`添加/更新EPG源: ${source.name}`);
  }

  /**
   * 删除EPG源
   */
  removeEpgSource(name: string): boolean {
    const index = this.epgSources.findIndex(s => s.name === name);
    if (index >= 0) {
      this.epgSources.splice(index, 1);
      this.logger.log(`删除EPG源: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 获取频道节目单
   */
  async getChannelEpg(channelId: number, days: number = 7): Promise<ChannelEpg> {
    const channel = await this.iptvChannelRepository.findOne({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error(`频道不存在: ${channelId}`);
    }

    const epgId = channel.epgId || channel.name;
    const programs: EpgProgram[] = [];

    // 从所有启用的EPG源获取节目单
    for (const source of this.epgSources.filter(s => s.enabled)) {
      try {
        const xml = await this.fetchEpgXml(source.url);
        const sourcePrograms = this.parseEpgXml(xml, epgId, days);
        programs.push(...sourcePrograms);
      } catch (error: unknown) {
        this.logger.warn(
          `从EPG源 ${source.name} 获取节目单失败: ${
            error instanceof Error ? error.message : '未知错误'
          }`,
        );
      }
    }

    // 去重并排序
    const uniquePrograms = this.deduplicatePrograms(programs);
    uniquePrograms.sort((a, b) => a.start - b.start);

    return {
      channelId,
      channelName: channel.name,
      epgId,
      programs: uniquePrograms,
      lastUpdated: new Date(),
    };
  }

  /**
   * 批量获取频道节目单
   */
  async getBatchChannelEpg(channelIds: number[], days: number = 7): Promise<ChannelEpg[]> {
    const results: ChannelEpg[] = [];

    for (const channelId of channelIds) {
      try {
        const epg = await this.getChannelEpg(channelId, days);
        results.push(epg);
      } catch (error: unknown) {
        this.logger.warn(
          `获取频道 ${channelId} 节目单失败: ${
            error instanceof Error ? error.message : '未知错误'
          }`,
        );
      }
    }

    return results;
  }

  /**
   * 获取当前正在播放的节目
   */
  async getCurrentProgram(channelId: number): Promise<EpgProgram | null> {
    const epg = await this.getChannelEpg(channelId, 1);
    const now = Date.now();

    return epg.programs.find(p => p.start <= now && p.end > now) || null;
  }

  /**
   * 获取接下来的节目
   */
  async getUpcomingPrograms(channelId: number, count: number = 5): Promise<EpgProgram[]> {
    const epg = await this.getChannelEpg(channelId, 1);
    const now = Date.now();

    return epg.programs.filter(p => p.start > now).slice(0, count);
  }

  /**
   * 导出XMLTV格式
   */
  async exportXmltv(channelIds?: number[]): Promise<string> {
    let channels: IPTVChannel[];

    if (channelIds && channelIds.length > 0) {
      channels = await this.iptvChannelRepository.findByIds(channelIds);
    } else {
      channels = await this.iptvChannelRepository.find({
        where: { isActive: true },
      });
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<!DOCTYPE tv SYSTEM "xmltv.dtd">\n';
    xml += '<tv generator-info-name="nest-tv-epg">\n';

    // 频道信息
    for (const channel of channels) {
      xml += `  <channel id="${this.escapeXml(channel.epgId || channel.name)}">\n`;
      xml += `    <display-name>${this.escapeXml(channel.name)}</display-name>\n`;
      if (channel.logo) {
        xml += `    <icon src="${this.escapeXml(channel.logo)}" />\n`;
      }
      xml += '  </channel>\n';
    }

    // 节目信息
    for (const channel of channels) {
      try {
        const epg = await this.getChannelEpg(channel.id, 7);
        for (const program of epg.programs) {
          xml += `  <programme start="${this.formatEpgTime(program.start)}" stop="${this.formatEpgTime(program.end)}" channel="${this.escapeXml(channel.epgId || channel.name)}">\n`;
          xml += `    <title>${this.escapeXml(program.title)}</title>\n`;
          if (program.description) {
            xml += `    <desc>${this.escapeXml(program.description)}</desc>\n`;
          }
          if (program.category) {
            xml += `    <category>${this.escapeXml(program.category)}</category>\n`;
          }
          xml += '  </programme>\n';
        }
      } catch {
        // 跳过获取失败的频道
      }
    }

    xml += '</tv>';
    return xml;
  }

  /**
   * 获取EPG数据（带缓存）
   */
  private async fetchEpgXml(url: string): Promise<string> {
    // 检查缓存
    const cached = this.epgCache.get(url);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // 获取新数据
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      responseType: 'text',
    });

    const data = String(response.data);

    // 更新缓存
    this.epgCache.set(url, {
      data,
      timestamp: Date.now(),
    });

    return data;
  }

  /**
   * 解析EPG XML
   */
  private parseEpgXml(xml: string, channelId: string, days: number = 7): EpgProgram[] {
    const programs: EpgProgram[] = [];
    const channelLower = channelId.toLowerCase();
    const now = Date.now();
    const endTime = now + days * 24 * 60 * 60 * 1000;

    // 匹配programme标签
    const programmeRegex =
      /<programme[^>]*start="([^"]*)"[^>]*stop="([^"]*)"[^>]*channel="([^"]*)"[^>]*>([\s\S]*?)<\/programme>/gi;
    let match: RegExpExecArray | null;

    while ((match = programmeRegex.exec(xml)) !== null) {
      const progChannel = (match[3] || '').toLowerCase();

      // 匹配频道（模糊匹配）
      if (!this.isChannelMatch(progChannel, channelLower)) {
        continue;
      }

      const start = this.parseEpgTime(match[1]);
      const end = this.parseEpgTime(match[2]);

      // 只返回指定时间范围内的节目
      if (start > endTime || end < now) {
        continue;
      }

      const content = match[4];
      const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const descMatch = content.match(/<desc[^>]*>([\s\S]*?)<\/desc>/i);
      const categoryMatch = content.match(/<category[^>]*>([\s\S]*?)<\/category>/i);

      programs.push({
        start,
        end,
        title: titleMatch ? titleMatch[1].trim() : '未知节目',
        description: descMatch ? descMatch[1].trim() : undefined,
        category: categoryMatch ? categoryMatch[1].trim() : undefined,
      });
    }

    return programs;
  }

  /**
   * 频道名称匹配
   */
  private isChannelMatch(epgChannel: string, channelName: string): boolean {
    // 完全匹配
    if (epgChannel === channelName) {
      return true;
    }

    // 包含匹配
    if (epgChannel.includes(channelName) || channelName.includes(epgChannel)) {
      return true;
    }

    // 去除常见后缀后匹配
    const cleanEpg = epgChannel.replace(/(高清|标清|hd|sd|fhd)$/i, '').trim();
    const cleanName = channelName.replace(/(高清|标清|hd|sd|fhd)$/i, '').trim();

    return cleanEpg === cleanName || cleanEpg.includes(cleanName) || cleanName.includes(cleanEpg);
  }

  /**
   * 解析EPG时间格式
   */
  private parseEpgTime(raw: string): number {
    if (!raw) return 0;
    const clean = raw.replace(/\s/g, '');
    const m = clean.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    if (!m) return 0;
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])).getTime();
  }

  /**
   * 格式化EPG时间
   */
  private formatEpgTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date
      .toISOString()
      .replace(/[-:T]/g, '')
      .replace(/\.\d{3}Z/, ' +0000');
  }

  /**
   * 去重节目
   */
  private deduplicatePrograms(programs: EpgProgram[]): EpgProgram[] {
    const seen = new Set<string>();
    return programs.filter(p => {
      const key = `${p.start}-${p.end}-${p.title}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * XML转义
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.epgCache.clear();
    this.logger.log('EPG缓存已清除');
  }

  /**
   * 获取缓存状态
   */
  getCacheStatus(): { size: number; entries: Array<{ url: string; age: number }> } {
    const entries: Array<{ url: string; age: number }> = [];
    const now = Date.now();

    this.epgCache.forEach((value, url) => {
      entries.push({
        url,
        age: now - value.timestamp,
      });
    });

    return {
      size: this.epgCache.size,
      entries,
    };
  }
}
