import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import magnetUri from 'magnet-uri';
import { PlaySource, PlaySourceType } from '../entities/play-source.entity';
import { MediaResource } from '../entities/media-resource.entity';

interface MagnetInfoPayload {
  size?: string | number;
  files?: Array<{ name: string; size?: number }>;
  seeders?: number;
  leechers?: number;
  category?: string;
}

export interface ParsedMagnetResult {
  infoHash: string;
  name: string;
  announce: string[];
  urlList: string[];
  keywords: string[];
  exactSources: string[];
}

export interface TorrentInfoResult {
  infoHash: string;
  name: string;
  size: string | number | null;
  files: Array<{ name: string; size?: number }>;
  announce: string[];
  relatedSourcesCount: number;
  linkedMedia: Array<{
    id: number;
    title: string;
    type: string;
    poster?: string;
  }>;
}

export interface TorrentHealthResult {
  infoHash: string;
  isHealthy: boolean;
  seeders: number | null;
  leechers: number | null;
  knownSources: number;
  lastChecked: string | null;
}

export interface TorrentListItem {
  infoHash: string;
  name: string;
  size: string | number | null;
  seeders: number | null;
  leechers: number | null;
  added: string;
  category: string | null;
  mediaResourceId: number;
  mediaTitle?: string;
}

@Injectable()
export class TorrentService {
  constructor(
    @InjectRepository(PlaySource)
    private readonly playSourceRepository: Repository<PlaySource>,
  ) {}

  parseMagnetUri(magnetLink: string): ParsedMagnetResult {
    const parsed = magnetUri.decode(magnetLink);

    return {
      infoHash: this.normalizeHash(parsed.infoHash || this.extractHashFromXt(parsed.xt)),
      name: this.toSingleString(parsed.name) || this.toSingleString(parsed.dn) || '',
      announce: parsed.announce || this.toStringArray(parsed.tr),
      urlList: parsed.urlList || this.toStringArray(parsed.ws),
      keywords: this.toStringArray(parsed.keywords || parsed.kt),
      exactSources: this.toStringArray(parsed.xs),
    };
  }

  async getTorrentInfo(hash: string): Promise<TorrentInfoResult | null> {
    const normalizedHash = this.normalizeHash(hash);
    const sources = await this.findSourcesByHash(normalizedHash);

    if (sources.length === 0) {
      return null;
    }

    const primarySource = sources[0];
    const parsed = this.parseMagnetUri(primarySource.url);
    const magnetInfo = this.getMagnetInfo(primarySource);
    const linkedMedia = this.buildLinkedMedia(sources);

    return {
      infoHash: normalizedHash,
      name: parsed.name || primarySource.sourceName || linkedMedia[0]?.title || normalizedHash,
      size: magnetInfo?.size ?? null,
      files: magnetInfo?.files ?? [],
      announce: parsed.announce,
      relatedSourcesCount: sources.length,
      linkedMedia,
    };
  }

  async checkTorrentHealth(hash: string): Promise<TorrentHealthResult | null> {
    const normalizedHash = this.normalizeHash(hash);
    const sources = await this.findSourcesByHash(normalizedHash);

    if (sources.length === 0) {
      return null;
    }

    const seeders = sources
      .map(source => this.getMagnetInfo(source)?.seeders)
      .find((value): value is number => typeof value === 'number');
    const leechers = sources
      .map(source => this.getMagnetInfo(source)?.leechers)
      .find((value): value is number => typeof value === 'number');
    const lastCheckedSource = sources.find(source => source.lastCheckedAt);

    return {
      infoHash: normalizedHash,
      isHealthy: sources.some(source => source.isActive),
      seeders: seeders ?? null,
      leechers: leechers ?? null,
      knownSources: sources.length,
      lastChecked: lastCheckedSource?.lastCheckedAt?.toISOString() ?? null,
    };
  }

  async searchTorrents(
    keyword: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{
    data: TorrentListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const queryBuilder = this.playSourceRepository
      .createQueryBuilder('playSource')
      .leftJoinAndSelect('playSource.mediaResource', 'mediaResource')
      .where('playSource.type = :type', { type: PlaySourceType.MAGNET });

    if (keyword.trim()) {
      queryBuilder.andWhere(
        `(
          playSource.url LIKE :keyword OR
          playSource.sourceName LIKE :keyword OR
          playSource.name LIKE :keyword OR
          mediaResource.title LIKE :keyword OR
          mediaResource.description LIKE :keyword
        )`,
        { keyword: `%${keyword.trim()}%` },
      );
    }

    const total = await queryBuilder.getCount();
    const sources = await queryBuilder
      .orderBy('playSource.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return {
      data: sources.map(source => this.toTorrentListItem(source)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getPopularTorrents(limit: number = 20, category?: string): Promise<TorrentListItem[]> {
    return this.getRankedTorrentList('playSource.playCount', limit, category);
  }

  async getLatestTorrents(limit: number = 20, category?: string): Promise<TorrentListItem[]> {
    return this.getRankedTorrentList('playSource.createdAt', limit, category);
  }

  private async getRankedTorrentList(
    orderBy: 'playSource.playCount' | 'playSource.createdAt',
    limit: number,
    category?: string,
  ): Promise<TorrentListItem[]> {
    const queryBuilder = this.playSourceRepository
      .createQueryBuilder('playSource')
      .leftJoinAndSelect('playSource.mediaResource', 'mediaResource')
      .where('playSource.type = :type', { type: PlaySourceType.MAGNET });

    if (category?.trim()) {
      queryBuilder.andWhere('mediaResource.type = :category', { category: category.trim() });
    }

    const sources = await queryBuilder.orderBy(orderBy, 'DESC').take(limit).getMany();
    return sources.map(source => this.toTorrentListItem(source));
  }

  private async findSourcesByHash(hash: string): Promise<PlaySource[]> {
    return this.playSourceRepository
      .createQueryBuilder('playSource')
      .leftJoinAndSelect('playSource.mediaResource', 'mediaResource')
      .where('playSource.type = :type', { type: PlaySourceType.MAGNET })
      .andWhere('playSource.url LIKE :hash', { hash: `%${hash}%` })
      .orderBy('playSource.createdAt', 'DESC')
      .getMany();
  }

  private toTorrentListItem(source: PlaySource): TorrentListItem {
    const parsed = this.parseMagnetUri(source.url);
    const magnetInfo = this.getMagnetInfo(source);

    return {
      infoHash: parsed.infoHash,
      name: parsed.name || source.sourceName || source.mediaResource?.title || parsed.infoHash,
      size: magnetInfo?.size ?? null,
      seeders: magnetInfo?.seeders ?? null,
      leechers: magnetInfo?.leechers ?? null,
      added: source.createdAt.toISOString(),
      category: magnetInfo?.category || source.mediaResource?.type || null,
      mediaResourceId: source.mediaResourceId,
      mediaTitle: source.mediaResource?.title,
    };
  }

  private buildLinkedMedia(sources: PlaySource[]): TorrentInfoResult['linkedMedia'] {
    const seen = new Set<number>();
    const media = sources
      .map(source => source.mediaResource)
      .filter((item): item is MediaResource => Boolean(item?.id) && !seen.has(item.id));

    media.forEach(item => seen.add(item.id));

    return media.map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      poster: item.poster,
    }));
  }

  private getMagnetInfo(source: PlaySource): MagnetInfoPayload | null {
    return source.magnetInfo && typeof source.magnetInfo === 'object'
      ? (source.magnetInfo as MagnetInfoPayload)
      : null;
  }

  private extractHashFromXt(xt?: string | string[]): string {
    const xtValue = this.toSingleString(xt) || '';
    return xtValue.replace('urn:btih:', '');
  }

  private toSingleString(value?: string | string[]): string {
    if (Array.isArray(value)) {
      return value[0] || '';
    }

    return value || '';
  }

  private toStringArray(value?: string | string[]): string[] {
    if (!value) {
      return [];
    }

    return Array.isArray(value) ? value.filter(Boolean) : [value];
  }

  private normalizeHash(hash: string): string {
    return hash.trim().toLowerCase();
  }
}
