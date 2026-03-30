import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlaySourceService } from './play-source.service';
import { PlaySourceController } from './play-source.controller';
import { PlaySource } from '../entities/play-source.entity';
import { MediaResource } from '../entities/media-resource.entity';
import { CommonModule } from '../common/common.module';
import { ParseProvidersModule } from '../parse-providers/parse-providers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PlaySource, MediaResource]),
    CommonModule,
    ParseProvidersModule,
  ],
  controllers: [PlaySourceController],
  providers: [PlaySourceService],
  exports: [PlaySourceService],
})
export class PlaySourceModule {}
