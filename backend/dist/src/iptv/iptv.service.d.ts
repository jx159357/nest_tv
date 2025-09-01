import { Repository } from 'typeorm';
import { IPTVChannel } from '../entities/iptv-channel.entity';
import { CreateIPTVChannelDto } from './dto/create-iptv-channel.dto';
import { UpdateIPTVChannelDto } from './dto/update-iptv-channel.dto';
import { IPTVChannelQueryDto } from './dto/iptv-channel-query.dto';
export declare class IPTVService {
    private iptvChannelRepository;
    private readonly logger;
    constructor(iptvChannelRepository: Repository<IPTVChannel>);
    create(createIPTVChannelDto: CreateIPTVChannelDto): Promise<IPTVChannel>;
    findAll(queryDto: IPTVChannelQueryDto): Promise<{
        data: IPTVChannel[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: number): Promise<IPTVChannel>;
    update(id: number, updateIPTVChannelDto: UpdateIPTVChannelDto): Promise<IPTVChannel>;
    remove(id: number): Promise<void>;
    softDelete(id: number): Promise<IPTVChannel>;
    incrementViewCount(id: number): Promise<void>;
    getAllGroups(): Promise<string[]>;
    getByGroup(group: string, activeOnly?: boolean): Promise<IPTVChannel[]>;
    createBulk(createIPTVChannelDtos: CreateIPTVChannelDto[]): Promise<IPTVChannel[]>;
    updateBulkStatus(ids: number[], isActive: boolean): Promise<void>;
    importFromM3U(m3uUrl: string): Promise<IPTVChannel[]>;
    validateChannel(id: number): Promise<boolean>;
    getStats(): Promise<{
        totalChannels: number;
        activeChannels: number;
        totalGroups: number;
        popularChannels: IPTVChannel[];
        recentChannels: IPTVChannel[];
    }>;
    searchChannels(keyword: string, limit?: number): Promise<IPTVChannel[]>;
}
