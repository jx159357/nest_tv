import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaResourceService } from '../media/media-resource.service';
import { MediaQuality, MediaType } from '../entities/media-resource.entity';
import { PlaySourceService } from '../play-sources/play-source.service';
import { PlaySourceType, PlaySourceVisibility } from '../entities/play-source.entity';
import { User } from '../entities/user.entity';
import { Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class InitializationService implements OnModuleInit {
  private readonly logger = new Logger(InitializationService.name);

  constructor(
    private readonly mediaResourceService: MediaResourceService,
    private readonly playSourceService: PlaySourceService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureAdminUser();
      await this.initializeDefaultPlaySources();
      this.logger.log('初始化完成');
    } catch (error) {
      this.logger.error('初始化失败:', error);
    }
  }

  /**
   * 确保管理员账号存在且可用
   */
  private async ensureAdminUser() {
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const adminUser = await this.userRepository.findOne({
      where: { username: 'admin' },
      select: ['id', 'username', 'password', 'isActive', 'role'],
    });

    if (adminUser) {
      const issues: string[] = [];
      if (!adminUser.password) issues.push('密码为空');
      if (!adminUser.isActive) issues.push('账号已禁用');
      if (adminUser.role !== 'superAdmin') issues.push(`角色异常: ${adminUser.role}`);

      if (issues.length > 0) {
        this.logger.warn(`管理员账号异常（${issues.join('，')}），正在修复...`);
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        adminUser.password = hashedPassword;
        adminUser.isActive = true;
        adminUser.role = 'superAdmin';
        await this.userRepository.save(adminUser);
        this.logger.log('管理员账号已修复');
      } else {
        this.logger.log('管理员账号正常');
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const admin = this.userRepository.create({
      username: 'admin',
      email: 'admin@nest-tv.local',
      password: hashedPassword,
      role: 'superAdmin',
      isActive: true,
      nickname: '管理员',
    });

    await this.userRepository.save(admin);
    this.logger.log('默认管理员账号已创建（密码请查看 DEFAULT_ADMIN_PASSWORD 环境变量）');
  }

  /**
   * 初始化默认播放源
   */
  private async initializeDefaultPlaySources() {
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

    this.logger.log('开始初始化示例数据');

    // 免费公共测试视频源（使用稳定可访问的 URL）
    const demoMedia = [
      {
        title: 'Big Buck Bunny',
        description: 'Blender 基金会出品的开源动画短片，讲述一只大兔子和三只小动物的故事。',
        type: MediaType.MOVIE,
        quality: MediaQuality.FULL_HD,
        rating: 8.5,
        director: 'Sacha Goedegebure',
        genres: ['动画', '喜剧', '短片'],
        source: '公共测试资源',
        poster:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/220px-Big_buck_bunny_poster_big.jpg',
        duration: 9,
        playSources: [
          {
            url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
            type: PlaySourceType.ONLINE,
            resolution: '1080p',
            sourceName: 'Test Videos',
          },
          {
            url: 'https://www.w3schools.com/html/mov_bbb.mp4',
            type: PlaySourceType.ONLINE,
            resolution: '720p',
            sourceName: 'W3Schools',
          },
        ],
      },
      {
        title: 'Sintel',
        description: 'Blender 基金会出品的开源奇幻动画短片，讲述少女 Sintel 寻找小龙的旅程。',
        type: MediaType.MOVIE,
        quality: MediaQuality.FULL_HD,
        rating: 8.8,
        director: 'Colin Levy',
        genres: ['动画', '奇幻', '冒险'],
        source: '公共测试资源',
        poster:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Sintel_poster.jpg/220px-Sintel_poster.jpg',
        duration: 15,
        playSources: [
          {
            url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
            type: PlaySourceType.ONLINE,
            resolution: '1080p',
            sourceName: 'Test Videos',
          },
        ],
      },
      {
        title: 'Tears of Steel',
        description: 'Blender 基金会出品的科幻短片，展示了真人与 CGI 结合的视觉效果。',
        type: MediaType.MOVIE,
        quality: MediaQuality.FULL_HD,
        rating: 7.9,
        director: 'Ian Hubert',
        genres: ['科幻', '动作', '短片'],
        source: '公共测试资源',
        poster:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Tears_of_Steel_poster.jpg/220px-Tears_of_Steel_poster.jpg',
        duration: 12,
        playSources: [
          {
            url: 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4',
            type: PlaySourceType.ONLINE,
            resolution: '720p',
            sourceName: 'File Samples',
          },
        ],
      },
      {
        title: 'Elephant Dream',
        description: '世界上第一部开源电影，Blender 基金会出品的实验性动画短片。',
        type: MediaType.MOVIE,
        quality: MediaQuality.HD,
        rating: 7.5,
        director: 'Bassam Kurdali',
        genres: ['动画', '科幻', '实验'],
        source: '公共测试资源',
        poster:
          'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Elephants_Dream_s1_proog.jpg/220px-Elephants_Dream_s1_proog.jpg',
        duration: 11,
        playSources: [
          {
            url: 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4',
            type: PlaySourceType.ONLINE,
            resolution: '720p',
            sourceName: 'File Samples',
          },
        ],
      },
      {
        title: 'For Bigger Blazes',
        description: '公共测试视频，用于测试流媒体播放功能。',
        type: MediaType.MOVIE,
        quality: MediaQuality.HD,
        rating: 6.0,
        source: '公共测试资源',
        duration: 1,
        playSources: [
          {
            url: 'https://www.w3schools.com/html/movie.mp4',
            type: PlaySourceType.ONLINE,
            resolution: '720p',
            sourceName: 'W3Schools',
          },
        ],
      },
      {
        title: 'Subaru Outback On Street',
        description: '公共测试视频，展示汽车行驶场景。',
        type: MediaType.MOVIE,
        quality: MediaQuality.HD,
        rating: 5.5,
        source: '公共测试资源',
        duration: 1,
        playSources: [
          {
            url: 'https://www.w3schools.com/html/mov_bbb.mp4',
            type: PlaySourceType.ONLINE,
            resolution: '720p',
            sourceName: 'W3Schools',
          },
        ],
      },
    ];

    for (const item of demoMedia) {
      try {
        const existing = await this.mediaResourceService.findByTitle(item.title);
        if (existing) {
          this.logger.log(`示例资源 "${item.title}" 已存在，跳过`);
          continue;
        }

        const media = await this.mediaResourceService.create({
          title: item.title,
          description: item.description,
          type: item.type,
          quality: item.quality,
          rating: item.rating,
          director: item.director,
          genres: item.genres,
          source: item.source,
          poster: item.poster,
          duration: item.duration,
        });

        for (const ps of item.playSources) {
          await this.playSourceService.create(
            {
              mediaResourceId: media.id,
              url: ps.url,
              type: ps.type,
              resolution: ps.resolution,
              priority: 1,
              sourceName: ps.sourceName,
            },
            { visibility: PlaySourceVisibility.PUBLIC },
          );
        }

        this.logger.log(`示例资源 "${item.title}" 创建成功`);
      } catch (error) {
        this.logger.warn(`示例资源 "${item.title}" 创建失败:`, error);
      }
    }

    this.logger.log('示例数据初始化完成');
  }
}
