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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ParseProvidersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseProvidersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const parse_provider_entity_1 = require("../entities/parse-provider.entity");
const axios_1 = __importDefault(require("axios"));
let ParseProvidersService = ParseProvidersService_1 = class ParseProvidersService {
    parseProviderRepository;
    logger = new common_1.Logger(ParseProvidersService_1.name);
    constructor(parseProviderRepository) {
        this.parseProviderRepository = parseProviderRepository;
    }
    async create(createParseProviderDto) {
        const parseProvider = this.parseProviderRepository.create(createParseProviderDto);
        return await this.parseProviderRepository.save(parseProvider);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, category, priority, activeOnly = true, supportOnlinePlay, supportDownload, minSuccessRate, sortBy = 'createdAt', sortOrder = 'DESC', search, } = queryDto;
        const queryBuilder = this.parseProviderRepository.createQueryBuilder('provider');
        if (search) {
            queryBuilder.andWhere('(provider.name LIKE :search OR provider.description LIKE :search OR provider.baseUrl LIKE :search)', { search: `%${search}%` });
        }
        if (category) {
            queryBuilder.andWhere('provider.category = :category', { category });
        }
        if (priority) {
            queryBuilder.andWhere('provider.priority = :priority', { priority });
        }
        if (supportOnlinePlay !== undefined) {
            queryBuilder.andWhere('provider.supportOnlinePlay = :supportOnlinePlay', {
                supportOnlinePlay,
            });
        }
        if (supportDownload !== undefined) {
            queryBuilder.andWhere('provider.supportDownload = :supportDownload', { supportDownload });
        }
        if (minSuccessRate !== undefined) {
            queryBuilder.andWhere('provider.successRate >= :minSuccessRate', { minSuccessRate });
        }
        if (activeOnly) {
            queryBuilder.andWhere('provider.isActive = :isActive', { isActive: true });
        }
        queryBuilder.andWhere('(provider.expireDate IS NULL OR provider.expireDate > :now)', {
            now: new Date(),
        });
        const validSortFields = [
            'id',
            'name',
            'successRate',
            'requestCount',
            'createdAt',
            'updatedAt',
            'priority',
        ];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        queryBuilder.orderBy(`provider.${sortField}`, sortOrder);
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
        const parseProvider = await this.parseProviderRepository.findOne({
            where: { id },
        });
        if (!parseProvider) {
            throw new common_1.NotFoundException('解析提供商不存在');
        }
        return parseProvider;
    }
    async update(id, updateParseProviderDto) {
        const parseProvider = await this.findById(id);
        Object.assign(parseProvider, updateParseProviderDto);
        return await this.parseProviderRepository.save(parseProvider);
    }
    async remove(id) {
        const parseProvider = await this.findById(id);
        await this.parseProviderRepository.remove(parseProvider);
    }
    async softDelete(id) {
        const parseProvider = await this.findById(id);
        parseProvider.isActive = false;
        return await this.parseProviderRepository.save(parseProvider);
    }
    async getAllCategories() {
        const categories = await this.parseProviderRepository
            .createQueryBuilder('provider')
            .select('DISTINCT provider.category', 'category')
            .where('provider.isActive = :isActive', { isActive: true })
            .orderBy('provider.category', 'ASC')
            .getRawMany();
        return categories.map(item => item.category).filter(Boolean);
    }
    async getByCategory(category, activeOnly = true) {
        const where = { category };
        if (activeOnly) {
            where.isActive = true;
        }
        return await this.parseProviderRepository.find({
            where,
            order: { priority: 'DESC', successRate: 'DESC' },
        });
    }
    async createBulk(createParseProviderDtos) {
        const parseProviders = this.parseProviderRepository.create(createParseProviderDtos);
        return await this.parseProviderRepository.save(parseProviders);
    }
    async updateBulkStatus(ids, isActive) {
        await this.parseProviderRepository.update(ids, {
            isActive,
            lastCheckedAt: new Date(),
        });
    }
    async testProvider(id, testUrl) {
        const provider = await this.findById(id);
        if (!provider.canMakeRequest()) {
            return {
                success: false,
                message: '解析提供商不可用或已达到请求限制',
                responseTime: 0,
            };
        }
        const startTime = Date.now();
        try {
            const testUrlToUse = testUrl || provider.baseUrl;
            const headers = provider.getApiHeaders();
            const response = await (0, axios_1.default)({
                method: provider.apiMethod || 'GET',
                url: provider.apiUrl || testUrlToUse,
                headers: headers,
                timeout: 30000,
            });
            const responseTime = Date.now() - startTime;
            const success = response.status >= 200 && response.status < 300;
            provider.updateRequestStats(success);
            await this.parseProviderRepository.save(provider);
            return {
                success,
                message: success ? '测试成功' : `测试失败，状态码: ${response.status}`,
                responseTime,
                data: response.data,
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            provider.updateRequestStats(false);
            await this.parseProviderRepository.save(provider);
            return {
                success: false,
                message: `测试失败: ${error.message}`,
                responseTime,
            };
        }
    }
    async parseVideoUrl(id, videoUrl) {
        const provider = await this.findById(id);
        if (!provider.canMakeRequest()) {
            return {
                success: false,
                message: '解析提供商不可用或已达到请求限制',
            };
        }
        try {
            const config = provider.getParseConfig();
            const headers = provider.getApiHeaders();
            const requestData = {
                url: videoUrl,
                ...config,
            };
            const response = await (0, axios_1.default)({
                method: provider.apiMethod || 'GET',
                url: provider.apiUrl || provider.baseUrl,
                headers: headers,
                [provider.apiMethod === 'POST' ? 'data' : 'params']: requestData,
                timeout: 60000,
            });
            provider.updateRequestStats(true);
            await this.parseProviderRepository.save(provider);
            const result = this.parseProviderResponse(response.data, config);
            return {
                success: true,
                message: '解析成功',
                ...result,
            };
        }
        catch (error) {
            provider.updateRequestStats(false);
            await this.parseProviderRepository.save(provider);
            this.logger.error(`解析视频URL失败: ${videoUrl}`, error.stack);
            return {
                success: false,
                message: `解析失败: ${error.message}`,
            };
        }
    }
    parseProviderResponse(responseData, config) {
        const result = {};
        if (config.playUrlsPath) {
            result.playUrls = this.extractDataByPath(responseData, config.playUrlsPath);
        }
        if (config.downloadUrlsPath) {
            result.downloadUrls = this.extractDataByPath(responseData, config.downloadUrlsPath);
        }
        if (config.subtitleUrlsPath) {
            result.subtitleUrls = this.extractDataByPath(responseData, config.subtitleUrlsPath);
        }
        if (config.metadataPath) {
            result.metadata = this.extractDataByPath(responseData, config.metadataPath);
        }
        return result;
    }
    extractDataByPath(data, path) {
        try {
            const pathParts = path.split('.');
            let current = data;
            for (const part of pathParts) {
                if (current && typeof current === 'object' && part in current) {
                    current = current[part];
                }
                else {
                    return null;
                }
            }
            return current;
        }
        catch (error) {
            this.logger.warn(`提取数据失败，路径: ${path}`, error.stack);
            return null;
        }
    }
    async getBestProvider(category, supportOnlinePlay = true) {
        const where = { isActive: true, supportOnlinePlay };
        if (category) {
            where.category = category;
        }
        return await this.parseProviderRepository.findOne({
            where,
            order: {
                priority: 'DESC',
                successRate: 'DESC',
                requestCount: 'ASC',
            },
        });
    }
    async resetDailyCounts() {
        await this.parseProviderRepository
            .createQueryBuilder()
            .update(parse_provider_entity_1.ParseProvider)
            .set({
            dailyRequestCount: 0,
            dailyResetDate: new Date(),
        })
            .where('dailyRequestLimit > 0')
            .execute();
    }
    async getStats() {
        const totalProviders = await this.parseProviderRepository.count();
        const activeProviders = await this.parseProviderRepository.count({
            where: { isActive: true },
        });
        const categories = await this.getAllCategories();
        const totalCategories = categories.length;
        const averageSuccessRateResult = await this.parseProviderRepository
            .createQueryBuilder('provider')
            .select('AVG(provider.successRate)', 'avgSuccessRate')
            .where('provider.isActive = :isActive', { isActive: true })
            .getRawOne();
        const averageSuccessRate = averageSuccessRateResult.avgSuccessRate || 0;
        const topProviders = await this.parseProviderRepository.find({
            where: { isActive: true },
            order: {
                successRate: 'DESC',
                requestCount: 'DESC',
                priority: 'DESC',
            },
            take: 10,
        });
        return {
            totalProviders,
            activeProviders,
            totalCategories,
            averageSuccessRate: Math.round(averageSuccessRate),
            topProviders,
        };
    }
    async searchProviders(keyword, limit = 20) {
        return await this.parseProviderRepository.find({
            where: [
                { name: (0, typeorm_2.Like)(`%${keyword}%`), isActive: true },
                { description: (0, typeorm_2.Like)(`%${keyword}%`), isActive: true },
                { category: (0, typeorm_2.Like)(`%${keyword}%`), isActive: true },
            ],
            order: {
                successRate: 'DESC',
                priority: 'DESC',
                name: 'ASC',
            },
            take: limit,
        });
    }
};
exports.ParseProvidersService = ParseProvidersService;
exports.ParseProvidersService = ParseProvidersService = ParseProvidersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(parse_provider_entity_1.ParseProvider)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ParseProvidersService);
//# sourceMappingURL=parse-providers.service.js.map