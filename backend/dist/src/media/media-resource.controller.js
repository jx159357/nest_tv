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
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const rate_limit_guard_1 = require("../common/guards/rate-limit.guard");
const create_media_resource_dto_1 = require("./dtos/create-media-resource.dto");
const update_media_resource_dto_1 = require("./dtos/update-media-resource.dto");
const media_resource_response_dto_1 = require("./dtos/media-resource-response.dto");
let MediaResourceController = class MediaResourceController {
    mediaResourceService;
    constructor(mediaResourceService) {
        this.mediaResourceService = mediaResourceService;
    }
    async findAll(page = 1, pageSize = 10, search, type, quality, minRating, maxRating, tags, startDate, endDate) {
        const queryDto = {
            page,
            pageSize,
            search,
            type: type,
            quality: quality,
            minRating,
            maxRating,
            tags: tags ? tags : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        };
        return this.mediaResourceService.findAll(queryDto);
    }
    async findById(id) {
        return this.mediaResourceService.findById(id);
    }
    async create(createMediaResourceDto) {
        return this.mediaResourceService.create(createMediaResourceDto);
    }
    async update(id, updateMediaResourceDto) {
        return this.mediaResourceService.update(id, updateMediaResourceDto);
    }
    async remove(id) {
        await this.mediaResourceService.remove(id);
        return {
            statusCode: 200,
            message: 'Media resource deleted successfully',
            timestamp: new Date().toISOString(),
        };
    }
    async search(keyword, limit = 10) {
        return this.mediaResourceService.search(keyword, limit);
    }
    async getPopular(limit = 20) {
        return this.mediaResourceService.getPopular(limit);
    }
    async getLatest(limit = 20) {
        return this.mediaResourceService.getLatest(limit);
    }
    async getSimilar(id, limit = 6) {
        return this.mediaResourceService.getSimilar(id, limit);
    }
    async incrementViews(id) {
        await this.mediaResourceService.incrementViews(id);
        return { message: '增加观看次数成功' };
    }
    async incrementLikes(id) {
        await this.mediaResourceService.incrementLikes(id);
        return { message: '增加点赞数成功' };
    }
    async decrementLikes(id) {
        await this.mediaResourceService.decrementLikes(id);
        return { message: '减少点赞数成功' };
    }
    async getStatistics() {
        return this.mediaResourceService.getStatistics();
    }
};
exports.MediaResourceController = MediaResourceController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '获取影视资源列表',
        description: '支持分页、搜索、分类筛选、评分范围、日期范围等多种筛选条件的影视资源列表查询',
    }),
    (0, rate_limit_guard_1.RateLimit)({
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', description: '页码，从1开始', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', description: '每页数量，默认10条，最大100条', example: 10 }),
    (0, swagger_1.ApiQuery)({ name: 'search', description: '搜索关键词，支持标题和描述模糊搜索', required: false }),
    (0, swagger_1.ApiQuery)({
        name: 'type',
        description: '影视类型',
        example: 'movie',
        enum: ['movie', 'tv', 'variety', 'documentary'],
    }),
    (0, swagger_1.ApiQuery)({
        name: 'quality',
        description: '视频质量',
        example: '1080p',
        enum: ['1080p', '720p', '480p', '360p'],
    }),
    (0, swagger_1.ApiQuery)({ name: 'minRating', description: '最低评分', example: 6.0, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'maxRating', description: '最高评分', example: 10.0, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'tags', description: '影视标签，多个标签用逗号分隔', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', description: '开始日期，格式：YYYY-MM-DD', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', description: '结束日期，格式：YYYY-MM-DD', required: false }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '获取成功',
        type: media_resource_response_dto_1.MediaListResponseDto,
        example: {
            data: [
                {
                    id: 1,
                    title: '复仇者联盟4',
                    description: '经典的超级英雄电影',
                    type: 'movie',
                    quality: '1080p',
                    rating: 8.7,
                    tags: ['动作', '科幻'],
                    coverUrl: 'https://example.com/cover.jpg',
                    playUrl: 'https://example.com/video.mp4',
                    duration: 8820,
                    isActive: true,
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z',
                },
            ],
            page: 1,
            pageSize: 10,
            total: 100,
            totalPages: 10,
            hasNext: true,
            hasPrevious: false,
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '请求参数错误',
        type: media_resource_response_dto_1.ErrorResponse,
        example: {
            statusCode: 400,
            message: 'Validation failed',
            errors: ['page must be greater than 0', 'pageSize must not be greater than 100'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权', type: media_resource_response_dto_1.ErrorResponse }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('quality')),
    __param(5, (0, common_1.Query)('minRating')),
    __param(6, (0, common_1.Query)('maxRating')),
    __param(7, (0, common_1.Query)('tags')),
    __param(8, (0, common_1.Query)('startDate')),
    __param(9, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '根据ID获取影视资源',
        description: '通过ID获取单个影视资源的详细信息，包括推荐和相关播放源',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: '影视资源ID，正整数',
        example: 1,
        required: true,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '获取成功',
        type: media_resource_response_dto_1.MediaDetailResponseDto,
        example: {
            data: {
                id: 1,
                title: '复仇者联盟4',
                description: '经典的超级英雄电影',
                type: 'movie',
                quality: '1080p',
                rating: 8.7,
                tags: ['动作', '科幻'],
                coverUrl: 'https://example.com/cover.jpg',
                playUrl: 'https://example.com/video.mp4',
                duration: 8820,
                isActive: true,
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
            },
            recommendations: [
                {
                    id: 2,
                    title: '复仇者联盟3',
                    type: 'movie',
                    coverUrl: 'https://example.com/cover2.jpg',
                },
            ],
            playSources: [
                {
                    quality: '1080p',
                    url: 'https://example.com/video1080.mp4',
                    size: '2.5GB',
                },
            ],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '影视资源不存在',
        type: media_resource_response_dto_1.ErrorResponse,
        example: {
            statusCode: 404,
            message: 'Media resource with ID 1 not found',
            timestamp: '2024-01-01T00:00:00.000Z',
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权', type: media_resource_response_dto_1.ErrorResponse }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: '创建影视资源',
        description: '创建新的影视资源，支持标题、描述、类型、封面等信息',
    }),
    (0, swagger_1.ApiBody)({
        description: '创建影视资源请求体',
        type: create_media_resource_dto_1.CreateMediaResourceDto,
        examples: {
            movie: {
                summary: '电影创建示例',
                value: {
                    title: '复仇者联盟4',
                    description: '经典的超级英雄电影',
                    type: 'movie',
                    quality: '1080p',
                    tags: ['动作', '科幻'],
                    coverUrl: 'https://example.com/cover.jpg',
                    playUrl: 'https://example.com/video.mp4',
                    duration: 8820,
                    rating: 8.7,
                    isActive: true,
                },
            },
            tv: {
                summary: '电视剧创建示例',
                value: {
                    title: '权力的游戏',
                    description: '史诗奇幻电视剧',
                    type: 'tv',
                    quality: '1080p',
                    tags: ['奇幻', '冒险'],
                    coverUrl: 'https://example.com/got-cover.jpg',
                    playUrl: 'https://example.com/got-video.mp4',
                    duration: 3600,
                    rating: 9.2,
                    isActive: true,
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '创建成功',
        type: media_resource_response_dto_1.MediaDetailResponseDto,
        example: {
            data: {
                id: 101,
                title: '复仇者联盟4',
                description: '经典的超级英雄电影',
                type: 'movie',
                quality: '1080p',
                rating: 8.7,
                tags: ['动作', '科幻'],
                coverUrl: 'https://example.com/cover.jpg',
                playUrl: 'https://example.com/video.mp4',
                duration: 8820,
                isActive: true,
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
            },
            recommendations: [],
            playSources: [],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '参数验证失败',
        type: media_resource_response_dto_1.ErrorResponse,
        example: {
            statusCode: 400,
            message: 'Validation failed',
            errors: ['title is required', 'type must be valid', 'coverUrl must be a valid URL'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权', type: media_resource_response_dto_1.ErrorResponse }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '权限不足', type: media_resource_response_dto_1.ErrorResponse }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_media_resource_dto_1.CreateMediaResourceDto]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '更新影视资源',
        description: '根据ID更新影视资源信息，支持部分更新',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: '要更新的影视资源ID',
        example: 1,
        required: true,
    }),
    (0, swagger_1.ApiBody)({
        description: '更新影视资源请求体',
        type: update_media_resource_dto_1.UpdateMediaResourceDto,
        examples: {
            partial_update: {
                summary: '部分更新示例',
                value: {
                    title: '复仇者联盟4：终极版',
                    description: '更新后的电影描述',
                    quality: '4K',
                    tags: ['动作', '科幻', '终极版'],
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '更新成功',
        type: media_resource_response_dto_1.MediaDetailResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '影视资源不存在',
        type: media_resource_response_dto_1.ErrorResponse,
        example: {
            statusCode: 404,
            message: 'Media resource with ID 1 not found',
            timestamp: '2024-01-01T00:00:00.000Z',
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '参数验证失败',
        type: media_resource_response_dto_1.ErrorResponse,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: '未授权',
        type: media_resource_response_dto_1.ErrorResponse,
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: '权限不足',
        type: media_resource_response_dto_1.ErrorResponse,
    }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_media_resource_dto_1.UpdateMediaResourceDto]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '删除影视资源',
        description: '根据ID删除指定的影视资源，删除后无法恢复',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: '要删除的影视资源ID',
        example: 1,
        required: true,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '删除成功',
        example: {
            statusCode: 200,
            message: 'Media resource deleted successfully',
            timestamp: '2024-01-01T00:00:00.000Z',
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '影视资源不存在',
        type: media_resource_response_dto_1.ErrorResponse,
        example: {
            statusCode: 404,
            message: 'Media resource with ID 1 not found',
            timestamp: '2024-01-01T00:00:00.000Z',
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权', type: media_resource_response_dto_1.ErrorResponse }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '权限不足', type: media_resource_response_dto_1.ErrorResponse }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: '搜索影视资源' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '搜索成功' }),
    (0, swagger_1.ApiQuery)({ name: 'keyword', description: '搜索关键词' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: '限制数量', required: false }),
    __param(0, (0, common_1.Query)('keyword')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('popular'),
    (0, swagger_1.ApiOperation)({ summary: '获取热门影视' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: '限制数量', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "getPopular", null);
__decorate([
    (0, common_1.Get)('latest'),
    (0, swagger_1.ApiOperation)({ summary: '获取最新影视' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: '限制数量', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "getLatest", null);
__decorate([
    (0, common_1.Get)(':id/similar'),
    (0, swagger_1.ApiOperation)({ summary: '获取相似影视' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '影视资源不存在' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: '限制数量', required: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "getSimilar", null);
__decorate([
    (0, common_1.Put)(':id/views'),
    (0, swagger_1.ApiOperation)({ summary: '增加观看次数' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '增加成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '影视资源不存在' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "incrementViews", null);
__decorate([
    (0, common_1.Put)(':id/likes'),
    (0, swagger_1.ApiOperation)({ summary: '增加点赞数' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '增加成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '影视资源不存在' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "incrementLikes", null);
__decorate([
    (0, common_1.Put)(':id/unlikes'),
    (0, swagger_1.ApiOperation)({ summary: '减少点赞数' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '减少成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '影视资源不存在' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '影视资源ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "decrementLikes", null);
__decorate([
    (0, common_1.Get)('statistics'),
    (0, swagger_1.ApiOperation)({ summary: '获取影视统计信息' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MediaResourceController.prototype, "getStatistics", null);
exports.MediaResourceController = MediaResourceController = __decorate([
    (0, swagger_1.ApiTags)('影视资源管理'),
    (0, common_1.Controller)('media'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rate_limit_guard_1.RateLimitGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [media_resource_service_1.MediaResourceService])
], MediaResourceController);
//# sourceMappingURL=media-resource.controller.js.map