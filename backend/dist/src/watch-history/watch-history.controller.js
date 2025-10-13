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
exports.WatchHistoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const watch_history_service_1 = require("./watch-history.service");
const create_watch_history_dto_1 = require("./dtos/create-watch-history.dto");
const update_watch_history_dto_1 = require("./dtos/update-watch-history.dto");
const watch_history_query_dto_1 = require("./dtos/watch-history-query.dto");
const watch_history_entity_1 = require("../entities/watch-history.entity");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
let WatchHistoryController = class WatchHistoryController {
    watchHistoryService;
    constructor(watchHistoryService) {
        this.watchHistoryService = watchHistoryService;
    }
    async create(userId, createWatchHistoryDto) {
        const dtoWithUserId = {
            ...createWatchHistoryDto,
            userId,
        };
        return await this.watchHistoryService.create(dtoWithUserId);
    }
    async findAll(queryDto) {
        return await this.watchHistoryService.findAll(queryDto);
    }
    async findMyHistory(userId, page = 1, limit = 10) {
        return await this.watchHistoryService.findByUserId(userId, page, limit);
    }
    async getMyContinueWatching(userId, limit = 10) {
        return await this.watchHistoryService.getContinueWatching(userId, limit);
    }
    async getMyCompleted(userId, page = 1, limit = 10) {
        return await this.watchHistoryService.getCompleted(userId, page, limit);
    }
    async getMyStats(userId) {
        return await this.watchHistoryService.getUserStats(userId);
    }
    async findById(id) {
        return await this.watchHistoryService.findById(id);
    }
    async findByUserAndMedia(userId, mediaResourceId) {
        return await this.watchHistoryService.findByUserAndMedia(userId, mediaResourceId);
    }
    async updateProgress(userId, mediaResourceId, currentTime, duration) {
        return await this.watchHistoryService.updateProgress(userId, mediaResourceId, currentTime, duration);
    }
    async update(id, updateWatchHistoryDto) {
        return await this.watchHistoryService.update(id, updateWatchHistoryDto);
    }
    async markAsCompleted(id) {
        return await this.watchHistoryService.markAsCompleted(id);
    }
    async remove(id) {
        await this.watchHistoryService.remove(id);
    }
    async clearMyHistory(userId) {
        await this.watchHistoryService.clearUserHistory(userId);
    }
};
exports.WatchHistoryController = WatchHistoryController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({
        summary: '创建或更新观看历史',
        description: '创建新的观看历史记录，如果已存在则更新进度信息',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: '观看历史创建成功',
        schema: {
            type: 'object',
            properties: {
                id: { type: 'number', example: 1 },
                userId: { type: 'number', example: 1 },
                mediaResourceId: { type: 'number', example: 1 },
                currentTime: { type: 'number', example: 1200 },
                duration: { type: 'number', example: 3600 },
                isCompleted: { type: 'boolean', example: false },
                lastWatchedAt: { type: 'string', format: 'date-time' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: '参数验证失败',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: { type: 'string', example: 'Validation failed' },
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
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, current_user_decorator_1.GetCurrentUserId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_watch_history_dto_1.CreateWatchHistoryDto]),
    __metadata("design:returntype", Promise)
], WatchHistoryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '分页查询观看历史' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取观看历史列表' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [watch_history_query_dto_1.WatchHistoryQueryDto]),
    __metadata("design:returntype", Promise)
], WatchHistoryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('user/me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '获取当前用户观看历史' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: '页码' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '每页数量' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取用户观看历史' }),
    __param(0, (0, current_user_decorator_1.GetCurrentUserId)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], WatchHistoryController.prototype, "findMyHistory", null);
__decorate([
    (0, common_1.Get)('user/me/continue'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '获取当前用户继续观看列表' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '返回数量限制' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取继续观看列表', type: [watch_history_entity_1.WatchHistory] }),
    __param(0, (0, current_user_decorator_1.GetCurrentUserId)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], WatchHistoryController.prototype, "getMyContinueWatching", null);
__decorate([
    (0, common_1.Get)('user/me/completed'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '获取当前用户已看完的影视' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: '页码' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '每页数量' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取已看完的影视列表' }),
    __param(0, (0, current_user_decorator_1.GetCurrentUserId)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], WatchHistoryController.prototype, "getMyCompleted", null);
__decorate([
    (0, common_1.Get)('user/me/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '获取当前用户观看统计' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取用户观看统计' }),
    __param(0, (0, current_user_decorator_1.GetCurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WatchHistoryController.prototype, "getMyStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '根据ID获取观看历史详情' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '观看历史ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取观看历史详情', type: watch_history_entity_1.WatchHistory }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WatchHistoryController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('user/:userId/media/:mediaResourceId'),
    (0, swagger_1.ApiOperation)({ summary: '根据用户ID和影视资源ID获取观看历史' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: '用户ID' }),
    (0, swagger_1.ApiParam)({ name: 'mediaResourceId', description: '影视资源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取观看历史', type: watch_history_entity_1.WatchHistory }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('mediaResourceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], WatchHistoryController.prototype, "findByUserAndMedia", null);
__decorate([
    (0, common_1.Patch)('progress'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '更新观看进度' }),
    (0, swagger_1.ApiQuery)({ name: 'mediaResourceId', description: '影视资源ID' }),
    (0, swagger_1.ApiQuery)({ name: 'currentTime', description: '当前观看时间（秒）' }),
    (0, swagger_1.ApiQuery)({ name: 'duration', required: false, description: '总时长（秒）' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '观看进度更新成功', type: watch_history_entity_1.WatchHistory }),
    __param(0, (0, current_user_decorator_1.GetCurrentUserId)()),
    __param(1, (0, common_1.Query)('mediaResourceId')),
    __param(2, (0, common_1.Query)('currentTime')),
    __param(3, (0, common_1.Query)('duration')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], WatchHistoryController.prototype, "updateProgress", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '更新观看历史' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '观看历史ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '观看历史更新成功', type: watch_history_entity_1.WatchHistory }),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_watch_history_dto_1.UpdateWatchHistoryDto]),
    __metadata("design:returntype", Promise)
], WatchHistoryController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '标记为已看完' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '观看历史ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '标记完成成功', type: watch_history_entity_1.WatchHistory }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WatchHistoryController.prototype, "markAsCompleted", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '删除观看历史' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '观看历史ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '观看历史删除成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WatchHistoryController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)('user/me/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '清空当前用户观看历史' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '用户观看历史清空成功' }),
    __param(0, (0, current_user_decorator_1.GetCurrentUserId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WatchHistoryController.prototype, "clearMyHistory", null);
exports.WatchHistoryController = WatchHistoryController = __decorate([
    (0, swagger_1.ApiTags)('观看历史'),
    (0, common_1.Controller)('watch-history'),
    __metadata("design:paramtypes", [watch_history_service_1.WatchHistoryService])
], WatchHistoryController);
//# sourceMappingURL=watch-history.controller.js.map