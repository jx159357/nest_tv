import { MediaType, MediaQuality } from '../../entities/media-resource.entity';
export declare class CreateSearchHistoryDto {
    keyword: string;
    resultCount?: number;
    searchTime?: number;
    filters?: {
        types?: MediaType[];
        genres?: string[];
        quality?: MediaQuality[];
        minRating?: number;
        maxRating?: number;
        yearRange?: [number, number];
    };
}
export declare class UpdateSearchHistoryDto {
    keyword?: string;
    resultCount?: number;
    searchTime?: number;
    isActive?: boolean;
    filters?: {
        types?: MediaType[];
        genres?: string[];
        quality?: MediaQuality[];
        minRating?: number;
        maxRating?: number;
        yearRange?: [number, number];
    };
}
export declare class SearchHistoryQueryDto {
    page?: number;
    pageSize?: number;
    onlyActive?: boolean;
    keyword?: string;
    startDate?: Date;
    endDate?: Date;
}
