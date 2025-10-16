import { MediaResourceService } from './media-resource.service';
import { CreateMediaResourceDto } from './dtos/create-media-resource.dto';
import { UpdateMediaResourceDto } from './dtos/update-media-resource.dto';
export declare class MediaResourceController {
    private readonly mediaResourceService;
    constructor(mediaResourceService: MediaResourceService);
    findAll(page?: number, pageSize?: number, search?: string, type?: string, quality?: string, minRating?: number, maxRating?: number, tags?: string, startDate?: string, endDate?: string): Promise<{
        data: import("../entities/media-resource.entity").MediaResource[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    search(keyword: string, limit?: number): Promise<import("../entities/media-resource.entity").MediaResource[]>;
    getPopular(limit?: number): Promise<import("../entities/media-resource.entity").MediaResource[]>;
    getLatest(limit?: number): Promise<import("../entities/media-resource.entity").MediaResource[]>;
    getStatistics(): Promise<{
        total: number;
        byType: Record<string, number>;
        byQuality: Record<string, number>;
        averageRating: number;
    }>;
    findById(id: number): Promise<import("../entities/media-resource.entity").MediaResource>;
    create(createMediaResourceDto: CreateMediaResourceDto): Promise<import("../entities/media-resource.entity").MediaResource>;
    update(id: number, updateMediaResourceDto: UpdateMediaResourceDto): Promise<import("../entities/media-resource.entity").MediaResource>;
    remove(id: number): Promise<{
        statusCode: number;
        message: string;
        timestamp: string;
    }>;
    getSimilar(id: number, limit?: number): Promise<import("../entities/media-resource.entity").MediaResource[]>;
    incrementViews(id: number): Promise<{
        message: string;
    }>;
    incrementLikes(id: number): Promise<{
        message: string;
    }>;
    decrementLikes(id: number): Promise<{
        message: string;
    }>;
}
