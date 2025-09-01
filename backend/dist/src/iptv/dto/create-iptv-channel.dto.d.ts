export declare class CreateIPTVChannelDto {
    name: string;
    url: string;
    group: string;
    logo?: string;
    epgId?: string;
    language?: string;
    country?: string;
    region?: string;
    description?: string;
    resolution?: string;
    isActive?: boolean;
    viewCount?: number;
    metadata?: any;
    expireDate?: Date;
    isLive?: boolean;
    streamFormat?: string;
    backupUrls?: string[];
}
