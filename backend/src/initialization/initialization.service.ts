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
   * 初始化默认播放源（仅开发环境）
   */
  private async initializeDefaultPlaySources() {
    // 生产环境不自动创建默认数据
    if (process.env.NODE_ENV === 'production') {
      this.logger.log('生产环境：跳过默认播放源初始化');
      return;
    }

    // 检查环境变量是否允许初始化默认数据
    const allowInitDefault = process.env.ALLOW_INIT_DEFAULT_DATA === 'true';
    if (!allowInitDefault) {
      this.logger.log('默认数据初始化已禁用');
      return;
    }

    // 检查是否已有播放源数据
    const existingSources = await this.playSourceService.findAll({ pageSize: 1 });
    if (existingSources.data.length > 0) {
      this.logger.log('检测到已有播放源数据，跳过初始化');
      return;
    }

    this.logger.log('开发环境：开始初始化示例播放源');
    
    // 创建示例媒体资源用于演示
    let mediaResource = await this.mediaResourceService.findByTitle('示例影视资源');

    if (!mediaResource) {
      mediaResource = await this.mediaResourceService.create({
        title: '示例影视资源',
        description: '用于系统测试和演示的示例影视资源',
        type: 'movie' as any,
        quality: 'full_hd' as any,
        rating: 8.0,
        source: '系统示例',
      });
    }

    // 创建示例播放源（不包含实际的第三方URL）
    await this.playSourceService.create({
      mediaResourceId: mediaResource.id,
      url: 'https://example.com/sample-video.mp4',
      type: PlaySourceType.ONLINE,
      resolution: '1080p',
      priority: 1,
      sourceName: '示例播放源',
      description: '用于系统测试的示例播放源',
    });

    this.logger.log('示例播放源初始化完成');
  }
}
