import { PlaySourceService } from './play-source.service';
import { CreatePlaySourceDto, UpdatePlaySourceDto } from './dtos/play-source.dto';
import { PlaySourceQueryDto } from './dtos/play-source-query.dto';
export declare class PlaySourceController {
    private readonly playSourceService;
    constructor(playSourceService: PlaySourceService);
    findAll(queryDto: PlaySourceQueryDto): Promise<{
        data: import("../entities/play-source.entity").PlaySource[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    findById(id: number): Promise<import("../entities/play-source.entity").PlaySource>;
    create(createPlaySourceDto: CreatePlaySourceDto): Promise<import("../entities/play-source.entity").PlaySource>;
    update(id: number, updatePlaySourceDto: UpdatePlaySourceDto): Promise<import("../entities/play-source.entity").PlaySource>;
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
