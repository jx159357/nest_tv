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
const recommendation_service_1 = require("./recommendation.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let RecommendationController = class RecommendationController {
    recommendationService;
    constructor(recommendationService) {
        this.recommendationService = recommendationService;
    }
    async getUserRecommendations(userId, limit) {
        const recommendations = await this.recommendationService.getUserRecommendations(parseInt(userId), limit ? parseInt(limit) : 10);
        return recommendations;
    }
    async generatePersonalizedRecommendations(userId, limit) {
        const recommendations = await this.recommendationService.generatePersonalizedRecommendations(parseInt(userId), limit || 10);
        return recommendations;
    }
    async getTrendingRecommendations(limit) {
        const recommendations = await this.recommendationService.getTrendingRecommendations(limit ? parseInt(limit) : 10);
        return recommendations;
    }
    async getEditorialRecommendations(limit) {
        const recommendations = await this.recommendationService.getEditorialRecommendations(limit ? parseInt(limit) : 10);
        return recommendations;
    }
    async getRecommendationDetail(id) {
        const recommendation = await this.recommendationService.getRecommendationDetail(parseInt(id));
        return recommendation;
    }
};
exports.RecommendationController = RecommendationController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getUserRecommendations", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('generate/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "generatePersonalizedRecommendations", null);
__decorate([
    (0, common_1.Get)('trending'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getTrendingRecommendations", null);
__decorate([
    (0, common_1.Get)('editorial'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getEditorialRecommendations", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RecommendationController.prototype, "getRecommendationDetail", null);
exports.RecommendationController = RecommendationController = __decorate([
    (0, common_1.Controller)('recommendations'),
    __metadata("design:paramtypes", [recommendation_service_1.RecommendationService])
], RecommendationController);
//# sourceMappingURL=recommendation.controller.js.map