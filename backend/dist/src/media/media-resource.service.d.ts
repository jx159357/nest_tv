import { Repository } from 'typeorm';
import { MediaResource, MediaType } from '../entities/media-resource.entity';
import { CreateMediaResourceDto } from './dtos/create-media-resource.dto';
import { UpdateMediaResourceDto } from './dtos/update-media-resource.dto';
import { MediaResourceQueryDto } from './dtos/media-resource-query.dto';
export declare class MediaResourceService {
    private mediaResourceRepository;
    constructor(mediaResourceRepository: Repository<MediaResource>);
    create(createMediaResourceDto: CreateMediaResourceDto): Promise<MediaResource>;
    findAll(queryDto: MediaResourceQueryDto): Promise<{
        data: MediaResource[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: number): Promise<MediaResource>;
    update(id: number, updateMediaResourceDto: UpdateMediaResourceDto): Promise<MediaResource>;
    remove(id: number): Promise<void>;
    softDelete(id: number): Promise<MediaResource>;
    incrementViewCount(id: number): Promise<void>;
    getPopular(limit?: number): Promise<MediaResource[]>;
    getLatest(limit?: number): Promise<MediaResource[]>;
    getTopRated(limit?: number, minRating?: number): Promise<MediaResource[]>;
    getByType(type: MediaType, limit?: number): Promise<MediaResource[]>;
    getRecommendations(id: number, limit?: number): Promise<MediaResource[]>;
}
