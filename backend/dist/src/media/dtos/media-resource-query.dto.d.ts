export declare class MediaResourceQueryDto {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
    genre?: string;
    minRating?: number;
    maxRating?: number;
    quality?: string;
    tags?: string;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
