import { Repository } from 'typeorm';
import { PlaySource, PlaySourceStatus } from '../entities/play-source.entity';
import { CreatePlaySourceDto } from './dtos/create-play-source.dto';
import { UpdatePlaySourceDto } from './dtos/update-play-source.dto';
import { PlaySourceQueryDto } from './dtos/play-source-query.dto';
export declare class PlaySourceService {
    private playSourceRepository;
    constructor(playSourceRepository: Repository<PlaySource>);
    create(createPlaySourceDto: CreatePlaySourceDto): Promise<PlaySource>;
    findAll(queryDto: PlaySourceQueryDto): Promise<{
        data: PlaySource[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: number): Promise<PlaySource>;
    findByMediaResourceId(mediaResourceId: number): Promise<PlaySource[]>;
    update(id: number, updatePlaySourceDto: UpdatePlaySourceDto): Promise<PlaySource>;
    remove(id: number): Promise<void>;
    softDelete(id: number): Promise<PlaySource>;
    updateStatus(id: number, status: PlaySourceStatus): Promise<PlaySource>;
    incrementPlayCount(id: number): Promise<void>;
    getBestPlaySource(mediaResourceId: number): Promise<PlaySource | null>;
    createBulk(createPlaySourceDtos: CreatePlaySourceDto[]): Promise<PlaySource[]>;
    updateBulkStatus(ids: number[], status: PlaySourceStatus): Promise<void>;
    validatePlaySource(id: number): Promise<boolean>;
}
