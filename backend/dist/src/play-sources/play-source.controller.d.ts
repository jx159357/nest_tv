import { PlaySourceService } from './play-source.service';
export declare class PlaySourceController {
    private readonly playSourceService;
    constructor(playSourceService: PlaySourceService);
    findAll(page?: number, pageSize?: number, mediaResourceId?: number, type?: string, status?: string): Promise<{
        data: import("../entities/play-source.entity").PlaySource[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    findById(id: number): Promise<import("../entities/play-source.entity").PlaySource>;
    create(createPlaySourceDto: any): Promise<import("../entities/play-source.entity").PlaySource>;
    update(id: number, updatePlaySourceDto: any): Promise<import("../entities/play-source.entity").PlaySource>;
    remove(id: number): Promise<{
        message: string;
    }>;
    validate(id: number): Promise<{
        isValid: boolean;
        message?: string;
    }>;
    getBestPlaySource(mediaId: number): Promise<import("../entities/play-source.entity").PlaySource | null>;
    getByMediaResource(mediaId: number): Promise<import("../entities/play-source.entity").PlaySource[]>;
}
