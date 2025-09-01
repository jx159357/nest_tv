import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaySource, PlaySourceType, PlaySourceStatus } from '../entities/play-source.entity';
import { CreatePlaySourceDto } from './dtos/create-play-source.dto';
import { UpdatePlaySourceDto } from './dtos/update-play-source.dto';
import { PlaySourceQueryDto } from './dtos/play-source-query.dto';
import { TorrentService } from '../common/services/torrent.service';
import { AppLoggerService, LogContext, LogLevel } from '../common/services/app-logger.service';

@Injectable()
export class PlaySourceService {
  private readonly logger: AppLoggerService;

  constructor(
    @InjectRepository(PlaySource)
    private playSourceRepository: Repository<PlaySource>,
    private readonly torrentService: TorrentService,
    appLoggerService: AppLoggerService,
  ) {
    this.logger = appLoggerService;
  }

  /**
   * 创建播放源
   */
  async create(createPlaySourceDto: CreatePlaySourceDto): Promise<PlaySource> {
    const context: LogContext = { function: 'createPlaySource' };
    
    try {
      const playSource = this.playSourceRepository.create(createPlaySourceDto);
      
      // 如果是磁力链接，进行特殊处理
      if (createPlaySourceDto.type === PlaySourceType.MAGNET) {
        try {
          const parsed = this.torrentService.parseMagnetUri(createPlaySourceDto.url);
          playSource.magnetInfo = {
            infoHash: parsed.infoHash,
            name: parsed.name,
            announce: parsed.announce,
          };
          
          // 检查磁力链接健康度
          const health = await this.torrentService.checkMagnetHealth(createPlaySourceDto.url);
          playSource.status = health.isHealthy ? PlaySourceStatus.ACTIVE : PlaySourceStatus.ERROR;
          
          this.logger.logParseProvider(0, 'magnet_created', {
            url: createPlaySourceDto.url,
            infoHash: parsed.infoHash,
            isHealthy: health.isHealthy,
          }, context);
          
        } catch (error) {
          this.logger.error(`Failed to process magnet URL: ${error.message}`, context, error.stack);
          playSource.status = PlaySourceStatus.ERROR;
        }
      }
      
      const result = await this.playSourceRepository.save(playSource);
      
      this.logger.logDatabase('create', 'play_sources', { 
        id: result.id, 
        type: result.type, 
        mediaResourceId: result.mediaResourceId 
      }, context);
      
      return result;
    } catch (error) {
      this.logger.error(`Failed to create play source: ${error.message}`, context, error.stack);
      throw error;
    }
  }

  /**
   * 分页查询播放源
   */
  async findAll(queryDto: PlaySourceQueryDto): Promise<{
    data: PlaySource[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { 
      page = 1, 
      limit = 10, 
      mediaResourceId, 
      type, 
      status, 
      resolution, 
      activeOnly = true,
      sortBy = 'priority',
      sortOrder = 'ASC' 
    } = queryDto;
    
    const queryBuilder = this.playSourceRepository.createQueryBuilder('playSource')
      .leftJoinAndSelect('playSource.mediaResource', 'mediaResource');

    // 影视资源过滤
    if (mediaResourceId) {
      queryBuilder.andWhere('playSource.mediaResourceId = :mediaResourceId', { mediaResourceId });
    }

    // 类型过滤
    if (type && Object.values(PlaySourceType).includes(type as PlaySourceType)) {
      queryBuilder.andWhere('playSource.type = :type', { type });
    }

    // 状态过滤
    if (status && Object.values(PlaySourceStatus).includes(status as PlaySourceStatus)) {
      queryBuilder.andWhere('playSource.status = :status', { status });
    }

    // 分辨率过滤
    if (resolution) {
      queryBuilder.andWhere('playSource.resolution = :resolution', { resolution });
    }

    // 只查询启用的播放源
    if (activeOnly) {
      queryBuilder.andWhere('playSource.isActive = :isActive', { isActive: true });
    }

    // 排序
    const validSortFields = ['id', 'priority', 'status', 'playCount', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'priority';
    queryBuilder.orderBy(`playSource.${sortField}`, sortOrder);

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
   * 根据ID查找播放源
   */
  async findById(id: number): Promise<PlaySource> {
    const playSource = await this.playSourceRepository.findOne({
      where: { id },
      relations: ['mediaResource'],
    });

    if (!playSource) {
      throw new NotFoundException('播放源不存在');
    }

    return playSource;
  }

  /**
   * 根据影视资源ID查找所有播放源
   */
  async findByMediaResourceId(mediaResourceId: number): Promise<PlaySource[]> {
    return await this.playSourceRepository.find({
      where: { 
        mediaResourceId,
        isActive: true,
        status: PlaySourceStatus.ACTIVE 
      },
      order: { priority: 'ASC' },
      relations: ['mediaResource'],
    });
  }

  /**
   * 更新播放源
   */
  async update(id: number, updatePlaySourceDto: UpdatePlaySourceDto): Promise<PlaySource> {
    const playSource = await this.findById(id);
    Object.assign(playSource, updatePlaySourceDto);
    return await this.playSourceRepository.save(playSource);
  }

  /**
   * 删除播放源
   */
  async remove(id: number): Promise<void> {
    const playSource = await this.findById(id);
    await this.playSourceRepository.remove(playSource);
  }

  /**
   * 软删除（标记为不活跃）
   */
  async softDelete(id: number): Promise<PlaySource> {
    const playSource = await this.findById(id);
    playSource.isActive = false;
    return await this.playSourceRepository.save(playSource);
  }

  /**
   * 更新播放源状态
   */
  async updateStatus(id: number, status: PlaySourceStatus): Promise<PlaySource> {
    const playSource = await this.findById(id);
    playSource.status = status;
    playSource.lastCheckedAt = new Date();
    return await this.playSourceRepository.save(playSource);
  }

  /**
   * 增加播放次数
   */
  async incrementPlayCount(id: number): Promise<void> {
    await this.playSourceRepository.increment({ id }, 'playCount', 1);
  }

  /**
   * 获取最佳的播放源（按优先级和状态）
   */
  async getBestPlaySource(mediaResourceId: number): Promise<PlaySource | null> {
    return await this.playSourceRepository.findOne({
      where: { 
        mediaResourceId,
        isActive: true,
        status: PlaySourceStatus.ACTIVE 
      },
      order: { priority: 'ASC', playCount: 'ASC' },
    });
  }

  /**
   * 批量创建播放源
   */
  async createBulk(createPlaySourceDtos: CreatePlaySourceDto[]): Promise<PlaySource[]> {
    const playSources = this.playSourceRepository.create(createPlaySourceDtos);
    return await this.playSourceRepository.save(playSources);
  }

  /**
   * 批量更新播放源状态
   */
  async updateBulkStatus(ids: number[], status: PlaySourceStatus): Promise<void> {
    await this.playSourceRepository.update(ids, { 
      status,
      lastCheckedAt: new Date()
    });
  }

  /**
   * 检查播放源链接是否有效
   */
  async validatePlaySource(id: number): Promise<boolean> {
    const playSource = await this.findById(id);
    
    try {
      // 实现实际的链接验证逻辑
      // 使用HTTP HEAD请求检查链接是否可访问
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      const response = await fetch(playSource.url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const isValid = response.ok;
      const status = isValid ? PlaySourceStatus.ACTIVE : PlaySourceStatus.ERROR;
      
      await this.updateStatus(id, status);
      return isValid;
    } catch (error) {
      await this.updateStatus(id, PlaySourceStatus.ERROR);
      return false;
    }
  }

  /**
   * 获取磁力链接播放信息
   */
  async getMagnetPlayInfo(id: number, userId?: number): Promise<{
    success: boolean;
    message: string;
    playUrl?: string;
    torrentInfo?: any;
    fileInfo?: any;
  }> {
    const context: LogContext = { userId, function: 'getMagnetPlayInfo', playSourceId: id };
    
    try {
      const playSource = await this.findById(id);
      
      if (playSource.type !== PlaySourceType.MAGNET) {
        this.logger.warn(`Play source is not magnet type: ${id}`, context);
        return {
          success: false,
          message: '播放源不是磁力链接类型',
        };
      }

      if (!playSource.magnetInfo?.infoHash) {
        this.logger.warn(`Magnet info not found: ${id}`, context);
        return {
          success: false,
          message: '磁力链接信息不存在',
        };
      }

      const infoHash = playSource.magnetInfo.infoHash;
      
      // 获取磁力链接信息
      const torrentInfo = this.torrentService.getTorrentInfo(infoHash);
      if (!torrentInfo) {
        // 如果磁力链接不存在，重新添加
        try {
          await this.torrentService.addMagnet(playSource.url);
          this.logger.log('Re-added magnet to client', LogLevel.INFO, context);
          
          // 等待1秒让元数据加载
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const retryInfo = this.torrentService.getTorrentInfo(infoHash);
          if (!retryInfo) {
            return {
              success: false,
              message: '磁力链接加载失败',
            };
          }
          
          return this.processTorrentInfo(retryInfo, id, context);
        } catch (error) {
          this.logger.error(`Failed to re-add magnet: ${error.message}`, context, error.stack);
          return {
            success: false,
            message: '磁力链接重新加载失败',
          };
        }
      }

      return this.processTorrentInfo(torrentInfo, id, context);

    } catch (error) {
      this.logger.error(`Failed to get magnet play info: ${error.message}`, context, error.stack);
      return {
        success: false,
        message: '获取磁力链接播放信息失败',
      };
    }
  }

  /**
   * 处理磁力链接信息
   */
  private async processTorrentInfo(torrentInfo: any, playSourceId: number, context: LogContext): Promise<{
    success: boolean;
    message: string;
    playUrl?: string;
    torrentInfo?: any;
    fileInfo?: any;
  }> {
    try {
      // 查找最大的视频文件
      const largestFile = this.torrentService.findLargestVideoFile(torrentInfo.infoHash);
      
      if (!largestFile) {
        this.logger.warn(`No video file found in torrent: ${torrentInfo.infoHash}`, context);
        return {
          success: false,
          message: '磁力链接中未找到视频文件',
          torrentInfo,
        };
      }

      const playUrl = this.torrentService.generatePlayUrl(torrentInfo.infoHash, largestFile.index);
      
      this.logger.logParseProvider(0, 'magnet_play_info_ready', {
        playSourceId,
        infoHash: torrentInfo.infoHash,
        fileName: largestFile.name,
        playUrl,
      }, context);
      
      return {
        success: true,
        message: '获取磁力链接播放信息成功',
        playUrl,
        torrentInfo,
        fileInfo: largestFile,
      };

    } catch (error) {
      this.logger.error(`Failed to process torrent info: ${error.message}`, context, error.stack);
      return {
        success: false,
        message: '处理磁力链接信息失败',
      };
    }
  }

  /**
   * 验证磁力链接播放源
   */
  async validateMagnetPlaySource(id: number, userId?: number): Promise<boolean> {
    const context: LogContext = { userId, function: 'validateMagnetPlaySource', playSourceId: id };
    
    try {
      const playSource = await this.findById(id);
      
      if (playSource.type !== PlaySourceType.MAGNET) {
        this.logger.warn(`Play source is not magnet type: ${id}`, context);
        return false;
      }

      if (!playSource.magnetInfo?.infoHash) {
        this.logger.warn(`Magnet info not found: ${id}`, context);
        return false;
      }

      const infoHash = playSource.magnetInfo.infoHash;
      const torrentInfo = this.torrentService.getTorrentInfo(infoHash);
      
      if (!torrentInfo) {
        return false;
      }

      const isValid = torrentInfo.numPeers > 0 && torrentInfo.progress > 0;
      
      this.logger.logParseProvider(0, 'magnet_validated', {
        playSourceId: id,
        infoHash,
        isValid,
        numPeers: torrentInfo.numPeers,
        progress: torrentInfo.progress,
      }, context);
      
      return isValid;

    } catch (error) {
      this.logger.error(`Failed to validate magnet play source: ${error.message}`, context, error.stack);
      return false;
    }
  }

  /**
   * 获取磁力链接统计信息
   */
  async getMagnetStats(mediaResourceId: number, userId?: number): Promise<{
    totalMagnets: number;
    activeMagnets: number;
    totalSize: number;
    totalPeers: number;
    averageProgress: number;
    magnetDetails: any[];
  }> {
    const context: LogContext = { userId, function: 'getMagnetStats', mediaResourceId };
    
    try {
      const playSources = await this.playSourceRepository.find({
        where: { 
          mediaResourceId,
          type: PlaySourceType.MAGNET,
          isActive: true,
        },
      });

      const magnetDetails: any[] = [];
      let totalSize = 0;
      let totalPeers = 0;
      let totalProgress = 0;
      let activeCount = 0;

      for (const playSource of playSources) {
        if (playSource.magnetInfo?.infoHash) {
          const torrentInfo = this.torrentService.getTorrentInfo(playSource.magnetInfo.infoHash);
          
          if (torrentInfo) {
            totalSize += torrentInfo.length;
            totalPeers += torrentInfo.numPeers;
            totalProgress += torrentInfo.progress;
            activeCount++;
            
            magnetDetails.push({
              id: playSource.id,
              infoHash: playSource.magnetInfo.infoHash,
              name: torrentInfo.name,
              length: torrentInfo.length,
              progress: torrentInfo.progress,
              numPeers: torrentInfo.numPeers,
              downloadSpeed: torrentInfo.downloadSpeed,
              status: torrentInfo.numPeers > 0 ? 'active' : 'inactive',
            });
          } else {
            magnetDetails.push({
              id: playSource.id,
              infoHash: playSource.magnetInfo.infoHash,
              status: 'not_loaded',
            });
          }
        }
      }

      const averageProgress = activeCount > 0 ? totalProgress / activeCount : 0;

      this.logger.log('Retrieved magnet stats', LogLevel.INFO, context);

      return {
        totalMagnets: playSources.length,
        activeMagnets: activeCount,
        totalSize,
        totalPeers,
        averageProgress: Math.round(averageProgress * 100),
        magnetDetails,
      };

    } catch (error) {
      this.logger.error(`Failed to get magnet stats: ${error.message}`, context, error.stack);
      return {
        totalMagnets: 0,
        activeMagnets: 0,
        totalSize: 0,
        totalPeers: 0,
        averageProgress: 0,
        magnetDetails: [],
      };
    }
  }
}