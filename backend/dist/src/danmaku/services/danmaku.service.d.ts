import { Repository, DataSource } from 'typeorm';
import { Danmaku } from '../entities/danmaku.entity';
export interface CreateDanmakuDto {
    text: string;
    color?: string;
    type?: 'scroll' | 'top' | 'bottom';
    priority?: number;
}
export interface DanmakuQueryDto {
    videoId?: string;
    mediaResourceId?: number;
    userId?: number;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
    sort?: 'ASC' | 'DESC';
    sortBy?: 'createdAt' | 'priority' | 'id';
}
export interface DanmakuFilterDto {
    text?: string;
    videoId?: string;
    mediaResourceId?: number;
    userId?: number;
    color?: string;
    type?: string;
    priority?: number;
    isHighlighted?: boolean;
    isActive?: boolean;
    dateRange?: {
        start?: Date;
        end?: Date;
    };
    customFilters?: {
        containsSensitive?: boolean;
        containsSpam?: boolean;
        containsEmojis?: boolean;
    };
}
export declare class DanmakuService {
    private readonly danmakuRepository;
    private readonly dataSource;
    private readonly logger;
    constructor(danmakuRepository: Repository<Danmaku>, dataSource: DataSource);
    create(createDto: CreateDanmakuDto, userId: number, mediaResourceId: number, videoId: string): Promise<Danmaku>;
    createBulk(createDtos: CreateDanmakuDto[], userId: number): Promise<Danmaku[]>;
    findAll(queryDto?: DanmakuQueryDto): Promise<{
        data: Danmaku[];
        total: number;
    }>;
    search(filters: DanmakuFilterDto, queryDto?: DanmakuQueryDto): Promise<{
        data: Danmaku[];
        total: number;
    }>;
    findById(id: number): Promise<Danmaku | null>;
    update(id: number, updateDto: Partial<CreateDanmakuDto>): Promise<Danmaku | null>;
    delete(id: number, userId?: number): Promise<boolean>;
    hardDelete(id: number): Promise<boolean>;
    cleanExpired(daysOld?: number): Promise<number>;
    getPopularDanmaku(limit?: number): Promise<Danmaku[]>;
    getUserDanmaku(userId: number, limit?: number, offset?: number): Promise<Danmaku[]>;
    getMediaDanmaku(mediaResourceId: number, limit?: number, offset?: number): Promise<Danmaku[]>;
    getDanmakuStats(videoId?: string): Promise<any>;
    private applyFilters;
    private applyQueryParams;
    private filterText;
    private analyzeContent;
    importData(data: any[]): Promise<number>;
}
