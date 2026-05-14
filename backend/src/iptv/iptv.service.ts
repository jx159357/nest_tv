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
   * 导入M3U播放列表
   */
  async importFromM3U(m3uUrl: string): Promise<IPTVChannel[]> {
    try {
      this.logger.log(`开始导入M3U播放列表: ${m3uUrl}`);

      // 下载M3U文件
      const response = await axios.get<string>(m3uUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const m3uContent = response.data;
      const ParserCtor = (m3u8Parser as unknown as { Parser: new () => M3U8ParserInstance }).Parser;
      const parser = new ParserCtor();
      parser.push(m3uContent);
      parser.end();

      const manifest = parser.manifest;
      const channels: IPTVChannel[] = [];

      if (manifest.playlists && manifest.playlists.length > 0) {
        for (const playlist of manifest.playlists) {
          if (playlist.uri && playlist.attributes) {
            const channelData: CreateIPTVChannelDto = {
              name:
                playlist.attributes['tvg-name'] ||
                playlist.attributes.channelName ||
                `频道${Date.now()}`,
              url: playlist.uri,
              group: playlist.attributes['group-title'] || '默认分组',
              logo: playlist.attributes['tvg-logo'],
              language: playlist.attributes['tvg-language'],
              country: playlist.attributes['tvg-country'],
              epgId: playlist.attributes['tvg-id'],
              streamFormat: 'hls',
              isActive: true,
              isLive: true,
              viewCount: 0,
            };

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
        }
      } else if (manifest.segments && manifest.segments.length > 0) {
        const urlObj = new URL(m3uUrl);
        const channelName = urlObj.hostname + urlObj.pathname.split('/').slice(0, -1).join('/');
        const channelData: CreateIPTVChannelDto = {
          name: channelName || `频道${Date.now()}`,
          url: m3uUrl,
          group: 'M3U导入',
          streamFormat: 'hls',
          isActive: true,
          isLive: true,
          viewCount: 0,
        };

        try {
          const existing = await this.iptvChannelRepository.findOne({
            where: { url: channelData.url },
          });
          if (existing) {
            this.logger.log(`频道已存在，跳过: ${channelData.name}`);
          } else {
            const channel = await this.create(channelData);
            channels.push(channel);
          }
        } catch (error: unknown) {
          this.logger.warn(`导入频道失败: ${channelData.name}`, this.toError(error).message);
        }
      } else {
        const channelData: CreateIPTVChannelDto = {
          name: `频道${Date.now()}`,
          url: m3uUrl,
          group: 'M3U导入',
          streamFormat: 'hls',
          isActive: true,
          isLive: true,
          viewCount: 0,
        };

        try {
          const existing = await this.iptvChannelRepository.findOne({
            where: { url: channelData.url },
          });
          if (existing) {
            this.logger.log(`频道已存在，跳过: ${channelData.name}`);
          } else {
            const channel = await this.create(channelData);
            channels.push(channel);
          }
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
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      res.set({
        'Content-Type': response.headers['content-type'] || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range',
        'Cache-Control': 'no-cache',
      });

      response.data.pipe(res);
    } catch (error) {
      this.logger.error(`代理流媒体失败: ${url}`, this.toError(error).message);
      throw new HttpException('代理流媒体失败', HttpStatus.BAD_GATEWAY);
    }
  }

  async getChannelEpg(
    channelId: number,
    epgUrl?: string,
  ): Promise<{ channelId: number; epgId: string | null; programs: EpgProgram[] }> {
    const channel = await this.findById(channelId);
    const epgId = channel.epgId || null;

    if (!epgUrl) {
      return { channelId, epgId, programs: this.generateDemoEpg(channel.name) };
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
      return { channelId, epgId, programs: this.generateDemoEpg(channel.name) };
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

  private generateDemoEpg(channelName: string): EpgProgram[] {
    const now = Date.now();
    const hour = 3600_000;
    const base = Math.floor(now / hour) * hour;
    const titles = [
      `${channelName} 新闻联播`,
      `${channelName} 焦点访谈`,
      `${channelName} 今日说法`,
      `${channelName} 电视剧场`,
      `${channelName} 综艺节目`,
      `${channelName} 纪录片`,
      `${channelName} 晚间新闻`,
      `${channelName} 深夜剧场`,
    ];
    return titles.map((title, i) => ({
      start: base + i * hour,
      end: base + (i + 1) * hour,
      title,
    }));
  }
}

export interface EpgProgram {
  start: number;
  end: number;
  title: string;
}
