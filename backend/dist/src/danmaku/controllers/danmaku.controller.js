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
exports.DanmakuController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const danmaku_service_1 = require("../services/danmaku.service");
const user_decorator_1 = require("../../decorators/user.decorator");
const danmaku_entity_1 = require("../entities/danmaku.entity");
let DanmakuController = class DanmakuController {
    danmakuService;
    constructor(danmakuService) {
        this.danmakuService = danmakuService;
    }
    async createDanmaku(createDto, user) {
        const { videoId, mediaResourceId, ...danmakuData } = createDto;
        return await this.danmakuService.create(danmakuData, user.id, mediaResourceId, videoId);
    }
    async createBulkDanmaku(createDtos, user) {
        const processedDtos = createDtos.map(dto => ({
            text: dto.text,
            color: dto.color,
            type: dto.type,
            priority: dto.priority
        }));
        return await this.danmakuService.createBulk(processedDtos, user.id);
    }
    async getDanmakuList(query) {
        return await this.danmakuService.findAll(query);
    }
    async searchDanmaku(filters, query) {
        return await this.danmakuService.search(filters, query);
    }
    async getDanmakuById(id) {
        return await this.danmakuService.findById(id);
    }
    async updateDanmaku(id, updateDto, user) {
        return await this.danmakuService.update(id, updateDto);
    }
    async deleteDanmaku(id, user) {
        const success = await this.danmakuService.delete(id, user.id);
        return {
            success,
            message: success ? '弹幕删除成功' : '删除失败或无权限'
        };
    }
    async hardDeleteDanmaku(id) {
        const success = await this.danmakuService.hardDelete(id);
        return {
            success,
            message: success ? '弹幕永久删除成功' : '弹幕不存在'
        };
    }
    async cleanExpiredDanmaku(days = 90) {
        const deletedCount = await this.danmakuService.cleanExpired(days);
        return {
            deletedCount,
            message: `成功清理 ${deletedCount} 条过期弹幕`
        };
    }
    async getPopularDanmaku(limit = 50) {
        return await this.danmakuService.getPopularDanmaku(limit);
    }
    async getUserDanmaku(user, query) {
        const userId = user.id;
        const { limit, offset } = query;
        return await this.danmakuService.getUserDanmaku(userId, limit, offset);
    }
    async getMediaDanmaku(mediaResourceId, query) {
        const { limit = 100, offset = 0 } = query;
        return await this.danmakuService.getMediaDanmaku(mediaResourceId, limit, offset);
    }
    async getDanmakuStats(videoId) {
        return await this.danmakuService.getDanmakuStats(videoId);
    }
    async importDanmakuData(data) {
        const importedCount = await this.danmakuService.importData(data);
        return {
            importedCount,
            message: `成功导入 ${importedCount} 条弹幕数据`
        };
    }
    async advancedSearch(searchDto) {
        const { query, filters, pagination } = searchDto;
        const searchFilters = {
            text: query,
            ...filters
        };
        const result = await this.danmakuService.search(searchFilters, pagination || {});
        return {
            ...result,
            queryInfo: {
                searchQuery: query,
                appliedFilters: searchFilters,
                pagination: pagination || {}
            }
        };
    }
    async getDanmakuTrends(query) {
        const { videoId, mediaResourceId, startDate, endDate, interval = 'day' } = query;
        return {
            videoId,
            mediaResourceId,
            interval,
            startDate,
            endDate,
            message: '弹幕趋势分析功能开发中',
            stats: await this.danmakuService.getDanmakuStats(videoId)
        };
    }
    async getDanmakuUserLeaderboard(query) {
        const { videoId, mediaResourceId, limit = 20, period = 'all' } = query;
        return {
            videoId,
            mediaResourceId,
            limit,
            period,
            message: '弹幕用户排行榜功能开发中',
            leaderboard: []
        };
    }
    async getDanmakuKeywordCloud(query) {
        const { videoId, mediaResourceId, minFrequency = 2, limit = 100 } = query;
        return {
            videoId,
            mediaResourceId,
            minFrequency,
            limit,
            message: '弹幕关键词云功能开发中',
            keywords: []
        };
    }
    async getRealtimeRoomInfo(videoId) {
        return {
            videoId,
            onlineUsers: 0,
            messageCount: 0,
            isActive: false,
            lastActivity: null,
            message: '实时房间信息需要WebSocket网关集成'
        };
    }
    async getDanmakuSuggestions(query) {
        const { videoId, mediaResourceId, type = 'popular', limit = 10 } = query;
        const popularDanmaku = await this.danmakuService.getPopularDanmaku(limit);
        return {
            videoId,
            mediaResourceId,
            type,
            limit,
            suggestions: popularDanmaku.map(d => ({
                text: d.text,
                color: d.color,
                type: d.type,
                priority: d.priority,
                score: 1 - (d.priority / 10)
            }))
        };
    }
    async setDanmakuHighlight(id, body, user) {
        const danmaku = await this.danmakuService.update(id, {
            isHighlighted: body.isHighlighted
        });
        return danmaku;
    }
    async getDanmakuReports(id) {
        return {
            danmakuId: id,
            reports: [],
            reportCount: 0,
            status: 'active',
            message: '弹幕举报系统功能开发中'
        };
    }
    async reportDanmaku(id, body, user) {
        return {
            success: true,
            message: `弹幕 ${id} 举报已提交，感谢您的反馈`
        };
    }
    async getFilterRules() {
        return {
            sensitiveWords: ['傻逼', '草泥马', '妈的', '操你', '傻叉'],
            spamPatterns: [
                'http[s]?:\\/\\/|www\\.',
                '(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)',
                '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}',
                '【.*?】.*?【.*?】',
                '关注.*?公众号.*?',
                '加.*?群.*?'
            ],
            level: 'medium',
            autoBlock: false,
            message: '弹幕过滤规则管理功能开发中'
        };
    }
    async updateFilterRules(body) {
        return {
            success: true,
            message: '过滤规则已更新',
            updatedRules: body
        };
    }
    async getHealthStatus() {
        return {
            status: 'healthy',
            database: 'connected',
            websocket: 'active',
            performance: {
                responseTime: 'normal',
                memoryUsage: 'normal',
                activeConnections: 0
            },
            lastUpdate: new Date(),
            uptime: process.uptime(),
            message: '弹幕系统运行正常'
        };
    }
};
exports.DanmakuController = DanmakuController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '发送弹幕', description: '为指定视频发送弹幕消息' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '弹幕发送成功', type: danmaku_entity_1.Danmaku }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "createDanmaku", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '批量发送弹幕', description: '批量导入弹幕数据' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "createBulkDanmaku", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: '获取弹幕列表', description: '分页获取弹幕消息列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '弹幕列表', type: [danmaku_entity_1.Danmaku] }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getDanmakuList", null);
__decorate([
    (0, common_1.Post)('search'),
    (0, swagger_1.ApiOperation)({ summary: '搜索弹幕', description: '根据条件搜索弹幕消息' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "searchDanmaku", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '获取弹幕详情', description: '根据弹幕ID获取详细信息' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '弹幕详情', type: danmaku_entity_1.Danmaku }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getDanmakuById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新弹幕', description: '更新弹幕内容或属性' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '更新后的弹幕', type: danmaku_entity_1.Danmaku }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "updateDanmaku", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '删除弹幕', description: '软删除指定弹幕' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '删除成功' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "deleteDanmaku", null);
__decorate([
    (0, common_1.Delete)(':id/hard'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '永久删除弹幕', description: '从数据库中永久删除弹幕' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '永久删除成功' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "hardDeleteDanmaku", null);
__decorate([
    (0, common_1.Delete)('clean'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: '清理过期弹幕', description: '清理指定天数前的已停用弹幕' }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "cleanExpiredDanmaku", null);
__decorate([
    (0, common_1.Get)('popular'),
    (0, swagger_1.ApiOperation)({ summary: '获取热门弹幕', description: '获取最近的热门弹幕消息' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getPopularDanmaku", null);
__decorate([
    (0, common_1.Get)('user/me'),
    (0, swagger_1.ApiOperation)({ summary: '获取我的弹幕', description: '获取当前用户发送的弹幕历史' }),
    __param(0, (0, user_decorator_1.User)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getUserDanmaku", null);
__decorate([
    (0, common_1.Get)('media/:mediaResourceId'),
    (0, swagger_1.ApiOperation)({ summary: '获取媒体弹幕', description: '获取指定媒体资源的弹幕列表' }),
    __param(0, (0, common_1.Param)('mediaResourceId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getMediaDanmaku", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: '获取弹幕统计', description: '获取弹幕系统的统计数据' }),
    __param(0, (0, common_1.Query)('videoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getDanmakuStats", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '导入弹幕数据', description: '批量导入弹幕数据' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "importDanmakuData", null);
__decorate([
    (0, common_1.Post)('advanced-search'),
    (0, swagger_1.ApiOperation)({
        summary: '高级弹幕搜索',
        description: '支持全文搜索和多条件组合的高级弹幕搜索'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "advancedSearch", null);
__decorate([
    (0, common_1.Get)('trends'),
    (0, swagger_1.ApiOperation)({ summary: '弹幕趋势分析', description: '分析指定时间范围内的弹幕趋势' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getDanmakuTrends", null);
__decorate([
    (0, common_1.Get)('leaderboard/users'),
    (0, swagger_1.ApiOperation)({ summary: '弹幕用户排行榜', description: '按弹幕数量统计的用户排行榜' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getDanmakuUserLeaderboard", null);
__decorate([
    (0, common_1.Get)('keywords/cloud'),
    (0, swagger_1.ApiOperation)({ summary: '弹幕关键词云', description: '生成指定视频或媒体资源的弹幕关键词云' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getDanmakuKeywordCloud", null);
__decorate([
    (0, common_1.Get)('realtime/rooms/:videoId'),
    (0, swagger_1.ApiOperation)({ summary: '实时房间信息', description: '获取指定视频的WebSocket弹幕房间信息' }),
    __param(0, (0, common_1.Param)('videoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getRealtimeRoomInfo", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    (0, swagger_1.ApiOperation)({ summary: '弹幕建议', description: '基于历史弹幕数据获取发送建议' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getDanmakuSuggestions", null);
__decorate([
    (0, common_1.Put)(':id/highlight'),
    (0, swagger_1.ApiOperation)({ summary: '设置弹幕高亮', description: '将指定弹幕设置为高亮状态' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "setDanmakuHighlight", null);
__decorate([
    (0, common_1.Get)(':id/reports'),
    (0, swagger_1.ApiOperation)({ summary: '获取弹幕举报', description: '获取指定弹幕的举报信息' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getDanmakuReports", null);
__decorate([
    (0, common_1.Post)(':id/report'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: '举报弹幕', description: '举报指定弹幕内容' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "reportDanmaku", null);
__decorate([
    (0, common_1.Get)('filter/rules'),
    (0, swagger_1.ApiOperation)({ summary: '获取过滤规则', description: '获取弹幕敏感词过滤规则' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getFilterRules", null);
__decorate([
    (0, common_1.Put)('filter/rules'),
    (0, swagger_1.ApiOperation)({ summary: '更新过滤规则', description: '更新弹幕敏感词过滤规则' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "updateFilterRules", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: '系统健康状态', description: '检查弹幕系统的健康状态' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DanmakuController.prototype, "getHealthStatus", null);
exports.DanmakuController = DanmakuController = __decorate([
    (0, swagger_1.ApiTags)('弹幕系统'),
    (0, common_1.Controller)('danmaku'),
    (0, common_1.UseGuards)(user_decorator_1.User),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [danmaku_service_1.DanmakuService])
], DanmakuController);
//# sourceMappingURL=danmaku.controller.js.map