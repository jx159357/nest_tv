import { CrawlerService } from '../crawler/crawler.service';
import { MediaResourceService } from '../media/media-resource.service';
import { AppLoggerService } from '../common/services/app-logger.service';
export declare class CrawlerSchedulerService {
    private readonly crawlerService;
    private readonly mediaResourceService;
    private readonly appLogger;
    private readonly logger;
    constructor(crawlerService: CrawlerService, mediaResourceService: MediaResourceService, appLogger: AppLoggerService);
    handleScheduledCrawl(): Promise<void>;
    private executeWithRetry;
    private crawlTargetWithTimeout;
    private sleep;
    triggerManualCrawl(targetName?: string): Promise<any>;
    testConnection(targetName?: string): Promise<any>;
    getCrawlerStatus(): any;
    toggleTarget(targetName: string, enabled: boolean): Promise<any>;
}
