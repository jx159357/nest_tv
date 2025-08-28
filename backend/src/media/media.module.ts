import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaResourceService } from './media-resource.service';
import { MediaResourceController } from './media-resource.controller';
import { MediaResource } from '../entities/media-resource.entity';
import { PlaySource } from '../entities/play-source.entity';
import { WatchHistory } from '../entities/watch-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaResource, PlaySource, WatchHistory]),
  ],
  controllers: [MediaResourceController],
  providers: [MediaResourceService],
  exports: [MediaResourceService],
})
export class MediaResourceModule {}