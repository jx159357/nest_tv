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

    // 简化处理：直接设置为活跃状态
    playSource.status = PlaySourceStatus.ACTIVE;

    const result = await this.playSourceRepository.save(playSource);

    return result;
  }

  /**
   * 获取播放源列表（支持筛选和分页）
   */
  async findAll(queryDto: PlaySourceQueryDto): Promise<{
    data: PlaySource[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const { page = 1, pageSize = 10, mediaResourceId, type } = queryDto;

    const queryBuilder = this.playSourceRepository
      .createQueryBuilder('playSource')
      .leftJoinAndSelect('playSource.mediaResource', 'mediaResource');

    // 筛选条件
    if (mediaResourceId) {
      queryBuilder.andWhere('playSource.mediaResourceId = :mediaResourceId', { mediaResourceId });
    }

    if (type) {
      queryBuilder.andWhere('playSource.type = :type', { type });
    }

    // 获取总数
    const total = await queryBuilder.getCount();

    // 分页查询
    const skip = (page - 1) * pageSize;
    const data = await queryBuilder
      .orderBy('playSource.priority', 'ASC')
      .addOrderBy('playSource.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getMany();

    const totalPages = Math.ceil(total / pageSize);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * 根据名称查找播放源
   */
  async findByName(name: string): Promise<PlaySource | null> {
    return this.playSourceRepository.findOne({
      where: { sourceName: name },
    });
  }

  /**
   * 根据ID获取播放源
   */
  async findById(id: number): Promise<PlaySource> {
    const playSource = await this.playSourceRepository.findOne({
      where: { id },
      relations: ['mediaResource'],
    });

    if (!playSource) {
      throw new NotFoundException(`播放源ID ${id} 不存在`);
    }

    return playSource;
  }

  /**
   * 更新播放源
   */
  async update(id: number, updatePlaySourceDto: UpdatePlaySourceDto): Promise<PlaySource> {
    const playSource = await this.findById(id);

    Object.assign(playSource, updatePlaySourceDto);

    return this.playSourceRepository.save(playSource);
  }

  /**
   * 删除播放源
   */
  async remove(id: number): Promise<void> {
    const playSource = await this.findById(id);

    await this.playSourceRepository.remove(playSource);
  }

  /**
   * 验证播放源有效性
   */
  async validate(id: number): Promise<{
    isValid: boolean;
    message?: string;
  }> {
    const playSource = await this.findById(id);

    // 简化验证逻辑
    const isValid = playSource.status === PlaySourceStatus.ACTIVE;

    return {
      isValid,
      message: isValid ? '播放源有效' : '播放源不可用',
    };
  }

  /**
   * 获取媒体资源的最佳播放源
   */
  async getBestPlaySource(mediaResourceId: number): Promise<PlaySource | null> {
    const playSource = await this.playSourceRepository.findOne({
      where: {
        mediaResourceId,
        status: PlaySourceStatus.ACTIVE,
      },
      order: {
        priority: 'ASC',
      },
    });

    return playSource || null;
  }

  /**
   * 获取媒体资源的播放源列表
   */
  async getByMediaResource(mediaResourceId: number): Promise<PlaySource[]> {
    return this.playSourceRepository.find({
      where: {
        mediaResourceId,
        status: PlaySourceStatus.ACTIVE,
      },
      order: {
        priority: 'ASC',
      },
    });
  }
}
