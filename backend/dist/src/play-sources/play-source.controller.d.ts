import { PlaySourceService } from './play-source.service';
import { CreatePlaySourceDto } from './dtos/create-play-source.dto';
import { UpdatePlaySourceDto } from './dtos/update-play-source.dto';
import { PlaySourceQueryDto } from './dtos/play-source-query.dto';
import { PlaySource, PlaySourceStatus } from '../entities/play-source.entity';
export declare class PlaySourceController {
    private readonly playSourceService;
    constructor(playSourceService: PlaySourceService);
    create(createPlaySourceDto: CreatePlaySourceDto): Promise<PlaySource>;
    createBulk(createPlaySourceDtos: CreatePlaySourceDto[]): Promise<PlaySource[]>;
    findAll(queryDto: PlaySourceQueryDto): Promise<{
        data: PlaySource[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByMediaResourceId(mediaResourceId: number): Promise<PlaySource[]>;
    getBestPlaySource(mediaResourceId: number): Promise<PlaySource | null>;
    findById(id: number): Promise<PlaySource>;
    update(id: number, updatePlaySourceDto: UpdatePlaySourceDto): Promise<PlaySource>;
    updateStatus(id: number, status: PlaySourceStatus): Promise<PlaySource>;
    incrementPlayCount(id: number): Promise<void>;
    validatePlaySource(id: number): Promise<{
        isValid: boolean;
    }>;
    updateBulkStatus(ids: number[], status: PlaySourceStatus): Promise<void>;
    remove(id: number): Promise<void>;
    softDelete(id: number): Promise<PlaySource>;
}
