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
exports.MediaResourceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const media_resource_entity_1 = require("../entities/media-resource.entity");
const user_entity_1 = require("../entities/user.entity");
const performance_monitor_service_1 = require("../common/services/performance-monitor.service");
const media_cache_service_1 = require("../common/services/media-cache.service");
let MediaResourceService = class MediaResourceService {
    mediaResourceRepository;
    performanceMonitorService;
    mediaCacheService;
    constructor(mediaResourceRepository, performanceMonitorService, mediaCacheService) {
        this.mediaResourceRepository = mediaResourceRepository;
        this.performanceMonitorService = performanceMonitorService;
        this.mediaCacheService = mediaCacheService;
    }
    async create(createMediaResourceDto) {
        const mediaResource = this.mediaResourceRepository.create(createMediaResourceDto);
        return await this.mediaResourceRepository.save(mediaResource);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, search, type, genre, minRating, maxRating, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;
        const startTime = Date.now();
        const queryBuilder = this.mediaResourceRepository.createQueryBuilder('media');
        if (search) {
            queryBuilder.andWhere('(media.title LIKE :search OR media.description LIKE :search OR media.director LIKE :search OR media.actors LIKE :search)', { search: `%${search}%` });
        }
        if (type && Object.values(media_resource_entity_1.MediaType).includes(type)) {
            queryBuilder.andWhere('media.type = :type', { type });
        }
        if (genre) {
            queryBuilder.andWhere('JSON_CONTAINS(media.genres, :genre)', { genre: `["${genre}"]` });
        }
        if (minRating !== undefined || maxRating !== undefined) {
            const min = minRating ?? 0;
            const max = maxRating ?? 10;
            queryBuilder.andWhere('media.rating BETWEEN :min AND :max', { min, max });
        }
        queryBuilder.andWhere('media.isActive = :isActive', { isActive: true });
        const validSortFields = ['id', 'title', 'rating', 'viewCount', 'createdAt', 'releaseDate'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        queryBuilder.orderBy(`media.${sortField}`, sortOrder);
        const validatedLimit = Math.min(Math.max(limit, 1), 100);
        const offset = (page - 1) * validatedLimit;
        queryBuilder.skip(offset).take(validatedLimit);
        const [data, total] = await queryBuilder.getManyAndCount();
        const duration = Date.now() - startTime;
        this.performanceMonitorService.recordDatabaseQuery(`MediaResource.findAll - ${JSON.stringify(queryDto)}`, duration);
        return {
            data,
            total,
            page: Number(page),
            limit: validatedLimit,
            totalPages: Math.ceil(total / validatedLimit),
        };
    }
    async findById(id) {
        const startTime = Date.now();
        const mediaResource = await this.mediaResourceRepository
            .createQueryBuilder('media')
            .leftJoinAndSelect('media.playSources', 'playSources')
            .leftJoinAndSelect('media.watchHistory', 'watchHistory')
            .leftJoinAndSelect('media.recommendations', 'recommendations')
            .leftJoinAndSelect('media.iptvChannels', 'iptvChannels')
            .where('media.id = :id', { id })
            .getOne();
        const duration = Date.now() - startTime;
        this.performanceMonitorService.recordDatabaseQuery(`MediaResource.findById - ${id}`, duration);
        if (!mediaResource) {
            throw new common_1.NotFoundException('影视资源不存在');
        }
        return mediaResource;
    }
    async update(id, updateMediaResourceDto) {
        const mediaResource = await this.findById(id);
        Object.assign(mediaResource, updateMediaResourceDto);
        return await this.mediaResourceRepository.save(mediaResource);
    }
    async remove(id) {
        const mediaResource = await this.findById(id);
        await this.mediaResourceRepository.remove(mediaResource);
    }
    async softDelete(id) {
        const mediaResource = await this.findById(id);
        mediaResource.isActive = false;
        return await this.mediaResourceRepository.save(mediaResource);
    }
    async incrementViewCount(id) {
        await this.mediaResourceRepository.increment({ id }, 'viewCount', 1);
    }
    async getPopular(limit = 10) {
        const validatedLimit = Math.min(Math.max(limit, 1), 50);
        const cached = await this.mediaCacheService.getCachedPopularMedia(validatedLimit);
        if (cached) {
            return cached;
        }
        const startTime = Date.now();
        const mediaResources = await this.mediaResourceRepository
            .createQueryBuilder('media')
            .where('media.isActive = :isActive', { isActive: true })
            .orderBy('media.viewCount', 'DESC')
            .addOrderBy('media.rating', 'DESC')
            .take(validatedLimit)
            .getMany();
        const duration = Date.now() - startTime;
        this.performanceMonitorService.recordDatabaseQuery(`MediaResource.getPopular - ${validatedLimit}`, duration);
        await this.mediaCacheService.cachePopularMedia(mediaResources, validatedLimit);
        return mediaResources;
    }
    async getLatest(limit = 10) {
        const validatedLimit = Math.min(Math.max(limit, 1), 50);
        const cached = await this.mediaCacheService.getCachedLatestMedia(validatedLimit);
        if (cached) {
            return cached;
        }
        const startTime = Date.now();
        const mediaResources = await this.mediaResourceRepository
            .createQueryBuilder('media')
            .where('media.isActive = :isActive', { isActive: true })
            .orderBy('media.createdAt', 'DESC')
            .take(validatedLimit)
            .getMany();
        const duration = Date.now() - startTime;
        this.performanceMonitorService.recordDatabaseQuery(`MediaResource.getLatest - ${validatedLimit}`, duration);
        await this.mediaCacheService.cacheLatestMedia(mediaResources, validatedLimit);
        return mediaResources;
    }
    async getTopRated(limit = 10, minRating = 8) {
        const validatedLimit = Math.min(Math.max(limit, 1), 50);
        const cached = await this.mediaCacheService.getCachedTopRatedMedia(validatedLimit, minRating);
        if (cached) {
            return cached;
        }
        const startTime = Date.now();
        const mediaResources = await this.mediaResourceRepository
            .createQueryBuilder('media')
            .where('media.isActive = :isActive', { isActive: true })
            .andWhere('media.rating BETWEEN :minRating AND :maxRating', {
            minRating,
            maxRating: 10
        })
            .orderBy('media.rating', 'DESC')
            .addOrderBy('media.viewCount', 'DESC')
            .take(validatedLimit)
            .getMany();
        const duration = Date.now() - startTime;
        this.performanceMonitorService.recordDatabaseQuery(`MediaResource.getTopRated - ${validatedLimit}`, duration);
        await this.mediaCacheService.cacheTopRatedMedia(mediaResources, validatedLimit, minRating);
        return mediaResources;
    }
    async getByType(type, limit = 20) {
        return await this.mediaResourceRepository.find({
            where: { type, isActive: true },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async getRecommendations(id, limit = 6) {
        const mediaResource = await this.findById(id);
        return await this.mediaResourceRepository.find({
            where: {
                type: mediaResource.type,
                isActive: true,
                id: (0, typeorm_2.Not)(id),
            },
            order: { rating: 'DESC', viewCount: 'DESC' },
            take: limit,
        });
    }
    async addToFavorites(userId, mediaResourceId) {
        const mediaResource = await this.mediaResourceRepository.findOne({
            where: { id: mediaResourceId },
            relations: ['favorites'],
        });
        if (!mediaResource) {
            throw new common_1.NotFoundException('影视资源不存在');
        }
        const user = await this.mediaResourceRepository.manager
            .createQueryBuilder(user_entity_1.User, 'user')
            .leftJoinAndSelect('user.favorites', 'favorites')
            .where('user.id = :userId', { userId })
            .getOne();
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        const isAlreadyFavorited = user.favorites.some(fav => fav.id === mediaResourceId);
        if (isAlreadyFavorited) {
            throw new common_1.HttpException('已经收藏该资源', common_1.HttpStatus.BAD_REQUEST);
        }
        user.favorites.push(mediaResource);
        await this.mediaResourceRepository.manager.save(user);
        await this.mediaCacheService.clearUserCache(userId);
        await this.mediaCacheService.clearMediaCache(mediaResourceId);
    }
    async removeFromFavorites(userId, mediaResourceId) {
        const mediaResource = await this.mediaResourceRepository.findOne({
            where: { id: mediaResourceId },
        });
        if (!mediaResource) {
            throw new common_1.NotFoundException('影视资源不存在');
        }
        const user = await this.mediaResourceRepository.manager
            .createQueryBuilder(user_entity_1.User, 'user')
            .leftJoinAndSelect('user.favorites', 'favorites')
            .where('user.id = :userId', { userId })
            .getOne();
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        user.favorites = user.favorites.filter(fav => fav.id !== mediaResourceId);
        await this.mediaResourceRepository.manager.save(user);
        await this.mediaCacheService.clearUserCache(userId);
        await this.mediaCacheService.clearMediaCache(mediaResourceId);
    }
    async isFavoritedByUser(userId, mediaResourceId) {
        const user = await this.mediaResourceRepository.manager
            .createQueryBuilder(user_entity_1.User, 'user')
            .leftJoinAndSelect('user.favorites', 'favorites')
            .where('user.id = :userId', { userId })
            .andWhere('favorites.id = :mediaResourceId', { mediaResourceId })
            .getOne();
        return !!user;
    }
    async getUserFavorites(userId, page = 1, limit = 10) {
        const validatedLimit = Math.min(Math.max(limit, 1), 100);
        const cached = await this.mediaCacheService.getCachedUserFavorites(userId, page, validatedLimit);
        if (cached) {
            return cached;
        }
        const startTime = Date.now();
        const offset = (page - 1) * validatedLimit;
        const [favorites, totalCount] = await this.mediaResourceRepository.manager
            .createQueryBuilder()
            .select('media')
            .from(media_resource_entity_1.MediaResource, 'media')
            .innerJoin('media.favorites', 'user', 'user.id = :userId', { userId })
            .leftJoinAndSelect('media.playSources', 'playSources')
            .leftJoinAndSelect('media.watchHistory', 'watchHistory')
            .orderBy('media.createdAt', 'DESC')
            .skip(offset)
            .take(validatedLimit)
            .getManyAndCount();
        const duration = Date.now() - startTime;
        this.performanceMonitorService.recordDatabaseQuery(`MediaResource.getUserFavorites - ${userId}, page: ${page}`, duration);
        const result = {
            data: favorites,
            total: totalCount,
            page,
            limit: validatedLimit,
            totalPages: Math.ceil(totalCount / validatedLimit),
        };
        await this.mediaCacheService.cacheUserFavorites(userId, result, page, validatedLimit);
        return result;
    }
    async rateResource(userId, mediaResourceId, rating) {
        if (rating < 0 || rating > 10) {
            throw new common_1.HttpException('评分必须在0-10之间', common_1.HttpStatus.BAD_REQUEST);
        }
        const mediaResource = await this.mediaResourceRepository.findOne({
            where: { id: mediaResourceId },
            relations: ['watchHistory'],
        });
        if (!mediaResource) {
            throw new common_1.NotFoundException('影视资源不存在');
        }
        mediaResource.rating = rating;
        return await this.mediaResourceRepository.save(mediaResource);
    }
    async getRatingStats(mediaResourceId) {
        const mediaResource = await this.findById(mediaResourceId);
        return {
            averageRating: mediaResource.rating,
            totalRatings: 1,
            ratingDistribution: {
                '5': 0,
                '6': 0,
                '7': 0,
                '8': 0,
                '9': 0,
                '10': 1,
            },
        };
    }
};
exports.MediaResourceService = MediaResourceService;
exports.MediaResourceService = MediaResourceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(media_resource_entity_1.MediaResource)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        performance_monitor_service_1.PerformanceMonitorService,
        media_cache_service_1.MediaCacheService])
], MediaResourceService);
//# sourceMappingURL=media-resource.service.js.map