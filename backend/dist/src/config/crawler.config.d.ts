import { CrawlerTarget } from '../crawler/crawler.service';
export declare const CRAWLER_TARGETS: CrawlerTarget[];
export declare const CRAWLER_CONFIG: {
    request: {
        timeout: number;
        userAgent: string;
        headers: {
            Accept: string;
            'Accept-Language': string;
            'Accept-Encoding': string;
            Connection: string;
            'Upgrade-Insecure-Requests': string;
        };
    };
    cache: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
    };
    parsing: {
        maxConcurrentRequests: number;
        maxTextLength: number;
        timeout: number;
    };
    cleaning: {
        enabled: boolean;
        minTitleLength: number;
        maxTitleLength: number;
        minDescriptionLength: number;
        maxDescriptionLength: number;
        allowedGenres: string[];
    };
    retry: {
        maxAttempts: number;
        delay: number;
        backoffFactor: number;
    };
    logging: {
        enabled: boolean;
        level: string;
        saveToFile: boolean;
        maxFileSize: number;
        maxFiles: number;
    };
    proxy: {
        enabled: boolean;
        servers: never[];
        rotateInterval: number;
    };
    rateLimit: {
        enabled: boolean;
        requestsPerMinute: number;
        burstSize: number;
    };
    validation: {
        strictMode: boolean;
        allowEmptyFields: string[];
        requiredFields: string[];
    };
};
export declare const CRAWLER_RULES: {
    urlFilters: {
        allowedExtensions: string[];
        disallowedPaths: string[];
        allowedPatterns: RegExp[];
        disallowedPatterns: RegExp[];
    };
    contentFilters: {
        minContentLength: number;
        maxContentLength: number;
        requiredKeywords: string[];
        disallowedKeywords: string[];
    };
    redirectRules: {
        maxRedirects: number;
        followRedirects: boolean;
    };
    timeoutRules: {
        connectionTimeout: number;
        requestTimeout: number;
        responseTimeout: number;
    };
    errorHandling: {
        retryOnTimeout: boolean;
        retryOnError: boolean;
        ignoreErrors: number[];
        logErrors: boolean;
    };
};
export declare const CRAWLER_TASKS: {
    schedule: {
        enabled: boolean;
        interval: string;
        timezone: string;
    };
    queue: {
        maxSize: number;
        retryDelay: number;
        maxRetries: number;
    };
    processing: {
        batchSize: number;
        delayBetweenBatches: number;
        saveToDatabase: boolean;
        generateReport: boolean;
    };
};
