import { RecommendationService } from './recommendation.service';
export declare class RecommendationController {
    private readonly recommendationService;
    constructor(recommendationService: RecommendationService);
    getUserRecommendations(userId: string, limit?: string): Promise<import("../entities/recommendation.entity").Recommendation[]>;
    generatePersonalizedRecommendations(userId: string, limit?: number): Promise<import("../entities/recommendation.entity").Recommendation[]>;
    getTrendingRecommendations(limit?: string): Promise<import("../entities/recommendation.entity").Recommendation[]>;
    getEditorialRecommendations(limit?: string): Promise<import("../entities/recommendation.entity").Recommendation[]>;
    getRecommendationDetail(id: string): Promise<import("../entities/recommendation.entity").Recommendation>;
}
