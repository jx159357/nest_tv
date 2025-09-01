import { ParseProvidersService } from './parse-providers.service';
import { CreateParseProviderDto } from './dtos/create-parse-provider.dto';
import { UpdateParseProviderDto } from './dtos/update-parse-provider.dto';
import { ParseProviderQueryDto } from './dtos/parse-provider-query.dto';
import { ParseProvider } from '../entities/parse-provider.entity';
export declare class ParseProvidersController {
    private readonly parseProvidersService;
    constructor(parseProvidersService: ParseProvidersService);
    create(createParseProviderDto: CreateParseProviderDto): Promise<ParseProvider>;
    findAll(queryDto: ParseProviderQueryDto): Promise<{
        data: ParseProvider[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: number): Promise<ParseProvider>;
    update(id: number, updateParseProviderDto: UpdateParseProviderDto): Promise<ParseProvider>;
    remove(id: number): Promise<void>;
    softDelete(id: number): Promise<ParseProvider>;
    getAllCategories(): Promise<string[]>;
    getByCategory(category: string, activeOnly?: boolean): Promise<ParseProvider[]>;
    createBulk(createParseProviderDtos: CreateParseProviderDto[]): Promise<ParseProvider[]>;
    updateBulkStatus(ids: number[], isActive: boolean): Promise<void>;
    testProvider(id: number, testUrl?: string): Promise<any>;
    parseVideoUrl(id: number, videoUrl: string): Promise<any>;
    getBestProvider(category?: string, supportOnlinePlay?: boolean): Promise<ParseProvider | null>;
    resetDailyCounts(): Promise<void>;
    getStats(): Promise<any>;
    searchProviders(keyword: string, limit?: number): Promise<ParseProvider[]>;
}
