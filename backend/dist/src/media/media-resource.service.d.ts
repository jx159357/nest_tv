import { Repository } from 'typeorm';
import { MediaResource } from '../entities/media-resource.entity';
import { CreateMediaResourceDto } from './dtos/create-media-resource.dto';
import { UpdateMediaResourceDto } from './dtos/update-media-resource.dto';
import { MediaResourceQueryDto } from './dtos/media-resource-query.dto';
import { CacheService } from '../common/cache/cache.service';
export declare class MediaResourceService {
    private mediaResourceRepository;
    private readonly cacheService;
    constructor(mediaResourceRepository: Repository<MediaResource>, cacheService: CacheService);
    create(createMediaResourceDto: CreateMediaResourceDto): Promise<MediaResource>;
    findAll(queryDto: MediaResourceQueryDto): Promise<{
        data: MediaResource[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    findById(id: number): Promise<MediaResource>;
    update(id: number, updateMediaResourceDto: UpdateMediaResourceDto): Promise<MediaResource>;
    remove(id: number): Promise<void>;
    search(keyword: string, limit?: number): Promise<MediaResource[]>;
    getPopular(limit?: number): Promise<MediaResource[]>;
    getLatest(limit?: number): Promise<MediaResource[]>;
    getSimilar(id: number, limit?: number): Promise<MediaResource[]>;
    incrementViews(id: number): Promise<void>;
    incrementLikes(id: number): Promise<void>;
    decrementLikes(id: number): Promise<void>;
    getStatistics(): Promise<{
        total: number;
        byType: Record<string, number>;
        byQuality: Record<string, number>;
        averageRating: number;
    }>;
}
