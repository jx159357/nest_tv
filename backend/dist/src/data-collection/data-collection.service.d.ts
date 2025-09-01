import { MediaType } from '../entities/media-resource.entity';
import { AppLoggerService } from '../common/services/app-logger.service';
export interface MediaData {
    title: string;
    description?: string;
    type: MediaType;
    director?: string;
    actors?: string;
    genres?: string[];
    releaseDate?: Date;
    poster?: string;
    backdrop?: string;
    rating: number;
    source: string;
    downloadUrls?: string[];
    playUrls?: string[];
    metadata?: any;
}
export interface CrawlerSource {
    name: string;
    baseUrl: string;
    enabled: boolean;
    maxConcurrent: number;
    delay: number;
    config: any;
}
export declare class DataCollectionService {
    private readonly logger;
    constructor(appLoggerService: AppLoggerService);
    private readonly sources;
    collectFromUrl(sourceName: string, url: string, userId?: number): Promise<MediaData | null>;
    batchCollect(sourceName: string, urls: string[], userId?: number): Promise<MediaData[]>;
    collectPopularResources(sourceName: string, count?: number, userId?: number): Promise<MediaData[]>;
    private getPopularUrls;
    private getDoubanPopularUrls;
    private getDy2018PopularUrls;
    private inferMediaType;
    private extractGenres;
    private parseDate;
    private parseRating;
    private extractUrls;
    private resolveUrl;
    private delay;
    getAvailableSources(): CrawlerSource[];
    toggleSource(sourceName: string, enabled: boolean): boolean;
    getSourceStats(): any;
}
