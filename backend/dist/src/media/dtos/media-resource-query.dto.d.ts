export declare class MediaResourceQueryDto {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string | string[];
    genre?: string;
    minRating?: number;
    maxRating?: number;
    quality?: string | string[];
    tags?: string | string[];
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
