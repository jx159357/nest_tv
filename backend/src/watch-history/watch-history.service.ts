import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchHistory } from '../entities/watch-history.entity';
import { CreateWatchHistoryDto } from './dtos/create-watch-history.dto';
import { UpdateWatchHistoryDto } from './dtos/update-watch-history.dto';
import { WatchHistoryQueryDto } from './dtos/watch-history-query.dto';

@Injectable()
export class WatchHistoryService {
  constructor(
    @InjectRepository(WatchHistory)
    private watchHistoryRepository: Repository<WatchHistory>,
  ) {}

  /**
   * 创建观看历史记录
   */
  async create(createWatchHistoryDto: CreateWatchHistoryDto): Promise<WatchHistory> {
    // 检查是否已存在相同的观看记录
    const existingHistory = await this.watchHistoryRepository.findOne({
      where: {
        userId: createWatchHistoryDto.userId,
        mediaResourceId: createWatchHistoryDto.mediaResourceId,
      },
    });

    if (existingHistory) {
      // 如果已存在，更新记录
      Object.assign(existingHistory, createWatchHistoryDto);
      return await this.watchHistoryRepository.save(existingHistory);
    }

    // 创建新的观看记录
    const watchHistory = this.watchHistoryRepository.create(createWatchHistoryDto);
    return await this.watchHistoryRepository.save(watchHistory);
  }

  /**
   * 分页查询观看历史
   */
  async findAll(queryDto: WatchHistoryQueryDto): Promise<{
    data: WatchHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { 
      page = 1, 
      limit = 10, 
      userId, 
      mediaResourceId, 
      isCompleted,
      sortBy = 'updatedAt',
      sortOrder = 'DESC' 
    } = queryDto;
    
    const queryBuilder = this.watchHistoryRepository.createQueryBuilder('watchHistory')
      .leftJoinAndSelect('watchHistory.user', 'user')
      .leftJoinAndSelect('watchHistory.mediaResource', 'mediaResource');

    // 用户过滤
    if (userId) {
      queryBuilder.andWhere('watchHistory.userId = :userId', { userId });
    }

    // 影视资源过滤
    if (mediaResourceId) {
      queryBuilder.andWhere('watchHistory.mediaResourceId = :mediaResourceId', { mediaResourceId });
    }

    // 完成状态过滤
    if (isCompleted !== undefined) {
      queryBuilder.andWhere('watchHistory.isCompleted = :isCompleted', { isCompleted });
    }

    // 排序
    const validSortFields = ['id', 'currentTime', 'duration', 'isCompleted', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
    queryBuilder.orderBy(`watchHistory.${sortField}`, sortOrder);

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
   * 根据ID查找观看历史
   */
  async findById(id: number): Promise<WatchHistory> {
    const watchHistory = await this.watchHistoryRepository.findOne({
      where: { id },
      relations: ['user', 'mediaResource'],
    });

    if (!watchHistory) {
      throw new NotFoundException('观看历史记录不存在');
    }

    return watchHistory;
  }

  /**
   * 根据用户ID和影视资源ID查找观看历史
   */
  async findByUserAndMedia(userId: number, mediaResourceId: number): Promise<WatchHistory | null> {
    return await this.watchHistoryRepository.findOne({
      where: {
        userId,
        mediaResourceId,
      },
      relations: ['user', 'mediaResource'],
    });
  }

  /**
   * 获取用户的观看历史
   */
  async findByUserId(userId: number, page: number = 1, limit: number = 10): Promise<{
    data: WatchHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.findAll({ userId, page, limit });
  }

  /**
   * 更新观看历史
   */
  async update(id: number, updateWatchHistoryDto: UpdateWatchHistoryDto): Promise<WatchHistory> {
    const watchHistory = await this.findById(id);
    Object.assign(watchHistory, updateWatchHistoryDto);
    return await this.watchHistoryRepository.save(watchHistory);
  }

  /**
   * 更新观看进度
   */
  async updateProgress(
    userId: number, 
    mediaResourceId: number, 
    currentTime: number, 
    duration?: number
  ): Promise<WatchHistory> {
    let watchHistory = await this.findByUserAndMedia(userId, mediaResourceId);

    if (!watchHistory) {
      // 如果不存在，创建新的观看记录
      const createDto: CreateWatchHistoryDto = {
        userId,
        mediaResourceId,
        currentTime,
        duration,
      };
      watchHistory = await this.create(createDto);
    } else {
      // 更新现有记录
      watchHistory.currentTime = currentTime;
      if (duration) {
        watchHistory.duration = duration;
      }
      watchHistory = await this.watchHistoryRepository.save(watchHistory);
    }

    return watchHistory;
  }

  /**
   * 标记为已看完
   */
  async markAsCompleted(id: number): Promise<WatchHistory> {
    const watchHistory = await this.findById(id);
    watchHistory.isCompleted = true;
    return await this.watchHistoryRepository.save(watchHistory);
  }

  /**
   * 删除观看历史
   */
  async remove(id: number): Promise<void> {
    const watchHistory = await this.findById(id);
    await this.watchHistoryRepository.remove(watchHistory);
  }

  /**
   * 清空用户观看历史
   */
  async clearUserHistory(userId: number): Promise<void> {
    await this.watchHistoryRepository.delete({ userId });
  }

  /**
   * 获取用户观看统计
   */
  async getUserStats(userId: number): Promise<{
    totalWatched: number;
    completed: number;
    watching: number;
    totalWatchTime: number;
  }> {
    const histories = await this.watchHistoryRepository.find({
      where: { userId },
    });

    const totalWatched = histories.length;
    const completed = histories.filter(h => h.isCompleted).length;
    const watching = totalWatched - completed;
    const totalWatchTime = histories.reduce((sum, h) => sum + (h.currentTime || 0), 0);

    return {
      totalWatched,
      completed,
      watching,
      totalWatchTime,
    };
  }

  /**
   * 获取继续观看列表
   */
  async getContinueWatching(userId: number, limit: number = 10): Promise<WatchHistory[]> {
    return await this.watchHistoryRepository.find({
      where: { 
        userId,
        isCompleted: false,
      },
      relations: ['mediaResource'],
      order: { updatedAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * 获取已看完的影视
   */
  async getCompleted(userId: number, page: number = 1, limit: number = 10): Promise<{
    data: WatchHistory[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return await this.findAll({ userId, isCompleted: true, page, limit });
  }
}