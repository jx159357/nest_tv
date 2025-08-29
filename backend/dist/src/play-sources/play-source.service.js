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
exports.PlaySourceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const play_source_entity_1 = require("../entities/play-source.entity");
let PlaySourceService = class PlaySourceService {
    playSourceRepository;
    constructor(playSourceRepository) {
        this.playSourceRepository = playSourceRepository;
    }
    async create(createPlaySourceDto) {
        const playSource = this.playSourceRepository.create(createPlaySourceDto);
        return await this.playSourceRepository.save(playSource);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, mediaResourceId, type, status, resolution, activeOnly = true, sortBy = 'priority', sortOrder = 'ASC' } = queryDto;
        const queryBuilder = this.playSourceRepository.createQueryBuilder('playSource')
            .leftJoinAndSelect('playSource.mediaResource', 'mediaResource');
        if (mediaResourceId) {
            queryBuilder.andWhere('playSource.mediaResourceId = :mediaResourceId', { mediaResourceId });
        }
        if (type && Object.values(play_source_entity_1.PlaySourceType).includes(type)) {
            queryBuilder.andWhere('playSource.type = :type', { type });
        }
        if (status && Object.values(play_source_entity_1.PlaySourceStatus).includes(status)) {
            queryBuilder.andWhere('playSource.status = :status', { status });
        }
        if (resolution) {
            queryBuilder.andWhere('playSource.resolution = :resolution', { resolution });
        }
        if (activeOnly) {
            queryBuilder.andWhere('playSource.isActive = :isActive', { isActive: true });
        }
        const validSortFields = ['id', 'priority', 'status', 'playCount', 'createdAt'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'priority';
        queryBuilder.orderBy(`playSource.${sortField}`, sortOrder);
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
        const playSource = await this.playSourceRepository.findOne({
            where: { id },
            relations: ['mediaResource'],
        });
        if (!playSource) {
            throw new common_1.NotFoundException('播放源不存在');
        }
        return playSource;
    }
    async findByMediaResourceId(mediaResourceId) {
        return await this.playSourceRepository.find({
            where: {
                mediaResourceId,
                isActive: true,
                status: play_source_entity_1.PlaySourceStatus.ACTIVE
            },
            order: { priority: 'ASC' },
            relations: ['mediaResource'],
        });
    }
    async update(id, updatePlaySourceDto) {
        const playSource = await this.findById(id);
        Object.assign(playSource, updatePlaySourceDto);
        return await this.playSourceRepository.save(playSource);
    }
    async remove(id) {
        const playSource = await this.findById(id);
        await this.playSourceRepository.remove(playSource);
    }
    async softDelete(id) {
        const playSource = await this.findById(id);
        playSource.isActive = false;
        return await this.playSourceRepository.save(playSource);
    }
    async updateStatus(id, status) {
        const playSource = await this.findById(id);
        playSource.status = status;
        playSource.lastCheckedAt = new Date();
        return await this.playSourceRepository.save(playSource);
    }
    async incrementPlayCount(id) {
        await this.playSourceRepository.increment({ id }, 'playCount', 1);
    }
    async getBestPlaySource(mediaResourceId) {
        return await this.playSourceRepository.findOne({
            where: {
                mediaResourceId,
                isActive: true,
                status: play_source_entity_1.PlaySourceStatus.ACTIVE
            },
            order: { priority: 'ASC', playCount: 'ASC' },
        });
    }
    async createBulk(createPlaySourceDtos) {
        const playSources = this.playSourceRepository.create(createPlaySourceDtos);
        return await this.playSourceRepository.save(playSources);
    }
    async updateBulkStatus(ids, status) {
        await this.playSourceRepository.update(ids, {
            status,
            lastCheckedAt: new Date()
        });
    }
    async validatePlaySource(id) {
        const playSource = await this.findById(id);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(playSource.url, {
                method: 'HEAD',
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const isValid = response.ok;
            const status = isValid ? play_source_entity_1.PlaySourceStatus.ACTIVE : play_source_entity_1.PlaySourceStatus.ERROR;
            await this.updateStatus(id, status);
            return isValid;
        }
        catch (error) {
            await this.updateStatus(id, play_source_entity_1.PlaySourceStatus.ERROR);
            return false;
        }
    }
};
exports.PlaySourceService = PlaySourceService;
exports.PlaySourceService = PlaySourceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(play_source_entity_1.PlaySource)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PlaySourceService);
//# sourceMappingURL=play-source.service.js.map