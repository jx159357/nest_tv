import { Module } from '@nestjs/common';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { MediaResourceModule } from '../media/media.module';
import { RecommendationModule } from '../recommendations/recommendation.module';

@Module({
  imports: [MediaResourceModule, RecommendationModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
