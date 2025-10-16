import { MediaResourceService } from '../media/media-resource.service';
import { AppLoggerService } from '../common/services/app-logger.service';
import { ProxyPoolService } from '../common/services/proxy-pool.service';
import { ProxyInfo } from '../common/types/proxy-pool.types';
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
        genres: string;
        releaseDate: string;
        downloadUrls: string;
    };
    enabled?: boolean;
    priority?: number;
    maxPages?: number;
    respectRobotsTxt?: boolean;
    requestDelay?: number;
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
    private readonly appLogger;
    private readonly proxyPoolService;
    private readonly logger;
    private readonly httpClient;
    private readonly cache;
    constructor(mediaResourceService: MediaResourceService, appLogger: AppLoggerService, proxyPoolService: ProxyPoolService);
    getAvailableTargets(): CrawlerTarget[];
    private validateUrl;
    private getCache;
    private setCache;
    private cleanCache;
    private delay;
    private fetchWithRetry;
    private generateRequestId;
    private validateAndCleanData;
    crawlWebsite(targetName: string, url: string): Promise<{
        success: boolean;
        data?: CrawledData;
        error?: string;
        details?: any;
    }>;
    private extractDyttData;
    private extractDyttDescription;
    private extractDyttDirector;
    private extractDyttActors;
    private extractDyttGenres;
    private inferEpisodeCount;
    private createDynamicTarget;
    private extractGenericData;
    private extractTitleFromPage;
    private extractDescriptionFromPage;
    private extractPosterFromPage;
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
    private extractTargetNameFromUrl;
    private createProxyConfig;
    getProxyStats(): import("../common/types/proxy-pool.types").ProxyStats | {
        enabled: boolean;
        message: string;
    };
    refreshProxyPool(): Promise<{
        success: number;
        failed: number;
    }>;
    testProxy(proxyInfo: ProxyInfo): Promise<any>;
    removeFailedProxies(): number;
    initializeProxyPool(): Promise<void>;
    getProxyPoolConfig(): import("../common/types/proxy-pool.types").ProxyPoolConfig;
    updateProxyPoolConfig(newConfig: any): void;
}
