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

@Injectable()
export class PlaySourceService {
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
    const playSource = this.playSourceRepository.create(createPlaySourceDto);
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
    const { page = 1, pageSize = 10, mediaResourceId, type } = queryDto;

    const queryBuilder = this.playSourceRepository
      .createQueryBuilder('playSource')
      .leftJoinAndSelect('playSource.mediaResource', 'mediaResource');

    if (mediaResourceId) {
      queryBuilder.andWhere('playSource.mediaResourceId = :mediaResourceId', { mediaResourceId });
    }

    if (type) {
      queryBuilder.andWhere('playSource.type = :type', { type });
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

    return this.sortPlaySources(sources).filter(
      source => source.status === PlaySourceStatus.ACTIVE && source.isActive,
    );
  }

  private async validatePlaySource(playSource: PlaySource): Promise<PlaySourceValidationResult> {
    const result = await this.checkPlaySourceAvailability(playSource);

    playSource.status = result.isValid ? PlaySourceStatus.ACTIVE : PlaySourceStatus.ERROR;
    playSource.isActive = result.isValid;
    playSource.lastCheckedAt = new Date();
    playSource.validationInfo = {
      ...result.validationInfo,
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

  private isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private sortPlaySources(sources: PlaySource[]): PlaySource[] {
    const now = new Date();
    return [...sources].sort((left, right) => comparePlaySources(left, right, now));
  }
}
