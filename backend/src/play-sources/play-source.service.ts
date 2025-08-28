import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaySource, PlaySourceType, PlaySourceStatus } from '../entities/play-source.entity';
import { CreatePlaySourceDto } from './dtos/create-play-source.dto';
import { UpdatePlaySourceDto } from './dtos/update-play-source.dto';
import { PlaySourceQueryDto } from './dtos/play-source-query.dto';

@Injectable()
export class PlaySourceService {
  constructor(
    @InjectRepository(PlaySource)
    private playSourceRepository: Repository<PlaySource>,
  ) {}

  /**
   * 创建播放源
   */
  async create(createPlaySourceDto: CreatePlaySourceDto): Promise<PlaySource> {
    const playSource = this.playSourceRepository.create(createPlaySourceDto);
    return await this.playSourceRepository.save(playSource);
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
      // 这里应该实现实际的链接验证逻辑
      // 可以使用HTTP请求检查链接是否可访问
      // 为了简化，我们假设链接都是有效的
      const isValid = true; // 实际应用中需要实现验证逻辑
      
      await this.updateStatus(id, isValid ? PlaySourceStatus.ACTIVE : PlaySourceStatus.ERROR);
      return isValid;
    } catch (error) {
      await this.updateStatus(id, PlaySourceStatus.ERROR);
      return false;
    }
  }
}