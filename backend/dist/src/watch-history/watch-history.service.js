"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchHistoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const watch_history_entity_1 = require("../entities/watch-history.entity");
let WatchHistoryService = class WatchHistoryService {
    watchHistoryRepository;
    constructor(watchHistoryRepository) {
        this.watchHistoryRepository = watchHistoryRepository;
    }
    async create(createWatchHistoryDto) {
        const existingHistory = await this.watchHistoryRepository.findOne({
            where: {
                userId: createWatchHistoryDto.userId,
                mediaResourceId: createWatchHistoryDto.mediaResourceId,
            },
        });
        if (existingHistory) {
            Object.assign(existingHistory, createWatchHistoryDto);
            return await this.watchHistoryRepository.save(existingHistory);
        }
        const watchHistory = this.watchHistoryRepository.create(createWatchHistoryDto);
        return await this.watchHistoryRepository.save(watchHistory);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, userId, mediaResourceId, isCompleted, sortBy = 'updatedAt', sortOrder = 'DESC', } = queryDto;
        const queryBuilder = this.watchHistoryRepository
            .createQueryBuilder('watchHistory')
            .leftJoinAndSelect('watchHistory.user', 'user')
            .leftJoinAndSelect('watchHistory.mediaResource', 'mediaResource');
        if (userId) {
            queryBuilder.andWhere('watchHistory.userId = :userId', { userId });
        }
        if (mediaResourceId) {
            queryBuilder.andWhere('watchHistory.mediaResourceId = :mediaResourceId', { mediaResourceId });
        }
        if (isCompleted !== undefined) {
            queryBuilder.andWhere('watchHistory.isCompleted = :isCompleted', { isCompleted });
        }
        const validSortFields = [
            'id',
            'currentTime',
            'duration',
            'isCompleted',
            'createdAt',
            'updatedAt',
        ];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
        queryBuilder.orderBy(`watchHistory.${sortField}`, sortOrder);
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);
        const [data, total] = await queryBuilder.getManyAndCount();
        return {
            data,
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
        };
    }
    async findById(id) {
        const watchHistory = await this.watchHistoryRepository.findOne({
            where: { id },
            relations: ['user', 'mediaResource'],
        });
        if (!watchHistory) {
            throw new common_1.NotFoundException('观看历史记录不存在');
        }
        return watchHistory;
    }
    async findByUserAndMedia(userId, mediaResourceId) {
        return await this.watchHistoryRepository.findOne({
            where: {
                userId,
                mediaResourceId,
            },
            relations: ['user', 'mediaResource'],
        });
    }
    async findByUserId(userId, page = 1, limit = 10) {
        return await this.findAll({ userId, page, limit });
    }
    async update(id, updateWatchHistoryDto) {
        const watchHistory = await this.findById(id);
        Object.assign(watchHistory, updateWatchHistoryDto);
        return await this.watchHistoryRepository.save(watchHistory);
    }
    async updateProgress(userId, mediaResourceId, currentTime, duration) {
        let watchHistory = await this.findByUserAndMedia(userId, mediaResourceId);
        if (!watchHistory) {
            const createDto = {
                userId,
                mediaResourceId,
                currentTime,
                duration,
            };
            watchHistory = await this.create(createDto);
        }
        else {
            watchHistory.currentTime = currentTime;
            if (duration) {
                watchHistory.duration = duration;
            }
            watchHistory = await this.watchHistoryRepository.save(watchHistory);
        }
        return watchHistory;
    }
    async markAsCompleted(id) {
        const watchHistory = await this.findById(id);
        watchHistory.isCompleted = true;
        return await this.watchHistoryRepository.save(watchHistory);
    }
    async remove(id) {
        const watchHistory = await this.findById(id);
        await this.watchHistoryRepository.remove(watchHistory);
    }
    async clearUserHistory(userId) {
        await this.watchHistoryRepository.delete({ userId });
    }
    async getUserStats(userId) {
        const histories = await this.watchHistoryRepository.find({
            where: { userId },
        });
        const totalWatched = histories.length;
        const completed = histories.filter(h => h.isCompleted).length;
        const watching = totalWatched - completed;
        const totalWatchTime = histories.reduce((sum, h) => sum + (h.currentTime || 0), 0);
        return {
            totalWatched,
            completed,
            watching,
            totalWatchTime,
        };
    }
    async getContinueWatching(userId, limit = 10) {
        return await this.watchHistoryRepository.find({
            where: {
                userId,
                isCompleted: false,
            },
            relations: ['mediaResource'],
            order: { updatedAt: 'DESC' },
            take: limit,
        });
    }
    async getCompleted(userId, page = 1, limit = 10) {
        return await this.findAll({ userId, isCompleted: true, page, limit });
    }
};
exports.WatchHistoryService = WatchHistoryService;
exports.WatchHistoryService = WatchHistoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(watch_history_entity_1.WatchHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], WatchHistoryService);
//# sourceMappingURL=watch-history.service.js.map