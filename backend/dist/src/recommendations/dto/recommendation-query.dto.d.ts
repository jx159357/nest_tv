import { Recommendation } from '../../entities/recommendation.entity';
export declare class RecommendationQueryDto {
    page?: number;
    limit?: number;
    type?: string;
    mediaType?: string;
    quality?: string;
    minRating?: number;
    maxRating?: number;
    genre?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export interface PaginatedRecommendations {
    data: Recommendation[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface RecommendationFilters {
    type?: string;
    mediaType?: string;
    quality?: string;
    minRating?: number;
    maxRating?: number;
    genre?: string;
}
