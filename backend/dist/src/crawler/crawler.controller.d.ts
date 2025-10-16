import { CrawlerService } from './crawler.service';
import { MediaResourceService } from '../media/media-resource.service';
import { CrawlRequestDto, BatchCrawlRequestDto, CrawlAndSaveDto } from './dtos/crawl-request.dto';
export interface CrawlerStatsResponse {
    totalCrawled: number;
    successCount: number;
    failureCount: number;
    lastCrawlTime?: Date;
    targetsAvailable: string[];
}
export declare class CrawlerController {
    private readonly crawlerService;
    private readonly mediaResourceService;
    private readonly logger;
    constructor(crawlerService: CrawlerService, mediaResourceService: MediaResourceService);
    crawlSingle(req: any, crawlRequest: CrawlRequestDto): Promise<{
        success: boolean;
        message: string;
        data: null;
        error: string | undefined;
        details: any;
    } | {
        success: boolean;
        message: string;
        data: import("./crawler.service").CrawledData | undefined;
        error?: undefined;
        details?: undefined;
    }>;
    batchCrawl(req: any, batchCrawlRequest: BatchCrawlRequestDto): Promise<{
        success: boolean;
        message: string;
        data: {
            crawledData: import("./crawler.service").CrawledData[];
            successCount: number;
            failureCount: number;
            savedCount: number;
            totalRequested: number;
        };
    }>;
    getTargets(): Promise<{
        success: boolean;
        data: import("./crawler.service").CrawlerTarget[];
    }>;
    crawlAndSave(req: any, body: CrawlAndSaveDto): Promise<{
        success: boolean;
        message: string;
        data: null;
        error: string | undefined;
        details: any;
    } | {
        success: boolean;
        message: string;
        data: import("./crawler.service").CrawledData | undefined;
        error?: undefined;
        details?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            crawledData: import("./crawler.service").CrawledData | undefined;
            error: any;
        };
        error?: undefined;
        details?: undefined;
    }>;
    getStats(): Promise<CrawlerStatsResponse>;
    testConnection(targetName: string): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        message: string;
        data: {
            status: number;
            url: string;
            error?: undefined;
        };
    } | {
        success: boolean;
        message: string;
        data: {
            error: any;
            url: string;
            status?: undefined;
        };
    }>;
    private saveToDatabase;
    private mapMediaType;
    private mapQuality;
    private arrayFromString;
    testCrawler(targetName?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            target: string;
            connection: boolean;
            responseTime: number;
            error: string;
            testData?: undefined;
        };
    } | {
        success: boolean;
        message: string;
        data: {
            target: string;
            connection: boolean;
            responseTime: number;
            testData: {
                title: any;
                hasDownloadUrls: any;
                description: string;
            } | null;
            error?: undefined;
        };
    } | {
        success: boolean;
        message: string;
        data: {
            target: string;
            error: any;
            connection?: undefined;
            responseTime?: undefined;
            testData?: undefined;
        };
    }>;
}
