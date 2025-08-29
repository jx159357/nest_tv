import { MediaResourceService } from './media-resource.service';
import { CreateMediaResourceDto } from './dtos/create-media-resource.dto';
import { UpdateMediaResourceDto } from './dtos/update-media-resource.dto';
import { MediaResourceQueryDto } from './dtos/media-resource-query.dto';
import { MediaResource } from '../entities/media-resource.entity';
export declare class MediaResourceController {
    private readonly mediaResourceService;
    constructor(mediaResourceService: MediaResourceService);
    create(createMediaResourceDto: CreateMediaResourceDto): Promise<MediaResource>;
    findAll(queryDto: MediaResourceQueryDto): Promise<{
        data: MediaResource[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getPopular(limit?: number): Promise<MediaResource[]>;
    getLatest(limit?: number): Promise<MediaResource[]>;
    getTopRated(limit?: number, minRating?: number): Promise<MediaResource[]>;
    getByType(type: string, limit?: number): Promise<MediaResource[]>;
    findById(id: number): Promise<MediaResource>;
    getRecommendations(id: number, limit?: number): Promise<MediaResource[]>;
    incrementViewCount(id: number): Promise<void>;
    update(id: number, updateMediaResourceDto: UpdateMediaResourceDto): Promise<MediaResource>;
    remove(id: number): Promise<void>;
    softDelete(id: number): Promise<MediaResource>;
    addToFavorites(mediaResourceId: number, req: any): Promise<void>;
    removeFromFavorites(mediaResourceId: number, req: any): Promise<void>;
    checkFavoriteStatus(mediaResourceId: number, req: any): Promise<{
        isFavorited: boolean;
    }>;
    getUserFavorites(req: any, page?: number, limit?: number): Promise<{
        data: MediaResource[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    rateResource(mediaResourceId: number, rating: number, req: any): Promise<MediaResource>;
    getRatingStats(mediaResourceId: number): Promise<{
        averageRating: number;
        totalRatings: number;
        ratingDistribution: {
            [key: string]: number;
        };
    }>;
}
