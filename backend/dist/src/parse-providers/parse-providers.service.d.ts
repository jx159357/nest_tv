import { Repository } from 'typeorm';
import { ParseProvider } from '../entities/parse-provider.entity';
import { CreateParseProviderDto } from './dto/create-parse-provider.dto';
import { UpdateParseProviderDto } from './dto/update-parse-provider.dto';
import { ParseProviderQueryDto } from './dto/parse-provider-query.dto';
export declare class ParseProvidersService {
    private parseProviderRepository;
    private readonly logger;
    constructor(parseProviderRepository: Repository<ParseProvider>);
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
    testProvider(id: number, testUrl?: string): Promise<{
        success: boolean;
        message: string;
        responseTime: number;
        data?: any;
    }>;
    parseVideoUrl(id: number, videoUrl: string): Promise<{
        success: boolean;
        message: string;
        playUrls?: string[];
        downloadUrls?: string[];
        subtitleUrls?: string[];
        metadata?: any;
    }>;
    private parseProviderResponse;
    private extractDataByPath;
    getBestProvider(category?: string, supportOnlinePlay?: boolean): Promise<ParseProvider | null>;
    resetDailyCounts(): Promise<void>;
    getStats(): Promise<{
        totalProviders: number;
        activeProviders: number;
        totalCategories: number;
        averageSuccessRate: number;
        topProviders: ParseProvider[];
    }>;
    searchProviders(keyword: string, limit?: number): Promise<ParseProvider[]>;
}
