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
exports.IPTVController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const iptv_service_1 = require("./iptv.service");
const create_iptv_channel_dto_1 = require("./dto/create-iptv-channel.dto");
const update_iptv_channel_dto_1 = require("./dto/update-iptv-channel.dto");
const iptv_channel_query_dto_1 = require("./dto/iptv-channel-query.dto");
const iptv_channel_entity_1 = require("../entities/iptv-channel.entity");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let IPTVController = class IPTVController {
    iptvService;
    constructor(iptvService) {
        this.iptvService = iptvService;
    }
    async create(createIPTVChannelDto) {
        return await this.iptvService.create(createIPTVChannelDto);
    }
    async findAll(queryDto) {
        return await this.iptvService.findAll(queryDto);
    }
    async findById(id) {
        return await this.iptvService.findById(id);
    }
    async update(id, updateIPTVChannelDto) {
        return await this.iptvService.update(id, updateIPTVChannelDto);
    }
    async remove(id) {
        await this.iptvService.remove(id);
    }
    async softDelete(id) {
        return await this.iptvService.softDelete(id);
    }
    async incrementViewCount(id) {
        await this.iptvService.incrementViewCount(id);
    }
    async getAllGroups() {
        return await this.iptvService.getAllGroups();
    }
    async getByGroup(group, activeOnly = true) {
        return await this.iptvService.getByGroup(group, activeOnly);
    }
    async createBulk(createIPTVChannelDtos) {
        return await this.iptvService.createBulk(createIPTVChannelDtos);
    }
    async updateBulkStatus(ids, isActive) {
        await this.iptvService.updateBulkStatus(ids, isActive);
    }
    async importFromM3U(m3uUrl) {
        return await this.iptvService.importFromM3U(m3uUrl);
    }
    async validateChannel(id) {
        const isValid = await this.iptvService.validateChannel(id);
        return { isValid };
    }
    async getStats() {
        return await this.iptvService.getStats();
    }
    async searchChannels(keyword, limit = 20) {
        return await this.iptvService.searchChannels(keyword, limit);
    }
};
exports.IPTVController = IPTVController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建IPTV频道' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'IPTV频道创建成功', type: iptv_channel_entity_1.IPTVChannel }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_iptv_channel_dto_1.CreateIPTVChannelDto]),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '分页查询IPTV频道' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [iptv_channel_query_dto_1.IPTVChannelQueryDto]),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '根据ID查找IPTV频道' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'IPTV频道ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功', type: iptv_channel_entity_1.IPTVChannel }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新IPTV频道' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'IPTV频道ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功', type: iptv_channel_entity_1.IPTVChannel }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_iptv_channel_dto_1.UpdateIPTVChannelDto]),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除IPTV频道' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'IPTV频道ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/soft-delete'),
    (0, swagger_1.ApiOperation)({ summary: '软删除IPTV频道' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'IPTV频道ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '软删除成功', type: iptv_channel_entity_1.IPTVChannel }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "softDelete", null);
__decorate([
    (0, common_1.Put)(':id/view'),
    (0, swagger_1.ApiOperation)({ summary: '增加观看次数' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'IPTV频道ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '观看次数增加成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "incrementViewCount", null);
__decorate([
    (0, common_1.Get)('groups/list'),
    (0, swagger_1.ApiOperation)({ summary: '获取所有频道分组' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "getAllGroups", null);
__decorate([
    (0, common_1.Get)('group/:group'),
    (0, swagger_1.ApiOperation)({ summary: '根据分组获取频道' }),
    (0, swagger_1.ApiParam)({ name: 'group', description: '频道分组' }),
    (0, swagger_1.ApiQuery)({ name: 'activeOnly', description: '只查询活跃频道', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('group')),
    __param(1, (0, common_1.Query)('activeOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "getByGroup", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, swagger_1.ApiOperation)({ summary: '批量创建IPTV频道' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '批量创建成功' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "createBulk", null);
__decorate([
    (0, common_1.Put)('bulk/status'),
    (0, swagger_1.ApiOperation)({ summary: '批量更新频道状态' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '批量更新成功' }),
    __param(0, (0, common_1.Body)('ids')),
    __param(1, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Boolean]),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "updateBulkStatus", null);
__decorate([
    (0, common_1.Post)('import/m3u'),
    (0, swagger_1.ApiOperation)({ summary: '导入M3U播放列表' }),
    (0, swagger_1.ApiQuery)({ name: 'm3uUrl', description: 'M3U播放列表URL' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '导入成功' }),
    __param(0, (0, common_1.Query)('m3uUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "importFromM3U", null);
__decorate([
    (0, common_1.Get)(':id/validate'),
    (0, swagger_1.ApiOperation)({ summary: '验证频道链接有效性' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'IPTV频道ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '验证成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "validateChannel", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: '获取IPTV频道统计信息' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('search/:keyword'),
    (0, swagger_1.ApiOperation)({ summary: '搜索频道' }),
    (0, swagger_1.ApiParam)({ name: 'keyword', description: '搜索关键词' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: '返回数量限制', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '搜索成功' }),
    __param(0, (0, common_1.Param)('keyword')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], IPTVController.prototype, "searchChannels", null);
exports.IPTVController = IPTVController = __decorate([
    (0, swagger_1.ApiTags)('IPTV频道管理'),
    (0, common_1.Controller)('iptv'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [iptv_service_1.IPTVService])
], IPTVController);
//# sourceMappingURL=iptv.controller.js.map