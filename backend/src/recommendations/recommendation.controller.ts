import { Controller, Get, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecommendationService } from './recommendation.service';
import { MediaResource } from '../entities/media-resource.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { GetCurrentUserId } from '../decorators/current-user.decorator';
import { RecommendationQueryDto } from './dto/recommendation-query.dto';

@ApiTags('推荐系统')
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('personalized')
  @ApiOperation({ summary: '获取个性化推荐' })
  @ApiResponse({ status: 200, description: '成功获取个性化推荐', type: [MediaResource] })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPersonalized(
    @GetCurrentUserId() userId: number,
    @Query() queryDto: RecommendationQueryDto,
  ) {
    return this.recommendationService.getPersonalizedRecommendations(userId, queryDto.limit);
  }

  @Get('personalized-detailed')
  @ApiOperation({ summary: '获取带推荐理由的个性化推荐' })
  @ApiResponse({ status: 200, description: '成功获取带理由的个性化推荐' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getPersonalizedDetailed(
    @GetCurrentUserId() userId: number,
    @Query() queryDto: RecommendationQueryDto,
  ) {
    return this.recommendationService.getPersonalizedRecommendationItems(userId, queryDto.limit);
  }

  @Get('profile')
  @ApiOperation({ summary: '获取推荐偏好画像' })
  @ApiResponse({ status: 200, description: '成功获取推荐偏好画像' })
  async getRecommendationProfile(@GetCurrentUserId() userId: number) {
    return this.recommendationService.getRecommendationProfile(userId);
  }

  @Get('trending')
  @Public()
  @ApiOperation({ summary: '获取热门推荐' })
  @ApiResponse({ status: 200, description: '成功获取热门推荐', type: [MediaResource] })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getTrending(@Query() queryDto: RecommendationQueryDto) {
    return this.recommendationService.getTrendingRecommendations(queryDto.limit);
  }

  @Get('latest')
  @Public()
  @ApiOperation({ summary: '获取最新推荐' })
  @ApiResponse({ status: 200, description: '成功获取最新推荐', type: [MediaResource] })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getLatest(@Query() queryDto: RecommendationQueryDto) {
    return this.recommendationService.getLatestRecommendations(queryDto.limit);
  }

  @Get('top-rated')
  @Public()
  @ApiOperation({ summary: '获取高分推荐' })
  @ApiResponse({ status: 200, description: '成功获取高分推荐', type: [MediaResource] })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async getTopRated(@Query() queryDto: RecommendationQueryDto) {
    return this.recommendationService.getTopRatedRecommendations(queryDto.limit);
  }
}
