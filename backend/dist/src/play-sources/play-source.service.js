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
        playSource.status = play_source_entity_1.PlaySourceStatus.ACTIVE;
        const result = await this.playSourceRepository.save(playSource);
        return result;
    }
    async findAll(queryDto) {
        const { page = 1, pageSize = 10, mediaResourceId, type, status } = queryDto;
        const queryBuilder = this.playSourceRepository
            .createQueryBuilder('playSource')
            .leftJoinAndSelect('playSource.mediaResource', 'mediaResource')
            .leftJoinAndSelect('mediaResource.poster', 'poster');
        if (mediaResourceId) {
            queryBuilder.andWhere('playSource.mediaResourceId = :mediaResourceId', { mediaResourceId });
        }
        if (type) {
            queryBuilder.andWhere('playSource.type = :type', { type });
        }
        if (status) {
            queryBuilder.andWhere('playSource.status = :status', { status });
        }
        const total = await queryBuilder.getCount();
        const skip = (page - 1) * pageSize;
        const data = await queryBuilder
            .orderBy('playSource.priority', 'ASC')
            .addOrderBy('playSource.createdAt', 'DESC')
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
        const playSource = await this.playSourceRepository.findOne({
            where: { id },
            relations: ['mediaResource'],
        });
        if (!playSource) {
            throw new common_1.NotFoundException(`播放源ID ${id} 不存在`);
        }
        return playSource;
    }
    async update(id, updatePlaySourceDto) {
        const playSource = await this.findById(id);
        Object.assign(playSource, updatePlaySourceDto);
        return this.playSourceRepository.save(playSource);
    }
    async remove(id) {
        const playSource = await this.findById(id);
        await this.playSourceRepository.remove(playSource);
    }
    async validate(id) {
        const playSource = await this.findById(id);
        const isValid = playSource.status === play_source_entity_1.PlaySourceStatus.ACTIVE;
        return {
            isValid,
            message: isValid ? '播放源有效' : '播放源不可用',
        };
    }
    async getBestPlaySource(mediaResourceId) {
        const playSource = await this.playSourceRepository.findOne({
            where: {
                mediaResourceId,
                status: play_source_entity_1.PlaySourceStatus.ACTIVE,
            },
            order: {
                priority: 'ASC',
            },
        });
        return playSource || null;
    }
    async getByMediaResource(mediaResourceId) {
        return this.playSourceRepository.find({
            where: {
                mediaResourceId,
                status: play_source_entity_1.PlaySourceStatus.ACTIVE,
            },
            order: {
                priority: 'ASC',
            },
        });
    }
};
exports.PlaySourceService = PlaySourceService;
exports.PlaySourceService = PlaySourceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(play_source_entity_1.PlaySource)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PlaySourceService);
//# sourceMappingURL=play-source.service.js.map