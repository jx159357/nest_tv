import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaySourceService } from './play-source.service';
import { PlaySourceController } from './play-source.controller';
import { PlaySource } from '../entities/play-source.entity';
import { MediaResource } from '../entities/media-resource.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlaySource, MediaResource]),
  ],
  controllers: [PlaySourceController],
  providers: [PlaySourceService],
  exports: [PlaySourceService],
})
export class PlaySourceModule {}