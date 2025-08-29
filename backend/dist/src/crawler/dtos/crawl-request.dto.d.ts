export declare class CrawlRequestDto {
    targetName: string;
    url: string;
}
export declare class BatchCrawlRequestDto {
    targetName: string;
    urls: string[];
}
export declare class CrawlAndSaveDto {
    url: string;
    targetName?: string;
}
