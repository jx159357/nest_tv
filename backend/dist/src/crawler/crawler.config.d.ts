import { CrawlerTarget } from './crawler.service';
export declare const CRAWLER_TARGETS: CrawlerTarget[];
export declare const CRAWLER_CONFIG: {
    request: {
        timeout: number;
        retries: number;
        delay: number;
        userAgent: string;
        headers: {
            Accept: string;
            'Accept-Language': string;
            'Accept-Encoding': string;
            Connection: string;
        };
    };
    parsing: {
        defaultTimeout: number;
        maxRetries: number;
        respectRobotsTxt: boolean;
        maxConcurrentRequests: number;
    };
    cleaning: {
        removeHtmlTags: boolean;
        trimWhitespace: boolean;
        normalizeUrls: boolean;
        minTextLength: number;
        maxTextLength: number;
    };
    errorHandling: {
        logErrors: boolean;
        continueOnError: boolean;
        maxErrorRate: number;
    };
    cache: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
    };
};
export declare const CRAWLER_RULES: {
    urlFilters: {
        allowedExtensions: string[];
        disallowedPaths: string[];
        requiredParams: never[];
    };
    contentFilters: {
        minContentLength: number;
        maxContentLength: number;
        requiredKeywords: string[];
        excludedKeywords: string[];
    };
    validation: {
        requiredFields: string[];
        optionalFields: string[];
        dataTypes: {
            title: string;
            rating: string;
            releaseDate: string;
        };
    };
};
