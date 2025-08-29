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
exports.RecommendationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const recommendation_entity_1 = require("../entities/recommendation.entity");
const user_entity_1 = require("../entities/user.entity");
const media_resource_entity_1 = require("../entities/media-resource.entity");
const media_resource_service_1 = require("../media/media-resource.service");
let RecommendationService = class RecommendationService {
    recommendationRepository;
    userRepository;
    mediaResourceRepository;
    mediaResourceService;
    constructor(recommendationRepository, userRepository, mediaResourceRepository, mediaResourceService) {
        this.recommendationRepository = recommendationRepository;
        this.userRepository = userRepository;
        this.mediaResourceRepository = mediaResourceRepository;
        this.mediaResourceService = mediaResourceService;
    }
    async generatePersonalizedRecommendations(userId, limit = 10) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['watchHistory', 'favorites'],
        });
        if (!user) {
            throw new common_1.NotFoundException('用户不存在');
        }
        const watchedMediaIds = user.watchHistory?.map(history => history.mediaResourceId) || [];
        const favoritedMediaIds = user.favorites?.map(media => media.id) || [];
        const allViewedMediaIds = [...new Set([...watchedMediaIds, ...favoritedMediaIds])];
        const watchedMedia = await this.mediaResourceRepository.findByIds(watchedMediaIds);
        const typePreferences = this.calculateTypePreferences(watchedMedia);
        const similarMedia = await this.findSimilarMediaByType(typePreferences, allViewedMediaIds, limit * 2);
        const recommendations = [];
        for (let i = 0; i < Math.min(similarMedia.length, limit); i++) {
            const media = similarMedia[i];
            const recommendation = this.recommendationRepository.create({
                userId,
                mediaResourceId: media.id,
                type: 'personalized',
                score: this.calculateRecommendationScore(media, typePreferences),
                priority: i + 1,
                metadata: {
                    reason: `基于您观看过的${this.getTypeDisplayName(media.type)}类型内容推荐`,
                    algorithm: 'content-based-filtering',
                    category: media.type,
                },
            });
            recommendations.push(recommendation);
        }
        await this.recommendationRepository.save(recommendations);
        return recommendations;
    }
    async getTrendingRecommendations(limit = 10) {
        const popularMedia = await this.mediaResourceService.getPopular(limit * 2);
        const recommendations = [];
        for (let i = 0; i < Math.min(popularMedia.length, limit); i++) {
            const media = popularMedia[i];
            const recommendation = this.recommendationRepository.create({
                userId: 0,
                mediaResourceId: media.id,
                type: 'trending',
                score: media.viewCount,
                priority: i + 1,
                metadata: {
                    reason: '热门影视内容',
                    algorithm: 'popularity-based',
                },
            });
            recommendations.push(recommendation);
        }
        return recommendations;
    }
    async getEditorialRecommendations(limit = 10) {
        const editorialRecommendations = await this.recommendationRepository.find({
            where: {
                type: 'editorial',
                isActive: true,
            },
            order: {
                priority: 'ASC',
                createdAt: 'DESC',
            },
            take: limit,
        });
        return editorialRecommendations;
    }
    async getUserRecommendations(userId, limit = 10) {
        let recommendations = await this.recommendationRepository.find({
            where: {
                userId,
                isActive: true,
                type: 'personalized',
                expiresAt: (0, typeorm_2.MoreThan)(new Date()),
            },
            order: {
                priority: 'ASC',
                score: 'DESC',
            },
            take: limit,
        });
        if (recommendations.length < limit) {
            const trending = await this.getTrendingRecommendations(limit - recommendations.length);
            recommendations = [...recommendations, ...trending];
        }
        return recommendations;
    }
    async getRecommendationDetail(recommendationId) {
        const recommendation = await this.recommendationRepository.findOne({
            where: { id: recommendationId },
            relations: ['user', 'mediaResource'],
        });
        if (!recommendation) {
            throw new common_1.NotFoundException('推荐记录不存在');
        }
        return recommendation;
    }
    calculateTypePreferences(watchedMedia) {
        const typeCount = {};
        watchedMedia.forEach(media => {
            if (typeCount[media.type]) {
                typeCount[media.type]++;
            }
            else {
                typeCount[media.type] = 1;
            }
        });
        return typeCount;
    }
    async findSimilarMediaByType(typePreferences, excludeIds, limit) {
        const preferredTypes = Object.keys(typePreferences)
            .sort((a, b) => typePreferences[b] - typePreferences[a])
            .slice(0, 3);
        const queryBuilder = this.mediaResourceRepository.createQueryBuilder('media');
        queryBuilder
            .where('media.type IN (:...types)', { types: preferredTypes })
            .andWhere('media.isActive = :isActive', { isActive: true })
            .andWhere('media.rating >= :minRating', { minRating: 7.0 })
            .andWhere('media.id NOT IN (:...excludeIds)', { excludeIds })
            .orderBy('media.rating', 'DESC')
            .addOrderBy('media.viewCount', 'DESC')
            .limit(limit);
        return await queryBuilder.getMany();
    }
    calculateRecommendationScore(media, typePreferences) {
        let score = media.rating * 10;
        if (typePreferences[media.type]) {
            score += typePreferences[media.type] * 5;
        }
        score += Math.log(media.viewCount + 1) * 2;
        return Math.min(score, 100);
    }
    getTypeDisplayName(type) {
        const typeMap = {
            'movie': '电影',
            'tv_series': '电视剧',
            'variety': '综艺',
            'anime': '动漫',
            'documentary': '纪录片',
        };
        return typeMap[type] || type;
    }
};
exports.RecommendationService = RecommendationService;
exports.RecommendationService = RecommendationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(recommendation_entity_1.Recommendation)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(media_resource_entity_1.MediaResource)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        media_resource_service_1.MediaResourceService])
], RecommendationService);
//# sourceMappingURL=recommendation.service.js.map