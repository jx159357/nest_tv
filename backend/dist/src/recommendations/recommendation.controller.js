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
const media_resource_entity_1 = require("../entities/media-resource.entity");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let RecommendationController = class RecommendationController {
    recommendationService;
    constructor(recommendationService) {
        this.recommendationService = recommendationService;
    }
    async getTrending(limit = 10) {
        return this.recommendationService.getTrendingRecommendations(limit);
    }
    async getLatest(limit = 10) {
        return this.recommendationService.getLatestRecommendations(limit);
    }
    async getTopRated(limit = 10) {
        return this.recommendationService.getTopRatedRecommendations(limit);
    }
};
exports.RecommendationController = RecommendationController;
__decorate([
    (0, common_1.Get)('trending'),
    (0, swagger_1.ApiOperation)({ summary: '获取热门推荐' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取热门推荐', type: [media_resource_entity_1.MediaResource] }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '返回数量限制' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getTrending", null);
__decorate([
    (0, common_1.Get)('latest'),
    (0, swagger_1.ApiOperation)({ summary: '获取最新推荐' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取最新推荐', type: [media_resource_entity_1.MediaResource] }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '返回数量限制' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getLatest", null);
__decorate([
    (0, common_1.Get)('top-rated'),
    (0, swagger_1.ApiOperation)({ summary: '获取高分推荐' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取高分推荐', type: [media_resource_entity_1.MediaResource] }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '返回数量限制' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getTopRated", null);
exports.RecommendationController = RecommendationController = __decorate([
    (0, swagger_1.ApiTags)('推荐系统'),
    (0, common_1.Controller)('recommendations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [recommendation_service_1.RecommendationService])
], RecommendationController);
//# sourceMappingURL=recommendation.controller.js.map