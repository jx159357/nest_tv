import { Injectable, HttpException, HttpStatus, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import type { Response } from 'express';
import { IPTVChannel } from '../entities/iptv-channel.entity';
import { CreateIPTVChannelDto } from './dto/create-iptv-channel.dto';
import { UpdateIPTVChannelDto } from './dto/update-iptv-channel.dto';
import { IPTVChannelQueryDto } from './dto/iptv-channel-query.dto';
import axios from 'axios';
import * as m3u8Parser from 'm3u8-parser';

interface GroupRow {
  group?: string | null;
}

interface M3UPlaylistAttributes {
  'tvg-name'?: string;
  'group-title'?: string;
  'tvg-logo'?: string;
  'tvg-language'?: string;
  'tvg-country'?: string;
  'tvg-id'?: string;
  channelName?: string;
}

interface M3UPlaylist {
  uri?: string;
  attributes?: M3UPlaylistAttributes;
}

interface M3USegment {
  uri?: string;
  duration?: number;
  title?: string;
}

interface M3UManifest {
  playlists?: M3UPlaylist[];
  segments?: M3USegment[];
}

interface M3U8ParserInstance {
  manifest: M3UManifest;
  push(input: string): void;
  end(): void;
}

@Injectable()
export class IPTVService {
  private readonly logger = new Logger(IPTVService.name);

  constructor(
    @InjectRepository(IPTVChannel)
    private iptvChannelRepository: Repository<IPTVChannel>,
  ) {}

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  /**
   * 创建IPTV频道
   */
  async create(createIPTVChannelDto: CreateIPTVChannelDto): Promise<IPTVChannel> {
    const iptvChannel = this.iptvChannelRepository.create(createIPTVChannelDto);
    return await this.iptvChannelRepository.save(iptvChannel);
  }

  /**
   * 分页查询IPTV频道
   */
  async findAll(queryDto: IPTVChannelQueryDto): Promise<{
    data: IPTVChannel[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page: rawPage = 1,
      limit: rawLimit = 10,
      group,
      language,
      country,
      region,
      resolution,
      streamFormat,
      activeOnly = true,
      isLive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      search,
    } = queryDto;

    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 10;

    const queryBuilder = this.iptvChannelRepository.createQueryBuilder('iptv');

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(iptv.name LIKE :search OR iptv.description LIKE :search OR iptv.group LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 分组过滤
    if (group) {
      queryBuilder.andWhere('iptv.group = :group', { group });
    }

    // 语言过滤
    if (language) {
      queryBuilder.andWhere('iptv.language = :language', { language });
    }

    // 国家过滤
    if (country) {
      queryBuilder.andWhere('iptv.country = :country', { country });
    }

    // 地区过滤
    if (region) {
      queryBuilder.andWhere('iptv.region = :region', { region });
    }

    // 分辨率过滤
    if (resolution) {
      queryBuilder.andWhere('iptv.resolution = :resolution', { resolution });
    }

    // 流媒体格式过滤
    if (streamFormat) {
      queryBuilder.andWhere('iptv.streamFormat = :streamFormat', { streamFormat });
    }

    // 直播状态过滤
    if (isLive !== undefined) {
      queryBuilder.andWhere('iptv.isLive = :isLive', { isLive });
    }

    // 只查询可用的频道
    if (activeOnly) {
      queryBuilder.andWhere('iptv.isActive = :isActive', { isActive: true });
    }

    // 排序
    const validSortFields = ['id', 'name', 'group', 'viewCount', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`iptv.${sortField}`, sortOrder);

    // 分页
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 根据ID查找IPTV频道
   */
  async findById(id: number): Promise<IPTVChannel> {
    const iptvChannel = await this.iptvChannelRepository.findOne({
      where: { id },
    });

    if (!iptvChannel) {
      throw new NotFoundException('IPTV频道不存在');
    }

    return iptvChannel;
  }

  /**
   * 更新IPTV频道
   */
  async update(id: number, updateIPTVChannelDto: UpdateIPTVChannelDto): Promise<IPTVChannel> {
    const iptvChannel = await this.findById(id);
    Object.assign(iptvChannel, updateIPTVChannelDto);
    return await this.iptvChannelRepository.save(iptvChannel);
  }

  /**
   * 删除IPTV频道
   */
  async remove(id: number): Promise<void> {
    const iptvChannel = await this.findById(id);
    await this.iptvChannelRepository.remove(iptvChannel);
  }

  /**
   * 软删除（标记为不活跃）
   */
  async softDelete(id: number): Promise<IPTVChannel> {
    const iptvChannel = await this.findById(id);
    iptvChannel.isActive = false;
    return await this.iptvChannelRepository.save(iptvChannel);
  }

  /**
   * 增加观看次数
   */
  async incrementViewCount(id: number): Promise<void> {
    await this.iptvChannelRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * 获取所有频道分组
   */
  async getAllGroups(): Promise<string[]> {
    const groups = await this.iptvChannelRepository
      .createQueryBuilder('iptv')
      .select('DISTINCT iptv.group', 'group')
      .where('iptv.isActive = :isActive', { isActive: true })
      .orderBy('iptv.group', 'ASC')
      .getRawMany<GroupRow>();

    return groups
      .map(item => item.group)
      .filter((group): group is string => typeof group === 'string' && group.length > 0);
  }

  /**
   * 根据分组获取频道
   */
  async getByGroup(group: string, activeOnly: boolean = true): Promise<IPTVChannel[]> {
    const where: FindOptionsWhere<IPTVChannel> = { group };
    if (activeOnly) {
      where.isActive = true;
    }

    return await this.iptvChannelRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  /**
   * 批量创建频道
   */
  async createBulk(createIPTVChannelDtos: CreateIPTVChannelDto[]): Promise<IPTVChannel[]> {
    const iptvChannels = this.iptvChannelRepository.create(createIPTVChannelDtos);
    return await this.iptvChannelRepository.save(iptvChannels);
  }

  /**
   * 批量更新频道状态
   */
  async updateBulkStatus(ids: number[], isActive: boolean): Promise<void> {
    await this.iptvChannelRepository.update(ids, {
      isActive,
      lastCheckedAt: new Date(),
    });
  }

  /**
   * 导入M3U播放列表（支持 IPTV #EXTINF 格式和 HLS 格式）
   */
  async importFromM3U(m3uUrl: string, defaultGroup?: string): Promise<IPTVChannel[]> {
    try {
      this.logger.log(`开始导入M3U播放列表: ${m3uUrl}`);

      const response = await axios.get<string>(m3uUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const m3uContent = response.data;
      let parsed: CreateIPTVChannelDto[] = [];

      if (m3uContent.includes('#EXTINF')) {
        parsed = this.parseIptvM3U(m3uContent, defaultGroup);
      }

      if (parsed.length === 0) {
        parsed = this.parseHlsM3U(m3uContent, m3uUrl, defaultGroup);
      }

      if (parsed.length === 0) {
        parsed = this.parsePlainTextUrls(m3uContent, m3uUrl, defaultGroup);
      }

      const channels: IPTVChannel[] = [];
      for (const channelData of parsed) {
        try {
          const existing = await this.iptvChannelRepository.findOne({
            where: { url: channelData.url },
          });
          if (existing) {
            this.logger.log(`频道已存在，跳过: ${channelData.name}`);
            continue;
          }
          const channel = await this.create(channelData);
          channels.push(channel);
        } catch (error: unknown) {
          this.logger.warn(`导入频道失败: ${channelData.name}`, this.toError(error).message);
        }
      }

      this.logger.log(`成功导入 ${channels.length} 个频道`);
      return channels;
    } catch (error: unknown) {
      this.logger.error(`导入M3U播放列表失败: ${m3uUrl}`, this.toError(error).stack);
      throw new HttpException('导入M3U播放列表失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 解析 IPTV 格式 M3U（#EXTINF 行含 tvg-logo, group-title 等属性）
   */
  private parseIptvM3U(content: string, defaultGroup?: string): CreateIPTVChannelDto[] {
    const channels: CreateIPTVChannelDto[] = [];
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].startsWith('#EXTINF')) continue;

      const extinfLine = lines[i];
      const urlLine = i + 1 < lines.length ? lines[i + 1] : '';
      if (!urlLine || urlLine.startsWith('#')) continue;

      const tvgNameMatch = extinfLine.match(/tvg-name="([^"]*)"/);
      const tvgLogoMatch = extinfLine.match(/tvg-logo="([^"]*)"/);
      const groupMatch = extinfLine.match(/group-title="([^"]*)"/);
      const tvgIdMatch = extinfLine.match(/tvg-id="([^"]*)"/);
      const tvgLanguageMatch = extinfLine.match(/tvg-language="([^"]*)"/);
      const tvgCountryMatch = extinfLine.match(/tvg-country="([^"]*)"/);

      const commaIdx = extinfLine.lastIndexOf(',');
      const displayName = commaIdx >= 0 ? extinfLine.slice(commaIdx + 1).trim() : '';

      const name = tvgNameMatch?.[1] || displayName || `频道${channels.length + 1}`;
      const logo = tvgLogoMatch?.[1] || undefined;
      const group = groupMatch?.[1] || defaultGroup || 'M3U导入';
      const epgId = tvgIdMatch?.[1] || undefined;
      const language = tvgLanguageMatch?.[1] || undefined;
      const country = tvgCountryMatch?.[1] || undefined;

      const isHls = urlLine.includes('.m3u8') || urlLine.includes('m3u8');

      channels.push({
        name,
        url: urlLine,
        group,
        logo,
        language,
        country,
        epgId,
        streamFormat: isHls ? 'hls' : 'unknown',
        isActive: true,
        isLive: true,
        viewCount: 0,
      });
    }

    return channels;
  }

  /**
   * 解析 HLS 格式 M3U（m3u8-parser 库处理）
   */
  private parseHlsM3U(content: string, sourceUrl: string, defaultGroup?: string): CreateIPTVChannelDto[] {
    const channels: CreateIPTVChannelDto[] = [];

    try {
      const ParserCtor = (m3u8Parser as unknown as { Parser: new () => M3U8ParserInstance }).Parser;
      const parser = new ParserCtor();
      parser.push(content);
      parser.end();

      const manifest = parser.manifest;

      if (manifest.playlists && manifest.playlists.length > 0) {
        for (const playlist of manifest.playlists) {
          if (playlist.uri) {
            const attrs = playlist.attributes || {};
            channels.push({
              name: attrs['tvg-name'] || attrs.channelName || `频道${channels.length + 1}`,
              url: playlist.uri,
              group: attrs['group-title'] || defaultGroup || 'HLS导入',
              logo: attrs['tvg-logo'],
              language: attrs['tvg-language'],
              country: attrs['tvg-country'],
              epgId: attrs['tvg-id'],
              streamFormat: 'hls',
              isActive: true,
              isLive: true,
              viewCount: 0,
            });
          }
        }
      } else if (manifest.segments && manifest.segments.length > 0) {
        channels.push({
          name: `频道${Date.now()}`,
          url: sourceUrl,
          group: defaultGroup || 'HLS导入',
          streamFormat: 'hls',
          isActive: true,
          isLive: true,
          viewCount: 0,
        });
      }
    } catch {
      // HLS 解析失败，返回空
    }

    return channels;
  }

  /**
   * 从 JSON 数组导入频道
   */
  async importFromJson(
    items: { name: string; url: string; group?: string; logo?: string }[],
    defaultGroup?: string,
  ): Promise<IPTVChannel[]> {
    const channels: IPTVChannel[] = [];
    for (const item of items) {
      if (!item.url) continue;
      try {
        const existing = await this.iptvChannelRepository.findOne({
          where: { url: item.url },
        });
        if (existing) {
          this.logger.log(`频道已存在，跳过: ${item.name}`);
          continue;
        }
        const isHls = item.url.includes('.m3u8') || item.url.includes('m3u8');
        const channel = await this.create({
          name: item.name || `频道${channels.length + 1}`,
          url: item.url,
          group: item.group || defaultGroup || 'JSON导入',
          logo: item.logo,
          streamFormat: isHls ? 'hls' : 'unknown',
          isActive: true,
          isLive: true,
          viewCount: 0,
        });
        channels.push(channel);
      } catch (error: unknown) {
        this.logger.warn(`导入频道失败: ${item.name}`, this.toError(error).message);
      }
    }
    this.logger.log(`JSON导入成功 ${channels.length} 个频道`);
    return channels;
  }

  /**
   * 解析纯文本 URL 列表
   */
  private parsePlainTextUrls(content: string, sourceUrl: string, defaultGroup?: string): CreateIPTVChannelDto[] {
    const channels: CreateIPTVChannelDto[] = [];
    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (const line of lines) {
      if (line.startsWith('#') || line.startsWith('[')) continue;
      if (line.startsWith('http://') || line.startsWith('https://')) {
        const isHls = line.includes('.m3u8') || line.includes('m3u8');
        channels.push({
          name: `频道${channels.length + 1}`,
          url: line,
          group: defaultGroup || 'M3U导入',
          streamFormat: isHls ? 'hls' : 'unknown',
          isActive: true,
          isLive: true,
          viewCount: 0,
        });
      }
    }

    return channels;
  }

  /**
   * 检查频道链接是否有效
   */
  async validateChannel(id: number): Promise<boolean> {
    const channel = await this.findById(id);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

      const response = await fetch(channel.url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const isValid = response.ok;
      channel.lastCheckedAt = new Date();
      channel.isActive = isValid;

      await this.iptvChannelRepository.save(channel);
      return isValid;
    } catch {
      channel.lastCheckedAt = new Date();
      channel.isActive = false;
      await this.iptvChannelRepository.save(channel);
      return false;
    }
  }

  /**
   * 获取频道统计信息
   */
  async getStats(): Promise<{
    totalChannels: number;
    activeChannels: number;
    totalGroups: number;
    popularChannels: IPTVChannel[];
    recentChannels: IPTVChannel[];
  }> {
    const totalChannels = await this.iptvChannelRepository.count();
    const activeChannels = await this.iptvChannelRepository.count({
      where: { isActive: true },
    });

    const groups = await this.getAllGroups();
    const totalGroups = groups.length;

    const popularChannels = await this.iptvChannelRepository.find({
      where: { isActive: true },
      order: { viewCount: 'DESC' },
      take: 10,
    });

    const recentChannels = await this.iptvChannelRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      totalChannels,
      activeChannels,
      totalGroups,
      popularChannels,
      recentChannels,
    };
  }

  /**
   * 搜索频道
   */
  async searchChannels(keyword: string, limit: number = 20): Promise<IPTVChannel[]> {
    return await this.iptvChannelRepository.find({
      where: [
        { name: Like(`%${keyword}%`), isActive: true },
        { group: Like(`%${keyword}%`), isActive: true },
        { description: Like(`%${keyword}%`), isActive: true },
      ],
      order: { viewCount: 'DESC', name: 'ASC' },
      take: limit,
    });
  }

  /**
   * 代理IPTV流媒体
   */
  async proxyStream(url: string, res: Response): Promise<void> {
    try {
      const decodedUrl = this.decodeUnicodeUrl(url);
      const isM3u8Url = decodedUrl.toLowerCase().includes('.m3u8') || decodedUrl.toLowerCase().includes('m3u8');

      let referer: string;
      try {
        referer = new URL(decodedUrl).origin + '/';
      } catch {
        referer = 'https://www.google.com/';
      }

      const response = await axios.get(decodedUrl, {
        responseType: isM3u8Url ? 'arraybuffer' : 'stream',
        timeout: isM3u8Url ? 30000 : 120000,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': referer,
          'Accept': '*/*',
        },
        validateStatus: status => status >= 200 && status < 400,
      });

      const remoteContentType = (response.headers['content-type'] || '').toLowerCase();

      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Cache-Control': 'no-cache',
      });

      if (isM3u8Url) {
        const bodyStr = Buffer.from(response.data).toString('utf-8');
        const isM3u8 =
          remoteContentType.includes('mpegurl') ||
          remoteContentType.includes('m3u8') ||
          bodyStr.trimStart().startsWith('#EXTM3U');

        res.set({ 'Content-Type': isM3u8 ? 'application/vnd.apple.mpegurl' : (remoteContentType || 'application/octet-stream') });

        if (isM3u8) {
          const rewritten = this.rewriteM3u8Urls(bodyStr, decodedUrl);
          res.send(rewritten);
        } else {
          res.send(bodyStr);
        }
      } else {
        res.set({
          'Content-Type': remoteContentType || 'application/octet-stream',
          ...(response.headers['content-length'] ? { 'Content-Length': response.headers['content-length'] } : {}),
        });
        response.data.pipe(res);
      }
    } catch (error) {
      const err = this.toError(error);
      const axiosErr = error as any;
      const statusCode = axiosErr?.response?.status;
      this.logger.error(`代理流媒体失败: ${url} (状态码: ${statusCode || 'N/A'})`, err.message);

      if (statusCode === 404) {
        throw new HttpException('视频资源不存在或已过期', HttpStatus.NOT_FOUND);
      }
      if (statusCode === 403) {
        throw new HttpException('视频资源访问被拒绝', HttpStatus.FORBIDDEN);
      }
      throw new HttpException('代理流媒体失败: ' + err.message, HttpStatus.BAD_GATEWAY);
    }
  }

  private decodeUnicodeUrl(url: string): string {
    try {
      return url.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    } catch {
      return url;
    }
  }


  private rewriteM3u8Urls(content: string, baseUrl: string): string {
    let base: URL;
    try {
      base = new URL(baseUrl);
    } catch {
      return content;
    }
    const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);

    return content.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        const uriMatch = trimmed.match(/(URI=)(["']?)([^"'\s,]+)/);
        if (uriMatch) {
          const resolved = this.resolveUrl(uriMatch[3], basePath, base);
          return line.replace(uriMatch[3], resolved);
        }
        return line;
      }
      const resolved = this.resolveUrl(trimmed, basePath, base);
      return resolved;
    }).join('\n');
  }

  private resolveUrl(url: string, basePath: string, base: URL): string {
    let absolute: string;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      absolute = url;
    } else if (url.startsWith('/')) {
      absolute = `${base.protocol}//${base.host}${url}`;
    } else {
      absolute = basePath + url;
    }
    return `/api/iptv/stream/proxy?url=${encodeURIComponent(absolute)}`;
  }

  async getChannelEpg(
    channelId: number,
    epgUrl?: string,
  ): Promise<{ channelId: number; epgId: string | null; programs: EpgProgram[] }> {
    const channel = await this.findById(channelId);
    const epgId = channel.epgId || null;

    if (!epgUrl) {
      return { channelId, epgId, programs: [] };
    }

    try {
      const response = await axios.get(epgUrl, {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        responseType: 'text',
      });
      const xml = String(response.data);
      const programs = this.parseEpgXml(xml, epgId || channel.name);
      return { channelId, epgId, programs };
    } catch {
      return { channelId, epgId, programs: [] };
    }
  }

  private parseEpgXml(xml: string, channelId: string): EpgProgram[] {
    const programs: EpgProgram[] = [];
    const channelLower = channelId.toLowerCase();

    const programmeRegex =
      /<programme[^>]*start="([^"]*)"[^>]*stop="([^"]*)"[^>]*channel="([^"]*)"[^>]*>([\s\S]*?)<\/programme>/gi;
    let match: RegExpExecArray | null;

    while ((match = programmeRegex.exec(xml)) !== null) {
      const progChannel = (match[3] || '').toLowerCase();
      if (!progChannel.includes(channelLower) && !channelLower.includes(progChannel)) continue;

      const titleMatch = match[4].match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '未知节目';

      programs.push({
        start: this.parseEpgTime(match[1]),
        end: this.parseEpgTime(match[2]),
        title,
      });
    }

    programs.sort((a, b) => a.start - b.start);
    return programs;
  }

  private parseEpgTime(raw: string): number {
    if (!raw) return 0;
    const clean = raw.replace(/\s/g, '');
    const m = clean.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
    if (!m) return 0;
    return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])).getTime();
  }


}

export interface EpgProgram {
  start: number;
  end: number;
  title: string;
}
