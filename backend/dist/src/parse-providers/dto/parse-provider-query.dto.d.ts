export declare class ParseProviderQueryDto {
    page?: number;
    limit?: number;
    category?: string;
    priority?: 'high' | 'medium' | 'low';
    activeOnly?: boolean;
    supportOnlinePlay?: boolean;
    supportDownload?: boolean;
    minSuccessRate?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    search?: string;
}
