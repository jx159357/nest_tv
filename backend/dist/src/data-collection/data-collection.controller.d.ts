import { DataCollectionService } from './data-collection.service';
export declare class DataCollectionController {
    private readonly dataCollectionService;
    constructor(dataCollectionService: DataCollectionService);
    getSources(): import("./data-collection.service").CrawlerSource[];
    getSource(name: string): import("./data-collection.service").CrawlerSource;
    crawlUrl(body: {
        sourceName: string;
        url: string;
        userId?: number;
    }): Promise<{
        success: boolean;
        data: {
            success: boolean;
            data: import("./data-collection.service").MediaData;
            message: string;
        };
        message: string;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
    batchCrawl(body: {
        sourceName: string;
        urls: string[];
        userId?: number;
    }): Promise<{
        success: boolean;
        data: import("./data-collection.service").MediaData[];
        message: string;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
    getPopularUrls(sourceName: string, limit?: number): Promise<{
        success: boolean;
        data: string[];
        message: string;
    } | {
        success: boolean;
        message: any;
        data?: undefined;
    }>;
    testConnection(sourceName: string): Promise<{
        success: boolean;
        message: string;
        responseTime: number | undefined;
    }>;
    getStatistics(): Promise<{
        success: boolean;
        data: {
            totalSources: number;
            enabledSources: number;
            sources: Array<{
                name: string;
                enabled: boolean;
                lastCrawled?: Date;
                totalCrawled?: number;
            }>;
        };
        message: string;
    }>;
}
