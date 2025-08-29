import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  /**
   * 获取用户的个性化推荐
   * @param userId 用户ID
   * @param limit 推荐数量
   * @returns 推荐列表
   */
  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async getUserRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const recommendations = await this.recommendationService.getUserRecommendations(
      parseInt(userId),
      limit ? parseInt(limit) : 10,
    );
    return recommendations;
  }

  /**
   * 生成用户的个性化推荐
   * @param userId 用户ID
   * @param limit 推荐数量
   * @returns 推荐列表
   */
  @UseGuards(JwtAuthGuard)
  @Post('generate/:userId')
  async generatePersonalizedRecommendations(
    @Param('userId') userId: string,
    @Body('limit') limit?: number,
  ) {
    const recommendations = await this.recommendationService.generatePersonalizedRecommendations(
      parseInt(userId),
      limit || 10,
    );
    return recommendations;
  }

  /**
   * 获取热门推荐
   * @param limit 推荐数量
   * @returns 推荐列表
   */
  @Get('trending')
  async getTrendingRecommendations(@Query('limit') limit?: string) {
    const recommendations = await this.recommendationService.getTrendingRecommendations(
      limit ? parseInt(limit) : 10,
    );
    return recommendations;
  }

  /**
   * 获取编辑推荐
   * @param limit 推荐数量
   * @returns 推荐列表
   */
  @Get('editorial')
  async getEditorialRecommendations(@Query('limit') limit?: string) {
    const recommendations = await this.recommendationService.getEditorialRecommendations(
      limit ? parseInt(limit) : 10,
    );
    return recommendations;
  }

  /**
   * 获取推荐详情
   * @param id 推荐ID
   * @returns 推荐详情
   */
  @Get(':id')
  async getRecommendationDetail(@Param('id') id: string) {
    const recommendation = await this.recommendationService.getRecommendationDetail(parseInt(id));
    return recommendation;
  }
}