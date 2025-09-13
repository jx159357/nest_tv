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
exports.TorrentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let TorrentController = class TorrentController {
    async getTorrentInfo(hash) {
        return {
            infoHash: hash,
            name: `Torrent ${hash}`,
            size: 'Unknown',
            files: [],
            announce: [],
        };
    }
    async checkTorrentHealth(hash) {
        return {
            infoHash: hash,
            isHealthy: true,
            seeders: Math.floor(Math.random() * 100),
            leechers: Math.floor(Math.random() * 50),
            lastChecked: new Date().toISOString(),
        };
    }
    async parseMagnetUri(body) {
        const { magnetUri } = body;
        if (!magnetUri || !magnetUri.startsWith('magnet:')) {
            throw new Error('无效的磁力链接URI');
        }
        const params = new URLSearchParams(magnetUri.substring(8));
        const xt = params.get('xt');
        const dn = params.get('dn');
        const tr = params.getAll('tr');
        return {
            infoHash: xt?.replace('urn:btih:', '') || '',
            name: dn || '',
            announce: tr || [],
        };
    }
    async searchTorrents(keyword, page = 1, pageSize = 10) {
        return {
            data: Array.from({ length: pageSize }, (_, index) => ({
                infoHash: `hash_${(page - 1) * pageSize + index}`,
                name: `${keyword} ${index + 1}`,
                size: `${Math.floor(Math.random() * 10) + 1} GB`,
                seeders: Math.floor(Math.random() * 1000),
                leechers: Math.floor(Math.random() * 500),
                added: new Date().toISOString(),
            })),
            total: 100,
            page,
            pageSize,
            totalPages: Math.ceil(100 / pageSize),
        };
    }
    async getPopularTorrents(limit = 20, category) {
        return Array.from({ length: limit }, (_, index) => ({
            infoHash: `popular_${index}`,
            name: `热门资源 ${index + 1}`,
            size: `${Math.floor(Math.random() * 10) + 1} GB`,
            seeders: Math.floor(Math.random() * 1000),
            leechers: Math.floor(Math.random() * 500),
            category: category || '电影',
            added: new Date().toISOString(),
        }));
    }
    async getLatestTorrents(limit = 20, category) {
        return Array.from({ length: limit }, (_, index) => ({
            infoHash: `latest_${index}`,
            name: `最新资源 ${index + 1}`,
            size: `${Math.floor(Math.random() * 10) + 1} GB`,
            seeders: Math.floor(Math.random() * 100),
            leechers: Math.floor(Math.random() * 50),
            category: category || '电影',
            added: new Date().toISOString(),
        }));
    }
};
exports.TorrentController = TorrentController;
__decorate([
    (0, common_1.Get)('info/:hash'),
    (0, swagger_1.ApiOperation)({ summary: '获取磁力链接信息' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '磁力链接不存在' }),
    __param(0, (0, common_1.Param)('hash')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "getTorrentInfo", null);
__decorate([
    (0, common_1.Get)('health/:hash'),
    (0, swagger_1.ApiOperation)({ summary: '检查磁力链接健康度' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '检查成功' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '磁力链接不存在' }),
    __param(0, (0, common_1.Param)('hash')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "checkTorrentHealth", null);
__decorate([
    (0, common_1.Post)('parse'),
    (0, swagger_1.ApiOperation)({ summary: '解析磁力链接URI' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '解析成功' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '无效的磁力链接' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "parseMagnetUri", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: '搜索磁力链接' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '搜索成功' }),
    __param(0, (0, common_1.Query)('keyword')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "searchTorrents", null);
__decorate([
    (0, common_1.Get)('popular'),
    (0, swagger_1.ApiOperation)({ summary: '获取热门磁力链接' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "getPopularTorrents", null);
__decorate([
    (0, common_1.Get)('latest'),
    (0, swagger_1.ApiOperation)({ summary: '获取最新磁力链接' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '获取成功' }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "getLatestTorrents", null);
exports.TorrentController = TorrentController = __decorate([
    (0, swagger_1.ApiTags)('磁力链接播放'),
    (0, common_1.Controller)('torrent'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)
], TorrentController);
//# sourceMappingURL=torrent.controller.js.map