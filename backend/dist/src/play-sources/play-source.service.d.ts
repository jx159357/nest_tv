import { Repository } from 'typeorm';
import { PlaySource } from '../entities/play-source.entity';
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
        pageSize: number;
        totalPages: number;
    }>;
    findById(id: number): Promise<PlaySource>;
    update(id: number, updatePlaySourceDto: UpdatePlaySourceDto): Promise<PlaySource>;
    remove(id: number): Promise<void>;
    validate(id: number): Promise<{
        isValid: boolean;
        message?: string;
    }>;
    getBestPlaySource(mediaResourceId: number): Promise<PlaySource | null>;
    getByMediaResource(mediaResourceId: number): Promise<PlaySource[]>;
}
