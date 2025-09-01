import { DataCollectionService } from './data-collection.service';
import { AppLoggerService } from '../common/services/app-logger.service';
export declare class DataCollectionController {
    private readonly dataCollectionService;
    private readonly logger;
    constructor(dataCollectionService: DataCollectionService, appLoggerService: AppLoggerService);
    collectFromUrl(query: any): Promise<any>;
    batchCollect(sourceName: string, urls: string[], userId?: number): Promise<any>;
    collectPopular(sourceName: string, count?: number, userId?: number): Promise<any>;
    getAvailableSources(): Promise<any>;
    toggleSource(sourceName: string, enabled: boolean, userId?: number): Promise<any>;
    getSourceStats(): Promise<any>;
    processAndSave(mediaData: any, createPlaySources?: boolean, userId?: number): Promise<any>;
    getTemplates(sourceName?: string): Promise<any>;
}
