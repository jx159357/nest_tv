import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { Recommendation } from '../entities/recommendation.entity';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { User } from '../entities/user.entity';
import { MediaResource } from '../entities/media-resource.entity';
import { WatchHistory } from '../entities/watch-history.entity';
import { MediaResourceModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recommendation, User, MediaResource, WatchHistory]),
    MediaResourceModule,
    CacheModule.register(),
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
