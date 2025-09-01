import { Injectable, HttpException, HttpStatus, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between, Not } from 'typeorm';
import { IPTVChannel } from '../entities/iptv-channel.entity';
import { CreateIPTVChannelDto } from './dto/create-iptv-channel.dto';
import { UpdateIPTVChannelDto } from './dto/update-iptv-channel.dto';
import { IPTVChannelQueryDto } from './dto/iptv-channel-query.dto';
import axios from 'axios';
import * as m3u8Parser from 'm3u8-parser';

@Injectable()
export class IPTVService {
  private readonly logger = new Logger(IPTVService.name);

  constructor(
    @InjectRepository(IPTVChannel)
    private iptvChannelRepository: Repository<IPTVChannel>,
  ) {}

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
      page = 1, 
      limit = 10, 
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
      search 
    } = queryDto;
    
    const queryBuilder = this.iptvChannelRepository.createQueryBuilder('iptv');

    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(iptv.name LIKE :search OR iptv.description LIKE :search OR iptv.group LIKE :search)',
        { search: `%${search}%` }
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
      .getRawMany();

    return groups.map(item => item.group);
  }

  /**
   * 根据分组获取频道
   */
  async getByGroup(group: string, activeOnly: boolean = true): Promise<IPTVChannel[]> {
    const where: any = { group };
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
      lastCheckedAt: new Date()
    });
  }

  /**
   * 导入M3U播放列表
   */
  async importFromM3U(m3uUrl: string): Promise<IPTVChannel[]> {
    try {
      this.logger.log(`开始导入M3U播放列表: ${m3uUrl}`);

      // 下载M3U文件
      const response = await axios.get(m3uUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const m3uContent = response.data;
      const parser = new m3u8Parser.Parser();
      parser.push(m3uContent);
      parser.end();

      const manifest = parser.manifest;
      const channels: IPTVChannel[] = [];

      if (manifest.playlists) {
        for (const playlist of manifest.playlists) {
          if (playlist.uri && playlist.attributes) {
            const channelData: CreateIPTVChannelDto = {
              name: playlist.attributes['tvg-name'] || playlist.attributes.channelName || `频道${Date.now()}`,
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
              const channel = await this.create(channelData);
              channels.push(channel);
            } catch (error) {
              this.logger.warn(`导入频道失败: ${channelData.name}`, error);
            }
          }
        }
      }

      this.logger.log(`成功导入 ${channels.length} 个频道`);
      return channels;

    } catch (error) {
      this.logger.error(`导入M3U播放列表失败: ${m3uUrl}`, error.stack);
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
    } catch (error) {
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
}