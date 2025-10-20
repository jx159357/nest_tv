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
var InitializationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitializationService = void 0;
const common_1 = require("@nestjs/common");
const media_resource_service_1 = require("../media/media-resource.service");
const play_source_service_1 = require("../play-sources/play-source.service");
const play_source_entity_1 = require("../entities/play-source.entity");
const common_2 = require("@nestjs/common");
let InitializationService = InitializationService_1 = class InitializationService {
    mediaResourceService;
    playSourceService;
    logger = new common_2.Logger(InitializationService_1.name);
    constructor(mediaResourceService, playSourceService) {
        this.mediaResourceService = mediaResourceService;
        this.playSourceService = playSourceService;
    }
    async onModuleInit() {
        try {
            await this.initializeDefaultPlaySources();
            this.logger.log('默认播放源初始化完成');
        }
        catch (error) {
            this.logger.error('默认播放源初始化失败:', error);
        }
    }
    async initializeDefaultPlaySources() {
        if (process.env.NODE_ENV === 'production') {
            this.logger.log('生产环境：跳过默认播放源初始化');
            return;
        }
        const allowInitDefault = process.env.ALLOW_INIT_DEFAULT_DATA === 'true';
        if (!allowInitDefault) {
            this.logger.log('默认数据初始化已禁用');
            return;
        }
        const existingSources = await this.playSourceService.findAll({ pageSize: 1 });
        if (existingSources.data.length > 0) {
            this.logger.log('检测到已有播放源数据，跳过初始化');
            return;
        }
        this.logger.log('开发环境：开始初始化示例播放源');
        let mediaResource = await this.mediaResourceService.findByTitle('示例影视资源');
        if (!mediaResource) {
            mediaResource = await this.mediaResourceService.create({
                title: '示例影视资源',
                description: '用于系统测试和演示的示例影视资源',
                type: 'movie',
                quality: 'full_hd',
                rating: 8.0,
                source: '系统示例',
            });
        }
        await this.playSourceService.create({
            mediaResourceId: mediaResource.id,
            url: 'https://example.com/sample-video.mp4',
            type: play_source_entity_1.PlaySourceType.ONLINE,
            resolution: '1080p',
            priority: 1,
            sourceName: '示例播放源',
            description: '用于系统测试的示例播放源',
        });
        this.logger.log('示例播放源初始化完成');
    }
};
exports.InitializationService = InitializationService;
exports.InitializationService = InitializationService = InitializationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [media_resource_service_1.MediaResourceService,
        play_source_service_1.PlaySourceService])
], InitializationService);
//# sourceMappingURL=initialization.service.js.map