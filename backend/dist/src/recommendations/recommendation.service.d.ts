import { Cache } from '@nestjs/cache-manager';
import { Repository } from 'typeorm';
import { MediaResource } from '../entities/media-resource.entity';
import { Recommendation } from '../entities/recommendation.entity';
export declare class RecommendationService {
    private readonly mediaResourceRepository;
    private readonly recommendationRepository;
    private readonly cacheManager;
    private readonly logger;
    constructor(mediaResourceRepository: Repository<MediaResource>, recommendationRepository: Repository<Recommendation>, cacheManager: Cache);
    getTrendingRecommendations(limit?: number): Promise<MediaResource[]>;
    getLatestRecommendations(limit?: number): Promise<MediaResource[]>;
    getTopRatedRecommendations(limit?: number): Promise<MediaResource[]>;
    clearRecommendationsCache(): Promise<void>;
}
