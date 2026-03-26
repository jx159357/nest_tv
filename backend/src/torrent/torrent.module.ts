import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TorrentController } from './torrent.controller';
import { TorrentService } from './torrent.service';
import { PlaySource } from '../entities/play-source.entity';
import { MediaResource } from '../entities/media-resource.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PlaySource, MediaResource])],
  controllers: [TorrentController],
  providers: [TorrentService],
})
export class TorrentModule {}
