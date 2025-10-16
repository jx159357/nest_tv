import { CrawlerService } from '../crawler/crawler.service';
import { MediaResourceService } from '../media/media-resource.service';
import { AppLoggerService } from '../common/services/app-logger.service';
export declare class CrawlerSchedulerService {
    private readonly crawlerService;
    private readonly mediaResourceService;
    private readonly appLogger;
    private readonly logger;
    private readonly retryAttempts;
    private readonly retryDelay;
    private readonly timeout;
    constructor(crawlerService: CrawlerService, mediaResourceService: MediaResourceService, appLogger: AppLoggerService);
    handleMovieHeavenCrawl(): Promise<void>;
    handleFullCrawl(): Promise<void>;
    private crawlTarget;
    private discoverCrawlUrls;
    private saveToDatabase;
    private mapMediaType;
    private mapQuality;
    private parseRating;
    private arrayFromString;
    private delay;
    private generateRequestId;
    private executeWithRetry;
    private crawlTargetWithTimeout;
    private saveToDatabaseWithRetry;
}
