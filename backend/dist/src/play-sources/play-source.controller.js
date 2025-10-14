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
exports.PlaySourceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const play_source_service_1 = require("./play-source.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const play_source_dto_1 = require("./dtos/play-source.dto");
const play_source_query_dto_1 = require("./dtos/play-source-query.dto");
let PlaySourceController = class PlaySourceController {
    playSourceService;
    constructor(playSourceService) {
        this.playSourceService = playSourceService;
    }
    async findAll(queryDto) {
        return this.playSourceService.findAll(queryDto);
    }
    async findById(id) {
        return this.playSourceService.findById(id);
    }
    async create(createPlaySourceDto) {
        return this.playSourceService.create(createPlaySourceDto);
    }
    async update(id, updatePlaySourceDto) {
        return this.playSourceService.update(id, updatePlaySourceDto);
    }
    async remove(id) {
        await this.playSourceService.remove(id);
        return { message: '删除成功' };
    }
    async validate(id) {
        return this.playSourceService.validate(id);
    }
    async getBestPlaySource(mediaId) {
        return this.playSourceService.getBestPlaySource(mediaId);
    }
    async getByMediaResource(mediaId) {
        return this.playSourceService.getByMediaResource(mediaId);
    }
};
exports.PlaySourceController = PlaySourceController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: '获取播放源列表',
        description: '支持分页、搜索、类型筛选、质量筛选、状态筛选等多种条件的播放源列表查询',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '获取成功',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'number', example: 1 },
                            url: { type: 'string', example: 'https://example.com/video.mp4' },
                            quality: { type: 'string', example: '1080p' },
                            type: { type: 'string', example: 'online' },
                            isActive: { type: 'boolean', example: true },
                            mediaResourceId: { type: 'number', example: 1 },
                            priority: { type: 'number', example: 1 },
                        },
                    },
                },
                page: { type: 'number', example: 1 },
                pageSize: { type: 'number', example: 10 },
                total: { type: 'number', example: 50 },
                totalPages: { type: 'number', example: 5 },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '请求参数错误',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: { type: 'string', example: 'Validation failed' },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: '未授权访问',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 401 },
                message: { type: 'string', example: 'Unauthorized' },
            },
        },
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', description: '页码，从1开始', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'pageSize', description: '每页数量，默认10条，最大100条', example: 10 }),
    (0, swagger_1.ApiQuery)({ name: 'search', description: '搜索关键词，支持URL和描述模糊搜索', required: false }),
    (0, swagger_1.ApiQuery)({
        name: 'type',
        description: '播放源类型',
        example: 'online',
        enum: ['online', 'local', 'torrent', 'm3u8'],
    }),
    (0, swagger_1.ApiQuery)({
        name: 'quality',
        description: '视频质量',
        example: '1080p',
        enum: ['4K', '1080p', '720p', '480p', '360p'],
    }),
    (0, swagger_1.ApiQuery)({ name: 'isActive', description: '是否激活', example: true, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'mediaResourceId', description: '媒体资源ID', example: 1, required: false }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [play_source_query_dto_1.PlaySourceQueryDto]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: '根据ID获取播放源',
        description: '通过ID获取单个播放源的详细信息',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '获取成功',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'number', example: 1 },
                url: { type: 'string', example: 'https://example.com/video.mp4' },
                quality: { type: 'string', example: '1080p' },
                type: { type: 'string', example: 'online' },
                isActive: { type: 'boolean', example: true },
                mediaResourceId: { type: 'number', example: 1 },
                priority: { type: 'number', example: 1 },
                size: { type: 'string', example: '2.5GB' },
                language: { type: 'string', example: '中文' },
                subtitle: { type: 'string', example: 'https://example.com/subtitle.srt' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: '播放源不存在',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 404 },
                message: { type: 'string', example: 'Play source with ID 1 not found' },
                error: { type: 'string', example: 'Not Found' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: '未授权访问',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 401 },
                message: { type: 'string', example: 'Unauthorized' },
            },
        },
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: '播放源ID，正整数',
        example: 1,
        required: true,
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建播放源' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '创建成功' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '参数错误' }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [play_source_dto_1.CreatePlaySourceDto]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新播放源' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '播放源不存在' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '播放源ID' }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, play_source_dto_1.UpdatePlaySourceDto]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除播放源' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '播放源不存在' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '播放源ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/validate'),
    (0, swagger_1.ApiOperation)({ summary: '验证播放源有效性' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '验证成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '播放源不存在' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '播放源ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "validate", null);
__decorate([
    (0, common_1.Get)('media/:mediaId/best'),
    (0, swagger_1.ApiOperation)({ summary: '获取媒体资源的最佳播放源' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '播放源不存在' }),
    (0, swagger_1.ApiParam)({ name: 'mediaId', description: '媒体资源ID' }),
    __param(0, (0, common_1.Param)('mediaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "getBestPlaySource", null);
__decorate([
    (0, common_1.Get)('media/:mediaId'),
    (0, swagger_1.ApiOperation)({ summary: '获取媒体资源的播放源列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiParam)({ name: 'mediaId', description: '媒体资源ID' }),
    __param(0, (0, common_1.Param)('mediaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "getByMediaResource", null);
exports.PlaySourceController = PlaySourceController = __decorate([
    (0, swagger_1.ApiTags)('播放源管理'),
    (0, common_1.Controller)('play-sources'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [play_source_service_1.PlaySourceService])
], PlaySourceController);
//# sourceMappingURL=play-source.controller.js.map