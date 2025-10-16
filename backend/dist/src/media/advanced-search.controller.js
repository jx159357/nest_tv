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
exports.AdvancedSearchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const advanced_search_service_1 = require("./advanced-search.service");
let AdvancedSearchController = class AdvancedSearchController {
    advancedSearchService;
    constructor(advancedSearchService) {
        this.advancedSearchService = advancedSearchService;
    }
    async advancedSearch(req, searchParams) {
        try {
            const userId = req.user.userId;
            return await this.advancedSearchService.advancedSearch(searchParams, userId);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '搜索失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSearchSuggestions(keyword, limit) {
        try {
            const parsedLimit = limit ? parseInt(limit, 10) : 8;
            return await this.advancedSearchService.getSearchSuggestions(keyword, parsedLimit);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取搜索建议失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPopularKeywords(limit) {
        try {
            const parsedLimit = limit ? parseInt(limit, 10) : 20;
            return await this.advancedSearchService.getPopularSearchKeywords(parsedLimit);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取热门搜索关键词失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserSearchHistory(req, limit) {
        try {
            const userId = req.user.userId;
            const parsedLimit = limit ? parseInt(limit, 10) : 10;
            return await this.advancedSearchService.getUserSearchHistory(userId, parsedLimit);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取搜索历史失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async clearUserSearchHistory(req) {
        try {
            const userId = req.user.userId;
            await this.advancedSearchService.clearUserSearchHistory(userId);
            return { message: '搜索历史清除成功' };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '清除搜索历史失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getRelatedKeywords(keyword, limit) {
        try {
            const parsedLimit = limit ? parseInt(limit, 10) : 5;
            return await this.advancedSearchService.getRelatedKeywords(keyword, parsedLimit);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取相关关键词失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSearchTrends(days) {
        try {
            const parsedDays = days ? parseInt(days, 10) : 7;
            return {
                totalSearches: 1250,
                dailyTrends: [
                    { date: '2024-09-11', count: 180, topKeywords: ['复仇者联盟', '阿凡达', '黑豹'] },
                    { date: '2024-09-10', count: 165, topKeywords: ['雷神4', '蜘蛛侠', '奥本海默'] },
                    { date: '2024-09-09', count: 152, topKeywords: ['沙丘', '敦刻尔克', '星际穿越'] },
                ],
                popularKeywords: [
                    { keyword: '复仇者联盟', count: 45 },
                    { keyword: '阿凡达', count: 38 },
                    { keyword: '雷神4', count: 32 },
                    { keyword: '黑豹', count: 28 },
                    { keyword: '蜘蛛侠', count: 25 },
                ],
            };
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取搜索趋势失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async smartSearch(query, req, body) {
        try {
            const userId = body?.userId || req.user?.userId;
            const searchParams = this.parseSmartSearchQuery(query);
            return await this.advancedSearchService.advancedSearch(searchParams, userId);
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '智能搜索失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getFilterPresets() {
        try {
            return [
                {
                    id: 'recent-movies',
                    name: '最新电影',
                    description: '最近上映的高评分电影',
                    filters: {
                        type: ['movie'],
                        minRating: 7.0,
                        sortBy: 'date',
                        sortOrder: 'DESC',
                    },
                },
                {
                    id: 'popular-tv',
                    name: '热播电视剧',
                    description: '最受欢迎的电视剧',
                    filters: {
                        type: ['tv_series'],
                        sortBy: 'views',
                        sortOrder: 'DESC',
                    },
                },
                {
                    id: 'high-rated',
                    name: '高评分作品',
                    description: '评分8.0以上的优质内容',
                    filters: {
                        minRating: 8.0,
                        sortBy: 'rating',
                        sortOrder: 'DESC',
                    },
                },
                {
                    id: 'action-movies',
                    name: '动作电影',
                    description: '动作类型的电影',
                    filters: {
                        type: ['movie'],
                        genres: ['动作'],
                        sortBy: 'rating',
                        sortOrder: 'DESC',
                    },
                },
                {
                    id: 'latest-anime',
                    name: '新番动漫',
                    description: '最新发布的动漫',
                    filters: {
                        type: ['anime'],
                        sortBy: 'date',
                        sortOrder: 'DESC',
                    },
                },
            ];
        }
        catch (error) {
            throw new common_1.HttpException(error.message || '获取搜索过滤器预设失败', error.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    parseSmartSearchQuery(query) {
        const searchParams = {
            sortBy: 'relevance',
            sortOrder: 'DESC',
            page: 1,
            pageSize: 20,
        };
        const lowerQuery = query.toLowerCase();
        const yearMatch = lowerQuery.match(/(19|20)\d{2}/);
        if (yearMatch) {
            const year = parseInt(yearMatch[0]);
            searchParams.minYear = year;
            searchParams.maxYear = year;
            searchParams.keyword = query.replace(yearMatch[0], '').trim();
        }
        const ratingMatch = lowerQuery.match(/(\d+(?:\.\d+)?)\s*分以上?/);
        if (ratingMatch) {
            searchParams.minRating = parseFloat(ratingMatch[1]);
            searchParams.keyword = query.replace(ratingMatch[0], '').trim();
        }
        if (lowerQuery.includes('电影') || lowerQuery.includes('movie')) {
            searchParams.type = ['movie'];
        }
        if (lowerQuery.includes('电视剧') || lowerQuery.includes('剧') || lowerQuery.includes('tv')) {
            searchParams.type = ['tv_series'];
        }
        if (lowerQuery.includes('动漫') || lowerQuery.includes('动画')) {
            searchParams.type = ['anime'];
        }
        if (lowerQuery.includes('综艺')) {
            searchParams.type = ['variety'];
        }
        if (lowerQuery.includes('纪录片')) {
            searchParams.type = ['documentary'];
        }
        if (lowerQuery.includes('高清') || lowerQuery.includes('hd')) {
            searchParams.quality = ['hd', 'full_hd'];
        }
        if (lowerQuery.includes('蓝光') || lowerQuery.includes('蓝光')) {
            searchParams.quality = ['blue_ray'];
        }
        if (lowerQuery.includes('4k')) {
            searchParams.quality = ['full_hd'];
        }
        if (!searchParams.keyword) {
            searchParams.keyword = query;
        }
        return searchParams;
    }
};
exports.AdvancedSearchController = AdvancedSearchController;
__decorate([
    (0, common_1.Post)('advanced'),
    (0, swagger_1.ApiOperation)({ summary: '执行高级搜索' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '搜索成功' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '参数错误' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdvancedSearchController.prototype, "advancedSearch", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    (0, swagger_1.ApiOperation)({ summary: '获取搜索建议' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiQuery)({ name: 'keyword', description: '搜索关键词' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: '返回数量限制，默认8', required: false }),
    __param(0, (0, common_1.Query)('keyword')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdvancedSearchController.prototype, "getSearchSuggestions", null);
__decorate([
    (0, common_1.Get)('popular-keywords'),
    (0, swagger_1.ApiOperation)({ summary: '获取热门搜索关键词' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: '返回数量限制，默认20', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdvancedSearchController.prototype, "getPopularKeywords", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: '获取用户搜索历史' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: '返回数量限制，默认10', required: false }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdvancedSearchController.prototype, "getUserSearchHistory", null);
__decorate([
    (0, common_1.Delete)('history'),
    (0, swagger_1.ApiOperation)({ summary: '清除用户搜索历史' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '清除成功' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdvancedSearchController.prototype, "clearUserSearchHistory", null);
__decorate([
    (0, common_1.Get)('related-keywords/:keyword'),
    (0, swagger_1.ApiOperation)({ summary: '获取相关关键词' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiParam)({ name: 'keyword', description: '基础关键词' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', description: '返回数量限制，默认5', required: false }),
    __param(0, (0, common_1.Param)('keyword')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdvancedSearchController.prototype, "getRelatedKeywords", null);
__decorate([
    (0, common_1.Get)('trends'),
    (0, swagger_1.ApiOperation)({ summary: '获取搜索趋势统计' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiQuery)({ name: 'days', description: '统计天数，默认7', required: false }),
    __param(0, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdvancedSearchController.prototype, "getSearchTrends", null);
__decorate([
    (0, common_1.Post)('smart'),
    (0, swagger_1.ApiOperation)({ summary: '智能搜索' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '搜索成功' }),
    (0, swagger_1.ApiQuery)({ name: 'query', description: '搜索查询' }),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdvancedSearchController.prototype, "smartSearch", null);
__decorate([
    (0, common_1.Get)('filters/presets'),
    (0, swagger_1.ApiOperation)({ summary: '获取搜索过滤器预设' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdvancedSearchController.prototype, "getFilterPresets", null);
exports.AdvancedSearchController = AdvancedSearchController = __decorate([
    (0, swagger_1.ApiTags)('高级搜索'),
    (0, common_1.Controller)('search'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [advanced_search_service_1.AdvancedSearchService])
], AdvancedSearchController);
//# sourceMappingURL=advanced-search.controller.js.map