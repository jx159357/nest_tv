import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RecommendationService } from './recommendation.service';
import { MediaResource } from '../entities/media-resource.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('推荐系统')
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

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