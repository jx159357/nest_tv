import { Repository } from 'typeorm';
import { WatchHistory } from '../entities/watch-history.entity';
import { CreateWatchHistoryDto } from './dtos/create-watch-history.dto';
import { UpdateWatchHistoryDto } from './dtos/update-watch-history.dto';
import { WatchHistoryQueryDto } from './dtos/watch-history-query.dto';
export declare class WatchHistoryService {
    private watchHistoryRepository;
    constructor(watchHistoryRepository: Repository<WatchHistory>);
    create(createWatchHistoryDto: CreateWatchHistoryDto): Promise<WatchHistory>;
    findAll(queryDto: WatchHistoryQueryDto): Promise<{
        data: WatchHistory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: number): Promise<WatchHistory>;
    findByUserAndMedia(userId: number, mediaResourceId: number): Promise<WatchHistory | null>;
    findByUserId(userId: number, page?: number, limit?: number): Promise<{
        data: WatchHistory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    update(id: number, updateWatchHistoryDto: UpdateWatchHistoryDto): Promise<WatchHistory>;
    updateProgress(userId: number, mediaResourceId: number, currentTime: number, duration?: number): Promise<WatchHistory>;
    markAsCompleted(id: number): Promise<WatchHistory>;
    remove(id: number): Promise<void>;
    clearUserHistory(userId: number): Promise<void>;
    getUserStats(userId: number): Promise<{
        totalWatched: number;
        completed: number;
        watching: number;
        totalWatchTime: number;
    }>;
    getContinueWatching(userId: number, limit?: number): Promise<WatchHistory[]>;
    getCompleted(userId: number, page?: number, limit?: number): Promise<{
        data: WatchHistory[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
