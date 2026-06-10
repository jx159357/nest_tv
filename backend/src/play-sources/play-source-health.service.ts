import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PlaySource, PlaySourceStatus, PlaySourceType } from '../entities/play-source.entity';
import { MediaResource } from '../entities/media-resource.entity';
import { MacCmsResolverService } from './mac-cms-resolver.service';
import { AppLoggerService } from '../common/services/app-logger.service';

export interface HealthCheckResult {
  checked: number;
  active: number;
  inactive: number;
  replaced: number;
  cleaned: number;
  errors: string[];
}

export interface HealthStats {
  totalSources: number;
  activeSources: number;
  errorSources: number;
  inactiveSources: number;
  expirationRate: number;
  lastCheckAt: string | null;
  needsFullRefresh: boolean;
}

@Injectable()
export class PlaySourceHealthService {
  private readonly logger = new Logger(PlaySourceHealthService.name);
  private lastHealthCheck: HealthCheckResult | null = null;

  constructor(
    @InjectRepository(PlaySource)
    private readonly playSourceRepository: Repository<PlaySource>,
    @InjectRepository(MediaResource)
    private readonly mediaResourceRepository: Repository<MediaResource>,
    private readonly macCmsResolver: MacCmsResolverService,
    private readonly appLogger: AppLoggerService,
  ) {}

  @Cron('0 */2 * * *')
  async handleHealthCheck(): Promise<void> {
    this.logger.log('开始播放源健康检查...');
    const result = await this.validateAndReplace(200);
    this.lastHealthCheck = result;

    this.logger.log(
      `健康检查完成: 检查${result.checked}个, 有效${result.active}个, ` +
        `失效${result.inactive}个, 替换${result.replaced}个, 清理${result.cleaned}个`,
    );

    const stats = await this.getHealthStats();
    if (stats.needsFullRefresh) {
      this.logger.warn(
        `播放源过期率过高(${(stats.expirationRate * 100).toFixed(1)}%), 建议执行全量刷新`,
      );
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleExpiredCleanup(): Promise<void> {
    this.logger.log('开始清理过期播放源...');
    const cleaned = await this.cleanupExpiredSources(30);
    this.logger.log(`清理完成: 删除${cleaned}条过期记录`);
  }

  async validateAndReplace(limit: number = 100): Promise<HealthCheckResult> {
    const errors: string[] = [];
    let checked = 0;
    let active = 0;
    let inactive = 0;
    let replaced = 0;

    const sources = await this.playSourceRepository
      .createQueryBuilder('ps')
      .where('ps.isActive = :isActive', { isActive: true })
      .andWhere('ps.type IN (:...types)', {
        types: [PlaySourceType.ONLINE, PlaySourceType.STREAM],
      })
      .orderBy('CASE WHEN ps.lastCheckedAt IS NULL THEN 0 ELSE 1 END', 'ASC')
      .addOrderBy('ps.lastCheckedAt', 'ASC')
      .take(limit)
      .getMany();

    for (const source of sources) {
      checked++;
      try {
        const isAvailable = await this.checkUrlAvailability(source.url);

        if (isAvailable) {
          source.status = PlaySourceStatus.ACTIVE;
          source.lastCheckedAt = new Date();
          await this.playSourceRepository.save(source);
          active++;
          continue;
        }

        inactive++;
        const replacedSource = await this.tryReplaceFromMacCMS(source);
        if (replacedSource) {
          replaced++;
          continue;
        }

        source.status = PlaySourceStatus.ERROR;
        source.isActive = false;
        source.lastCheckedAt = new Date();
        await this.playSourceRepository.save(source);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`Source ${source.id}: ${msg}`);
      }
    }

    const cleaned = await this.cleanupExpiredSources(30);

    return { checked, active, inactive, replaced, cleaned, errors };
  }

  private async checkUrlAvailability(url: string): Promise<boolean> {
    try {
      const axios = (await import('axios')).default;
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      };

      const headResp = await axios.head(url, {
        timeout: 8000,
        headers,
        maxRedirects: 3,
        validateStatus: () => true,
      });
      if (headResp.status >= 200 && headResp.status < 400) return true;
    } catch {
      // HEAD not supported by some CDNs
    }

    try {
      const axios = (await import('axios')).default;
      const getResp = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Range: 'bytes=0-0',
        },
        maxRedirects: 3,
        validateStatus: () => true,
        responseType: 'text',
      });
      if (getResp.status >= 200 && getResp.status < 400) return true;
    } catch {
      // direct GET also failed
    }

    try {
      const axios = (await import('axios')).default;
      const proxyUrl = `http://localhost:3334/iptv/stream/proxy?url=${encodeURIComponent(url)}`;
      const proxyResp = await axios.get(proxyUrl, {
        timeout: 10000,
        validateStatus: () => true,
      });
      return proxyResp.status >= 200 && proxyResp.status < 400;
    } catch {
      return false;
    }
  }

  private async tryReplaceFromMacCMS(source: PlaySource): Promise<PlaySource | null> {
    try {
      const media = await this.mediaResourceRepository.findOne({
        where: { id: source.mediaResourceId },
      });
      if (!media?.title) return null;

      const episodes = await this.macCmsResolver.resolveByTitle(
        media.title,
        source.episodeNumber || undefined,
      );

      if (episodes.length === 0) return null;

      const newEpisode = episodes[0];

      source.url = newEpisode.url;
      source.status = PlaySourceStatus.ACTIVE;
      source.isActive = true;
      source.lastCheckedAt = new Date();
      source.sourceName = newEpisode.sourceName;
      source.validationInfo = {
        ...(source.validationInfo || {}),
        replacedAt: new Date().toISOString(),
        replacedFrom: newEpisode.sourceName,
        previousUrl: source.url,
      };

      await this.playSourceRepository.save(source);
      this.logger.log(`播放源 ${source.id} 已替换为 ${newEpisode.sourceName} 的新地址`);
      return source;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`播放源 ${source.id} MacCMS替换失败: ${msg}`);
      return null;
    }
  }

  async cleanupExpiredSources(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.playSourceRepository.delete({
      status: PlaySourceStatus.ERROR,
      isActive: false,
      lastCheckedAt: LessThan(cutoffDate),
    });

    return result.affected || 0;
  }

  async getHealthStats(): Promise<HealthStats> {
    const totalSources = await this.playSourceRepository.count();

    const activeSources = await this.playSourceRepository.count({
      where: { isActive: true, status: PlaySourceStatus.ACTIVE },
    });

    const errorSources = await this.playSourceRepository.count({
      where: { status: PlaySourceStatus.ERROR },
    });

    const inactiveSources = await this.playSourceRepository.count({
      where: { isActive: false },
    });

    const expirationRate = totalSources > 0 ? errorSources / totalSources : 0;
    const needsFullRefresh = expirationRate > 0.5;

    const lastChecked = await this.playSourceRepository
      .createQueryBuilder('ps')
      .select('MAX(ps.lastCheckedAt)', 'lastCheckedAt')
      .getRawOne();

    return {
      totalSources,
      activeSources,
      errorSources,
      inactiveSources,
      expirationRate,
      lastCheckAt: lastChecked?.lastCheckedAt || null,
      needsFullRefresh,
    };
  }

  getLastHealthCheck(): HealthCheckResult | null {
    return this.lastHealthCheck;
  }
}
