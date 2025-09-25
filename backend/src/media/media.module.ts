/*
 * @Descripttion:
 * @version:
 * @Author: jxwd
 * @Date: 2025-09-11 10:15:11
 * @LastEditors: jxwd
 * @LastEditTime: 2025-09-17 14:21:43
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaResourceService } from './media-resource.service';
import { MediaResourceController } from './media-resource.controller';
import { AdvancedSearchService } from './advanced-search.service';
import { AdvancedSearchController } from './advanced-search.controller';
import { MediaResource } from '../entities/media-resource.entity';
import { PlaySource } from '../entities/play-source.entity';
import { WatchHistory } from '../entities/watch-history.entity';
import { SearchHistory } from '../entities/search-history.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaResource, PlaySource, WatchHistory, SearchHistory]),
    CommonModule,
  ],
  controllers: [MediaResourceController, AdvancedSearchController],
  providers: [MediaResourceService, AdvancedSearchService],
  exports: [MediaResourceService, AdvancedSearchService],
})
export class MediaResourceModule {}
