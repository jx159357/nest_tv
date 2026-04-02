import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetCurrentUserId } from '../decorators/current-user.decorator';
import { AdvancedSearchService, SearchResult } from './advanced-search.service';
import type { AdvancedSearchParams } from './advanced-search.service';
import { CreateSearchHistoryDto } from './dtos/search-history.dto';

const toHttpException = (error: unknown, fallbackMessage: string): HttpException => {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const status =
    error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

  return new HttpException(message || fallbackMessage, status);
};

@ApiTags('高级搜索')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdvancedSearchController {
  constructor(private readonly advancedSearchService: AdvancedSearchService) {}

  /**
   * 执行高级搜索
   */
  @Post('advanced')
  @ApiOperation({ summary: '执行高级搜索' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async advancedSearch(
    @GetCurrentUserId() userId: number,
    @Body() searchParams: AdvancedSearchParams,
  ): Promise<SearchResult> {
    try {
      return await this.advancedSearchService.advancedSearch(searchParams, userId);
    } catch (error: unknown) {
      throw toHttpException(error, '搜索失败');
    }
  }

  /**
   * 获取搜索建议
   */
  @Get('suggestions')
  @ApiOperation({ summary: '获取搜索建议' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'keyword', description: '搜索关键词' })
  @ApiQuery({ name: 'limit', description: '返回数量限制，默认8', required: false })
  async getSearchSuggestions(@Query('keyword') keyword: string, @Query('limit') limit?: string) {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : 8;
      return await this.advancedSearchService.getSearchSuggestions(keyword, parsedLimit);
    } catch (error: unknown) {
      throw toHttpException(error, '获取搜索建议失败');
    }
  }

  /**
   * 获取热门搜索关键词
   */
  @Get('popular-keywords')
  @ApiOperation({ summary: '获取热门搜索关键词' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'limit', description: '返回数量限制，默认20', required: false })
  async getPopularKeywords(@Query('limit') limit?: string): Promise<string[]> {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : 20;
      return await this.advancedSearchService.getPopularSearchKeywords(parsedLimit);
    } catch (error: unknown) {
      throw toHttpException(error, '获取热门搜索关键词失败');
    }
  }

  /**
   * 记录用户搜索历史
   */
  @Post('history')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ summary: '记录用户搜索历史' })
  @ApiResponse({ status: 201, description: '记录成功' })
  async recordUserSearchHistory(
    @GetCurrentUserId() userId: number,
    @Body() createSearchHistoryDto: CreateSearchHistoryDto,
  ): Promise<{ success: true }> {
    try {
      await this.advancedSearchService.recordSearchHistory(userId, createSearchHistoryDto);
      return { success: true };
    } catch (error: unknown) {
      throw toHttpException(error, '记录搜索历史失败');
    }
  }

  /**
   * 获取用户搜索历史
   */
  @Get('history')
  @ApiOperation({ summary: '获取用户搜索历史' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'limit', description: '返回数量限制，默认10', required: false })
  async getUserSearchHistory(
    @GetCurrentUserId() userId: number,
    @Query('limit') limit?: string,
  ): Promise<string[]> {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : 10;
      return await this.advancedSearchService.getUserSearchHistory(userId, parsedLimit);
    } catch (error: unknown) {
      throw toHttpException(error, '获取搜索历史失败');
    }
  }

  /**
   * 清除用户搜索历史
   */
  @Delete('history')
  @ApiOperation({ summary: '清除用户搜索历史' })
  @ApiResponse({ status: 200, description: '清除成功' })
  async clearUserSearchHistory(@GetCurrentUserId() userId: number): Promise<{ message: string }> {
    try {
      await this.advancedSearchService.clearUserSearchHistory(userId);
      return { message: '搜索历史清除成功' };
    } catch (error: unknown) {
      throw toHttpException(error, '清除搜索历史失败');
    }
  }

  /**
   * 获取相关关键词
   */
  @Get('related-keywords/:keyword')
  @ApiOperation({ summary: '获取相关关键词' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiParam({ name: 'keyword', description: '基础关键词' })
  @ApiQuery({ name: 'limit', description: '返回数量限制，默认5', required: false })
  async getRelatedKeywords(
    @Param('keyword') keyword: string,
    @Query('limit') limit?: string,
  ): Promise<string[]> {
    try {
      const parsedLimit = limit ? parseInt(limit, 10) : 5;
      return await this.advancedSearchService.getRelatedKeywords(keyword, parsedLimit);
    } catch (error: unknown) {
      throw toHttpException(error, '获取相关关键词失败');
    }
  }

  /**
   * 搜索趋势统计
   */
  @Get('trends')
  @ApiOperation({ summary: '获取搜索趋势统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiQuery({ name: 'days', description: '统计天数，默认7', required: false })
  getSearchTrends(@Query('days') days?: string): {
    totalSearches: number;
    dailyTrends: Array<{
      date: string;
      count: number;
      topKeywords: string[];
    }>;
    popularKeywords: Array<{
      keyword: string;
      count: number;
    }>;
  } {
    try {
      void days;
      // 这里可以实现搜索趋势统计
      // 暂时返回模拟数据
      return {
        totalSearches: 1250,
        dailyTrends: [
          { date: '2024-09-11', count: 180, topKeywords: ['复仇者联盟', '阿凡达', '黑豹'] },
          { date: '2024-09-10', count: 165, topKeywords: ['雷神4', '蜘蛛侠', '奥本海默'] },
          { date: '2024-09-09', count: 152, topKeywords: ['沙丘', '敦刻尔克', '星际穿越'] },
        ],
        popularKeywords: [
          { keyword: '复仇者联盟', count: 45 },
          { keyword: '阿凡达', count: 38 },
          { keyword: '雷神4', count: 32 },
          { keyword: '黑豹', count: 28 },
          { keyword: '蜘蛛侠', count: 25 },
        ],
      };
    } catch (error: unknown) {
      throw toHttpException(error, '获取搜索趋势失败');
    }
  }

  /**
   * 智能搜索
   */
  @Post('smart')
  @ApiOperation({ summary: '智能搜索' })
  @ApiResponse({ status: 200, description: '搜索成功' })
  @ApiQuery({ name: 'query', description: '搜索查询' })
  async smartSearch(
    @Query('query') query: string,
    @GetCurrentUserId() userId: number,
    @Body() body?: { userId?: number; filters?: Record<string, unknown> },
  ): Promise<SearchResult> {
    try {
      void body;

      // 智能解析搜索查询
      const searchParams = this.parseSmartSearchQuery(query);

      return await this.advancedSearchService.advancedSearch(searchParams, userId);
    } catch (error: unknown) {
      throw toHttpException(error, '智能搜索失败');
    }
  }

  /**
   * 搜索过滤器预设
   */
  @Get('filters/presets')
  @ApiOperation({ summary: '获取搜索过滤器预设' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getFilterPresets(): Array<{
    id: string;
    name: string;
    description: string;
    filters: AdvancedSearchParams;
  }> {
    try {
      return [
        {
          id: 'recent-movies',
          name: '最新电影',
          description: '最近上映的高评分电影',
          filters: {
            type: ['movie'],
            minRating: 7.0,
            sortBy: 'date',
            sortOrder: 'DESC',
          },
        },
        {
          id: 'popular-tv',
          name: '热播电视剧',
          description: '最受欢迎的电视剧',
          filters: {
            type: ['tv_series'],
            sortBy: 'views',
            sortOrder: 'DESC',
          },
        },
        {
          id: 'high-rated',
          name: '高评分作品',
          description: '评分8.0以上的优质内容',
          filters: {
            minRating: 8.0,
            sortBy: 'rating',
            sortOrder: 'DESC',
          },
        },
        {
          id: 'action-movies',
          name: '动作电影',
          description: '动作类型的电影',
          filters: {
            type: ['movie'],
            genres: ['动作'],
            sortBy: 'rating',
            sortOrder: 'DESC',
          },
        },
        {
          id: 'latest-anime',
          name: '新番动漫',
          description: '最新发布的动漫',
          filters: {
            type: ['anime'],
            sortBy: 'date',
            sortOrder: 'DESC',
          },
        },
      ];
    } catch (error: unknown) {
      throw toHttpException(error, '获取搜索过滤器预设失败');
    }
  }

  /**
   * 解析智能搜索查询
   */
  private parseSmartSearchQuery(query: string): AdvancedSearchParams {
    const searchParams: AdvancedSearchParams = {
      sortBy: 'relevance',
      sortOrder: 'DESC',
      page: 1,
      pageSize: 20,
    };

    const lowerQuery = query.toLowerCase();

    // 解析年份
    const yearMatch = lowerQuery.match(/(19|20)\d{2}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      searchParams.minYear = year;
      searchParams.maxYear = year;
      searchParams.keyword = query.replace(yearMatch[0], '').trim();
    }

    // 解析评分
    const ratingMatch = lowerQuery.match(/(\d+(?:\.\d+)?)\s*分以上?/);
    if (ratingMatch) {
      searchParams.minRating = parseFloat(ratingMatch[1]);
      searchParams.keyword = query.replace(ratingMatch[0], '').trim();
    }

    // 解析类型
    if (lowerQuery.includes('电影') || lowerQuery.includes('movie')) {
      searchParams.type = ['movie'];
    }
    if (lowerQuery.includes('电视剧') || lowerQuery.includes('剧') || lowerQuery.includes('tv')) {
      searchParams.type = ['tv_series'];
    }
    if (lowerQuery.includes('动漫') || lowerQuery.includes('动画')) {
      searchParams.type = ['anime'];
    }
    if (lowerQuery.includes('综艺')) {
      searchParams.type = ['variety'];
    }
    if (lowerQuery.includes('纪录片')) {
      searchParams.type = ['documentary'];
    }

    // 解析质量
    if (lowerQuery.includes('高清') || lowerQuery.includes('hd')) {
      searchParams.quality = ['hd', 'full_hd'];
    }
    if (lowerQuery.includes('蓝光') || lowerQuery.includes('蓝光')) {
      searchParams.quality = ['blue_ray'];
    }
    if (lowerQuery.includes('4k')) {
      searchParams.quality = ['full_hd']; // 假设4K属于全高清
    }

    // 如果没有设置关键词，使用原始查询
    if (!searchParams.keyword) {
      searchParams.keyword = query;
    }

    return searchParams;
  }
}
