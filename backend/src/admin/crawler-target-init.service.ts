import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrawlerTarget } from '../entities/crawler-target.entity';

const DEFAULT_TARGETS: Partial<CrawlerTarget>[] = [
  {
    name: '电影天堂',
    baseUrl: 'https://www.dytt8899.com',
    selectors: {
      title: '.title_all h1',
      description: '#Zoom, .co_content8',
      poster: '#Zoom img, .co_content8 img',
      rating: '.rank, .co_content8 strong',
      director: '.co_content8 p',
      actors: '.co_content8 p',
      genres: '.co_content8 p a',
      releaseDate: '.position .updatetime, .co_content8 p span',
      downloadUrls:
        '#downlist a[href*="magnet"], .player_list a, a[href*="thunder"], a[href*="ftp"], a[href*="ed2k"]',
    },
    listingUrls: [
      'https://www.dytt8899.com/html/gndy/dyzz/index.html',
      'https://www.dytt8899.com/html/gndy/rihan/index.html',
      'https://www.dytt8899.com/html/gndy/oumei/index.html',
    ],
    enabled: true,
    isActive: false,
    priority: 1,
    maxPages: 50,
    respectRobotsTxt: true,
    requestDelay: 2000,
    description: '电影天堂主站点，提供磁力/迅雷/FTP下载资源',
  },
  {
    name: '天堂影院',
    baseUrl: 'https://dytt001.com',
    selectors: {
      title: 'h1',
      description: '.m-text1 .txt',
      poster: '.m-text1 .txt img',
      rating: '.info span',
      director: '.info span',
      actors: '.info span',
      genres: '.info span a',
      releaseDate: '.info span',
      downloadUrls: '',
    },
    listingUrls: [
      'https://dytt001.com/html/page-5.html',
      'https://dytt001.com/html/page-6.html',
      'https://dytt001.com/html/page-7.html',
      'https://dytt001.com/html/page-8.html',
      'https://dytt001.com/html/page-9.html',
      'https://dytt001.com/html/page-10.html',
      'https://dytt001.com/html/page-11.html',
      'https://dytt001.com/html/page-12.html',
      'https://dytt001.com/html/page-13.html',
      'https://dytt001.com/html/page-14.html',
      'https://dytt001.com/html/page-15.html',
      'https://dytt001.com/html/page-16.html',
      'https://dytt001.com/html/page-17.html',
      'https://dytt001.com/html/page-18.html',
      'https://dytt001.com/html/page-19.html',
      'https://dytt001.com/html/page-3.html',
      'https://dytt001.com/html/page-4.html',
      'https://dytt001.com/html/page-22.html',
      'https://dytt001.com/html/page-27.html',
      'https://dytt001.com/label/new.html',
      'https://dytt001.com/label/top.html',
    ],
    enabled: true,
    isActive: true,
    priority: 2,
    maxPages: 100,
    respectRobotsTxt: true,
    requestDelay: 1500,
    description: '天堂影院，maccms CMS在线播放站，提供m3u8视频源',
  },
  {
    name: '阳光电影',
    baseUrl: 'https://www.ygdy8.com',
    selectors: {
      title: '.title_all h1',
      description: '#Zoom, .co_content8',
      poster: '#Zoom img',
      rating: '.rank, .score',
      director: '.co_content8 p',
      actors: '.co_content8 p',
      genres: '.co_content8 p a',
      releaseDate: '.co_content8 p span',
      downloadUrls: 'a[href*="magnet"], a[href*="thunder"], a[href*="ftp"]',
    },
    enabled: false,
    isActive: false,
    priority: 3,
    maxPages: 30,
    respectRobotsTxt: true,
    requestDelay: 2000,
    description: '阳光电影（站点不可达，已禁用）',
  },
  {
    name: '6v电影',
    baseUrl: 'https://www.6v520.cc',
    selectors: {
      title: '.title_all h1',
      description: '#Zoom, .co_content8',
      poster: '#Zoom img',
      rating: '.rank, .score',
      director: '.co_content8 p',
      actors: '.co_content8 p',
      genres: '.co_content8 p a',
      releaseDate: '.co_content8 p span',
      downloadUrls: 'a[href*="magnet"], a[href*="thunder"], a[href*="ftp"]',
    },
    enabled: false,
    isActive: false,
    priority: 4,
    maxPages: 20,
    respectRobotsTxt: true,
    requestDelay: 2500,
    description: '6v电影（域名已变更，已禁用）',
  },
];

@Injectable()
export class CrawlerTargetInitService implements OnModuleInit {
  private readonly logger = new Logger(CrawlerTargetInitService.name);

  constructor(
    @InjectRepository(CrawlerTarget)
    private crawlerTargetRepository: Repository<CrawlerTarget>,
  ) {}

  async onModuleInit() {
    await this.initDefaultTargets();
  }

  private async initDefaultTargets() {
    try {
      const count = await this.crawlerTargetRepository.count();
      if (count > 0) {
        this.logger.log(`数据库中已存在 ${count} 个数据源，跳过初始化`);
        return;
      }

      this.logger.log('正在初始化默认数据源配置...');
      for (const targetData of DEFAULT_TARGETS) {
        const target = this.crawlerTargetRepository.create(targetData);
        await this.crawlerTargetRepository.save(target);
        this.logger.log(`已创建数据源: ${targetData.name}`);
      }
      this.logger.log('默认数据源初始化完成');
    } catch (error) {
      this.logger.error('初始化默认数据源失败:', error);
    }
  }
}
