import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';
import { MediaResource, MediaType } from '../../entities/media-resource.entity';
import { MediaResourceQueryDto } from '../../media/dtos/media-resource-query.dto';

/**
 * 媒体资源缓存服务
 * 专门处理媒体资源相关的缓存策略
 */
@Injectable()
export class MediaCacheService {
  private readonly CACHE_PREFIX = 'media';
  private readonly TTL_SHORT = 300;    // 5分钟
  private readonly TTL_MEDIUM = 1800;  // 30分钟
  private readonly TTL_LONG = 3600;    // 1小时

  constructor(private cacheService: CacheService) {}

  /**
   * 生成媒体资源缓存键
   */
  private generateMediaKey(...parts: string[]): string {
    return this.cacheService.generateKey(this.CACHE_PREFIX, ...parts);
  }

  /**
   * 缓存媒体资源详情
   */
  async cacheMediaDetail(mediaId: number, media: MediaResource): Promise<void> {
    const key = this.generateMediaKey('detail', mediaId.toString());
    await this.cacheService.set(key, media, this.TTL_MEDIUM);
  }

  /**
   * 获取缓存的媒体资源详情
   */
  async getCachedMediaDetail(mediaId: number): Promise<MediaResource | null> {
    const key = this.generateMediaKey('detail', mediaId.toString());
    return await this.cacheService.get<MediaResource>(key);
  }

  /**
   * 缓存媒体资源列表查询结果
   */
  async cacheMediaList(
    query: MediaResourceQueryDto,
    result: { data: MediaResource[]; total: number }
  ): Promise<void> {
    const key = this.generateMediaKey('list', this.createQueryHash(query));
    await this.cacheService.set(key, result, this.TTL_SHORT);
  }

  /**
   * 获取缓存的媒体资源列表
   */
  async getCachedMediaList(
    query: MediaResourceQueryDto
  ): Promise<{ data: MediaResource[]; total: number } | null> {
    const key = this.generateMediaKey('list', this.createQueryHash(query));
    return await this.cacheService.get<{ data: MediaResource[]; total: number }>(key);
  }

  /**
   * 缓存热门媒体资源
   */
  async cachePopularMedia(media: MediaResource[], limit: number): Promise<void> {
    const key = this.generateMediaKey('popular', limit.toString());
    await this.cacheService.set(key, media, this.TTL_MEDIUM);
  }

  /**
   * 获取缓存的热门媒体资源
   */
  async getCachedPopularMedia(limit: number): Promise<MediaResource[] | null> {
    const key = this.generateMediaKey('popular', limit.toString());
    return await this.cacheService.get<MediaResource[]>(key);
  }

  /**
   * 缓存最新媒体资源
   */
  async cacheLatestMedia(media: MediaResource[], limit: number): Promise<void> {
    const key = this.generateMediaKey('latest', limit.toString());
    await this.cacheService.set(key, media, this.TTL_MEDIUM);
  }

  /**
   * 获取缓存的最新媒体资源
   */
  async getCachedLatestMedia(limit: number): Promise<MediaResource[] | null> {
    const key = this.generateMediaKey('latest', limit.toString());
    return await this.cacheService.get<MediaResource[]>(key);
  }

  /**
   * 缓存高评分媒体资源
   */
  async cacheTopRatedMedia(
    media: MediaResource[],
    limit: number,
    minRating: number
  ): Promise<void> {
    const key = this.generateMediaKey('toprated', limit.toString(), minRating.toString());
    await this.cacheService.set(key, media, this.TTL_MEDIUM);
  }

  /**
   * 获取缓存的高评分媒体资源
   */
  async getCachedTopRatedMedia(
    limit: number,
    minRating: number
  ): Promise<MediaResource[] | null> {
    const key = this.generateMediaKey('toprated', limit.toString(), minRating.toString());
    return await this.cacheService.get<MediaResource[]>(key);
  }

  /**
   * 缓存用户收藏列表
   */
  async cacheUserFavorites(
    userId: number,
    result: { data: MediaResource[]; total: number },
    page: number,
    limit: number
  ): Promise<void> {
    const key = this.generateMediaKey('favorites', userId.toString(), page.toString(), limit.toString());
    await this.cacheService.set(key, result, this.TTL_SHORT);
  }

  /**
   * 获取缓存的用户收藏列表
   */
  async getCachedUserFavorites(
    userId: number,
    page: number,
    limit: number
  ): Promise<{ data: MediaResource[]; total: number; page: number; limit: number; totalPages: number } | null> {
    const key = this.generateMediaKey('favorites', userId.toString(), page.toString(), limit.toString());
    return await this.cacheService.get<{ data: MediaResource[]; total: number; page: number; limit: number; totalPages: number }>(key);
  }

  /**
   * 缓存按类型分类的媒体资源
   */
  async cacheMediaByType(
    type: MediaType,
    media: MediaResource[],
    limit: number
  ): Promise<void> {
    const key = this.generateMediaKey('type', type, limit.toString());
    await this.cacheService.set(key, media, this.TTL_MEDIUM);
  }

  /**
   * 获取缓存按类型分类的媒体资源
   */
  async getCachedMediaByType(
    type: MediaType,
    limit: number
  ): Promise<MediaResource[] | null> {
    const key = this.generateMediaKey('type', type, limit.toString());
    return await this.cacheService.get<MediaResource[]>(key);
  }

  /**
   * 清除媒体资源相关缓存
   */
  async clearMediaCache(mediaId: number): Promise<void> {
    const patterns = [
      this.generateMediaKey('detail', mediaId.toString()),
      this.generateMediaKey('list', '*'),
      this.generateMediaKey('popular', '*'),
      this.generateMediaKey('latest', '*'),
      this.generateMediaKey('toprated', '*'),
      this.generateMediaKey('type', '*'),
    ];
    
    for (const pattern of patterns) {
      await this.cacheService.delPattern(pattern);
    }
  }

  /**
   * 清除用户相关缓存
   */
  async clearUserCache(userId: number): Promise<void> {
    const patterns = [
      this.generateMediaKey('favorites', userId.toString(), '*'),
    ];
    
    for (const pattern of patterns) {
      await this.cacheService.delPattern(pattern);
    }
  }

  /**
   * 清除所有媒体缓存
   */
  async clearAllMediaCache(): Promise<void> {
    await this.cacheService.delPattern(this.generateMediaKey('*'));
  }

  /**
   * 生成查询哈希值
   */
  private createQueryHash(query: MediaResourceQueryDto): string {
    const normalized = {
      page: query.page || 1,
      limit: query.limit || 10,
      search: query.search || '',
      type: query.type || '',
      genre: query.genre || '',
      minRating: query.minRating || 0,
      maxRating: query.maxRating || 10,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'DESC',
    };
    
    return Buffer.from(JSON.stringify(normalized)).toString('base64');
  }

  /**
   * 获取媒体缓存统计
   */
  async getMediaCacheStats(): Promise<{
    totalKeys: number;
    detailCache: number;
    listCache: number;
    popularCache: number;
    latestCache: number;
    topRatedCache: number;
    favoritesCache: number;
    typeCache: number;
  }> {
    const patterns = [
      { name: 'detailCache', pattern: this.generateMediaKey('detail', '*') },
      { name: 'listCache', pattern: this.generateMediaKey('list', '*') },
      { name: 'popularCache', pattern: this.generateMediaKey('popular', '*') },
      { name: 'latestCache', pattern: this.generateMediaKey('latest', '*') },
      { name: 'topRatedCache', pattern: this.generateMediaKey('toprated', '*') },
      { name: 'favoritesCache', pattern: this.generateMediaKey('favorites', '*') },
      { name: 'typeCache', pattern: this.generateMediaKey('type', '*') },
    ];
    
    const stats = await Promise.all(
      patterns.map(async ({ name, pattern }) => {
        const keys = await this.cacheService['redisClient'].keys(pattern);
        return { name, count: keys.length };
      })
    );
    
    const result = {
      totalKeys: 0,
      detailCache: 0,
      listCache: 0,
      popularCache: 0,
      latestCache: 0,
      topRatedCache: 0,
      favoritesCache: 0,
      typeCache: 0,
    };
    
    stats.forEach(({ name, count }) => {
      result[name as keyof typeof result] = count;
      result.totalKeys += count;
    });
    
    return result;
  }

  /**
   * 预热热门资源缓存
   */
  async preheatPopularCache(): Promise<void> {
    try {
      const keys = await this.cacheService['redisClient'].keys(
        this.generateMediaKey('popular', '*')
      );
      
      for (const key of keys) {
        const ttl = await this.cacheService.ttl(key);
        if (ttl < 300) { // 如果缓存即将过期（5分钟内）
          // 这里可以触发后台任务重新生成缓存
          console.log(`Preheating cache for key: ${key}`);
        }
      }
    } catch (error) {
      console.error('Preheating cache error:', error);
    }
  }
}