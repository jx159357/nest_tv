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
const create_media_resource_dto_1 = require("./dtos/create-media-resource.dto");
const update_media_resource_dto_1 = require("./dtos/update-media-resource.dto");
const media_resource_query_dto_1 = require("./dtos/media-resource-query.dto");
const cache_service_1 = require("../common/cache/cache.service");
const cache_decorator_1 = require("../common/decorators/cache.decorator");
let MediaResourceService = class MediaResourceService {
    mediaResourceRepository;
    cacheService;
    constructor(mediaResourceRepository, cacheService) {
        this.mediaResourceRepository = mediaResourceRepository;
        this.cacheService = cacheService;
    }
    async create(createMediaResourceDto) {
        const mediaResource = this.mediaResourceRepository.create(createMediaResourceDto);
        return this.mediaResourceRepository.save(mediaResource);
    }
    async findAll(queryDto) {
        const { page = 1, pageSize = 10, search, type, quality, minRating, maxRating, tags, startDate, endDate, } = queryDto;
        const queryBuilder = this.mediaResourceRepository
            .createQueryBuilder('mediaResource')
            .leftJoinAndSelect('mediaResource.poster', 'poster');
        if (search) {
            queryBuilder.andWhere('(mediaResource.title LIKE :search OR mediaResource.description LIKE :search OR mediaResource.originalTitle LIKE :search)', { search: `%${search}%` });
        }
        if (type) {
            queryBuilder.andWhere('mediaResource.type IN (:...type)', { type });
        }
        if (quality) {
            queryBuilder.andWhere('mediaResource.quality IN (:...quality)', { quality });
        }
        if (minRating !== undefined) {
            queryBuilder.andWhere('mediaResource.rating >= :minRating', { minRating });
        }
        if (maxRating !== undefined) {
            queryBuilder.andWhere('mediaResource.rating <= :maxRating', { maxRating });
        }
        if (tags && tags.length > 0) {
            queryBuilder.andWhere('mediaResource.tags && JSON_CONTAINS(mediaResource.tags, :tags)', {
                tags,
            });
        }
        if (startDate && endDate) {
            queryBuilder.andWhere('mediaResource.releaseDate BETWEEN :startDate AND :endDate', {
                startDate,
                endDate,
            });
        }
        const total = await queryBuilder.getCount();
        const skip = (page - 1) * pageSize;
        const data = await queryBuilder
            .orderBy('mediaResource.rating', 'DESC')
            .addOrderBy('mediaResource.releaseDate', 'DESC')
            .addOrderBy('mediaResource.createdAt', 'DESC')
            .skip(skip)
            .take(pageSize)
            .getMany();
        const totalPages = Math.ceil(total / pageSize);
        return {
            data,
            total,
            page,
            pageSize,
            totalPages,
        };
    }
    async findById(id) {
        const mediaResource = await this.mediaResourceRepository.findOne({
            where: { id },
            relations: ['poster', 'watchHistory', 'playSources'],
        });
        if (!mediaResource) {
            throw new common_1.NotFoundException(`影视资源ID ${id} 不存在`);
        }
        return mediaResource;
    }
    async update(id, updateMediaResourceDto) {
        const mediaResource = await this.findById(id);
        Object.assign(mediaResource, updateMediaResourceDto);
        return this.mediaResourceRepository.save(mediaResource);
    }
    async remove(id) {
        const mediaResource = await this.findById(id);
        await this.mediaResourceRepository.remove(mediaResource);
    }
    async search(keyword, limit = 10) {
        return this.mediaResourceRepository.find({
            where: [{ title: (0, typeorm_2.Like)(`%${keyword}%`) }],
            take: limit,
            order: {
                rating: 'DESC',
            },
        });
    }
    async getPopular(limit = 10) {
        return this.mediaResourceRepository.find({
            where: {
                rating: (0, typeorm_2.Not)(0),
            },
            order: {
                rating: 'DESC',
            },
            take: limit,
        });
    }
    async getLatest(limit = 10) {
        return this.mediaResourceRepository.find({
            order: {
                createdAt: 'DESC',
            },
            take: limit,
        });
    }
    async getSimilar(id, limit = 6) {
        const mediaResource = await this.findById(id);
        return this.mediaResourceRepository
            .createQueryBuilder('mediaResource')
            .where('mediaResource.id != :id', { id })
            .andWhere('mediaResource.type = :type', {
            type: mediaResource.type,
        })
            .orderBy('mediaResource.rating', 'DESC')
            .take(limit)
            .getMany();
    }
    async incrementViews(id) {
        await this.mediaResourceRepository.increment({ id }, 'views', 1);
    }
    async incrementLikes(id) {
        await this.mediaResourceRepository.increment({ id }, 'likes', 1);
    }
    async decrementLikes(id) {
        await this.mediaResourceRepository.decrement({ id }, 'likes', 1);
    }
    async getStatistics() {
        const total = await this.mediaResourceRepository.count();
        const byTypeQuery = await this.mediaResourceRepository
            .createQueryBuilder('mediaResource')
            .select('mediaResource.type')
            .addSelect('COUNT(*)', 'count')
            .groupBy('mediaResource.type')
            .getRawMany();
        const byType = byTypeQuery.reduce((acc, item) => {
            acc[item.type] = parseInt(item.count);
            return acc;
        }, {});
        const byQualityQuery = await this.mediaResourceRepository
            .createQueryBuilder('mediaResource')
            .select('mediaResource.quality')
            .addSelect('COUNT(*)', 'count')
            .groupBy('mediaResource.quality')
            .getRawMany();
        const byQuality = byQualityQuery.reduce((acc, item) => {
            acc[item.quality] = parseInt(item.count);
            return acc;
        }, {});
        const averageRatingQuery = await this.mediaResourceRepository
            .createQueryBuilder('mediaResource')
            .select('AVG(mediaResource.rating)', 'avgRating')
            .where('mediaResource.rating != 0')
            .getRawOne();
        const averageRating = parseFloat(averageRatingQuery.avgRating) || 0;
        return {
            total,
            byType,
            byQuality,
            averageRating,
        };
    }
};
exports.MediaResourceService = MediaResourceService;
__decorate([
    (0, cache_decorator_1.CacheEvict)({
        all: true,
        key: 'media:list:*',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_media_resource_dto_1.CreateMediaResourceDto]),
    __metadata("design:returntype", Promise)
], MediaResourceService.prototype, "create", null);
__decorate([
    (0, cache_decorator_1.Cacheable)({
        ttl: 600,
        key: 'media:list:default',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [media_resource_query_dto_1.MediaResourceQueryDto]),
    __metadata("design:returntype", Promise)
], MediaResourceService.prototype, "findAll", null);
__decorate([
    (0, cache_decorator_1.CacheEvict)({
        all: true,
        key: 'media:list:*',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_media_resource_dto_1.UpdateMediaResourceDto]),
    __metadata("design:returntype", Promise)
], MediaResourceService.prototype, "update", null);
__decorate([
    (0, cache_decorator_1.CacheEvict)({
        all: true,
        key: 'media:list:*',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceService.prototype, "remove", null);
exports.MediaResourceService = MediaResourceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(media_resource_entity_1.MediaResource)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        cache_service_1.CacheService])
], MediaResourceService);
//# sourceMappingURL=media-resource.service.js.map