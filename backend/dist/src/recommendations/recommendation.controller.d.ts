import { RecommendationService } from './recommendation.service';
import { MediaResource } from '../entities/media-resource.entity';
export declare class RecommendationController {
    private readonly recommendationService;
    constructor(recommendationService: RecommendationService);
    getTrending(limit?: number): Promise<MediaResource[]>;
    getLatest(limit?: number): Promise<MediaResource[]>;
    getTopRated(limit?: number): Promise<MediaResource[]>;
}
