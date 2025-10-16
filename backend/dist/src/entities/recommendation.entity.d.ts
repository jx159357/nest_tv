import { User } from './user.entity';
import { MediaResource } from './media-resource.entity';
export declare class Recommendation {
    id: number;
    type: 'collaborative' | 'content' | 'trending' | 'editorial' | 'personalized' | 'latest' | 'top-rated';
    userId: number;
    mediaResourceId: number;
    score: number;
    priority: number;
    isActive: boolean;
    metadata?: {
        reason?: string;
        algorithm?: string;
        similarUsers?: number[];
        similarMedia?: number[];
        tags?: string[];
        category?: string;
        scoreBreakdown?: {
            viewScore?: number;
            ratingScore?: number;
            recencyScore?: number;
            qualityScore?: number;
            totalScore?: number;
        };
    };
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    mediaResource: MediaResource;
}
