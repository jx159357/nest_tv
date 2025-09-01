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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParseProvidersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const parse_providers_service_1 = require("./parse-providers.service");
const create_parse_provider_dto_1 = require("./dtos/create-parse-provider.dto");
const update_parse_provider_dto_1 = require("./dtos/update-parse-provider.dto");
const parse_provider_query_dto_1 = require("./dtos/parse-provider-query.dto");
const parse_provider_entity_1 = require("../entities/parse-provider.entity");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let ParseProvidersController = class ParseProvidersController {
    parseProvidersService;
    constructor(parseProvidersService) {
        this.parseProvidersService = parseProvidersService;
    }
    async create(createParseProviderDto) {
        return await this.parseProvidersService.create(createParseProviderDto);
    }
    async findAll(queryDto) {
        return await this.parseProvidersService.findAll(queryDto);
    }
    async findById(id) {
        return await this.parseProvidersService.findById(id);
    }
    async update(id, updateParseProviderDto) {
        return await this.parseProvidersService.update(id, updateParseProviderDto);
    }
    async remove(id) {
        await this.parseProvidersService.remove(id);
    }
    async softDelete(id) {
        return await this.parseProvidersService.softDelete(id);
    }
    async getAllCategories() {
        return await this.parseProvidersService.getAllCategories();
    }
    async getByCategory(category, activeOnly = true) {
        return await this.parseProvidersService.getByCategory(category, activeOnly);
    }
    async createBulk(createParseProviderDtos) {
        return await this.parseProvidersService.createBulk(createParseProviderDtos);
    }
    async updateBulkStatus(ids, isActive) {
        await this.parseProvidersService.updateBulkStatus(ids, isActive);
    }
    async testProvider(id, testUrl) {
        return await this.parseProvidersService.testProvider(id, testUrl);
    }
    async parseVideoUrl(id, videoUrl) {
        return await this.parseProvidersService.parseVideoUrl(id, videoUrl);
    }
    async getBestProvider(category, supportOnlinePlay = true) {
        return await this.parseProvidersService.getBestProvider(category, supportOnlinePlay);
    }
    async resetDailyCounts() {
        await this.parseProvidersService.resetDailyCounts();
    }
    async getStats() {
        return await this.parseProvidersService.getStats();
    }
    async searchProviders(keyword, limit = 20) {
        return await this.parseProvidersService.searchProviders(keyword, limit);
    }
};
exports.ParseProvidersController = ParseProvidersController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建解析提供商' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '解析提供商创建成功', type: parse_provider_entity_1.ParseProvider }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof create_parse_provider_dto_1.CreateParseProviderDto !== "undefined" && create_parse_provider_dto_1.CreateParseProviderDto) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '分页查询解析提供商' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof parse_provider_query_dto_1.ParseProviderQueryDto !== "undefined" && parse_provider_query_dto_1.ParseProviderQueryDto) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '根据ID查找解析提供商' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '解析提供商ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功', type: parse_provider_entity_1.ParseProvider }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "findById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新解析提供商' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '解析提供商ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新成功', type: parse_provider_entity_1.ParseProvider }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, typeof (_c = typeof update_parse_provider_dto_1.UpdateParseProviderDto !== "undefined" && update_parse_provider_dto_1.UpdateParseProviderDto) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除解析提供商' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '解析提供商ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/soft-delete'),
    (0, swagger_1.ApiOperation)({ summary: '软删除解析提供商' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '解析提供商ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '软删除成功', type: parse_provider_entity_1.ParseProvider }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "softDelete", null);
__decorate([
    (0, common_1.Get)('categories/list'),
    (0, swagger_1.ApiOperation)({ summary: '获取所有分类' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "getAllCategories", null);
__decorate([
    (0, common_1.Get)('category/:category'),
    (0, swagger_1.ApiOperation)({ summary: '根据分类获取解析提供商' }),
    (0, swagger_1.ApiParam)({ name: 'category', description: '分类名称' }),
    (0, swagger_1.ApiQuery)({ name: 'activeOnly', description: '只查询活跃提供商', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('category')),
    __param(1, (0, common_1.Query)('activeOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "getByCategory", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, swagger_1.ApiOperation)({ summary: '批量创建解析提供商' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '批量创建成功' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "createBulk", null);
__decorate([
    (0, common_1.Put)('bulk/status'),
    (0, swagger_1.ApiOperation)({ summary: '批量更新解析提供商状态' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '批量更新成功' }),
    __param(0, (0, common_1.Body)('ids')),
    __param(1, (0, common_1.Body)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Boolean]),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "updateBulkStatus", null);
__decorate([
    (0, common_1.Post)(':id/test'),
    (0, swagger_1.ApiOperation)({ summary: '测试解析提供商' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '解析提供商ID' }),
    (0, swagger_1.ApiQuery)({ name: 'testUrl', description: '测试URL', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '测试成功' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('testUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "testProvider", null);
__decorate([
    (0, common_1.Post)(':id/parse'),
    (0, swagger_1.ApiOperation)({ summary: '解析视频链接' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: '解析提供商ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '解析成功' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('videoUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "parseVideoUrl", null);
__decorate([
    (0, common_1.Get)('best'),
    (0, swagger_1.ApiOperation)({ summary: '获取最佳解析提供商' }),
    (0, swagger_1.ApiQuery)({ name: 'category', description: '分类', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'supportOnlinePlay', description: '支持在线播放', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('supportOnlinePlay')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "getBestProvider", null);
__decorate([
    (0, common_1.Put)('daily/reset'),
    (0, swagger_1.ApiOperation)({ summary: '重置每日请求计数' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '重置成功' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "resetDailyCounts", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: '获取解析提供商统计信息' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('search/:keyword'),
    (0, swagger_1.ApiOperation)({ summary: '搜索解析提供商' }),
    (0, swagger_1.ApiParam)({ name: 'keyword', description: '搜索关键词' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: '返回数量限制', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '搜索成功' }),
    __param(0, (0, common_1.Param)('keyword')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], ParseProvidersController.prototype, "searchProviders", null);
exports.ParseProvidersController = ParseProvidersController = __decorate([
    (0, swagger_1.ApiTags)('解析提供商管理'),
    (0, common_1.Controller)('parse-providers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [parse_providers_service_1.ParseProvidersService])
], ParseProvidersController);
//# sourceMappingURL=parse-providers.controller.js.map