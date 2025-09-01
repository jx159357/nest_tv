import { User } from './user.entity';
import { MediaResource } from './media-resource.entity';
export declare enum PlaySourceType {
    ONLINE = "online",
    DOWNLOAD = "download",
    STREAM = "stream",
    THIRD_PARTY = "third_party",
    MAGNET = "magnet",
    IPTV = "iptv",
    WEBDISK = "webdisk",
    PARSER = "parser"
}
export declare enum PlaySourceStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    ERROR = "error",
    CHECKING = "checking"
}
export declare class PlaySource {
    id: number;
    url: string;
    type: PlaySourceType;
    status: PlaySourceStatus;
    resolution?: string;
    format?: string;
    subtitleUrl?: string;
    priority: number;
    isAds: boolean;
    playCount: number;
    description?: string;
    sourceName?: string;
    isActive: boolean;
    headers?: any;
    expireDate?: Date;
    channelGroup?: string;
    channelLogo?: string;
    providerName?: string;
    magnetInfo?: any;
    webDiskInfo?: any;
    episodeNumber?: number;
    createdAt: Date;
    updatedAt: Date;
    lastCheckedAt?: Date;
    mediaResource: MediaResource;
    mediaResourceId: number;
    configuredBy: User[];
}
