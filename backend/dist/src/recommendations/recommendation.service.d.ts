import { Repository } from 'typeorm';
import { Recommendation } from '../entities/recommendation.entity';
import { User } from '../entities/user.entity';
import { MediaResource } from '../entities/media-resource.entity';
import { MediaResourceService } from '../media/media-resource.service';
export declare class RecommendationService {
    private recommendationRepository;
    private userRepository;
    private mediaResourceRepository;
    private mediaResourceService;
    constructor(recommendationRepository: Repository<Recommendation>, userRepository: Repository<User>, mediaResourceRepository: Repository<MediaResource>, mediaResourceService: MediaResourceService);
    generatePersonalizedRecommendations(userId: number, limit?: number): Promise<Recommendation[]>;
    getTrendingRecommendations(limit?: number): Promise<Recommendation[]>;
    getEditorialRecommendations(limit?: number): Promise<Recommendation[]>;
    getUserRecommendations(userId: number, limit?: number): Promise<Recommendation[]>;
    getRecommendationDetail(recommendationId: number): Promise<Recommendation>;
    private calculateTypePreferences;
    private findSimilarMediaByType;
    private calculateRecommendationScore;
    private getTypeDisplayName;
}
