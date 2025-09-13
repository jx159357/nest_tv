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
let PlaySourceController = class PlaySourceController {
    playSourceService;
    constructor(playSourceService) {
        this.playSourceService = playSourceService;
    }
    async findAll(page = 1, pageSize = 10, mediaResourceId, type, status) {
        const queryDto = {
            page,
            pageSize,
            mediaResourceId,
            type,
            status,
        };
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
    (0, swagger_1.ApiOperation)({ summary: '获取播放源列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('mediaResourceId')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '根据ID获取播放源' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '播放源不存在' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '播放源ID' }),
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
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新播放源' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '播放源不存在' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '播放源ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
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