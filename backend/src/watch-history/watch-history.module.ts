import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchHistoryService } from './watch-history.service';
import { WatchHistoryController } from './watch-history.controller';
import { WatchHistory } from '../entities/watch-history.entity';
import { User } from '../entities/user.entity';
import { MediaResource } from '../entities/media-resource.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WatchHistory, User, MediaResource])],
  controllers: [WatchHistoryController],
  providers: [WatchHistoryService],
  exports: [WatchHistoryService],
})
export class WatchHistoryModule {}
