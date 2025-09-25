import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In, Between, Not, ILike } from 'typeorm';
import { MediaResource, MediaType, MediaQuality } from '../entities/media-resource.entity';
import { User } from '../entities/user.entity';
import { SearchHistory } from '../entities/search-history.entity';

export interface AdvancedSearchParams {
  keyword?: string;
  type?: string[];
  quality?: string[];
  genres?: string[];
  director?: string;
  actors?: string;
  minRating?: number;
  maxRating?: number;
  minYear?: number;
  maxYear?: number;
  sortBy?: 'relevance' | 'rating' | 'views' | 'date' | 'title';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
}

export interface SearchResult {
  data: MediaResource[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  suggestions?: string[];
  searchTime: number;
  filters: {
    appliedTypes: string[];
    appliedGenres: string[];
    priceRange?: [number, number];
    yearRange?: [number, number];
  };
}

export interface SearchSuggestion {
  text: string;
  type: 'keyword' | 'title' | 'actor' | 'director' | 'genre';
  count: number;
}

@Injectable()
export class AdvancedSearchService {
  private readonly searchHistory: Map<number, string[]> = new Map();
  private readonly popularSearches: Map<string, number> = new Map();

  constructor(
    @InjectRepository(MediaResource)
    private readonly mediaResourceRepository: Repository<MediaResource>,
    @InjectRepository(SearchHistory)
    private readonly searchHistoryRepository: Repository<SearchHistory>,
  ) {}

  /**
   * 执行高级搜索
   */
  async advancedSearch(params: AdvancedSearchParams, userId?: number): Promise<SearchResult> {
    const startTime = Date.now();

    const {
      keyword = '',
      type = [],
      quality = [],
      genres = [],
      director = '',
      actors = '',
      minRating,
      maxRating,
      minYear,
      maxYear,
      sortBy = 'relevance',
      sortOrder = 'DESC',
      page = 1,
      pageSize = 10,
      includeInactive = false,
    } = params;

    // 记录搜索历史
    if (keyword && userId) {
      await this.recordSearchHistory(userId, keyword);
    }

    // 构建查询
    const queryBuilder = this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .leftJoinAndSelect('mediaResource.poster', 'poster');

    // 基础条件：只搜索活跃的资源
    if (!includeInactive) {
      queryBuilder.andWhere('mediaResource.isActive = :isActive', { isActive: true });
    }

    // 关键词搜索 - 支持模糊匹配和多字段搜索
    if (keyword.trim()) {
      const keywordPattern = `%${keyword.trim()}%`;
      queryBuilder.andWhere(
        `(mediaResource.title LIKE :keyword OR 
          mediaResource.description LIKE :keyword OR 
          mediaResource.originalTitle LIKE :keyword OR 
          mediaResource.director LIKE :keyword OR 
          mediaResource.actors LIKE :keyword)`,
        { keyword: keywordPattern },
      );
    }

    // 类型筛选
    if (type.length > 0) {
      queryBuilder.andWhere('mediaResource.type IN (:...types)', { types: type });
    }

    // 质量筛选
    if (quality.length > 0) {
      queryBuilder.andWhere('mediaResource.quality IN (:...qualities)', { qualities: quality });
    }

    // 类型标签筛选
    if (genres.length > 0) {
      genres.forEach(genre => {
        queryBuilder.andWhere('JSON_CONTAINS(mediaResource.genres, :genre)', { genre });
      });
    }

    // 导演筛选
    if (director.trim()) {
      queryBuilder.andWhere('mediaResource.director LIKE :director', {
        director: `%${director.trim()}%`,
      });
    }

    // 演员筛选
    if (actors.trim()) {
      queryBuilder.andWhere('mediaResource.actors LIKE :actors', {
        actors: `%${actors.trim()}%`,
      });
    }

    // 评分范围筛选
    if (minRating !== undefined) {
      queryBuilder.andWhere('mediaResource.rating >= :minRating', { minRating });
    }
    if (maxRating !== undefined) {
      queryBuilder.andWhere('mediaResource.rating <= :maxRating', { maxRating });
    }

    // 年份范围筛选
    if (minYear !== undefined) {
      const minDate = new Date(minYear, 0, 1);
      queryBuilder.andWhere('mediaResource.releaseDate >= :minDate', { minDate });
    }
    if (maxYear !== undefined) {
      const maxDate = new Date(maxYear + 1, 0, 1); // 到年底
      queryBuilder.andWhere('mediaResource.releaseDate < :maxDate', { maxDate });
    }

    // 排序逻辑
    this.applySorting(queryBuilder, sortBy, sortOrder, keyword);

    // 获取总数
    const total = await queryBuilder.getCount();

    // 分页查询
    const skip = (page - 1) * pageSize;
    const data = await queryBuilder.skip(skip).take(pageSize).getMany();

    const searchTime = Date.now() - startTime;

    // 生成搜索建议
    const suggestions = await this.generateSearchSuggestions(keyword);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      suggestions: suggestions.slice(0, 5), // 最多返回5个建议
      searchTime,
      filters: {
        appliedTypes: type,
        appliedGenres: genres,
        yearRange: minYear !== undefined && maxYear !== undefined ? [minYear, maxYear] : undefined,
      },
    };
  }

  /**
   * 智能搜索建议
   */
  async getSearchSuggestions(keyword: string, limit: number = 8): Promise<SearchSuggestion[]> {
    if (!keyword.trim()) {
      return [];
    }

    const suggestions: SearchSuggestion[] = [];

    // 1. 搜索标题建议
    const titleSuggestions = await this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .select('mediaResource.title')
      .addSelect('COUNT(*)', 'count')
      .where('mediaResource.title LIKE :keyword', { keyword: `${keyword.trim()}%` })
      .andWhere('mediaResource.isActive = :isActive', { isActive: true })
      .groupBy('mediaResource.title')
      .orderBy('count', 'DESC')
      .take(limit / 2)
      .getRawMany();

    titleSuggestions.forEach(item => {
      suggestions.push({
        text: item.title,
        type: 'title',
        count: parseInt(item.count as string),
      });
    });

    // 2. 搜索导演建议
    const directorSuggestions = await this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .select('mediaResource.director')
      .addSelect('COUNT(*)', 'count')
      .where('mediaResource.director LIKE :keyword', { keyword: `${keyword.trim()}%` })
      .andWhere('mediaResource.isActive = :isActive', { isActive: true })
      .andWhere('mediaResource.director IS NOT NULL')
      .groupBy('mediaResource.director')
      .orderBy('count', 'DESC')
      .take(Math.max(1, Math.floor(limit / 4)))
      .getRawMany();

    directorSuggestions.forEach(item => {
      if (item.director) {
        suggestions.push({
          text: item.director,
          type: 'director',
          count: parseInt(item.count as string),
        });
      }
    });

    // 3. 搜索演员建议
    const actorSuggestions = await this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .select('mediaResource.actors')
      .addSelect('COUNT(*)', 'count')
      .where('mediaResource.actors LIKE :keyword', { keyword: `%${keyword.trim()}%` })
      .andWhere('mediaResource.isActive = :isActive', { isActive: true })
      .andWhere('mediaResource.actors IS NOT NULL')
      .groupBy('mediaResource.actors')
      .orderBy('count', 'DESC')
      .take(Math.max(1, Math.floor(limit / 4)))
      .getRawMany();

    actorSuggestions.forEach(item => {
      if (item.actors) {
        // 分割演员字符串并添加前几个
        const actorList = item.actors
          .split(',')
          .map(actor => actor.trim())
          .slice(0, 2);
        actorList.forEach(actor => {
          if (actor.includes(keyword.trim())) {
            suggestions.push({
              text: actor,
              type: 'actor',
              count: parseInt(item.count as string),
            });
          }
        });
      }
    });

    // 4. 搜索类型建议
    const genreSuggestions = await this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .select('mediaResource.genres')
      .addSelect('COUNT(*)', 'count')
      .where('JSON_CONTAINS(mediaResource.genres, :keyword)', { keyword: keyword.trim() })
      .andWhere('mediaResource.isActive = :isActive', { isActive: true })
      .groupBy('mediaResource.genres')
      .orderBy('count', 'DESC')
      .take(Math.max(1, Math.floor(limit / 4)))
      .getRawMany();

    genreSuggestions.forEach(item => {
      if (item.genres && Array.isArray(item.genres)) {
        item.genres.forEach((genre: string) => {
          if (genre.includes(keyword.trim())) {
            suggestions.push({
              text: genre,
              type: 'genre',
              count: parseInt(item.count as string),
            });
          }
        });
      }
    });

    // 去重并按相关性排序
    const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
    return uniqueSuggestions
      .sort((a, b) => {
        // 优先级：完全匹配 > 开始匹配 > 包含匹配
        const aExact = a.text.toLowerCase() === keyword.toLowerCase();
        const bExact = b.text.toLowerCase() === keyword.toLowerCase();
        const aStartsWith = a.text.toLowerCase().startsWith(keyword.toLowerCase());
        const bStartsWith = b.text.toLowerCase().startsWith(keyword.toLowerCase());

        if (aExact !== bExact) return aExact ? -1 : 1;
        if (aStartsWith !== bStartsWith) return aStartsWith ? -1 : 1;

        // 最后按数量排序
        return b.count - a.count;
      })
      .slice(0, limit);
  }

  /**
   * 获取热门搜索关键词
   */
  async getPopularSearchKeywords(limit: number = 20): Promise<string[]> {
    const popularKeywords = await this.searchHistoryRepository
      .createQueryBuilder('searchHistory')
      .select('searchHistory.keyword')
      .addSelect('COUNT(*)', 'count')
      .where('searchHistory.createdAt > :since', {
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天内
      })
      .groupBy('searchHistory.keyword')
      .orderBy('count', 'DESC')
      .take(limit)
      .getRawMany();

    return popularKeywords.map(item => item.keyword);
  }

  /**
   * 获取用户的搜索历史
   */
  async getUserSearchHistory(userId: number, limit: number = 10): Promise<string[]> {
    const history = await this.searchHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return history.map(item => item.keyword);
  }

  /**
   * 清除用户搜索历史
   */
  async clearUserSearchHistory(userId: number): Promise<void> {
    await this.searchHistoryRepository.delete({ userId });
  }

  /**
   * 记录搜索历史
   */
  private async recordSearchHistory(userId: number, keyword: string): Promise<void> {
    try {
      // 避免重复记录相同的搜索词
      const existingRecord = await this.searchHistoryRepository.findOne({
        where: { userId, keyword },
        order: { createdAt: 'DESC' },
      });

      // 如果同一用户在5分钟内搜索过相同关键词，则不记录
      if (existingRecord) {
        const timeDiff = Date.now() - existingRecord.createdAt.getTime();
        if (timeDiff < 5 * 60 * 1000) {
          return;
        }
      }

      const searchHistory = this.searchHistoryRepository.create({
        userId,
        keyword: keyword.trim(),
      });

      await this.searchHistoryRepository.save(searchHistory);
    } catch (error) {
      // 静默处理错误，不影响主要搜索功能
      console.warn('Failed to record search history:', error);
    }
  }

  /**
   * 生成搜索建议
   */
  private async generateSearchSuggestions(keyword: string): Promise<string[]> {
    if (!keyword.trim()) {
      return [];
    }

    const suggestions = await this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .select('mediaResource.title')
      .distinct(true)
      .where('mediaResource.title LIKE :keyword', { keyword: `${keyword.trim()}%` })
      .andWhere('mediaResource.isActive = :isActive', { isActive: true })
      .take(5)
      .getMany();

    return suggestions.map(item => item.title);
  }

  /**
   * 应用排序逻辑
   */
  private applySorting(
    queryBuilder: any,
    sortBy: string,
    sortOrder: string,
    keyword: string,
  ): void {
    const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    switch (sortBy) {
      case 'relevance':
        // 相关性排序：优先匹配关键词的标题，然后评分
        if (keyword.trim()) {
          queryBuilder
            .addOrderBy('CASE WHEN mediaResource.title LIKE :exactKeyword THEN 1 ELSE 2 END', 'ASC')
            .addOrderBy('mediaResource.rating', order);
        } else {
          queryBuilder.addOrderBy('mediaResource.rating', order);
        }
        break;

      case 'rating':
        queryBuilder.addOrderBy('mediaResource.rating', order);
        break;

      case 'views':
        queryBuilder.addOrderBy('mediaResource.views', order);
        break;

      case 'date':
        queryBuilder.addOrderBy('mediaResource.releaseDate', order);
        break;

      case 'title':
        queryBuilder.addOrderBy('mediaResource.title', order);
        break;

      default:
        queryBuilder
          .addOrderBy('mediaResource.rating', order)
          .addOrderBy('mediaResource.releaseDate', order);
    }
  }

  /**
   * 去重搜索建议
   */
  private deduplicateSuggestions(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = `${suggestion.text}:${suggestion.type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 获取相关搜索词
   */
  async getRelatedKeywords(keyword: string, limit: number = 5): Promise<string[]> {
    // 查找包含相同关键词的影视资源的其他标签
    const mediaWithKeyword = await this.mediaResourceRepository
      .createQueryBuilder('mediaResource')
      .select(['mediaResource.genres', 'mediaResource.director', 'mediaResource.actors'])
      .where('(mediaResource.title LIKE :keyword OR mediaResource.description LIKE :keyword)', {
        keyword: `%${keyword}%`,
      })
      .andWhere('mediaResource.isActive = :isActive', { isActive: true })
      .take(20)
      .getMany();

    const relatedKeywords = new Set<string>();

    mediaWithKeyword.forEach(media => {
      // 添加类型标签
      if (media.genres && Array.isArray(media.genres)) {
        media.genres.forEach((genre: string) => {
          if (genre && !genre.toLowerCase().includes(keyword.toLowerCase())) {
            relatedKeywords.add(genre);
          }
        });
      }

      // 添加导演
      if (media.director && !media.director.toLowerCase().includes(keyword.toLowerCase())) {
        relatedKeywords.add(media.director);
      }

      // 添加演员
      if (media.actors) {
        const actors = media.actors.split(',').map(actor => actor.trim());
        actors.forEach(actor => {
          if (actor && !actor.toLowerCase().includes(keyword.toLowerCase())) {
            relatedKeywords.add(actor);
          }
        });
      }
    });

    return Array.from(relatedKeywords).slice(0, limit);
  }
}
