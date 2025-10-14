import { Injectable, OnModuleInit } from '@nestjs/common';
import { MediaResourceService } from '../media/media-resource.service';
import { PlaySourceService } from '../play-sources/play-source.service';
import { PlaySourceType } from '../entities/play-source.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class InitializationService implements OnModuleInit {
  private readonly logger = new Logger(InitializationService.name);

  constructor(
    private readonly mediaResourceService: MediaResourceService,
    private readonly playSourceService: PlaySourceService,
  ) {}

  async onModuleInit() {
    try {
      await this.initializeDefaultPlaySources();
      this.logger.log('默认播放源初始化完成');
    } catch (error) {
      this.logger.error('默认播放源初始化失败:', error);
    }
  }

  /**
   * 初始化默认播放源
   */
  private async initializeDefaultPlaySources() {
    // 电影天堂默认播放源配置
    const defaultPlaySources = [
      {
        name: '电影天堂-在线播放',
        url: 'https://www.dytt8899.com',
        type: PlaySourceType.THIRD_PARTY,
        resolution: '1080p',
        language: '中文',
        priority: 1,
        isActive: true,
        description: '电影天堂官方网站，提供最新电影资源',
      },
      {
        name: '电影天堂-磁力链接',
        url: 'https://www.dytt8899.com/html/gndy/dyzz/index.html',
        type: PlaySourceType.MAGNET,
        resolution: '1080p',
        language: '中文',
        priority: 2,
        isActive: true,
        description: '电影天堂磁力链接下载',
      },
      {
        name: '电影天堂-最新电影',
        url: 'https://www.dytt8899.com/html/gndy/dyzz/index.html',
        type: PlaySourceType.ONLINE,
        resolution: '1080p',
        language: '中文',
        priority: 3,
        isActive: true,
        description: '最新电影资源',
      },
    ];

    // 检查是否已存在默认播放源
    for (const playSourceConfig of defaultPlaySources) {
      const existingSource = await this.playSourceService.findByName(playSourceConfig.name);
      
      if (!existingSource) {
        // 首先创建一个默认的媒体资源
        let mediaResource = await this.mediaResourceService.findByTitle('电影天堂资源库');
        
        if (!mediaResource) {
          mediaResource = await this.mediaResourceService.create({
            title: '电影天堂资源库',
            description: '电影天堂网站提供的影视资源集合，包含最新电影、电视剧、综艺等内容',
            type: 'movie' as any,
            quality: 'full_hd' as any,
            rating: 8.5,
            source: '电影天堂',
          });
        }

        // 创建播放源
        await this.playSourceService.create({
          mediaResourceId: mediaResource.id,
          url: playSourceConfig.url,
          type: playSourceConfig.type,
          resolution: playSourceConfig.resolution,
          priority: playSourceConfig.priority,
          sourceName: playSourceConfig.name, // 使用sourceName字段
          description: playSourceConfig.description,
        });

        this.logger.log(`创建默认播放源: ${playSourceConfig.name}`);
      }
    }
  }
}