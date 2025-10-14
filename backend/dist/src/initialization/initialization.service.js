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
        const defaultPlaySources = [
            {
                name: '电影天堂-在线播放',
                url: 'https://www.dytt8899.com',
                type: play_source_entity_1.PlaySourceType.THIRD_PARTY,
                resolution: '1080p',
                language: '中文',
                priority: 1,
                isActive: true,
                description: '电影天堂官方网站，提供最新电影资源',
            },
            {
                name: '电影天堂-磁力链接',
                url: 'https://www.dytt8899.com/html/gndy/dyzz/index.html',
                type: play_source_entity_1.PlaySourceType.MAGNET,
                resolution: '1080p',
                language: '中文',
                priority: 2,
                isActive: true,
                description: '电影天堂磁力链接下载',
            },
            {
                name: '电影天堂-最新电影',
                url: 'https://www.dytt8899.com/html/gndy/dyzz/index.html',
                type: play_source_entity_1.PlaySourceType.ONLINE,
                resolution: '1080p',
                language: '中文',
                priority: 3,
                isActive: true,
                description: '最新电影资源',
            },
        ];
        for (const playSourceConfig of defaultPlaySources) {
            const existingSource = await this.playSourceService.findByName(playSourceConfig.name);
            if (!existingSource) {
                let mediaResource = await this.mediaResourceService.findByTitle('电影天堂资源库');
                if (!mediaResource) {
                    mediaResource = await this.mediaResourceService.create({
                        title: '电影天堂资源库',
                        description: '电影天堂网站提供的影视资源集合，包含最新电影、电视剧、综艺等内容',
                        type: 'movie',
                        quality: 'full_hd',
                        rating: 8.5,
                        source: '电影天堂',
                    });
                }
                await this.playSourceService.create({
                    mediaResourceId: mediaResource.id,
                    url: playSourceConfig.url,
                    type: playSourceConfig.type,
                    resolution: playSourceConfig.resolution,
                    priority: playSourceConfig.priority,
                    sourceName: playSourceConfig.name,
                    description: playSourceConfig.description,
                });
                this.logger.log(`创建默认播放源: ${playSourceConfig.name}`);
            }
        }
    }
};
exports.InitializationService = InitializationService;
exports.InitializationService = InitializationService = InitializationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [media_resource_service_1.MediaResourceService,
        play_source_service_1.PlaySourceService])
], InitializationService);
//# sourceMappingURL=initialization.service.js.map