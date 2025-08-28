export declare class MediaResourceQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    genre?: string;
    minRating?: number;
    maxRating?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
