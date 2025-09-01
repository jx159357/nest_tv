import { Module } from '@nestjs/common';
import { TorrentController } from './torrent.controller';
import { TorrentService } from '../common/services/torrent.service';
import { AppLoggerService } from '../common/services/app-logger.service';

@Module({
  controllers: [TorrentController],
  providers: [TorrentService, AppLoggerService],
  exports: [TorrentService],
})
export class TorrentModule {}