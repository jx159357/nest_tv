import { PlaySourceType } from '../../entities/play-source.entity';
export declare class CreatePlaySourceDto {
    mediaResourceId: number;
    type: PlaySourceType;
    name: string;
    url: string;
    resolution?: string;
    language?: string;
    subtitle?: string;
    priority?: number;
    isActive?: boolean;
}
export declare class UpdatePlaySourceDto {
    name?: string;
    url?: string;
    resolution?: string;
    language?: string;
    subtitle?: string;
    priority?: number;
    isActive?: boolean;
}
