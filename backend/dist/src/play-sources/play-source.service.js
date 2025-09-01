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
const torrent_service_1 = require("../common/services/torrent.service");
const app_logger_service_1 = require("../common/services/app-logger.service");
let PlaySourceService = class PlaySourceService {
    playSourceRepository;
    torrentService;
    logger;
    constructor(playSourceRepository, torrentService, appLoggerService) {
        this.playSourceRepository = playSourceRepository;
        this.torrentService = torrentService;
        this.logger = appLoggerService;
    }
    async create(createPlaySourceDto) {
        const context = { function: 'createPlaySource' };
        try {
            const playSource = this.playSourceRepository.create(createPlaySourceDto);
            if (createPlaySourceDto.type === play_source_entity_1.PlaySourceType.MAGNET) {
                try {
                    const parsed = this.torrentService.parseMagnetUri(createPlaySourceDto.url);
                    playSource.magnetInfo = {
                        infoHash: parsed.infoHash,
                        name: parsed.name,
                        announce: parsed.announce,
                    };
                    const health = await this.torrentService.checkMagnetHealth(createPlaySourceDto.url);
                    playSource.status = health.isHealthy ? play_source_entity_1.PlaySourceStatus.ACTIVE : play_source_entity_1.PlaySourceStatus.ERROR;
                    this.logger.logParseProvider(0, 'magnet_created', {
                        url: createPlaySourceDto.url,
                        infoHash: parsed.infoHash,
                        isHealthy: health.isHealthy,
                    }, context);
                }
                catch (error) {
                    this.logger.error(`Failed to process magnet URL: ${error.message}`, context, error.stack);
                    playSource.status = play_source_entity_1.PlaySourceStatus.ERROR;
                }
            }
            const result = await this.playSourceRepository.save(playSource);
            this.logger.logDatabase('create', 'play_sources', {
                id: result.id,
                type: result.type,
                mediaResourceId: result.mediaResourceId
            }, context);
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to create play source: ${error.message}`, context, error.stack);
            throw error;
        }
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
    async getMagnetPlayInfo(id, userId) {
        const context = { userId, function: 'getMagnetPlayInfo', playSourceId: id };
        try {
            const playSource = await this.findById(id);
            if (playSource.type !== play_source_entity_1.PlaySourceType.MAGNET) {
                this.logger.warn(`Play source is not magnet type: ${id}`, context);
                return {
                    success: false,
                    message: '播放源不是磁力链接类型',
                };
            }
            if (!playSource.magnetInfo?.infoHash) {
                this.logger.warn(`Magnet info not found: ${id}`, context);
                return {
                    success: false,
                    message: '磁力链接信息不存在',
                };
            }
            const infoHash = playSource.magnetInfo.infoHash;
            const torrentInfo = this.torrentService.getTorrentInfo(infoHash);
            if (!torrentInfo) {
                try {
                    await this.torrentService.addMagnet(playSource.url);
                    this.logger.log('Re-added magnet to client', app_logger_service_1.LogLevel.INFO, context);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const retryInfo = this.torrentService.getTorrentInfo(infoHash);
                    if (!retryInfo) {
                        return {
                            success: false,
                            message: '磁力链接加载失败',
                        };
                    }
                    return this.processTorrentInfo(retryInfo, id, context);
                }
                catch (error) {
                    this.logger.error(`Failed to re-add magnet: ${error.message}`, context, error.stack);
                    return {
                        success: false,
                        message: '磁力链接重新加载失败',
                    };
                }
            }
            return this.processTorrentInfo(torrentInfo, id, context);
        }
        catch (error) {
            this.logger.error(`Failed to get magnet play info: ${error.message}`, context, error.stack);
            return {
                success: false,
                message: '获取磁力链接播放信息失败',
            };
        }
    }
    async processTorrentInfo(torrentInfo, playSourceId, context) {
        try {
            const largestFile = this.torrentService.findLargestVideoFile(torrentInfo.infoHash);
            if (!largestFile) {
                this.logger.warn(`No video file found in torrent: ${torrentInfo.infoHash}`, context);
                return {
                    success: false,
                    message: '磁力链接中未找到视频文件',
                    torrentInfo,
                };
            }
            const playUrl = this.torrentService.generatePlayUrl(torrentInfo.infoHash, largestFile.index);
            this.logger.logParseProvider(0, 'magnet_play_info_ready', {
                playSourceId,
                infoHash: torrentInfo.infoHash,
                fileName: largestFile.name,
                playUrl,
            }, context);
            return {
                success: true,
                message: '获取磁力链接播放信息成功',
                playUrl,
                torrentInfo,
                fileInfo: largestFile,
            };
        }
        catch (error) {
            this.logger.error(`Failed to process torrent info: ${error.message}`, context, error.stack);
            return {
                success: false,
                message: '处理磁力链接信息失败',
            };
        }
    }
    async validateMagnetPlaySource(id, userId) {
        const context = { userId, function: 'validateMagnetPlaySource', playSourceId: id };
        try {
            const playSource = await this.findById(id);
            if (playSource.type !== play_source_entity_1.PlaySourceType.MAGNET) {
                this.logger.warn(`Play source is not magnet type: ${id}`, context);
                return false;
            }
            if (!playSource.magnetInfo?.infoHash) {
                this.logger.warn(`Magnet info not found: ${id}`, context);
                return false;
            }
            const infoHash = playSource.magnetInfo.infoHash;
            const torrentInfo = this.torrentService.getTorrentInfo(infoHash);
            if (!torrentInfo) {
                return false;
            }
            const isValid = torrentInfo.numPeers > 0 && torrentInfo.progress > 0;
            this.logger.logParseProvider(0, 'magnet_validated', {
                playSourceId: id,
                infoHash,
                isValid,
                numPeers: torrentInfo.numPeers,
                progress: torrentInfo.progress,
            }, context);
            return isValid;
        }
        catch (error) {
            this.logger.error(`Failed to validate magnet play source: ${error.message}`, context, error.stack);
            return false;
        }
    }
    async getMagnetStats(mediaResourceId, userId) {
        const context = { userId, function: 'getMagnetStats', mediaResourceId };
        try {
            const playSources = await this.playSourceRepository.find({
                where: {
                    mediaResourceId,
                    type: play_source_entity_1.PlaySourceType.MAGNET,
                    isActive: true,
                },
            });
            const magnetDetails = [];
            let totalSize = 0;
            let totalPeers = 0;
            let totalProgress = 0;
            let activeCount = 0;
            for (const playSource of playSources) {
                if (playSource.magnetInfo?.infoHash) {
                    const torrentInfo = this.torrentService.getTorrentInfo(playSource.magnetInfo.infoHash);
                    if (torrentInfo) {
                        totalSize += torrentInfo.length;
                        totalPeers += torrentInfo.numPeers;
                        totalProgress += torrentInfo.progress;
                        activeCount++;
                        magnetDetails.push({
                            id: playSource.id,
                            infoHash: playSource.magnetInfo.infoHash,
                            name: torrentInfo.name,
                            length: torrentInfo.length,
                            progress: torrentInfo.progress,
                            numPeers: torrentInfo.numPeers,
                            downloadSpeed: torrentInfo.downloadSpeed,
                            status: torrentInfo.numPeers > 0 ? 'active' : 'inactive',
                        });
                    }
                    else {
                        magnetDetails.push({
                            id: playSource.id,
                            infoHash: playSource.magnetInfo.infoHash,
                            status: 'not_loaded',
                        });
                    }
                }
            }
            const averageProgress = activeCount > 0 ? totalProgress / activeCount : 0;
            this.logger.log('Retrieved magnet stats', app_logger_service_1.LogLevel.INFO, context);
            return {
                totalMagnets: playSources.length,
                activeMagnets: activeCount,
                totalSize,
                totalPeers,
                averageProgress: Math.round(averageProgress * 100),
                magnetDetails,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get magnet stats: ${error.message}`, context, error.stack);
            return {
                totalMagnets: 0,
                activeMagnets: 0,
                totalSize: 0,
                totalPeers: 0,
                averageProgress: 0,
                magnetDetails: [],
            };
        }
    }
};
exports.PlaySourceService = PlaySourceService;
exports.PlaySourceService = PlaySourceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(play_source_entity_1.PlaySource)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        torrent_service_1.TorrentService,
        app_logger_service_1.AppLoggerService])
], PlaySourceService);
//# sourceMappingURL=play-source.service.js.map