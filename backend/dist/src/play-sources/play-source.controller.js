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
const create_play_source_dto_1 = require("./dtos/create-play-source.dto");
const update_play_source_dto_1 = require("./dtos/update-play-source.dto");
const play_source_query_dto_1 = require("./dtos/play-source-query.dto");
const play_source_entity_1 = require("../entities/play-source.entity");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let PlaySourceController = class PlaySourceController {
    playSourceService;
    constructor(playSourceService) {
        this.playSourceService = playSourceService;
    }
    async create(createPlaySourceDto) {
        return await this.playSourceService.create(createPlaySourceDto);
    }
    async createBulk(createPlaySourceDtos) {
        return await this.playSourceService.createBulk(createPlaySourceDtos);
    }
    async findAll(queryDto) {
        return await this.playSourceService.findAll(queryDto);
    }
    async findByMediaResourceId(mediaResourceId) {
        return await this.playSourceService.findByMediaResourceId(mediaResourceId);
    }
    async getBestPlaySource(mediaResourceId) {
        return await this.playSourceService.getBestPlaySource(mediaResourceId);
    }
    async findById(id) {
        return await this.playSourceService.findById(id);
    }
    async update(id, updatePlaySourceDto) {
        return await this.playSourceService.update(id, updatePlaySourceDto);
    }
    async updateStatus(id, status) {
        return await this.playSourceService.updateStatus(id, status);
    }
    async incrementPlayCount(id) {
        await this.playSourceService.incrementPlayCount(id);
    }
    async validatePlaySource(id) {
        const isValid = await this.playSourceService.validatePlaySource(id);
        return { isValid };
    }
    async updateBulkStatus(ids, status) {
        await this.playSourceService.updateBulkStatus(ids, status);
    }
    async remove(id) {
        await this.playSourceService.remove(id);
    }
    async softDelete(id) {
        return await this.playSourceService.softDelete(id);
    }
};
exports.PlaySourceController = PlaySourceController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '创建播放源' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '播放源创建成功', type: play_source_entity_1.PlaySource }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_play_source_dto_1.CreatePlaySourceDto]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '批量创建播放源' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '播放源批量创建成功', type: [play_source_entity_1.PlaySource] }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "createBulk", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '分页查询播放源' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取播放源列表' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [play_source_query_dto_1.PlaySourceQueryDto]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('media/:mediaResourceId'),
    (0, swagger_1.ApiOperation)({ summary: '根据影视资源ID获取播放源' }),
    (0, swagger_1.ApiParam)({ name: 'mediaResourceId', description: '影视资源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取播放源列表', type: [play_source_entity_1.PlaySource] }),
    __param(0, (0, common_1.Param)('mediaResourceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "findByMediaResourceId", null);
__decorate([
    (0, common_1.Get)('media/:mediaResourceId/best'),
    (0, swagger_1.ApiOperation)({ summary: '获取影视资源的最佳播放源' }),
    (0, swagger_1.ApiParam)({ name: 'mediaResourceId', description: '影视资源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取最佳播放源', type: play_source_entity_1.PlaySource }),
    __param(0, (0, common_1.Param)('mediaResourceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "getBestPlaySource", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '根据ID获取播放源详情' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '播放源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取播放源详情', type: play_source_entity_1.PlaySource }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '更新播放源' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '播放源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '播放源更新成功', type: play_source_entity_1.PlaySource }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_play_source_dto_1.UpdatePlaySourceDto]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '更新播放源状态' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '播放源ID' }),
    (0, swagger_1.ApiQuery)({ name: 'status', description: '播放源状态' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '播放源状态更新成功', type: play_source_entity_1.PlaySource }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/play'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '增加播放次数' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '播放源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '播放次数增加成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "incrementPlayCount", null);
__decorate([
    (0, common_1.Patch)(':id/validate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '验证播放源链接有效性' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '播放源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '播放源验证结果' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "validatePlaySource", null);
__decorate([
    (0, common_1.Patch)('bulk/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '批量更新播放源状态' }),
    (0, swagger_1.ApiQuery)({ name: 'status', description: '播放源状态' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '播放源状态批量更新成功' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "updateBulkStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '删除播放源' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '播放源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '播放源删除成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/soft-delete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: '软删除播放源' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '播放源ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '播放源软删除成功', type: play_source_entity_1.PlaySource }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PlaySourceController.prototype, "softDelete", null);
exports.PlaySourceController = PlaySourceController = __decorate([
    (0, swagger_1.ApiTags)('播放源'),
    (0, common_1.Controller)('play-sources'),
    __metadata("design:paramtypes", [play_source_service_1.PlaySourceService])
], PlaySourceController);
//# sourceMappingURL=play-source.controller.js.map