import { MediaType, MediaQuality } from '../../entities/media-resource.entity';
export declare class CreateMediaResourceDto {
    title: string;
    description?: string;
    type: MediaType;
    director?: string;
    actors?: string;
    genres?: string[];
    releaseDate?: Date;
    quality?: MediaQuality;
    poster?: string;
    backdrop?: string;
    rating?: number;
    source?: string;
    episodeCount?: number;
    downloadUrls?: string[];
}
