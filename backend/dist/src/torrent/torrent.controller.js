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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TorrentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const torrent_service_1 = require("../common/services/torrent.service");
const app_logger_service_1 = require("../common/services/app-logger.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let TorrentController = class TorrentController {
    torrentService;
    logger;
    constructor(torrentService, appLoggerService) {
        this.torrentService = torrentService;
        this.logger = appLoggerService;
    }
    async addMagnet(magnetUri, userId) {
        const context = { userId, function: 'addMagnet' };
        try {
            this.logger.logUserAction(userId || 0, 'add_magnet', magnetUri, null, context);
            const result = await this.torrentService.addMagnet(magnetUri);
            this.logger.logTorrent(result.infoHash, 'added', { name: result.name, length: result.length }, context);
            return {
                success: true,
                message: '磁力链接添加成功',
                data: result,
            };
        }
        catch (error) {
            this.logger.error(`Failed to add magnet: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async getTorrentInfo(infoHash, userId) {
        const context = { userId, function: 'getTorrentInfo', infoHash };
        try {
            const info = this.torrentService.getTorrentInfo(infoHash);
            if (!info) {
                this.logger.warn(`Torrent not found: ${infoHash}`, context);
                return {
                    success: false,
                    message: '磁力链接不存在',
                };
            }
            this.logger.logTorrent(infoHash, 'info_retrieved', { name: info.name }, context);
            return {
                success: true,
                data: info,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get torrent info: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async findLargestVideoFile(infoHash, userId) {
        const context = { userId, function: 'findLargestVideoFile', infoHash };
        try {
            const file = this.torrentService.findLargestVideoFile(infoHash);
            if (!file) {
                this.logger.warn(`No video file found: ${infoHash}`, context);
                return {
                    success: false,
                    message: '未找到视频文件',
                };
            }
            const playUrl = this.torrentService.generatePlayUrl(infoHash, file.index);
            this.logger.logTorrent(infoHash, 'largest_video_found', { fileName: file.name, fileSize: file.length }, context);
            return {
                success: true,
                data: {
                    file,
                    playUrl,
                },
            };
        }
        catch (error) {
            this.logger.error(`Failed to find largest video: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async getFileStream(infoHash, fileIndex, userId, res, req) {
        const context = { userId, function: 'getFileStream', infoHash, fileIndex };
        try {
            const stream = this.torrentService.getFileStream(infoHash, parseInt(fileIndex.toString()));
            if (!stream) {
                this.logger.error(`Stream not found: ${infoHash}/${fileIndex}`, context);
                if (res) {
                    res.status(404).send('文件流不存在');
                }
                return;
            }
            const torrentInfo = this.torrentService.getTorrentInfo(infoHash);
            const file = torrentInfo?.files[parseInt(fileIndex.toString())];
            if (file && res) {
                res.setHeader('Content-Type', file.type || 'video/mp4');
                res.setHeader('Content-Length', file.length);
                res.setHeader('Accept-Ranges', 'bytes');
                const range = req.headers.range;
                if (range) {
                    const parts = range.replace(/bytes=/, '').split('-');
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
                    const chunksize = (end - start) + 1;
                    if (res) {
                        res.writeHead(206, {
                            'Content-Range': `bytes ${start}-${end}/${file.length}`,
                            'Accept-Ranges': 'bytes',
                            'Content-Length': chunksize,
                            'Content-Type': file.type || 'video/mp4',
                        });
                        const fileStream = file.createReadStream({ start, end });
                        fileStream.pipe(res);
                    }
                }
                else {
                    if (res) {
                        res.setHeader('Content-Type', file.type || 'video/mp4');
                        res.setHeader('Content-Length', file.length);
                    }
                    if (res) {
                        stream.pipe(res);
                    }
                }
                this.logger.logTorrent(infoHash, 'stream_started', { fileIndex, fileName: file.name }, context);
            }
            else {
                if (res) {
                    stream.pipe(res);
                }
                this.logger.logTorrent(infoHash, 'stream_started', { fileIndex }, context);
            }
        }
        catch (error) {
            this.logger.error(`Failed to get file stream: ${error.message}`, context, error.stack);
            if (res) {
                res.status(500).send('获取文件流失败');
            }
        }
    }
    async checkMagnetHealth(magnetUri, userId) {
        const context = { userId, function: 'checkMagnetHealth' };
        try {
            this.logger.log('Checking magnet health', app_logger_service_1.LogLevel.INFO, { magnetUri, ...context });
            const result = await this.torrentService.checkMagnetHealth(magnetUri);
            this.logger.log('Magnet health check completed', app_logger_service_1.LogLevel.INFO, {
                magnetUri,
                isHealthy: result.isHealthy,
                seeders: result.seeders,
                ...context
            });
            return {
                success: true,
                data: result,
            };
        }
        catch (error) {
            this.logger.error(`Failed to check magnet health: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async removeTorrent(infoHash, userId) {
        const context = { userId, function: 'removeTorrent', infoHash };
        try {
            const success = this.torrentService.removeTorrent(infoHash);
            if (success) {
                this.logger.logTorrent(infoHash, 'removed', null, context);
                return {
                    success: true,
                    message: '磁力链接移除成功',
                };
            }
            else {
                this.logger.warn(`Torrent not found for removal: ${infoHash}`, context);
                return {
                    success: false,
                    message: '磁力链接不存在',
                };
            }
        }
        catch (error) {
            this.logger.error(`Failed to remove torrent: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async getAllTorrents(userId) {
        const context = { userId, function: 'getAllTorrents' };
        try {
            const torrents = this.torrentService.getAllTorrents();
            this.logger.log('Retrieved all torrents', app_logger_service_1.LogLevel.INFO, {
                count: torrents.length,
                ...context
            });
            return {
                success: true,
                data: torrents,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get all torrents: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async parseMagnet(magnetUri, userId) {
        const context = { userId, function: 'parseMagnet' };
        try {
            this.logger.log('Parsing magnet URI', app_logger_service_1.LogLevel.INFO, { magnetUri, ...context });
            const parsed = this.torrentService.parseMagnetUri(magnetUri);
            this.logger.log('Magnet URI parsed', app_logger_service_1.LogLevel.INFO, {
                magnetUri,
                infoHash: parsed.infoHash,
                ...context
            });
            return {
                success: true,
                data: parsed,
            };
        }
        catch (error) {
            this.logger.error(`Failed to parse magnet: ${error.message}`, context, error.stack);
            throw error;
        }
    }
    async destroyAll(userId) {
        const context = { userId, function: 'destroyAll' };
        try {
            this.torrentService.destroyAll();
            this.logger.logSystemEvent('all_torrents_destroyed', { userId }, app_logger_service_1.LogLevel.INFO, context);
            return {
                success: true,
                message: '所有磁力链接已销毁',
            };
        }
        catch (error) {
            this.logger.error(`Failed to destroy all torrents: ${error.message}`, context, error.stack);
            throw error;
        }
    }
};
exports.TorrentController = TorrentController;
__decorate([
    (0, common_1.Post)('add'),
    (0, swagger_1.ApiOperation)({ summary: '添加磁力链接' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '磁力链接添加成功' }),
    __param(0, (0, common_1.Body)('magnetUri')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "addMagnet", null);
__decorate([
    (0, common_1.Get)('info/:infoHash'),
    (0, swagger_1.ApiOperation)({ summary: '获取磁力链接信息' }),
    (0, swagger_1.ApiParam)({ name: 'infoHash', description: '磁力链接Info Hash' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('infoHash')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "getTorrentInfo", null);
__decorate([
    (0, common_1.Get)('largest-video/:infoHash'),
    (0, swagger_1.ApiOperation)({ summary: '获取最大视频文件' }),
    (0, swagger_1.ApiParam)({ name: 'infoHash', description: '磁力链接Info Hash' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Param)('infoHash')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "findLargestVideoFile", null);
__decorate([
    (0, common_1.Get)('stream/:infoHash/:fileIndex'),
    (0, swagger_1.ApiOperation)({ summary: '获取文件流' }),
    (0, swagger_1.ApiParam)({ name: 'infoHash', description: '磁力链接Info Hash' }),
    (0, swagger_1.ApiParam)({ name: 'fileIndex', description: '文件索引' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '流数据' }),
    __param(0, (0, common_1.Param)('infoHash')),
    __param(1, (0, common_1.Param)('fileIndex')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Res)()),
    __param(4, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Object, Object]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "getFileStream", null);
__decorate([
    (0, common_1.Post)('check-health'),
    (0, swagger_1.ApiOperation)({ summary: '检查磁力链接健康度' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '检查成功' }),
    __param(0, (0, common_1.Body)('magnetUri')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "checkMagnetHealth", null);
__decorate([
    (0, common_1.Delete)(':infoHash'),
    (0, swagger_1.ApiOperation)({ summary: '移除磁力链接' }),
    (0, swagger_1.ApiParam)({ name: 'infoHash', description: '磁力链接Info Hash' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '移除成功' }),
    __param(0, (0, common_1.Param)('infoHash')),
    __param(1, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "removeTorrent", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({ summary: '获取所有磁力链接' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '查询成功' }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "getAllTorrents", null);
__decorate([
    (0, common_1.Post)('parse'),
    (0, swagger_1.ApiOperation)({ summary: '解析磁力链接' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '解析成功' }),
    __param(0, (0, common_1.Body)('magnetUri')),
    __param(1, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "parseMagnet", null);
__decorate([
    (0, common_1.Delete)('all'),
    (0, swagger_1.ApiOperation)({ summary: '销毁所有磁力链接' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '销毁成功' }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TorrentController.prototype, "destroyAll", null);
exports.TorrentController = TorrentController = __decorate([
    (0, swagger_1.ApiTags)('磁力链接播放'),
    (0, common_1.Controller)('torrent'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof torrent_service_1.TorrentService !== "undefined" && torrent_service_1.TorrentService) === "function" ? _a : Object, typeof (_b = typeof app_logger_service_1.AppLoggerService !== "undefined" && app_logger_service_1.AppLoggerService) === "function" ? _b : Object])
], TorrentController);
//# sourceMappingURL=torrent.controller.js.map