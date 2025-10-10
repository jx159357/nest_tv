import { MediaResourceService } from '../media/media-resource.service';
export interface CrawlerTarget {
    name: string;
    baseUrl: string;
    selectors: {
        title: string;
        description: string;
        poster: string;
        rating: string;
        director: string;
        actors: string;
        genres: string[];
        releaseDate: string;
        downloadUrls: string[];
    };
}
export interface CrawledData {
    title: string;
    description?: string;
    type: 'movie' | 'tv_series' | 'variety' | 'anime' | 'documentary';
    director?: string;
    actors?: string;
    genres?: string[];
    releaseDate?: Date;
    poster?: string;
    backdrop?: string;
    rating: number;
    source: string;
    downloadUrls?: string[];
    episodeCount?: number;
    metadata?: any;
}
export declare class CrawlerService {
    private readonly mediaResourceService;
    private readonly logger;
    private readonly httpClient;
    private readonly cache;
    constructor(mediaResourceService: MediaResourceService);
    getAvailableTargets(): CrawlerTarget[];
    private validateUrl;
    private getCache;
    private setCache;
    private cleanCache;
    private delay;
    crawlWebsite(targetName: string, url: string): Promise<CrawledData | null>;
    batchCrawl(targetName: string, urls: string[]): Promise<CrawledData[]>;
    private extractText;
    private inferMediaType;
    private extractGenres;
    private parseDate;
    private parseRating;
    private resolveUrl;
    private extractDownloadUrls;
    private validateCrawledData;
    testConnection(targetName: string): Promise<boolean>;
}
