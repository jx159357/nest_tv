import { RecommendationService } from './recommendation.service';
import { Recommendation } from '../entities/recommendation.entity';
import { MediaResource } from '../entities/media-resource.entity';
export declare class RecommendationController {
    private readonly recommendationService;
    constructor(recommendationService: RecommendationService);
    getTrendingRecommendations(limit?: number): Promise<Recommendation[]>;
    getEditorialRecommendations(limit?: number): Promise<Recommendation[]>;
    getUserRecommendations(req: any, type?: string, limit?: number): Promise<Recommendation[]>;
    generatePersonalizedRecommendations(req: any, limit?: number): Promise<Recommendation[]>;
    getContentBasedRecommendations(req: any, limit?: number): Promise<MediaResource[]>;
    getCollaborativeRecommendations(req: any, limit?: number): Promise<MediaResource[]>;
    recordRecommendationFeedback(req: any, feedbackData: {
        mediaResourceId: number;
        feedback: 'click' | 'like' | 'dislike';
    }): Promise<{
        message: string;
    }>;
    getSimilarMediaRecommendations(mediaId: number, limit?: number): Promise<MediaResource[]>;
    updateRecommendationPriority(req: any, id: number, priorityData: {
        priority: number;
    }): Promise<Recommendation>;
    deleteRecommendation(req: any, id: number): Promise<{
        message: string;
    }>;
    getRecommendationStats(req: any): Promise<{
        total: number;
        byType: Record<string, number>;
        averageScore: number;
    }>;
    getRecommendationDetail(id: number): Promise<Recommendation>;
}
