import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface CrawlerTarget {
  name: string;
  baseUrl: string;
  selectors: {
    title: string;
    description: string;
    poster: string;
    rating: string;
    director: string;
    actors: string;
    genres: string[];
    releaseDate: string;
    downloadUrls: string[];
  };
}

export interface CrawledData {
  title: string;
  description?: string;
  type: 'movie' | 'tv_series' | 'variety' | 'anime' | 'documentary';
  director?: string;
  actors?: string;
  genres?: string[];
  releaseDate?: Date;
  poster?: string;
  backdrop?: string;
  rating: number;
  source: string;
  downloadUrls?: string[];
  episodeCount?: number;
  metadata?: any;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  // 爬虫目标配置
  private readonly targets: CrawlerTarget[] = [
    {
      name: '电影天堂',
      baseUrl: 'https://www.dy2018.com',
      selectors: {
        title: '.title a',
        description: '.description',
        poster: '.poster img',
        rating: '.rating',
        director: '.director',
        actors: '.actors',
        genres: ['.genre'],
        releaseDate: '.release-date',
        downloadUrls: ['.download-link'],
      },
    },
    {
      name: 'BT种子',
      baseUrl: 'https://www.btdigg.com',
      selectors: {
        title: '.movie-title',
        description: '.movie-description',
        poster: '.movie-poster img',
        rating: '.movie-rating',
        director: '.movie-director',
        actors: '.movie-actors',
        genres: ['.movie-genres'],
        releaseDate: '.movie-date',
        downloadUrls: ['.torrent-link'],
      },
    },
    {
      name: '豆瓣电影',
      baseUrl: 'https://movie.douban.com',
      selectors: {
        title: 'h1 span[property="v:itemreviewed"]',
        description: '.related-info .indent .all',
        poster: '.related-pic img',
        rating: '.rating_self strong',
        director: '.info a[rel="v:directedBy"]',
        actors: '.info a[rel="v:starring"]',
        genres: ['.info span[property="v:genre"]'],
        releaseDate: '.info span[property="v:initialReleaseDate"]',
        downloadUrls: ['#info a[href*="download"]'],
      },
    },
    {
      name: 'IMDB',
      baseUrl: 'https://www.imdb.com',
      selectors: {
        title: '[data-testid="hero-title-block__title"]',
        description: '[data-testid="plot"] span',
        poster: '.ipc-media img',
        rating: '[data-testid="hero-rating-bar__aggregate-rating__score"] span',
        director: 'a[href*="tt_ov_dr"]',
        actors: 'a[href*="tt_ov_st"]',
        genres: ['.ipc-chip span'],
        releaseDate: '[data-testid="title-details-releasedate"] div',
        downloadUrls: ['.ipc-split-button a'],
      },
    },
    {
      name: 'BT蚂蚁',
      baseUrl: 'https://www.btant.com',
      selectors: {
        title: '.movie-title h1',
        description: '.movie-desc',
        poster: '.movie-poster img',
        rating: '.movie-rating',
        director: '.movie-director',
        actors: '.movie-actor',
        genres: ['.movie-genre'],
        releaseDate: '.movie-date',
        downloadUrls: ['.download-link'],
      },
    },
    {
      name: '电影蜜蜂',
      baseUrl: 'https://www.dytt8.net',
      selectors: {
        title: '.title h1',
        description: '.content',
        poster: '.poster img',
        rating: '.rating',
        director: '.director',
        actors: '.actors',
        genres: ['.genre'],
        releaseDate: '.date',
        downloadUrls: ['.download a'],
      },
    },
  ];

  /**
   * 爬取指定网站的数据
   * @param targetName 目标网站名称
   * @param url 要爬取的URL
   * @returns 爬取的数据
   */
  async crawlWebsite(targetName: string, url: string): Promise<CrawledData | null> {
    try {
      const target = this.targets.find(t => t.name === targetName);
      if (!target) {
        throw new Error(`未找到爬虫目标: ${targetName}`);
      }

      this.logger.log(`开始爬取 ${targetName}: ${url}`);

      // 获取网页内容
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const $ = cheerio.load(response.data);

      // 提取数据
      const crawledData: CrawledData = {
        title: $(target.selectors.title).first().text().trim() || '未知标题',
        description: $(target.selectors.description).first().text().trim(),
        type: this.inferMediaType(url),
        director: $(target.selectors.director).first().text().trim(),
        actors: $(target.selectors.actors).first().text().trim(),
        genres: this.extractGenres($, target.selectors.genres[0]),
        releaseDate: this.parseDate($(target.selectors.releaseDate).first().text().trim()),
        poster: this.resolveUrl($(target.selectors.poster).first().attr('src'), target.baseUrl),
        rating: this.parseRating($(target.selectors.rating).first().text().trim()),
        source: target.name,
        downloadUrls: this.extractDownloadUrls($, target.selectors.downloadUrls[0]),
        metadata: {
          crawledAt: new Date(),
          crawledUrl: url,
          website: target.name,
        },
      };

      this.logger.log(`成功爬取数据: ${crawledData.title}`);
      return crawledData;

    } catch (error) {
      this.logger.error(`爬取失败 ${targetName}: ${url}`, error.stack);
      return null;
    }
  }

  /**
   * 批量爬取资源
   * @param targetName 目标网站名称
   * @param urls 要爬取的URL列表
   * @returns 爬取的数据列表
   */
  async batchCrawl(targetName: string, urls: string[]): Promise<CrawledData[]> {
    const results: CrawledData[] = [];
    
    // 并发控制，每次最多同时处理5个
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const promises = batch.map(url => this.crawlWebsite(targetName, url));
      const batchResults = await Promise.allSettled(promises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      });

      // 避免请求过于频繁
      await this.delay(2000);
    }

    this.logger.log(`批量爬取完成，成功获取 ${results.length} 条数据`);
    return results;
  }

  /**
   * 获取可用的爬虫目标列表
   */
  getAvailableTargets(): CrawlerTarget[] {
    return this.targets;
  }

  /**
   * 推断媒体类型
   */
  private inferMediaType(url: string): 'movie' | 'tv_series' | 'variety' | 'anime' | 'documentary' {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('tv') || lowerUrl.includes('series') || lowerUrl.includes('剧集')) {
      return 'tv_series';
    }
    if (lowerUrl.includes('variety') || lowerUrl.includes('综艺')) {
      return 'variety';
    }
    if (lowerUrl.includes('anime') || lowerUrl.includes('动画') || lowerUrl.includes('动漫')) {
      return 'anime';
    }
    if (lowerUrl.includes('doc') || lowerUrl.includes('纪录')) {
      return 'documentary';
    }
    return 'movie';
  }

  /**
   * 提取类型标签
   */
  private extractGenres($: cheerio.CheerioAPI, selector: string): string[] {
    const genresText = $(selector).first().text().trim();
    if (!genresText) return [];
    
    return genresText
      .split(/[,，、\s]+/)
      .map(genre => genre.trim())
      .filter(genre => genre.length > 0);
  }

  /**
   * 解析日期
   */
  private parseDate(dateString: string): Date | undefined {
    if (!dateString) return undefined;

    // 尝试不同的日期格式
    const patterns = [
      /(\d{4})-(\d{1,2})-(\d{1,2})/, // 2024-01-01
      /(\d{4})\/(\d{1,2})\/(\d{1,2})/, // 2024/01/01
      /(\d{4})年(\d{1,2})月(\d{1,2})日/, // 2024年01月01日
    ];

    for (const pattern of patterns) {
      const match = dateString.match(pattern);
      if (match) {
        const [, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }

    return undefined;
  }

  /**
   * 解析评分
   */
  private parseRating(ratingString: string): number {
    if (!ratingString) return 0;

    const match = ratingString.match(/(\d+(?:\.\d+)?)/);
    if (match) {
      const rating = parseFloat(match[1]);
      return Math.min(10, Math.max(0, rating)); // 限制在0-10分之间
    }

    return 0;
  }

  /**
   * 解析下载链接
   */
  private extractDownloadUrls($: cheerio.CheerioAPI, selector: string): string[] {
    const urls: string[] = [];
    
    $(selector).each((index, element) => {
      const href = $(element).attr('href');
      if (href) {
        urls.push(href);
      }
    });

    return urls;
  }

  /**
   * 解析相对URL为绝对URL
   */
  private resolveUrl(url: string | undefined, baseUrl: string): string | undefined {
    if (!url) return undefined;
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }
    
    return `${baseUrl}/${url}`;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}