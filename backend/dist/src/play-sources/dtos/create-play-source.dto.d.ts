import { PlaySourceType, PlaySourceStatus } from '../../entities/play-source.entity';
export declare class CreatePlaySourceDto {
    url: string;
    type: PlaySourceType;
    status?: PlaySourceStatus;
    resolution?: string;
    format?: string;
    subtitleUrl?: string;
    priority?: number;
    isAds?: boolean;
    description?: string;
    sourceName?: string;
    headers?: any;
    expireDate?: Date;
    episodeNumber?: number;
    mediaResourceId: number;
}
