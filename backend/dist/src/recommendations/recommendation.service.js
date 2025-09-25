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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const recommendation_entity_1 = require("../entities/recommendation.entity");
const media_resource_entity_1 = require("../entities/media-resource.entity");
const user_entity_1 = require("../entities/user.entity");
const watch_history_entity_1 = require("../entities/watch-history.entity");
const media_resource_service_1 = require("../media/media-resource.service");
let RecommendationService = RecommendationService_1 = class RecommendationService {
    recommendationRepository;
    mediaResourceRepository;
    userRepository;
    watchHistoryRepository;
    mediaResourceService;
    logger = new common_1.Logger(RecommendationService_1.name);
    constructor(recommendationRepository, mediaResourceRepository, userRepository, watchHistoryRepository, mediaResourceService) {
        this.recommendationRepository = recommendationRepository;
        this.mediaResourceRepository = mediaResourceRepository;
        this.userRepository = userRepository;
        this.watchHistoryRepository = watchHistoryRepository;
        this.mediaResourceService = mediaResourceService;
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
    async generatePersonalizedRecommendations(userId, limit = 10) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['watchHistory', 'favorites'],
        });
        if (!user) {
            throw new common_1.NotFoundException(`用户ID ${userId} 不存在`);
        }
        await this.cleanupExpiredRecommendations(userId);
        const existingCount = await this.recommendationRepository.count({
            where: { userId, isActive: true },
        });
        if (existingCount < limit) {
            await this.generateNewRecommendations(user, limit - existingCount);
        }
        return this.recommendationRepository.find({
            where: { userId, isActive: true },
            relations: ['mediaResource'],
            order: { priority: 'ASC', score: 'DESC' },
            take: limit,
        });
    }
    async generateContentBasedRecommendations(userId, limit = 5) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['watchHistory', 'favorites'],
        });
        if (!user) {
            throw new common_1.NotFoundException(`用户ID ${userId} 不存在`);
        }
        const watchedMedia = user.watchHistory.map(h => h.mediaResource);
        const favoriteMedia = user.favorites;
        const allUserMedia = [...watchedMedia, ...favoriteMedia];
        const userPreferences = this.extractUserPreferences(allUserMedia);
        const recommendations = await this.findSimilarMedia(userPreferences, allUserMedia, limit);
        return recommendations;
    }
    async generateCollaborativeRecommendations(userId, limit = 5) {
        const similarUsers = await this.findSimilarUsers(userId);
        if (similarUsers.length === 0) {
            return [];
        }
        const similarUserMedia = await this.getSimilarUserMedia(similarUsers, userId);
        return similarUserMedia.slice(0, limit);
    }
    async recordRecommendationFeedback(userId, mediaResourceId, feedback) {
        const recommendation = await this.recommendationRepository.findOne({
            where: { userId, mediaResourceId },
        });
        if (recommendation) {
            switch (feedback) {
                case 'click':
                    recommendation.score += 5;
                    break;
                case 'like':
                    recommendation.score += 10;
                    break;
                case 'dislike':
                    recommendation.score -= 20;
                    recommendation.isActive = false;
                    break;
            }
            await this.recommendationRepository.save(recommendation);
        }
    }
    async cleanupExpiredRecommendations(userId) {
        const now = new Date();
        await this.recommendationRepository.delete({
            userId,
            expiresAt: (0, typeorm_2.LessThan)(now),
        });
    }
    async generateNewRecommendations(user, count) {
        const recommendations = [];
        const contentRecs = await this.generateContentBasedRecommendations(user.id, Math.ceil(count / 2));
        contentRecs.forEach((media, index) => {
            recommendations.push(this.createRecommendation(user, media, 'content', 80 - index, 1 + index));
        });
        const collabRecs = await this.generateCollaborativeRecommendations(user.id, Math.ceil(count / 2));
        collabRecs.forEach((media, index) => {
            recommendations.push(this.createRecommendation(user, media, 'collaborative', 70 - index, 10 + index));
        });
        if (recommendations.length < count) {
            const trendingRecs = await this.getTrendingRecommendations(count - recommendations.length);
            trendingRecs.forEach((rec, index) => {
                recommendations.push(this.createRecommendation(user, rec.mediaResource, 'trending', 60 - index, 20 + index));
            });
        }
        await this.recommendationRepository.save(recommendations);
    }
    createRecommendation(user, media, type, score, priority) {
        const recommendation = new recommendation_entity_1.Recommendation();
        recommendation.user = user;
        recommendation.mediaResource = media;
        recommendation.type = type;
        recommendation.score = score;
        recommendation.priority = priority;
        recommendation.isActive = true;
        recommendation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        recommendation.metadata = {
            reason: this.getRecommendationReason(type),
            algorithm: 'hybrid',
        };
        return recommendation;
    }
    extractUserPreferences(mediaList) {
        const preferences = {
            genres: new Map(),
            directors: new Map(),
            actors: new Map(),
            types: new Map(),
            qualities: new Map(),
        };
        mediaList.forEach(media => {
            media.genres?.forEach(genre => {
                preferences.genres.set(genre, (preferences.genres.get(genre) || 0) + 1);
            });
            if (media.director) {
                preferences.directors.set(media.director, (preferences.directors.get(media.director) || 0) + 1);
            }
            media.actors?.split(',')?.forEach(actor => {
                const trimmedActor = actor.trim();
                if (trimmedActor) {
                    preferences.actors.set(trimmedActor, (preferences.actors.get(trimmedActor) || 0) + 1);
                }
            });
            preferences.types.set(media.type, (preferences.types.get(media.type) || 0) + 1);
            preferences.qualities.set(media.quality, (preferences.qualities.get(media.quality) || 0) + 1);
        });
        return preferences;
    }
    async findSimilarMedia(preferences, excludeMedia, limit) {
        const excludeIds = excludeMedia.map(m => m.id);
        const queryBuilder = this.mediaResourceRepository
            .createQueryBuilder('media')
            .where('media.isActive = :isActive', { isActive: true })
            .andWhere('media.id NOT IN (:...excludeIds)', { excludeIds });
        const topGenres = Array.from(preferences.genres.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);
        if (topGenres.length > 0) {
            queryBuilder.andWhere('media.genres && :genres', { genres: topGenres });
        }
        queryBuilder.orderBy('media.rating', 'DESC').addOrderBy('media.viewCount', 'DESC').take(limit);
        return queryBuilder.getMany();
    }
    async findSimilarUsers(userId) {
        const userHistory = await this.watchHistoryRepository.find({
            where: { userId },
            relations: ['mediaResource'],
        });
        const userMediaIds = userHistory.map(h => h.mediaResource.id);
        if (userMediaIds.length === 0) {
            return [];
        }
        const similarUsers = await this.watchHistoryRepository
            .createQueryBuilder('history')
            .select('history.userId', 'userId')
            .addSelect('COUNT(*)', 'commonCount')
            .where('history.mediaResourceId IN (:...mediaIds)', { mediaIds: userMediaIds })
            .andWhere('history.userId != :userId', { userId })
            .groupBy('history.userId')
            .having('COUNT(*) > 0')
            .orderBy('COUNT(*)', 'DESC')
            .take(10)
            .getRawMany();
        if (similarUsers.length === 0) {
            return [];
        }
        const userIds = similarUsers.map(u => u.userId);
        return this.userRepository.findByIds(userIds);
    }
    async getSimilarUserMedia(similarUsers, excludeUserId) {
        const userIds = similarUsers.map(u => u.id);
        const similarUserMedia = await this.watchHistoryRepository
            .createQueryBuilder('history')
            .select('DISTINCT history.mediaResourceId', 'mediaResourceId')
            .where('history.userId IN (:...userIds)', { userIds })
            .andWhere('history.mediaResourceId NOT IN (SELECT h.mediaResourceId FROM watch_history h WHERE h.userId = :excludeUserId)', { excludeUserId })
            .getRawMany();
        if (similarUserMedia.length === 0) {
            return [];
        }
        const mediaIds = similarUserMedia.map(m => m.mediaResourceId);
        return this.mediaResourceRepository.findByIds(mediaIds);
    }
    getRecommendationReason(type) {
        switch (type) {
            case 'content':
                return '基于您的观看历史推荐';
            case 'collaborative':
                return '基于相似用户的喜好推荐';
            case 'trending':
                return '热门推荐';
            case 'editorial':
                return '编辑精选';
            default:
                return '个性化推荐';
        }
    }
    getTypeDisplayName(type) {
        const typeMap = {
            movie: '电影',
            tv_series: '电视剧',
            variety: '综艺',
            anime: '动漫',
            documentary: '纪录片',
        };
        return typeMap[type] || type;
    }
};
exports.RecommendationService = RecommendationService;
exports.RecommendationService = RecommendationService = RecommendationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(recommendation_entity_1.Recommendation)),
    __param(1, (0, typeorm_1.InjectRepository)(media_resource_entity_1.MediaResource)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(watch_history_entity_1.WatchHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        media_resource_service_1.MediaResourceService])
], RecommendationService);
//# sourceMappingURL=recommendation.service.js.map