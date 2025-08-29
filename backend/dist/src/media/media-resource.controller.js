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
exports.MediaResourceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const media_resource_service_1 = require("./media-resource.service");
const create_media_resource_dto_1 = require("./dtos/create-media-resource.dto");
const update_media_resource_dto_1 = require("./dtos/update-media-resource.dto");
const media_resource_query_dto_1 = require("./dtos/media-resource-query.dto");
const media_resource_entity_1 = require("../entities/media-resource.entity");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let MediaResourceController = class MediaResourceController {
    mediaResourceService;
    constructor(mediaResourceService) {
        this.mediaResourceService = mediaResourceService;
    }
    async create(createMediaResourceDto) {
        return await this.mediaResourceService.create(createMediaResourceDto);
    }
    async findAll(queryDto) {
        return await this.mediaResourceService.findAll(queryDto);
    }
    async getPopular(limit = 10) {
        return await this.mediaResourceService.getPopular(limit);
    }
    async getLatest(limit = 10) {
        return await this.mediaResourceService.getLatest(limit);
    }
    async getTopRated(limit = 10, minRating = 8) {
        return await this.mediaResourceService.getTopRated(limit, minRating);
    }
    async getByType(type, limit = 20) {
        return await this.mediaResourceService.getByType(type, limit);
    }
    async findById(id) {
        return await this.mediaResourceService.findById(id);
    }
    async getRecommendations(id, limit = 6) {
        return await this.mediaResourceService.getRecommendations(id, limit);
    }
    async incrementViewCount(id) {
        await this.mediaResourceService.incrementViewCount(id);
    }
    async update(id, updateMediaResourceDto) {
        return await this.mediaResourceService.update(id, updateMediaResourceDto);
    }
    async remove(id) {
        await this.mediaResourceService.remove(id);
    }
    async softDelete(id) {
        return await this.mediaResourceService.softDelete(id);
    }
    async addToFavorites(mediaResourceId, req) {
        const userId = req.user.id;
        return await this.mediaResourceService.addToFavorites(userId, mediaResourceId);
    }
    async removeFromFavorites(mediaResourceId, req) {
        const userId = req.user.id;
        return await this.mediaResourceService.removeFromFavorites(userId, mediaResourceId);
    }
    async checkFavoriteStatus(mediaResourceId, req) {
        const userId = req.user.id;
        const isFavorited = await this.mediaResourceService.isFavoritedByUser(userId, mediaResourceId);
        return { isFavorited };
    }
    async getUserFavorites(req, page = 1, limit = 10) {
        const userId = req.user.id;
        return await this.mediaResourceService.getUserFavorites(userId, page, limit);
    }
    async rateResource(mediaResourceId, rating, req) {
        const userId = req.user.id;
        return await this.mediaResourceService.rateResource(userId, mediaResourceId, rating);
    }
    async getRatingStats(mediaResourceId) {
        return await this.mediaResourceService.getRatingStats(mediaResourceId);
    }
};
exports.MediaResourceController = MediaResourceController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '创建影视资源' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '影视资源创建成功', type: media_resource_entity_1.MediaResource }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_media_resource_dto_1.CreateMediaResourceDto]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '分页查询影视资源' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取影视资源列表' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [media_resource_query_dto_1.MediaResourceQueryDto]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('popular'),
    (0, swagger_1.ApiOperation)({ summary: '获取热门影视资源' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '返回数量限制' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取热门影视资源', type: [media_resource_entity_1.MediaResource] }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "getPopular", null);
__decorate([
    (0, common_1.Get)('latest'),
    (0, swagger_1.ApiOperation)({ summary: '获取最新影视资源' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '返回数量限制' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取最新影视资源', type: [media_resource_entity_1.MediaResource] }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "getLatest", null);
__decorate([
    (0, common_1.Get)('top-rated'),
    (0, swagger_1.ApiOperation)({ summary: '获取高评分影视资源' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '返回数量限制' }),
    (0, swagger_1.ApiQuery)({ name: 'minRating', required: false, type: Number, description: '最低评分' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取高评分影视资源', type: [media_resource_entity_1.MediaResource] }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('minRating')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "getTopRated", null);
__decorate([
    (0, common_1.Get)('type/:type'),
    (0, swagger_1.ApiOperation)({ summary: '根据类型获取影视资源' }),
    (0, swagger_1.ApiParam)({ name: 'type', description: '影视类型' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '返回数量限制' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取指定类型的影视资源', type: [media_resource_entity_1.MediaResource] }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "getByType", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '根据ID获取影视资源详情' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取影视资源详情', type: media_resource_entity_1.MediaResource }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':id/recommendations'),
    (0, swagger_1.ApiOperation)({ summary: '获取相关推荐' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '推荐数量限制' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取相关推荐', type: [media_resource_entity_1.MediaResource] }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Patch)(':id/view'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '增加观看次数' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '观看次数增加成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "incrementViewCount", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '更新影视资源' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '影视资源更新成功', type: media_resource_entity_1.MediaResource }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_media_resource_dto_1.UpdateMediaResourceDto]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '删除影视资源' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '影视资源删除成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/soft-delete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '软删除影视资源' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '影视资源软删除成功', type: media_resource_entity_1.MediaResource }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "softDelete", null);
__decorate([
    (0, common_1.Post)(':id/favorites'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '添加影视资源到收藏' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '收藏成功' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "addToFavorites", null);
__decorate([
    (0, common_1.Delete)(':id/favorites'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '从收藏中移除影视资源' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '取消收藏成功' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "removeFromFavorites", null);
__decorate([
    (0, common_1.Get)(':id/favorites/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '检查是否已收藏影视资源' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '返回收藏状态', type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "checkFavoriteStatus", null);
__decorate([
    (0, common_1.Get)('my-favorites'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '获取用户收藏列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: '页码', default: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '每页数量', default: 10 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取收藏列表' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "getUserFavorites", null);
__decorate([
    (0, common_1.Patch)(':id/rate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '用户评分影视资源' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    (0, swagger_1.ApiQuery)({ name: 'rating', required: true, type: Number, description: '评分(0-10)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '评分成功', type: media_resource_entity_1.MediaResource }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('rating')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "rateResource", null);
__decorate([
    (0, common_1.Get)(':id/rating/stats'),
    (0, swagger_1.ApiOperation)({ summary: '获取影视资源评分统计' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取评分统计', type: Object }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "getRatingStats", null);
exports.MediaResourceController = MediaResourceController = __decorate([
    (0, swagger_1.ApiTags)('影视资源'),
    (0, common_1.Controller)('media'),
    __metadata("design:paramtypes", [media_resource_service_1.MediaResourceService])
], MediaResourceController);
//# sourceMappingURL=media-resource.controller.js.map