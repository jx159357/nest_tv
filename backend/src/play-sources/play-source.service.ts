import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import magnetUri from 'magnet-uri';
import { PlaySource, PlaySourceStatus, PlaySourceType } from '../entities/play-source.entity';
import { CreatePlaySourceDto } from './dtos/create-play-source.dto';
import { UpdatePlaySourceDto } from './dtos/update-play-source.dto';
import { PlaySourceQueryDto } from './dtos/play-source-query.dto';
import { comparePlaySources, isPlaySourceFresh } from './play-source-ranking.util';

@Injectable()
export class PlaySourceService {
  constructor(
    @InjectRepository(PlaySource)
    private playSourceRepository: Repository<PlaySource>,
  ) {}

  async getSourceHealthSummary(sourceName: string): Promise<{
    sourceName: string;
    totalPlaySources: number;
    activePlaySources: number;
    inactivePlaySources: number;
    recentPlaySources24h: number;
    activeRate: number;
    latestCreatedAt: string | null;
    latestCheckedAt: string | null;
  }> {
    const pattern = `${sourceName}%`;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalPlaySources,
      activePlaySources,
      recentPlaySources24h,
      latestCreated,
      latestChecked,
    ] = await Promise.all([
      this.playSourceRepository
        .createQueryBuilder('playSource')
        .where('playSource.sourceName LIKE :pattern', { pattern })
        .getCount(),
      this.playSourceRepository
        .createQueryBuilder('playSource')
        .where('playSource.sourceName LIKE :pattern', { pattern })
        .andWhere('playSource.isActive = :isActive', { isActive: true })
        .getCount(),
      this.playSourceRepository
        .createQueryBuilder('playSource')
        .where('playSource.sourceName LIKE :pattern', { pattern })
        .andWhere('playSource.createdAt >= :since', { since })
        .getCount(),
      this.playSourceRepository
        .createQueryBuilder('playSource')
        .where('playSource.sourceName LIKE :pattern', { pattern })
        .orderBy('playSource.createdAt', 'DESC')
        .getOne(),
      this.playSourceRepository
        .createQueryBuilder('playSource')
        .where('playSource.sourceName LIKE :pattern', { pattern })
        .andWhere('playSource.lastCheckedAt IS NOT NULL')
        .orderBy('playSource.lastCheckedAt', 'DESC')
        .getOne(),
    ]);

    const inactivePlaySources = Math.max(totalPlaySources - activePlaySources, 0);

    return {
      sourceName,
      totalPlaySources,
      activePlaySources,
      inactivePlaySources,
      recentPlaySources24h,
      activeRate:
        totalPlaySources > 0 ? Math.round((activePlaySources / totalPlaySources) * 100) : 0,
      latestCreatedAt: latestCreated?.createdAt?.toISOString() ?? null,
      latestCheckedAt: latestChecked?.lastCheckedAt?.toISOString() ?? null,
    };
  }

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

    const isValid = await this.validatePlaySource(playSource);

    return {
      isValid,
      message: isValid ? '播放源有效' : '播放源不可用',
    };
  }

  async validateRecentSources(
    limit: number = 50,
  ): Promise<{ checked: number; active: number; inactive: number }> {
    const sources = await this.playSourceRepository
      .createQueryBuilder('playSource')
      .where('playSource.isActive = :isActive', { isActive: true })
      .orderBy('CASE WHEN playSource.lastCheckedAt IS NULL THEN 0 ELSE 1 END', 'ASC')
      .addOrderBy('playSource.lastCheckedAt', 'ASC')
      .addOrderBy('playSource.priority', 'ASC')
      .addOrderBy('playSource.createdAt', 'DESC')
      .take(limit)
      .getMany();

    let active = 0;
    let inactive = 0;

    for (const source of sources) {
      const isValid = await this.validatePlaySource(source);
      if (isValid) {
        active++;
      } else {
        inactive++;
      }
    }

    return {
      checked: sources.length,
      active,
      inactive,
    };
  }

  /**
   * 获取媒体资源的最佳播放源
   */
  async getBestPlaySource(mediaResourceId: number): Promise<PlaySource | null> {
    const sources = await this.playSourceRepository.find({
      where: {
        mediaResourceId,
        isActive: true,
      },
    });

    const orderedSources = this.sortPlaySources(sources).filter(
      source => source.status !== PlaySourceStatus.ERROR,
    );

    for (const source of orderedSources) {
      if (source.status === PlaySourceStatus.ACTIVE && isPlaySourceFresh(source)) {
        return source;
      }

      const isValid = await this.validatePlaySource(source);
      if (isValid) {
        return source;
      }
    }

    return null;
  }

  /**
   * 获取媒体资源的播放源列表
   */
  async getByMediaResource(mediaResourceId: number): Promise<PlaySource[]> {
    const sources = await this.playSourceRepository.find({
      where: {
        mediaResourceId,
        isActive: true,
      },
    });

    return this.sortPlaySources(sources).filter(
      source => source.status === PlaySourceStatus.ACTIVE && source.isActive,
    );
  }

  private async validatePlaySource(playSource: PlaySource): Promise<boolean> {
    const isValid = await this.checkPlaySourceAvailability(playSource);

    playSource.status = isValid ? PlaySourceStatus.ACTIVE : PlaySourceStatus.ERROR;
    playSource.isActive = isValid;
    playSource.lastCheckedAt = new Date();
    await this.playSourceRepository.save(playSource);

    return isValid;
  }

  private async checkPlaySourceAvailability(playSource: PlaySource): Promise<boolean> {
    if (playSource.type === PlaySourceType.MAGNET) {
      try {
        const parsed = magnetUri.decode(playSource.url);
        return Boolean(parsed.infoHash || parsed.xt);
      } catch {
        return false;
      }
    }

    try {
      const headResponse = await axios.head(playSource.url, {
        timeout: 8000,
        validateStatus: status => status >= 200 && status < 500,
      });

      if (headResponse.status < 400) {
        return true;
      }
    } catch {
      // ignore and fallback to GET probe
    }

    try {
      const getResponse = await axios.get(playSource.url, {
        timeout: 8000,
        headers: {
          Range: 'bytes=0-1',
        },
        validateStatus: status => status >= 200 && status < 500,
      });

      return getResponse.status < 400;
    } catch {
      return false;
    }
  }

  private sortPlaySources(sources: PlaySource[]): PlaySource[] {
    const now = new Date();
    return [...sources].sort((left, right) => comparePlaySources(left, right, now));
  }
}
