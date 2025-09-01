export declare class CreateParseProviderDto {
    name: string;
    baseUrl: string;
    parseRule: string;
    apiUrl?: string;
    apiMethod?: string;
    apiHeaders?: string;
    description?: string;
    isActive?: boolean;
    successRate?: number;
    requestCount?: number;
    successCount?: number;
    config?: any;
    metadata?: any;
    category?: string;
    supportOnlinePlay?: boolean;
    supportDownload?: boolean;
    priority?: 'high' | 'medium' | 'low';
    expireDate?: Date;
    dailyRequestLimit?: number;
}
