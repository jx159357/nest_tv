"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var IPTVService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPTVService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const iptv_channel_entity_1 = require("../entities/iptv-channel.entity");
const axios_1 = __importDefault(require("axios"));
const m3u8Parser = __importStar(require("m3u8-parser"));
let IPTVService = IPTVService_1 = class IPTVService {
    iptvChannelRepository;
    logger = new common_1.Logger(IPTVService_1.name);
    constructor(iptvChannelRepository) {
        this.iptvChannelRepository = iptvChannelRepository;
    }
    async create(createIPTVChannelDto) {
        const iptvChannel = this.iptvChannelRepository.create(createIPTVChannelDto);
        return await this.iptvChannelRepository.save(iptvChannel);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, group, language, country, region, resolution, streamFormat, activeOnly = true, isLive, sortBy = 'createdAt', sortOrder = 'DESC', search } = queryDto;
        const queryBuilder = this.iptvChannelRepository.createQueryBuilder('iptv');
        if (search) {
            queryBuilder.andWhere('(iptv.name LIKE :search OR iptv.description LIKE :search OR iptv.group LIKE :search)', { search: `%${search}%` });
        }
        if (group) {
            queryBuilder.andWhere('iptv.group = :group', { group });
        }
        if (language) {
            queryBuilder.andWhere('iptv.language = :language', { language });
        }
        if (country) {
            queryBuilder.andWhere('iptv.country = :country', { country });
        }
        if (region) {
            queryBuilder.andWhere('iptv.region = :region', { region });
        }
        if (resolution) {
            queryBuilder.andWhere('iptv.resolution = :resolution', { resolution });
        }
        if (streamFormat) {
            queryBuilder.andWhere('iptv.streamFormat = :streamFormat', { streamFormat });
        }
        if (isLive !== undefined) {
            queryBuilder.andWhere('iptv.isLive = :isLive', { isLive });
        }
        if (activeOnly) {
            queryBuilder.andWhere('iptv.isActive = :isActive', { isActive: true });
        }
        const validSortFields = ['id', 'name', 'group', 'viewCount', 'createdAt', 'updatedAt'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        queryBuilder.orderBy(`iptv.${sortField}`, sortOrder);
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
        const iptvChannel = await this.iptvChannelRepository.findOne({
            where: { id },
        });
        if (!iptvChannel) {
            throw new common_1.NotFoundException('IPTV频道不存在');
        }
        return iptvChannel;
    }
    async update(id, updateIPTVChannelDto) {
        const iptvChannel = await this.findById(id);
        Object.assign(iptvChannel, updateIPTVChannelDto);
        return await this.iptvChannelRepository.save(iptvChannel);
    }
    async remove(id) {
        const iptvChannel = await this.findById(id);
        await this.iptvChannelRepository.remove(iptvChannel);
    }
    async softDelete(id) {
        const iptvChannel = await this.findById(id);
        iptvChannel.isActive = false;
        return await this.iptvChannelRepository.save(iptvChannel);
    }
    async incrementViewCount(id) {
        await this.iptvChannelRepository.increment({ id }, 'viewCount', 1);
    }
    async getAllGroups() {
        const groups = await this.iptvChannelRepository
            .createQueryBuilder('iptv')
            .select('DISTINCT iptv.group', 'group')
            .where('iptv.isActive = :isActive', { isActive: true })
            .orderBy('iptv.group', 'ASC')
            .getRawMany();
        return groups.map(item => item.group);
    }
    async getByGroup(group, activeOnly = true) {
        const where = { group };
        if (activeOnly) {
            where.isActive = true;
        }
        return await this.iptvChannelRepository.find({
            where,
            order: { name: 'ASC' },
        });
    }
    async createBulk(createIPTVChannelDtos) {
        const iptvChannels = this.iptvChannelRepository.create(createIPTVChannelDtos);
        return await this.iptvChannelRepository.save(iptvChannels);
    }
    async updateBulkStatus(ids, isActive) {
        await this.iptvChannelRepository.update(ids, {
            isActive,
            lastCheckedAt: new Date()
        });
    }
    async importFromM3U(m3uUrl) {
        try {
            this.logger.log(`开始导入M3U播放列表: ${m3uUrl}`);
            const response = await axios_1.default.get(m3uUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });
            const m3uContent = response.data;
            const parser = new m3u8Parser.Parser();
            parser.push(m3uContent);
            parser.end();
            const manifest = parser.manifest;
            const channels = [];
            if (manifest.playlists) {
                for (const playlist of manifest.playlists) {
                    if (playlist.uri && playlist.attributes) {
                        const channelData = {
                            name: playlist.attributes['tvg-name'] || playlist.attributes.channelName || `频道${Date.now()}`,
                            url: playlist.uri,
                            group: playlist.attributes['group-title'] || '默认分组',
                            logo: playlist.attributes['tvg-logo'],
                            language: playlist.attributes['tvg-language'],
                            country: playlist.attributes['tvg-country'],
                            epgId: playlist.attributes['tvg-id'],
                            streamFormat: 'hls',
                            isActive: true,
                            isLive: true,
                            viewCount: 0,
                        };
                        try {
                            const channel = await this.create(channelData);
                            channels.push(channel);
                        }
                        catch (error) {
                            this.logger.warn(`导入频道失败: ${channelData.name}`, error);
                        }
                    }
                }
            }
            this.logger.log(`成功导入 ${channels.length} 个频道`);
            return channels;
        }
        catch (error) {
            this.logger.error(`导入M3U播放列表失败: ${m3uUrl}`, error.stack);
            throw new common_1.HttpException('导入M3U播放列表失败', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async validateChannel(id) {
        const channel = await this.findById(id);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(channel.url, {
                method: 'HEAD',
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const isValid = response.ok;
            channel.lastCheckedAt = new Date();
            channel.isActive = isValid;
            await this.iptvChannelRepository.save(channel);
            return isValid;
        }
        catch (error) {
            channel.lastCheckedAt = new Date();
            channel.isActive = false;
            await this.iptvChannelRepository.save(channel);
            return false;
        }
    }
    async getStats() {
        const totalChannels = await this.iptvChannelRepository.count();
        const activeChannels = await this.iptvChannelRepository.count({
            where: { isActive: true },
        });
        const groups = await this.getAllGroups();
        const totalGroups = groups.length;
        const popularChannels = await this.iptvChannelRepository.find({
            where: { isActive: true },
            order: { viewCount: 'DESC' },
            take: 10,
        });
        const recentChannels = await this.iptvChannelRepository.find({
            where: { isActive: true },
            order: { createdAt: 'DESC' },
            take: 10,
        });
        return {
            totalChannels,
            activeChannels,
            totalGroups,
            popularChannels,
            recentChannels,
        };
    }
    async searchChannels(keyword, limit = 20) {
        return await this.iptvChannelRepository.find({
            where: [
                { name: (0, typeorm_2.Like)(`%${keyword}%`), isActive: true },
                { group: (0, typeorm_2.Like)(`%${keyword}%`), isActive: true },
                { description: (0, typeorm_2.Like)(`%${keyword}%`), isActive: true },
            ],
            order: { viewCount: 'DESC', name: 'ASC' },
            take: limit,
        });
    }
};
exports.IPTVService = IPTVService;
exports.IPTVService = IPTVService = IPTVService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(iptv_channel_entity_1.IPTVChannel)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], IPTVService);
//# sourceMappingURL=iptv.service.js.map