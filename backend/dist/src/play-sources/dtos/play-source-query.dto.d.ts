import { PlaySourceType } from '../../entities/play-source.entity';
export declare class PlaySourceQueryDto {
    page?: number;
    pageSize?: number;
    mediaResourceId?: number;
    type?: PlaySourceType;
    resolution?: string;
    isActive?: boolean;
    search?: string;
}
