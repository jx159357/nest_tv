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
let MediaResourceService = class MediaResourceService {
    mediaResourceRepository;
    constructor(mediaResourceRepository) {
        this.mediaResourceRepository = mediaResourceRepository;
    }
    async create(createMediaResourceDto) {
        const mediaResource = this.mediaResourceRepository.create(createMediaResourceDto);
        return await this.mediaResourceRepository.save(mediaResource);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, search, type, genre, minRating, maxRating, sortBy = 'createdAt', sortOrder = 'DESC' } = queryDto;
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
        const mediaResource = await this.mediaResourceRepository.findOne({
            where: { id },
            relations: ['playSources', 'watchHistory'],
        });
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
        return await this.mediaResourceRepository.find({
            where: { isActive: true },
            order: { viewCount: 'DESC', rating: 'DESC' },
            take: limit,
        });
    }
    async getLatest(limit = 10) {
        return await this.mediaResourceRepository.find({
            where: { isActive: true },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async getTopRated(limit = 10, minRating = 8) {
        return await this.mediaResourceRepository.find({
            where: {
                isActive: true,
                rating: (0, typeorm_2.Between)(minRating, 10)
            },
            order: { rating: 'DESC' },
            take: limit,
        });
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
};
exports.MediaResourceService = MediaResourceService;
exports.MediaResourceService = MediaResourceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(media_resource_entity_1.MediaResource)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MediaResourceService);
//# sourceMappingURL=media-resource.service.js.map