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
    private readonly logger;
    private readonly targets;
    crawlWebsite(targetName: string, url: string): Promise<CrawledData | null>;
    batchCrawl(targetName: string, urls: string[]): Promise<CrawledData[]>;
    getAvailableTargets(): CrawlerTarget[];
    private inferMediaType;
    private extractGenres;
    private parseDate;
    private parseRating;
    private extractDownloadUrls;
    private resolveUrl;
    private delay;
}
