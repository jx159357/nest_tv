import { User } from './user.entity';
import { MediaResource } from './media-resource.entity';
export declare class Recommendation {
    id: number;
    type: 'collaborative' | 'content' | 'trending' | 'editorial' | 'personalized';
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
    };
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    mediaResource: MediaResource;
}
