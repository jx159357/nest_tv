import { MediaResource } from './media-resource.entity';
export declare class IPTVChannel {
    id: number;
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
    isActive: boolean;
    viewCount: number;
    metadata?: any;
    expireDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    lastCheckedAt?: Date;
    isLive: boolean;
    streamFormat?: string;
    backupUrls?: string[];
    mediaResources: MediaResource[];
    getPrimaryStreamUrl(): string;
    getAllStreamUrls(): string[];
    isAvailable(): boolean;
    getChannelInfo(): any;
}
