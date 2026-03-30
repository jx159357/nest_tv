import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RecommendationService } from './recommendation.service';
import { MediaResource } from '../entities/media-resource.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetCurrentUserId } from '../decorators/current-user.decorator';

@ApiTags('推荐系统')
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('personalized')
  @ApiOperation({ summary: '获取个性化推荐' })
  @ApiResponse({ status: 200, description: '成功获取个性化推荐', type: [MediaResource] })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  async getPersonalized(@GetCurrentUserId() userId: number, @Query('limit') limit: number = 10) {
    return this.recommendationService.getPersonalizedRecommendations(userId, limit);
  }

  @Get('personalized-detailed')
  @ApiOperation({ summary: '获取带推荐理由的个性化推荐' })
  @ApiResponse({ status: 200, description: '成功获取带理由的个性化推荐' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  async getPersonalizedDetailed(
    @GetCurrentUserId() userId: number,
    @Query('limit') limit: number = 10,
  ) {
    return this.recommendationService.getPersonalizedRecommendationItems(userId, limit);
  }

  @Get('profile')
  @ApiOperation({ summary: '获取推荐偏好画像' })
  @ApiResponse({ status: 200, description: '成功获取推荐偏好画像' })
  async getRecommendationProfile(@GetCurrentUserId() userId: number) {
    return this.recommendationService.getRecommendationProfile(userId);
  }

  @Get('trending')
  @ApiOperation({ summary: '获取热门推荐' })
  @ApiResponse({ status: 200, description: '成功获取热门推荐', type: [MediaResource] })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  async getTrending(@Query('limit') limit: number = 10) {
    return this.recommendationService.getTrendingRecommendations(limit);
  }

  @Get('latest')
  @ApiOperation({ summary: '获取最新推荐' })
  @ApiResponse({ status: 200, description: '成功获取最新推荐', type: [MediaResource] })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  async getLatest(@Query('limit') limit: number = 10) {
    return this.recommendationService.getLatestRecommendations(limit);
  }

  @Get('top-rated')
  @ApiOperation({ summary: '获取高分推荐' })
  @ApiResponse({ status: 200, description: '成功获取高分推荐', type: [MediaResource] })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量限制' })
  async getTopRated(@Query('limit') limit: number = 10) {
    return this.recommendationService.getTopRatedRecommendations(limit);
  }
}
