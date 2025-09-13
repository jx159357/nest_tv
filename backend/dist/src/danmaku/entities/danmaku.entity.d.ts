import { User } from '../../entities/user.entity';
import { MediaResource } from '../../entities/media-resource.entity';
export declare class Danmaku {
    id: number;
    danmakuId: string;
    text: string;
    videoId: string;
    mediaResourceId: number;
    color: string;
    type: 'scroll' | 'top' | 'bottom';
    priority: number;
    isHighlighted: boolean;
    isActive: boolean;
    metadata: {
        userAgent?: string;
        timestamp?: number;
        location?: string;
        platform?: string;
    };
    filters: {
        containsSensitive?: boolean;
        containsSpam?: boolean;
        containsEmojis?: boolean;
        keywords?: string[];
    };
    createdAt: Date;
    updatedAt: Date;
    userId: number;
    user: User;
    mediaResource: MediaResource;
}
