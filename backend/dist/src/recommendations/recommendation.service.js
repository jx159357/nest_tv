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
var RecommendationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const media_resource_entity_1 = require("../entities/media-resource.entity");
const recommendation_entity_1 = require("../entities/recommendation.entity");
let RecommendationService = RecommendationService_1 = class RecommendationService {
    mediaResourceRepository;
    recommendationRepository;
    cacheManager;
    logger = new common_1.Logger(RecommendationService_1.name);
    constructor(mediaResourceRepository, recommendationRepository, cacheManager) {
        this.mediaResourceRepository = mediaResourceRepository;
        this.recommendationRepository = recommendationRepository;
        this.cacheManager = cacheManager;
    }
    async getTrendingRecommendations(limit = 10) {
        const cacheKey = `trending_recommendations_${limit}`;
        try {
            const cachedRecommendations = await this.cacheManager.get(cacheKey);
            if (cachedRecommendations) {
                this.logger.log(`从缓存获取热门推荐: ${cacheKey}`);
                return cachedRecommendations;
            }
            const trendingMedia = await this.mediaResourceRepository.find({
                where: { isActive: true },
                order: {
                    viewCount: 'DESC',
                    rating: 'DESC',
                    createdAt: 'DESC'
                },
                take: limit,
            });
            await this.cacheManager.set(cacheKey, trendingMedia, 300000);
            this.logger.log(`缓存热门推荐: ${cacheKey}`);
            return trendingMedia;
        }
        catch (error) {
            this.logger.error(`获取热门推荐失败: ${error.message}`);
            return [];
        }
    }
    async getLatestRecommendations(limit = 10) {
        const cacheKey = `latest_recommendations_${limit}`;
        try {
            const cachedRecommendations = await this.cacheManager.get(cacheKey);
            if (cachedRecommendations) {
                this.logger.log(`从缓存获取最新推荐: ${cacheKey}`);
                return cachedRecommendations;
            }
            const latestMedia = await this.mediaResourceRepository.find({
                where: { isActive: true },
                order: { createdAt: 'DESC' },
                take: limit,
            });
            await this.cacheManager.set(cacheKey, latestMedia, 180000);
            this.logger.log(`缓存最新推荐: ${cacheKey}`);
            return latestMedia;
        }
        catch (error) {
            this.logger.error(`获取最新推荐失败: ${error.message}`);
            return [];
        }
    }
    async getTopRatedRecommendations(limit = 10) {
        const cacheKey = `top_rated_recommendations_${limit}`;
        try {
            const cachedRecommendations = await this.cacheManager.get(cacheKey);
            if (cachedRecommendations) {
                this.logger.log(`从缓存获取高分推荐: ${cacheKey}`);
                return cachedRecommendations;
            }
            const topRatedMedia = await this.mediaResourceRepository.find({
                where: {
                    isActive: true,
                    rating: 7.0,
                },
                order: { rating: 'DESC' },
                take: limit,
            });
            await this.cacheManager.set(cacheKey, topRatedMedia, 600000);
            this.logger.log(`缓存高分推荐: ${cacheKey}`);
            return topRatedMedia;
        }
        catch (error) {
            this.logger.error(`获取高分推荐失败: ${error.message}`);
            return [];
        }
    }
    async clearRecommendationsCache() {
        try {
            await this.cacheManager.clear();
            this.logger.log('清理推荐缓存完成');
        }
        catch (error) {
            this.logger.error(`清理推荐缓存失败: ${error.message}`);
        }
    }
};
exports.RecommendationService = RecommendationService;
exports.RecommendationService = RecommendationService = RecommendationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(media_resource_entity_1.MediaResource)),
    __param(1, (0, typeorm_2.InjectRepository)(recommendation_entity_1.Recommendation)),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository,
        cache_manager_1.Cache])
], RecommendationService);
//# sourceMappingURL=recommendation.service.js.map