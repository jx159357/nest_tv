import { MediaType } from '../entities/media-resource.entity';
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
    private readonly sources;
    getSources(): CrawlerSource[];
    getSource(name: string): CrawlerSource | undefined;
    crawlUrl(sourceName: string, url: string): Promise<MediaData>;
    crawlBatch(sourceName: string, urls: string[]): Promise<MediaData[]>;
    crawlAndSave(sourceName: string, url: string): Promise<{
        success: boolean;
        data: MediaData;
        message: string;
    }>;
    getPopularUrls(sourceName: string, limit?: number): Promise<string[]>;
    testConnection(sourceName: string): Promise<{
        success: boolean;
        message: string;
        responseTime?: number;
    }>;
    getStatistics(): Promise<{
        totalSources: number;
        enabledSources: number;
        sources: Array<{
            name: string;
            enabled: boolean;
            lastCrawled?: Date;
            totalCrawled?: number;
        }>;
    }>;
    private extractDownloadUrls;
}
