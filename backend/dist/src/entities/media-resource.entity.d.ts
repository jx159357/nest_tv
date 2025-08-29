import { User } from './user.entity';
import { WatchHistory } from './watch-history.entity';
import { PlaySource } from './play-source.entity';
import { Recommendation } from './recommendation.entity';
export declare enum MediaType {
    MOVIE = "movie",
    TV_SERIES = "tv_series",
    VARIETY = "variety",
    ANIME = "anime",
    DOCUMENTARY = "documentary"
}
export declare enum MediaQuality {
    HD = "hd",
    FULL_HD = "full_hd",
    BLUE_RAY = "blue_ray",
    SD = "sd"
}
export declare class MediaResource {
    id: number;
    title: string;
    description?: string;
    type: MediaType;
    director?: string;
    actors?: string;
    genres?: string[];
    releaseDate?: Date;
    quality: MediaQuality;
    poster?: string;
    backdrop?: string;
    rating: number;
    viewCount: number;
    isActive: boolean;
    source?: string;
    metadata?: any;
    episodeCount?: number;
    downloadUrls?: string[];
    createdAt: Date;
    updatedAt: Date;
    favorites: User[];
    watchHistory: WatchHistory[];
    playSources: PlaySource[];
    recommendations: Recommendation[];
}
