export declare class IPTVChannelQueryDto {
    page?: number;
    limit?: number;
    group?: string;
    language?: string;
    country?: string;
    region?: string;
    resolution?: string;
    streamFormat?: string;
    activeOnly?: boolean;
    isLive?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    search?: string;
}
