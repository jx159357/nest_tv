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
var DanmakuService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DanmakuService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const danmaku_entity_1 = require("../entities/danmaku.entity");
let DanmakuService = DanmakuService_1 = class DanmakuService {
    danmakuRepository;
    dataSource;
    logger = new common_1.Logger(DanmakuService_1.name);
    constructor(danmakuRepository, dataSource) {
        this.danmakuRepository = danmakuRepository;
        this.dataSource = dataSource;
    }
    async create(createDto, userId, mediaResourceId, videoId) {
        const danmaku = this.danmakuRepository.create({
            danmakuId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: this.filterText(createDto.text),
            color: createDto.color || '#FFFFFF',
            type: createDto.type || 'scroll',
            priority: createDto.priority || 1,
            isHighlighted: false,
            isActive: true,
            filters: this.analyzeContent(createDto.text),
            metadata: {
                timestamp: Date.now(),
                userAgent: 'server-generated',
            },
            userId,
            mediaResourceId,
            videoId,
        });
        return await this.danmakuRepository.save(danmaku);
    }
    async createBulk(createDtos, userId) {
        const danmakuEntities = createDtos.map(dto => ({
            danmakuId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: this.filterText(dto.text),
            color: dto.color || '#FFFFFF',
            type: dto.type || 'scroll',
            priority: dto.priority || 1,
            isHighlighted: false,
            isActive: true,
            filters: this.analyzeContent(dto.text),
            metadata: {
                timestamp: Date.now(),
                userAgent: 'bulk-import',
            },
            userId,
            mediaResourceId: 0,
            videoId: '',
        }));
        return await this.danmakuRepository.save(danmakuEntities);
    }
    async findAll(queryDto = {}) {
        const { videoId, mediaResourceId, userId, limit = 50, offset = 0, startDate, endDate, isActive = true, sort = 'DESC', sortBy = 'createdAt', } = queryDto;
        const queryBuilder = this.danmakuRepository
            .createQueryBuilder('danmaku')
            .leftJoinAndSelect('danmaku.user', 'user')
            .leftJoinAndSelect('danmaku.mediaResource', 'mediaResource');
        if (videoId) {
            queryBuilder.andWhere('danmaku.videoId = :videoId', { videoId });
        }
        if (mediaResourceId) {
            queryBuilder.andWhere('danmaku.mediaResourceId = :mediaResourceId', { mediaResourceId });
        }
        if (userId) {
            queryBuilder.andWhere('danmaku.userId = :userId', { userId });
        }
        if (isActive !== undefined) {
            queryBuilder.andWhere('danmaku.isActive = :isActive', { isActive });
        }
        if (startDate && endDate) {
            queryBuilder.andWhere('danmaku.createdAt BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }
        else if (startDate) {
            queryBuilder.andWhere('danmaku.createdAt >= :startDate', { startDate });
        }
        else if (endDate) {
            queryBuilder.andWhere('danmaku.createdAt <= :endDate', { endDate });
        }
        queryBuilder.orderBy(`danmaku.${sortBy}`, sort).skip(offset).take(limit);
        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total };
    }
    async search(filters, queryDto = {}) {
        const queryBuilder = this.danmakuRepository
            .createQueryBuilder('danmaku')
            .leftJoinAndSelect('danmaku.user', 'user')
            .leftJoinAndSelect('danmaku.mediaResource', 'mediaResource');
        this.applyFilters(queryBuilder, filters);
        this.applyQueryParams(queryBuilder, queryDto);
        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total };
    }
    async findById(id) {
        return await this.danmakuRepository.findOne({
            where: { id },
            relations: ['user', 'mediaResource'],
        });
    }
    async update(id, updateDto) {
        const danmaku = await this.findById(id);
        if (!danmaku) {
            this.logger.warn(`弹幕未找到: ${id}`);
            return null;
        }
        if (updateDto.text) {
            updateDto.text = this.filterText(updateDto.text);
            danmaku.filters = this.analyzeContent(updateDto.text);
        }
        Object.assign(danmaku, updateDto);
        return await this.danmakuRepository.save(danmaku);
    }
    async delete(id, userId) {
        const danmaku = await this.findById(id);
        if (!danmaku) {
            this.logger.warn(`弹幕未找到: ${id}`);
            return false;
        }
        if (userId && danmaku.userId !== userId) {
            this.logger.warn(`用户 ${userId} 无权限删除弹幕 ${id}`);
            return false;
        }
        danmaku.isActive = false;
        await this.danmakuRepository.save(danmaku);
        return true;
    }
    async hardDelete(id) {
        const result = await this.danmakuRepository.delete(id);
        return (result.affected || 0) > 0;
    }
    async cleanExpired(daysOld = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        const result = await this.danmakuRepository
            .createQueryBuilder()
            .delete()
            .where('createdAt < :cutoffDate', { cutoffDate })
            .andWhere('isActive = false')
            .execute();
        return result.affected || 0;
    }
    async getPopularDanmaku(limit = 50) {
        return await this.danmakuRepository.find({
            where: { isActive: true },
            order: {
                createdAt: 'DESC',
            },
            take: limit,
            relations: ['user', 'mediaResource'],
        });
    }
    async getUserDanmaku(userId, limit = 50, offset = 0) {
        return await this.danmakuRepository.find({
            where: { userId, isActive: true },
            order: {
                createdAt: 'DESC',
            },
            skip: offset,
            take: limit,
            relations: ['mediaResource'],
        });
    }
    async getMediaDanmaku(mediaResourceId, limit = 100, offset = 0) {
        return await this.danmakuRepository.find({
            where: { mediaResourceId, isActive: true },
            order: {
                createdAt: 'ASC',
            },
            skip: offset,
            take: limit,
            relations: ['user'],
        });
    }
    async getDanmakuStats(videoId) {
        const queryBuilder = this.danmakuRepository
            .createQueryBuilder('danmaku')
            .select([
            'COUNT(DISTINCT userId) as uniqueUsers',
            'COUNT(*) as totalDanmaku',
            'COUNT(CASE WHEN type = :scroll THEN 1 END) as scrollDanmaku',
            'COUNT(CASE WHEN type = :top THEN 1 END) as topDanmaku',
            'COUNT(CASE WHEN type = :bottom THEN 1 END) as bottomDanmaku',
            'COUNT(CASE WHEN isHighlighted = true THEN 1 END) as highlightedDanmaku',
            'COUNT(CASE WHEN isHighlighted = false THEN 1 END) as normalDanmaku',
        ])
            .where('isActive = true', { isActive: true });
        if (videoId) {
            queryBuilder.andWhere('videoId = :videoId', { videoId });
        }
        return await queryBuilder.getRawOne();
    }
    applyFilters(queryBuilder, filters) {
        if (filters.text) {
            queryBuilder.andWhere('danmaku.text LIKE :text', { text: `%${filters.text}%` });
        }
        if (filters.videoId) {
            queryBuilder.andWhere('danmaku.videoId = :videoId', { videoId: filters.videoId });
        }
        if (filters.mediaResourceId) {
            queryBuilder.andWhere('danmaku.mediaResourceId = :mediaResourceId', {
                mediaResourceId: filters.mediaResourceId,
            });
        }
        if (filters.userId) {
            queryBuilder.andWhere('danmaku.userId = :userId', { userId: filters.userId });
        }
        if (filters.color) {
            queryBuilder.andWhere('danmaku.color = :color', { color: filters.color });
        }
        if (filters.type) {
            queryBuilder.andWhere('danmaku.type = :type', { type: filters.type });
        }
        if (filters.priority !== undefined) {
            queryBuilder.andWhere('danmaku.priority = :priority', { priority: filters.priority });
        }
        if (filters.isHighlighted !== undefined) {
            queryBuilder.andWhere('danmaku.isHighlighted = :isHighlighted', {
                isHighlighted: filters.isHighlighted,
            });
        }
        if (filters.isActive !== undefined) {
            queryBuilder.andWhere('danmaku.isActive = :isActive', { isActive: filters.isActive });
        }
        if (filters.dateRange?.start && filters.dateRange?.end) {
            queryBuilder.andWhere('danmaku.createdAt BETWEEN :start AND :end', {
                start: filters.dateRange.start,
                end: filters.dateRange.end,
            });
        }
        else if (filters.dateRange?.start) {
            queryBuilder.andWhere('danmaku.createdAt >= :start', {
                start: filters.dateRange.start,
            });
        }
        else if (filters.dateRange?.end) {
            queryBuilder.andWhere('danmaku.createdAt <= :end', {
                end: filters.dateRange.end,
            });
        }
        if (filters.customFilters?.containsSensitive) {
            queryBuilder.andWhere('danmaku.filters.containsSensitive = :containsSensitive', {
                containsSensitive: true,
            });
        }
        if (filters.customFilters?.containsSpam) {
            queryBuilder.andWhere('danmaku.filters.containsSpam = :containsSpam', {
                containsSpam: true,
            });
        }
        if (filters.customFilters?.containsEmojis) {
            queryBuilder.andWhere('danmaku.filters.containsEmojis = :containsEmojis', {
                containsEmojis: true,
            });
        }
    }
    applyQueryParams(queryBuilder, queryDto) {
        const { limit = 50, offset = 0, sort = 'DESC', sortBy = 'createdAt' } = queryDto;
        queryBuilder.orderBy(`danmaku.${sortBy}`, sort).skip(offset).take(limit);
    }
    filterText(text) {
        let filtered = text.trim();
        filtered = filtered.replace(/<[^>]*>/g, '');
        filtered = filtered.replace(/<script[^>]*>.*?<\/script>/gi, '');
        filtered = filtered.replace(/<style[^>]*>.*?<\/style>/gi, '');
        filtered = filtered.length > 200 ? filtered.substring(0, 200) + '...' : filtered;
        filtered = filtered.replace(/\s+/g, ' ');
        return filtered;
    }
    analyzeContent(text) {
        const filters = {
            containsSensitive: false,
            containsSpam: false,
            containsEmojis: false,
            keywords: [],
        };
        const sensitiveWords = ['傻逼', '草泥马', '妈的', '操你', '傻叉'];
        filters.containsSensitive = sensitiveWords.some(word => text.toLowerCase().includes(word.toLowerCase()));
        const spamPatterns = [
            /http[s]?:\/\/|www\./gi,
            /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)/gi,
            /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/gi,
            /【.*?】.*?【.*?】/g,
            /关注.*?公众号.*?/gi,
            /加.*?群.*?/gi,
        ];
        filters.containsSpam = spamPatterns.some(pattern => pattern.test(text));
        const emojiRegex = /[\p{Emoji_Presentation}\p{Emoji}\u200D\uFE0F]|[\p{Emoji}\uFE0F\u200D\uFE0F]/gu;
        filters.containsEmojis = emojiRegex.test(text);
        const keywords = text.match(/[\u4e00-\u9fa5]+/g) || [];
        filters.keywords = [...new Set(keywords)].slice(0, 10);
        return filters;
    }
    async importData(data) {
        let importedCount = 0;
        const batchSize = 100;
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            const processedBatch = batch.map(item => ({
                danmakuId: item.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                text: this.filterText(item.text || ''),
                color: item.color || '#FFFFFF',
                type: item.type || 'scroll',
                priority: item.priority || 1,
                isHighlighted: item.isHighlighted || false,
                isActive: true,
                filters: this.analyzeContent(item.text || ''),
                metadata: {
                    timestamp: item.timestamp || Date.now(),
                    userAgent: item.userAgent || 'imported',
                },
                userId: item.userId || 1,
                mediaResourceId: item.mediaResourceId || 0,
                videoId: item.videoId || '',
            }));
            const savedBatch = await this.danmakuRepository.save(processedBatch);
            importedCount += savedBatch.length;
        }
        this.logger.log(`导入完成，共导入 ${importedCount} 条弹幕`);
        return importedCount;
    }
};
exports.DanmakuService = DanmakuService;
exports.DanmakuService = DanmakuService = DanmakuService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(danmaku_entity_1.Danmaku)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], DanmakuService);
//# sourceMappingURL=danmaku.service.js.map