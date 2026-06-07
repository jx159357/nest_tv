import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { type AxiosResponse, type RawAxiosResponseHeaders } from 'axios';
import magnetUri from 'magnet-uri';
import { ParseProvidersService } from '../parse-providers/parse-providers.service';
import { PlaySource, PlaySourceStatus, PlaySourceType } from '../entities/play-source.entity';
import { CreatePlaySourceDto } from './dtos/create-play-source.dto';
import { UpdatePlaySourceDto } from './dtos/update-play-source.dto';
import { PlaySourceQueryDto } from './dtos/play-source-query.dto';
import { comparePlaySources, isPlaySourceFresh } from './play-source-ranking.util';

interface PlaySourceValidationResult {
  isValid: boolean;
  message: string;
  validationInfo: Record<string, unknown>;
  format?: string;
  resolution?: string;
  providerName?: string;
  magnetInfo?: Record<string, unknown>;
}

interface PlaySourceDuplicateGroup {
  keeper: Pick<PlaySource, 'id' | 'mediaResourceId' | 'url' | 'status' | 'isActive' | 'priority'>;
  duplicates: Array<
    Pick<PlaySource, 'id' | 'mediaResourceId' | 'url' | 'status' | 'isActive' | 'priority'>
  >;
}

export interface PlaySourceOriginInfo {
  originSite?: string;
  originDetailUrl?: string;
  originPlayPageUrl?: string;
  originSourceId?: string;
  episodeNumber?: number;
  resolvedAt?: string;
}

export interface PlaySourceRefreshResult {
  refreshed: boolean;
  oldUrl: string;
  newUrl?: string;
  message: string;
  playSource?: PlaySource;
}

@Injectable()
export class PlaySourceService {
  private readonly FRESHNESS_MS = 6 * 60 * 60 * 1000;
  private readonly STALE_MS = 24 * 60 * 60 * 1000;
  private readonly refreshLocks = new Map<number, Promise<void>>();

  constructor(
    @InjectRepository(PlaySource)
    private playSourceRepository: Repository<PlaySource>,
    private parseProvidersService: ParseProvidersService,
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

  async create(createPlaySourceDto: CreatePlaySourceDto): Promise<PlaySource> {
    const url = this.normalizeUrl(createPlaySourceDto.url);
    const existing = await this.playSourceRepository.findOne({
      where: {
        mediaResourceId: createPlaySourceDto.mediaResourceId,
        url,
      },
    });

    if (existing) {
      existing.isActive = true;
      existing.status = PlaySourceStatus.ACTIVE;
      existing.type = createPlaySourceDto.type;
      existing.priority = createPlaySourceDto.priority ?? existing.priority;
      existing.sourceName = createPlaySourceDto.sourceName ?? existing.sourceName;
      existing.resolution = createPlaySourceDto.resolution ?? existing.resolution;
      existing.format = createPlaySourceDto.format ?? existing.format;
      existing.description = createPlaySourceDto.description ?? existing.description;
      existing.episodeNumber = createPlaySourceDto.episodeNumber ?? existing.episodeNumber;
      existing.lastCheckedAt = undefined;
      existing.validationInfo = {
        ...(this.isRecord(existing.validationInfo) ? existing.validationInfo : {}),
        reactivatedAt: new Date().toISOString(),
      };
      await this.playSourceRepository.save(existing);
      return existing;
    }

    const playSource = this.playSourceRepository.create(createPlaySourceDto);
    playSource.url = url;
    playSource.status = PlaySourceStatus.ACTIVE;
    return this.playSourceRepository.save(playSource);
  }

  async findAll(queryDto: PlaySourceQueryDto): Promise<{
    data: PlaySource[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      pageSize = 10,
      mediaResourceId,
      type,
      status,
      quality,
      resolution,
      isActive,
      search,
    } = queryDto;

    const queryBuilder = this.playSourceRepository
      .createQueryBuilder('playSource')
      .leftJoinAndSelect('playSource.mediaResource', 'mediaResource');

    if (mediaResourceId) {
      queryBuilder.andWhere('playSource.mediaResourceId = :mediaResourceId', { mediaResourceId });
    }

    if (type) {
      queryBuilder.andWhere('playSource.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('playSource.status = :status', { status });
    }

    if (quality) {
      queryBuilder.andWhere('playSource.resolution = :quality', { quality });
    }

    if (resolution) {
      queryBuilder.andWhere('playSource.resolution = :resolution', { resolution });
    }

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('playSource.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(playSource.url LIKE :search OR playSource.name LIKE :search OR playSource.description LIKE :search OR mediaResource.title LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await queryBuilder.getCount();
    const skip = (page - 1) * pageSize;
    const data = await queryBuilder
      .orderBy('playSource.priority', 'ASC')
      .addOrderBy('playSource.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize)
      .getMany();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findByName(name: string): Promise<PlaySource | null> {
    return this.playSourceRepository.findOne({
      where: { sourceName: name },
    });
  }

  async findById(id: number): Promise<PlaySource> {
    const playSource = await this.playSourceRepository.findOne({
      where: { id },
      relations: ['mediaResource'],
    });

    if (!playSource) {
      throw new NotFoundException(`Play source ${id} not found`);
    }

    return playSource;
  }

  async update(id: number, updatePlaySourceDto: UpdatePlaySourceDto): Promise<PlaySource> {
    const playSource = await this.findById(id);
    Object.assign(playSource, updatePlaySourceDto);
    return this.playSourceRepository.save(playSource);
  }

  async updateOriginInfo(id: number, origin: PlaySourceOriginInfo): Promise<PlaySource> {
    const playSource = await this.findById(id);
    playSource.validationInfo = {
      ...(this.isRecord(playSource.validationInfo) ? playSource.validationInfo : {}),
      origin: {
        ...(this.isRecord(playSource.validationInfo?.origin)
          ? playSource.validationInfo.origin
          : {}),
        ...origin,
      },
    };
    return this.playSourceRepository.save(playSource);
  }

  async refreshResolvedUrl(
    id: number,
    url: string,
    origin: PlaySourceOriginInfo,
  ): Promise<PlaySource> {
    const playSource = await this.findById(id);
    const previousUrl = playSource.url;

    playSource.url = this.normalizeUrl(url);
    playSource.type = this.inferTypeFromUrl(playSource.url);
    playSource.status = PlaySourceStatus.ACTIVE;
    playSource.isActive = true;
    playSource.lastCheckedAt = undefined;
    playSource.validationInfo = {
      ...(this.isRecord(playSource.validationInfo) ? playSource.validationInfo : {}),
      origin: {
        ...(this.isRecord(playSource.validationInfo?.origin)
          ? playSource.validationInfo.origin
          : {}),
        ...origin,
      },
      previousUrl,
      refreshedAt: new Date().toISOString(),
    };

    return this.playSourceRepository.save(playSource);
  }

  async refreshFromOrigin(id: number): Promise<PlaySourceRefreshResult> {
    const playSource = await this.findById(id);
    const origin = this.extractOriginInfo(playSource);
    const oldUrl = playSource.url;

    if (!origin.originPlayPageUrl) {
      return {
        refreshed: false,
        oldUrl,
        message: '播放源没有保存原始播放页，无法按单条源刷新。需要重新爬取详情页或列表页。',
      };
    }

    const resolvedUrl = await this.resolveDytt001PlayPageUrl(origin.originPlayPageUrl);
    if (!resolvedUrl) {
      return {
        refreshed: false,
        oldUrl,
        message: '原始播放页未解析到可用播放 URL。',
      };
    }

    if (this.normalizeUrl(resolvedUrl) === this.normalizeUrl(oldUrl)) {
      const validation = await this.validatePlaySource(playSource);
      return {
        refreshed: validation.isValid,
        oldUrl,
        newUrl: resolvedUrl,
        message: validation.isValid ? '播放源仍然有效。' : validation.message,
        playSource,
      };
    }

    const updated = await this.refreshResolvedUrl(id, resolvedUrl, {
      ...origin,
      resolvedAt: new Date().toISOString(),
    });
    const validation = await this.validatePlaySource(updated);

    return {
      refreshed: validation.isValid,
      oldUrl,
      newUrl: resolvedUrl,
      message: validation.isValid ? '播放源已刷新。' : validation.message,
      playSource: updated,
    };
  }

  async remove(id: number): Promise<void> {
    const playSource = await this.findById(id);
    await this.playSourceRepository.remove(playSource);
  }

  async validate(id: number): Promise<{
    isValid: boolean;
    message: string;
    details: Record<string, unknown>;
  }> {
    const playSource = await this.findById(id);
    const result = await this.validatePlaySource(playSource);

    return {
      isValid: result.isValid,
      message: result.message,
      details: result.validationInfo,
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
      const result = await this.validatePlaySource(source);
      if (result.isValid) {
        active += 1;
      } else {
        inactive += 1;
      }
    }

    return {
      checked: sources.length,
      active,
      inactive,
    };
  }

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

      const result = await this.validatePlaySource(source);
      if (result.isValid) {
        return source;
      }
    }

    return null;
  }

  async getByMediaResource(mediaResourceId: number): Promise<PlaySource[]> {
    const sources = await this.playSourceRepository.find({
      where: {
        mediaResourceId,
        isActive: true,
      },
    });

    const sorted = this.sortPlaySources(sources).filter(
      source => source.status === PlaySourceStatus.ACTIVE && source.isActive,
    );

    return this.deduplicateByUrl(sorted);
  }

  async getPlayableSources(mediaResourceId: number): Promise<{
    sources: PlaySource[];
    freshness: 'fresh' | 'stale' | 'refreshing' | 'empty';
  }> {
    const sources = await this.playSourceRepository.find({
      where: {
        mediaResourceId,
        isActive: true,
      },
    });

    const activeSources = sources.filter(s => s.status === PlaySourceStatus.ACTIVE);
    if (activeSources.length === 0) {
      this.triggerBackgroundRefresh(mediaResourceId);
      return { sources: [], freshness: 'empty' };
    }

    const now = Date.now();
    const fresh = activeSources.filter(s => {
      if (!s.lastCheckedAt) return false;
      return now - new Date(s.lastCheckedAt).getTime() < this.FRESHNESS_MS;
    });

    if (fresh.length > 0) {
      return {
        sources: this.deduplicateByUrl(this.sortPlaySources(fresh)),
        freshness: 'fresh',
      };
    }

    const hasRecent = activeSources.some(s => {
      if (!s.lastCheckedAt) return false;
      return now - new Date(s.lastCheckedAt).getTime() < this.STALE_MS;
    });

    this.triggerBackgroundRefresh(mediaResourceId);

    return {
      sources: this.deduplicateByUrl(this.sortPlaySources(activeSources)),
      freshness: hasRecent ? 'stale' : 'refreshing',
    };
  }

  private triggerBackgroundRefresh(mediaResourceId: number): void {
    if (this.refreshLocks.has(mediaResourceId)) return;

    const promise = this.refreshMediaSources(mediaResourceId, { limit: 5 })
      .then(() => undefined)
      .catch(() => undefined)
      .finally(() => {
        this.refreshLocks.delete(mediaResourceId);
      });
    this.refreshLocks.set(mediaResourceId, promise);
  }

  async getSourceFreshness(mediaResourceId: number): Promise<'fresh' | 'stale' | 'refreshing' | 'empty'> {
    if (this.refreshLocks.has(mediaResourceId)) return 'refreshing';

    const sources = await this.playSourceRepository.find({
      where: { mediaResourceId, isActive: true },
    });
    const active = sources.filter(s => s.status === PlaySourceStatus.ACTIVE);
    if (active.length === 0) return 'empty';

    const now = Date.now();
    const hasFresh = active.some(s => {
      if (!s.lastCheckedAt) return false;
      return now - new Date(s.lastCheckedAt).getTime() < this.FRESHNESS_MS;
    });
    if (hasFresh) return 'fresh';

    return 'stale';
  }

  async refreshMediaSources(
    mediaResourceId: number,
    options?: { limit?: number },
  ): Promise<{
    refreshed: number;
    valid: PlaySource[];
    invalid: Array<{ id: number; oldUrl: string; reason: string }>;
    best: PlaySource | null;
  }> {
    const limit = options?.limit ?? 5;
    const sources = await this.playSourceRepository.find({
      where: { mediaResourceId },
    });

    const sorted = this.sortPlaySources(sources).slice(0, limit);
    const valid: PlaySource[] = [];
    const invalid: Array<{ id: number; oldUrl: string; reason: string }> = [];

    for (const source of sorted) {
      try {
        let refreshed = source;
        const origin = this.extractOriginInfo(source);

        if (origin.originPlayPageUrl) {
          const newUrl = await this.resolveDytt001PlayPageUrl(origin.originPlayPageUrl);
          if (newUrl && this.normalizeUrl(newUrl) !== this.normalizeUrl(source.url)) {
            refreshed = await this.refreshResolvedUrl(source.id, newUrl, {
              ...origin,
              resolvedAt: new Date().toISOString(),
            });
          }
        }

        const validation = await this.validatePlaySource(refreshed);
        if (validation.isValid) {
          valid.push(refreshed);
        } else {
          invalid.push({ id: source.id, oldUrl: source.url, reason: validation.message });
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        source.status = PlaySourceStatus.ERROR;
        source.isActive = false;
        source.lastCheckedAt = new Date();
        await this.playSourceRepository.save(source);
        invalid.push({ id: source.id, oldUrl: source.url, reason: msg });
      }
    }

    return {
      refreshed: valid.length + invalid.length,
      valid: this.deduplicateByUrl(this.sortPlaySources(valid)),
      invalid,
      best: valid.length > 0 ? this.sortPlaySources(valid)[0] : null,
    };
  }

  private deduplicateByUrl(sources: PlaySource[]): PlaySource[] {
    const seen = new Set<string>();
    return sources.filter(s => {
      const key = this.normalizeUrl(s.url);
      if (!key) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async deduplicatePlaySources(dryRun = true): Promise<{
    dryRun: boolean;
    duplicateGroups: number;
    deactivated: number;
    groups: PlaySourceDuplicateGroup[];
  }> {
    const sources = await this.playSourceRepository.find({
      order: { mediaResourceId: 'ASC', priority: 'ASC', id: 'ASC' },
    });
    const grouped = new Map<string, PlaySource[]>();

    for (const source of sources) {
      const key = `${source.mediaResourceId}:${this.normalizeUrl(source.url)}`;
      if (!source.mediaResourceId || key.endsWith(':')) continue;
      const group = grouped.get(key) || [];
      group.push(source);
      grouped.set(key, group);
    }

    const duplicateGroups = Array.from(grouped.values()).filter(group => group.length > 1);
    const previewGroups: PlaySourceDuplicateGroup[] = [];
    let deactivated = 0;

    for (const group of duplicateGroups) {
      const [keeper, ...duplicates] = this.sortPlaySources(group);
      previewGroups.push({
        keeper: this.toPlaySourcePreview(keeper),
        duplicates: duplicates.map(source => this.toPlaySourcePreview(source)),
      });

      if (dryRun) {
        deactivated += duplicates.filter(source => source.isActive).length;
        continue;
      }

      for (const duplicate of duplicates) {
        if (!duplicate.isActive) continue;
        duplicate.isActive = false;
        duplicate.status = PlaySourceStatus.INACTIVE;
        await this.playSourceRepository.save(duplicate);
        deactivated++;
      }
    }

    return {
      dryRun,
      duplicateGroups: duplicateGroups.length,
      deactivated,
      groups: previewGroups,
    };
  }

  private async validatePlaySource(playSource: PlaySource): Promise<PlaySourceValidationResult> {
    const result = await this.checkPlaySourceAvailability(playSource);
    const existingOrigin = this.isRecord(playSource.validationInfo?.origin)
      ? playSource.validationInfo.origin
      : undefined;

    playSource.status = result.isValid ? PlaySourceStatus.ACTIVE : PlaySourceStatus.ERROR;
    playSource.isActive = result.isValid;
    playSource.lastCheckedAt = new Date();
    playSource.validationInfo = {
      ...result.validationInfo,
      ...(existingOrigin ? { origin: existingOrigin } : {}),
      checkedAt: playSource.lastCheckedAt.toISOString(),
    };

    if (result.providerName) {
      playSource.providerName = result.providerName;
    }
    if (result.format) {
      playSource.format = result.format;
    }
    if (result.resolution) {
      playSource.resolution = playSource.resolution || result.resolution;
    }
    if (result.magnetInfo) {
      playSource.magnetInfo = {
        ...(this.isRecord(playSource.magnetInfo) ? playSource.magnetInfo : {}),
        ...result.magnetInfo,
      };
    }

    await this.playSourceRepository.save(playSource);
    return result;
  }

  private async checkPlaySourceAvailability(
    playSource: PlaySource,
  ): Promise<PlaySourceValidationResult> {
    switch (playSource.type) {
      case PlaySourceType.MAGNET:
        return this.validateMagnetSource(playSource);
      case PlaySourceType.PARSER:
        return this.validateParserSource(playSource);
      default:
        return this.validateHttpSource(playSource.url, playSource.type);
    }
  }

  private validateMagnetSource(playSource: PlaySource): PlaySourceValidationResult {
    try {
      const parsed = magnetUri.decode(playSource.url) as unknown as Record<string, unknown>;
      const infoHash = this.extractMagnetInfoHash(parsed);
      const trackers = this.normalizeStringArray(parsed.announce || parsed.tr || []);
      const webSeeds = this.normalizeStringArray(parsed.urlList || parsed.ws || []);
      const displayName =
        (typeof parsed.name === 'string' && parsed.name) ||
        (typeof parsed.dn === 'string' && parsed.dn) ||
        playSource.name ||
        undefined;

      if (!infoHash) {
        return {
          isValid: false,
          message: 'Magnet source is missing infoHash.',
          validationInfo: {
            strategy: 'magnet',
            reason: 'missing_info_hash',
          },
        };
      }

      return {
        isValid: true,
        message: 'Magnet source parsed successfully.',
        validationInfo: {
          strategy: 'magnet',
          infoHash,
          trackerCount: trackers.length,
          webSeedCount: webSeeds.length,
          displayName,
        },
        format: 'magnet',
        magnetInfo: {
          infoHash,
          displayName,
          trackers,
          trackerCount: trackers.length,
          webSeeds,
          webSeedCount: webSeeds.length,
        },
      };
    } catch (error: unknown) {
      return {
        isValid: false,
        message: error instanceof Error ? error.message : 'Invalid magnet source.',
        validationInfo: {
          strategy: 'magnet',
          reason: 'decode_failed',
        },
      };
    }
  }

  private async validateParserSource(playSource: PlaySource): Promise<PlaySourceValidationResult> {
    const provider = playSource.providerName
      ? await this.parseProvidersService.findByName(playSource.providerName)
      : await this.parseProvidersService.getBestProvider(undefined, true);

    if (!provider) {
      return {
        isValid: false,
        message: 'No active parse provider is available for this source.',
        validationInfo: {
          strategy: 'parser',
          reason: 'provider_unavailable',
        },
      };
    }

    const parsedResult = await this.parseProvidersService.parseVideoUrl(
      provider.id,
      playSource.url,
    );
    const playUrls = this.normalizeStringArray(parsedResult.playUrls || []);
    const downloadUrls = this.normalizeStringArray(parsedResult.downloadUrls || []);
    const subtitleUrls = this.normalizeStringArray(parsedResult.subtitleUrls || []);
    const candidateUrl = playUrls[0] || downloadUrls[0];

    if (!parsedResult.success || !candidateUrl) {
      return {
        isValid: false,
        message: parsedResult.message || 'Parser did not return any usable URL.',
        validationInfo: {
          strategy: 'parser',
          providerName: provider.name,
          providerId: provider.id,
          playUrlCount: playUrls.length,
          downloadUrlCount: downloadUrls.length,
          subtitleUrlCount: subtitleUrls.length,
          reason: 'empty_parse_result',
        },
        providerName: provider.name,
      };
    }

    const downstreamValidation = await this.validateHttpSource(candidateUrl, PlaySourceType.STREAM);

    return {
      isValid: downstreamValidation.isValid,
      message: downstreamValidation.isValid
        ? `Parser validation succeeded via provider ${provider.name}.`
        : `Parser resolved a URL but downstream probe failed: ${downstreamValidation.message}`,
      validationInfo: {
        strategy: 'parser',
        providerName: provider.name,
        providerId: provider.id,
        playUrlCount: playUrls.length,
        downloadUrlCount: downloadUrls.length,
        subtitleUrlCount: subtitleUrls.length,
        resolvedUrl: candidateUrl,
        parserMessage: parsedResult.message,
        ...downstreamValidation.validationInfo,
      },
      format: downstreamValidation.format,
      resolution: downstreamValidation.resolution,
      providerName: provider.name,
    };
  }

  private async validateHttpSource(
    url: string,
    sourceType: PlaySourceType,
  ): Promise<PlaySourceValidationResult> {
    const extension = this.getFileExtension(url);
    const requestHeaders = this.buildProbeHeaders();
    const looksLikePlaylist = extension === 'm3u8';

    try {
      const headResponse = await axios.head(url, {
        timeout: 8000,
        headers: requestHeaders,
        maxRedirects: 5,
        validateStatus: status => status >= 200 && status < 500,
      });

      const headDetails = this.extractHttpProbeDetails(headResponse, 'head', sourceType, url);
      if (headResponse.status < 400 && this.isSuccessfulMediaProbe(headDetails)) {
        return {
          isValid: true,
          message: 'HTTP HEAD probe succeeded.',
          validationInfo: headDetails,
          format: this.detectFormat(extension, headDetails.contentType),
        };
      }
    } catch {
      // ignore and continue with GET probes
    }

    try {
      if (looksLikePlaylist) {
        const playlistResponse = await axios.get<string>(url, {
          timeout: 10000,
          headers: requestHeaders,
          responseType: 'text',
          maxRedirects: 5,
          validateStatus: status => status >= 200 && status < 500,
        });
        const playlistBody = typeof playlistResponse.data === 'string' ? playlistResponse.data : '';
        const playlistValid = playlistResponse.status < 400 && playlistBody.includes('#EXTM3U');
        const details = {
          ...this.extractHttpProbeDetails(playlistResponse, 'playlist-get', sourceType, url),
          playlistSignature: playlistBody.includes('#EXTM3U'),
        };

        return {
          isValid: playlistValid,
          message: playlistValid ? 'Playlist probe succeeded.' : 'Playlist probe failed.',
          validationInfo: details,
          format: 'm3u8',
        };
      }

      const getResponse = await axios.get<ArrayBuffer>(url, {
        timeout: 10000,
        headers: {
          ...requestHeaders,
          Range: 'bytes=0-1',
        },
        responseType: 'arraybuffer',
        maxRedirects: 5,
        validateStatus: status => status >= 200 && status < 500,
      });

      const details = this.extractHttpProbeDetails(getResponse, 'range-get', sourceType, url);
      const isValid = getResponse.status < 400;

      return {
        isValid,
        message: isValid ? 'Range probe succeeded.' : 'Range probe failed.',
        validationInfo: details,
        format: this.detectFormat(extension, details.contentType),
      };
    } catch (error: unknown) {
      return {
        isValid: false,
        message: error instanceof Error ? error.message : 'HTTP probe failed.',
        validationInfo: {
          strategy: 'http',
          method: 'range-get',
          sourceType,
          originalUrl: url,
          reason: error instanceof Error ? error.message : 'request_failed',
        },
      };
    }
  }

  private extractHttpProbeDetails(
    response: AxiosResponse<unknown>,
    method: string,
    sourceType: PlaySourceType,
    originalUrl: string,
  ) {
    const headers = response.headers as RawAxiosResponseHeaders;
    const contentType = this.getHeaderValue(headers, 'content-type');
    const contentLength = this.parseContentLength(this.getHeaderValue(headers, 'content-length'));
    const acceptRanges = this.getHeaderValue(headers, 'accept-ranges');
    const finalUrl = this.extractFinalUrl(response) || originalUrl;

    return {
      strategy: 'http',
      method,
      sourceType,
      originalUrl,
      finalUrl,
      statusCode: response.status,
      contentType,
      contentLength,
      acceptRanges,
    };
  }

  private isSuccessfulMediaProbe(details: Record<string, unknown>) {
    const contentType = typeof details.contentType === 'string' ? details.contentType : '';
    const finalUrl = typeof details.finalUrl === 'string' ? details.finalUrl : '';
    const extension = this.getFileExtension(finalUrl);

    return (
      contentType.includes('video/') ||
      contentType.includes('audio/') ||
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl') ||
      contentType.includes('application/octet-stream') ||
      extension === 'm3u8' ||
      extension === 'mp4' ||
      extension === 'mkv' ||
      extension === 'flv' ||
      extension === 'avi'
    );
  }

  private detectFormat(extension?: string, contentType?: unknown) {
    const normalizedContentType = typeof contentType === 'string' ? contentType.toLowerCase() : '';

    if (extension) {
      return extension;
    }

    if (normalizedContentType.includes('mpegurl')) {
      return 'm3u8';
    }
    if (normalizedContentType.includes('mp4')) {
      return 'mp4';
    }
    if (normalizedContentType.includes('webm')) {
      return 'webm';
    }
    if (normalizedContentType.includes('x-matroska')) {
      return 'mkv';
    }

    return undefined;
  }

  private getFileExtension(url: string) {
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.([a-z0-9]+)$/i);
      return match?.[1]?.toLowerCase();
    } catch {
      const match = url.match(/\.([a-z0-9]+)(?:\?|$)/i);
      return match?.[1]?.toLowerCase();
    }
  }

  private extractMagnetInfoHash(parsed: Record<string, unknown>) {
    const directInfoHash = typeof parsed.infoHash === 'string' ? parsed.infoHash : undefined;
    if (directInfoHash) {
      return directInfoHash;
    }

    const xt = typeof parsed.xt === 'string' ? parsed.xt : undefined;
    if (!xt) {
      return undefined;
    }

    const match = xt.match(/urn:btih:([a-zA-Z0-9]+)/i);
    return match?.[1];
  }

  private normalizeStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
    }
    if (typeof value === 'string' && value.length > 0) {
      return [value];
    }
    return [];
  }

  private buildProbeHeaders() {
    return {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: '*/*',
    };
  }

  private getHeaderValue(headers: RawAxiosResponseHeaders, key: string) {
    const value = headers[key] || headers[key.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  }

  private parseContentLength(value: unknown) {
    if (typeof value !== 'string') {
      return undefined;
    }
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private extractFinalUrl(response: AxiosResponse<unknown>) {
    const request = response.request as { res?: { responseUrl?: string } } | undefined;
    return request?.res?.responseUrl;
  }

  private extractOriginInfo(playSource: PlaySource): PlaySourceOriginInfo {
    const validationInfo = this.isRecord(playSource.validationInfo)
      ? playSource.validationInfo
      : {};
    const origin = this.isRecord(validationInfo.origin) ? validationInfo.origin : {};

    return {
      originSite: typeof origin.originSite === 'string' ? origin.originSite : undefined,
      originDetailUrl:
        typeof origin.originDetailUrl === 'string' ? origin.originDetailUrl : undefined,
      originPlayPageUrl:
        typeof origin.originPlayPageUrl === 'string' ? origin.originPlayPageUrl : undefined,
      originSourceId: typeof origin.originSourceId === 'string' ? origin.originSourceId : undefined,
      episodeNumber:
        typeof origin.episodeNumber === 'number' ? origin.episodeNumber : playSource.episodeNumber,
      resolvedAt: typeof origin.resolvedAt === 'string' ? origin.resolvedAt : undefined,
    };
  }

  private async resolveDytt001PlayPageUrl(playPageUrl: string): Promise<string | null> {
    const response = await axios.get<string>(playPageUrl, {
      timeout: 12000,
      headers: this.buildProbeHeaders(),
      responseType: 'text',
      maxRedirects: 5,
      validateStatus: status => status >= 200 && status < 500,
    });

    if (response.status >= 400 || typeof response.data !== 'string') {
      return null;
    }

    const playerMatch = response.data.match(/"url"\s*:\s*"(https?:[^"]+\.m3u8[^"]*)"/);
    if (playerMatch) {
      return this.decodeJsonString(playerMatch[1]);
    }

    const anyUrlMatch = response.data.match(/"url"\s*:\s*"(https?:[^"]+)"/);
    return anyUrlMatch ? this.decodeJsonString(anyUrlMatch[1]) : null;
  }

  private decodeJsonString(value: string): string {
    try {
      return value
        .replace(/\\\//g, '/')
        .replace(/\\u([0-9a-fA-F]{4})/g, (_match: string, hex: string) =>
          String.fromCharCode(parseInt(hex, 16)),
        )
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"');
    } catch {
      return value;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private sortPlaySources(sources: PlaySource[]): PlaySource[] {
    const now = new Date();
    return [...sources].sort((left, right) => comparePlaySources(left, right, now));
  }

  private normalizeUrl(url?: string): string {
    return String(url || '').trim();
  }

  private inferTypeFromUrl(url: string): PlaySourceType {
    const normalizedUrl = url.toLowerCase();

    if (normalizedUrl.startsWith('magnet:')) {
      return PlaySourceType.MAGNET;
    }

    if (
      normalizedUrl.startsWith('ftp:') ||
      normalizedUrl.startsWith('thunder:') ||
      normalizedUrl.startsWith('ed2k:')
    ) {
      return PlaySourceType.DOWNLOAD;
    }

    if (normalizedUrl.includes('.m3u8') || normalizedUrl.startsWith('rtmp')) {
      return PlaySourceType.STREAM;
    }

    return PlaySourceType.ONLINE;
  }

  private toPlaySourcePreview(
    source: PlaySource,
  ): Pick<PlaySource, 'id' | 'mediaResourceId' | 'url' | 'status' | 'isActive' | 'priority'> {
    return {
      id: source.id,
      mediaResourceId: source.mediaResourceId,
      url: source.url,
      status: source.status,
      isActive: source.isActive,
      priority: source.priority,
    };
  }
}
