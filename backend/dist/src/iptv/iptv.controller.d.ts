import { IPTVService } from './iptv.service';
import { CreateIPTVChannelDto } from './dto/create-iptv-channel.dto';
import { UpdateIPTVChannelDto } from './dto/update-iptv-channel.dto';
import { IPTVChannelQueryDto } from './dto/iptv-channel-query.dto';
import { IPTVChannel } from '../entities/iptv-channel.entity';
export declare class IPTVController {
    private readonly iptvService;
    constructor(iptvService: IPTVService);
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
    validateChannel(id: number): Promise<{
        isValid: boolean;
    }>;
    getStats(): Promise<any>;
    searchChannels(keyword: string, limit?: number): Promise<IPTVChannel[]>;
}
