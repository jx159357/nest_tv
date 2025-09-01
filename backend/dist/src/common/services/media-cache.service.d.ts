import { CacheService } from './cache.service';
import { MediaResource, MediaType } from '../../entities/media-resource.entity';
import { MediaResourceQueryDto } from '../../media/dtos/media-resource-query.dto';
export declare class MediaCacheService {
    private cacheService;
    private readonly CACHE_PREFIX;
    private readonly TTL_SHORT;
    private readonly TTL_MEDIUM;
    private readonly TTL_LONG;
    constructor(cacheService: CacheService);
    private generateMediaKey;
    cacheMediaDetail(mediaId: number, media: MediaResource): Promise<void>;
    getCachedMediaDetail(mediaId: number): Promise<MediaResource | null>;
    cacheMediaList(query: MediaResourceQueryDto, result: {
        data: MediaResource[];
        total: number;
    }): Promise<void>;
    getCachedMediaList(query: MediaResourceQueryDto): Promise<{
        data: MediaResource[];
        total: number;
    } | null>;
    cachePopularMedia(media: MediaResource[], limit: number): Promise<void>;
    getCachedPopularMedia(limit: number): Promise<MediaResource[] | null>;
    cacheLatestMedia(media: MediaResource[], limit: number): Promise<void>;
    getCachedLatestMedia(limit: number): Promise<MediaResource[] | null>;
    cacheTopRatedMedia(media: MediaResource[], limit: number, minRating: number): Promise<void>;
    getCachedTopRatedMedia(limit: number, minRating: number): Promise<MediaResource[] | null>;
    cacheUserFavorites(userId: number, result: {
        data: MediaResource[];
        total: number;
    }, page: number, limit: number): Promise<void>;
    getCachedUserFavorites(userId: number, page: number, limit: number): Promise<{
        data: MediaResource[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    } | null>;
    cacheMediaByType(type: MediaType, media: MediaResource[], limit: number): Promise<void>;
    getCachedMediaByType(type: MediaType, limit: number): Promise<MediaResource[] | null>;
    clearMediaCache(mediaId: number): Promise<void>;
    clearUserCache(userId: number): Promise<void>;
    clearAllMediaCache(): Promise<void>;
    private createQueryHash;
    getMediaCacheStats(): Promise<{
        totalKeys: number;
        detailCache: number;
        listCache: number;
        popularCache: number;
        latestCache: number;
        topRatedCache: number;
        favoritesCache: number;
        typeCache: number;
    }>;
    preheatPopularCache(): Promise<void>;
}
