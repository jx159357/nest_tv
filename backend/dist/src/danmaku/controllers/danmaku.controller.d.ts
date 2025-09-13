import { DanmakuService, CreateDanmakuDto, type DanmakuQueryDto, type DanmakuFilterDto } from '../services/danmaku.service';
import { Danmaku } from '../entities/danmaku.entity';
export declare class DanmakuController {
    private readonly danmakuService;
    constructor(danmakuService: DanmakuService);
    createDanmaku(createDto: CreateDanmakuDto & {
        videoId: string;
        mediaResourceId: number;
    }, user: any): Promise<Danmaku>;
    createBulkDanmaku(createDtos: Array<CreateDanmakuDto & {
        videoId: string;
        mediaResourceId: number;
    }>, user: any): Promise<Danmaku[]>;
    getDanmakuList(query: DanmakuQueryDto): Promise<{
        data: Danmaku[];
        total: number;
    }>;
    searchDanmaku(filters: DanmakuFilterDto, query: DanmakuQueryDto): Promise<{
        data: Danmaku[];
        total: number;
    }>;
    getDanmakuById(id: number): Promise<Danmaku | null>;
    updateDanmaku(id: number, updateDto: Partial<CreateDanmakuDto>, user: any): Promise<Danmaku | null>;
    deleteDanmaku(id: number, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    hardDeleteDanmaku(id: number): Promise<{
        success: boolean;
        message: string;
    }>;
    cleanExpiredDanmaku(days?: number): Promise<{
        deletedCount: number;
        message: string;
    }>;
    getPopularDanmaku(limit?: number): Promise<Danmaku[]>;
    getUserDanmaku(user: any, query: DanmakuQueryDto): Promise<Danmaku[]>;
    getMediaDanmaku(mediaResourceId: number, query: {
        limit?: number;
        offset?: number;
    }): Promise<Danmaku[]>;
    getDanmakuStats(videoId?: string): Promise<any>;
    importDanmakuData(data: Array<{
        text: string;
        color?: string;
        type?: string;
        priority?: number;
        timestamp?: number;
        userId?: number;
        mediaResourceId?: number;
        videoId?: string;
    }>): Promise<{
        importedCount: number;
        message: string;
    }>;
    advancedSearch(searchDto: {
        query: string;
        filters?: DanmakuFilterDto;
        pagination?: DanmakuQueryDto;
    }): Promise<{
        data: Danmaku[];
        total: number;
        queryInfo: any;
    }>;
    getDanmakuTrends(query: {
        videoId?: string;
        mediaResourceId?: number;
        startDate?: string;
        endDate?: string;
        interval?: 'hour' | 'day' | 'week' | 'month';
    }): Promise<any>;
    getDanmakuUserLeaderboard(query: {
        videoId?: string;
        mediaResourceId?: number;
        limit?: number;
        period?: 'all' | 'day' | 'week' | 'month';
    }): Promise<any>;
    getDanmakuKeywordCloud(query: {
        videoId?: string;
        mediaResourceId?: number;
        minFrequency?: number;
        limit?: number;
    }): Promise<any>;
    getRealtimeRoomInfo(videoId: string): Promise<any>;
    getDanmakuSuggestions(query: {
        videoId?: string;
        mediaResourceId?: number;
        type?: 'popular' | 'recent' | 'relevant';
        limit?: number;
    }): Promise<any>;
    setDanmakuHighlight(id: number, body: {
        isHighlighted: boolean;
    }, user: any): Promise<Danmaku | null>;
    getDanmakuReports(id: number): Promise<any>;
    reportDanmaku(id: number, body: {
        reason: string;
        description?: string;
    }, user: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getFilterRules(): Promise<any>;
    updateFilterRules(body: {
        sensitiveWords?: string[];
        spamPatterns?: string[];
        level?: 'low' | 'medium' | 'high';
        autoBlock?: boolean;
    }): Promise<any>;
    getHealthStatus(): Promise<any>;
}
