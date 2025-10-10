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
    constructor(crawlerService: CrawlerService, mediaResourceService: MediaResourceService);
    crawlSingle(req: any, crawlRequest: CrawlRequestDto): Promise<{
        success: boolean;
        message: string;
        data: null;
    } | {
        success: boolean;
        message: string;
        data: import("./crawler.service").CrawledData;
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
    } | {
        success: boolean;
        message: string;
        data: import("./crawler.service").CrawledData;
    } | {
        success: boolean;
        message: string;
        data: {
            crawledData: import("./crawler.service").CrawledData;
            error: any;
        };
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
}
