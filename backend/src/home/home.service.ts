import { Injectable } from '@nestjs/common';
import { MediaResourceService } from '../media/media-resource.service';
import { RecommendationService } from '../recommendations/recommendation.service';
import { MediaResource } from '../entities/media-resource.entity';

export interface HomeBootstrapData {
  popular: MediaResource[];
  latest: MediaResource[];
  topRated: MediaResource[];
}

@Injectable()
export class HomeService {
  constructor(
    private readonly mediaResourceService: MediaResourceService,
    private readonly recommendationService: RecommendationService,
  ) {}

  async getBootstrapData(limit: number = 8): Promise<HomeBootstrapData> {
    const [popular, latest, topRated] = await Promise.all([
      this.mediaResourceService.getPopular(limit),
      this.mediaResourceService.getLatest(limit),
      this.recommendationService.getTopRatedRecommendations(limit),
    ]);

    return { popular, latest, topRated };
  }
}
