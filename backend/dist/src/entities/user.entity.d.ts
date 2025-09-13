import { WatchHistory } from './watch-history.entity';
import { MediaResource } from './media-resource.entity';
import { PlaySource } from './play-source.entity';
import { Recommendation } from './recommendation.entity';
import { SearchHistory } from './search-history.entity';
export declare class User {
    id: number;
    username: string;
    password: string;
    email: string;
    phone?: string;
    nickname?: string;
    role: string;
    isActive: boolean;
    avatar?: string;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    watchHistory: WatchHistory[];
    favorites: MediaResource[];
    configuredPlaySources: PlaySource[];
    recommendations: Recommendation[];
    searchHistory: SearchHistory[];
}
