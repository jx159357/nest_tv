export declare class MediaResourceDto {
    id: number;
    title: string;
    description?: string;
    type: string;
    quality?: string;
    tags?: string[];
    coverUrl?: string;
    playUrl?: string;
    duration?: number;
    rating?: number;
    ratingCount?: number;
    releaseDate?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class MediaListResponseDto {
    data: MediaResourceDto[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
export declare class MediaDetailResponseDto {
    data: MediaResourceDto;
    recommendations?: MediaResourceDto[];
    playSources?: any[];
}
export declare class ErrorResponse {
    statusCode: number;
    message: string;
    errors?: string[];
    timestamp: string;
}
