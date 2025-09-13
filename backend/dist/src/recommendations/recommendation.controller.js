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
exports.RecommendationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const recommendation_service_1 = require("./recommendation.service");
let RecommendationController = class RecommendationController {
    recommendationService;
    constructor(recommendationService) {
        this.recommendationService = recommendationService;
    }
    async getTrendingRecommendations(limit = 10) {
        try {
            return await this.recommendationService.getTrendingRecommendations(limit);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取热门推荐失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getEditorialRecommendations(limit = 10) {
        try {
            return await this.recommendationService.getEditorialRecommendations(limit);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取编辑推荐失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserRecommendations(req, type, limit = 10) {
        try {
            const userId = req.user.userId;
            return await this.recommendationService.getUserRecommendations(userId, limit);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取用户推荐失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async generatePersonalizedRecommendations(req, limit = 10) {
        try {
            const userId = req.user.userId;
            return await this.recommendationService.generatePersonalizedRecommendations(userId, limit);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '生成个性化推荐失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getContentBasedRecommendations(req, limit = 5) {
        try {
            const userId = req.user.userId;
            return await this.recommendationService.generateContentBasedRecommendations(userId, limit);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取基于内容的推荐失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCollaborativeRecommendations(req, limit = 5) {
        try {
            const userId = req.user.userId;
            return await this.recommendationService.generateCollaborativeRecommendations(userId, limit);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取协同过滤推荐失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async recordRecommendationFeedback(req, feedbackData) {
        try {
            const userId = req.user.userId;
            const { mediaResourceId, feedback } = feedbackData;
            await this.recommendationService.recordRecommendationFeedback(userId, mediaResourceId, feedback);
            return { message: '推荐反馈记录成功' };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '记录推荐反馈失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSimilarMediaRecommendations(mediaId, limit = 6) {
        try {
            const trendingRecs = await this.recommendationService.getTrendingRecommendations(limit);
            return trendingRecs.map(rec => rec.mediaResource);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取相似影视推荐失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateRecommendationPriority(req, id, priorityData) {
        try {
            const userId = req.user.userId;
            const recommendations = await this.recommendationService.getUserRecommendations(userId);
            const targetRecommendation = recommendations.find(r => r.id === id);
            if (!targetRecommendation) {
                throw new common_1.HttpException('推荐记录不存在', common_1.HttpStatus.NOT_FOUND);
            }
            targetRecommendation.priority = priorityData.priority;
            return targetRecommendation;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '更新推荐优先级失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteRecommendation(req, id) {
        try {
            const userId = req.user.userId;
            return { message: '推荐记录删除成功' };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '删除推荐记录失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getRecommendationStats(req) {
        try {
            const userId = req.user.userId;
            const recommendations = await this.recommendationService.getUserRecommendations(userId);
            const stats = {
                total: recommendations.length,
                byType: {},
                averageScore: 0,
            };
            recommendations.forEach(rec => {
                stats.byType[rec.type] = (stats.byType[rec.type] || 0) + 1;
            });
            if (recommendations.length > 0) {
                const totalScore = recommendations.reduce((sum, rec) => sum + rec.score, 0);
                stats.averageScore = Math.round(totalScore / recommendations.length * 100) / 100;
            }
            return stats;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取推荐统计信息失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getRecommendationDetail(id) {
        try {
            const recommendation = await this.recommendationService.getRecommendationDetail(id);
            return recommendation;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取推荐详情失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.RecommendationController = RecommendationController;
__decorate([
    (0, common_1.Get)('trending'),
    (0, swagger_1.ApiOperation)({ summary: '获取热门推荐' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取热门推荐' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '返回数量限制，默认10' }),
    __param(0, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getTrendingRecommendations", null);
__decorate([
    (0, common_1.Get)('editorial'),
    (0, swagger_1.ApiOperation)({ summary: '获取编辑推荐' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取编辑推荐' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '返回数量限制，默认10' }),
    __param(0, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getEditorialRecommendations", null);
__decorate([
    (0, common_1.Get)('user'),
    (0, swagger_1.ApiOperation)({ summary: '获取用户推荐列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取用户推荐列表' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: '推荐类型：personalized, content, collaborative, trending' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '返回数量限制，默认10' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getUserRecommendations", null);
__decorate([
    (0, common_1.Post)('personalized'),
    (0, swagger_1.ApiOperation)({ summary: '生成个性化推荐' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功生成个性化推荐' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '返回数量限制，默认10' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "generatePersonalizedRecommendations", null);
__decorate([
    (0, common_1.Get)('content-based'),
    (0, swagger_1.ApiOperation)({ summary: '基于内容的推荐' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取基于内容的推荐' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '返回数量限制，默认5' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getContentBasedRecommendations", null);
__decorate([
    (0, common_1.Get)('collaborative'),
    (0, swagger_1.ApiOperation)({ summary: '协同过滤推荐' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取协同过滤推荐' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '返回数量限制，默认5' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getCollaborativeRecommendations", null);
__decorate([
    (0, common_1.Post)('feedback'),
    (0, swagger_1.ApiOperation)({ summary: '记录推荐反馈' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功记录推荐反馈' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "recordRecommendationFeedback", null);
__decorate([
    (0, common_1.Get)('similar/:mediaId'),
    (0, swagger_1.ApiOperation)({ summary: '获取相似影视推荐' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取相似影视推荐' }),
    (0, swagger_1.ApiParam)({ name: 'mediaId', description: '影视资源ID' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '返回数量限制，默认6' }),
    __param(0, (0, common_1.Param)('mediaId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getSimilarMediaRecommendations", null);
__decorate([
    (0, common_1.Put)(':id/priority'),
    (0, swagger_1.ApiOperation)({ summary: '更新推荐优先级' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功更新推荐优先级' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '推荐记录ID' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Object]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "updateRecommendationPriority", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除推荐记录' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功删除推荐记录' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '推荐记录ID' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "deleteRecommendation", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: '获取推荐统计信息' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取推荐统计信息' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getRecommendationStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取推荐详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取推荐详情' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '推荐ID' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getRecommendationDetail", null);
exports.RecommendationController = RecommendationController = __decorate([
    (0, swagger_1.ApiTags)('推荐系统'),
    (0, common_1.Controller)('recommendations'),
    __metadata("design:paramtypes", [recommendation_service_1.RecommendationService])
], RecommendationController);
//# sourceMappingURL=recommendation.controller.js.map