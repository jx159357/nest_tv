import { WatchHistoryService } from './watch-history.service';
import { CreateWatchHistoryDto } from './dtos/create-watch-history.dto';
import { UpdateWatchHistoryDto } from './dtos/update-watch-history.dto';
import { WatchHistoryQueryDto } from './dtos/watch-history-query.dto';
import { WatchHistory } from '../entities/watch-history.entity';
export declare class WatchHistoryController {
    private readonly watchHistoryService;
    constructor(watchHistoryService: WatchHistoryService);
    create(createWatchHistoryDto: CreateWatchHistoryDto): Promise<WatchHistory>;
    findAll(queryDto: WatchHistoryQueryDto): Promise<{
        data: WatchHistory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByUserId(userId: number, page?: number, limit?: number): Promise<{
        data: WatchHistory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getContinueWatching(userId: number, limit?: number): Promise<WatchHistory[]>;
    getCompleted(userId: number, page?: number, limit?: number): Promise<{
        data: WatchHistory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getUserStats(userId: number): Promise<{
        totalWatched: number;
        completed: number;
        watching: number;
        totalWatchTime: number;
    }>;
    findById(id: number): Promise<WatchHistory>;
    findByUserAndMedia(userId: number, mediaResourceId: number): Promise<WatchHistory | null>;
    updateProgress(userId: number, mediaResourceId: number, currentTime: number, duration?: number): Promise<WatchHistory>;
    update(id: number, updateWatchHistoryDto: UpdateWatchHistoryDto): Promise<WatchHistory>;
    markAsCompleted(id: number): Promise<WatchHistory>;
    remove(id: number): Promise<void>;
    clearUserHistory(userId: number): Promise<void>;
}
