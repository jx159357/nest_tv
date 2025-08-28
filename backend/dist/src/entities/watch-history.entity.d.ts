import { User } from './user.entity';
import { MediaResource } from './media-resource.entity';
export declare class WatchHistory {
    id: number;
    currentTime: number;
    duration?: number;
    progress?: {
        currentTime: number;
        duration: number;
        percentage: number;
    };
    watchDuration: number;
    isCompleted: boolean;
    episodeNumber?: number;
    playCount: number;
    lastPlayedAt?: Date;
    playSettings?: {
        volume: number;
        playbackRate: number;
        quality: string;
        subtitleLanguage: string;
    };
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    user: User;
    userId: number;
    mediaResource: MediaResource;
    mediaResourceId: number;
}
