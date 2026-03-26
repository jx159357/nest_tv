import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CrawlerSchedulerService } from './crawler-scheduler.service';
import { DailySourceCollectionService } from './daily-source-collection.service';
import { SchedulerController } from './scheduler.controller';
import { CrawlerModule } from '../crawler/crawler.module';
import { MediaResourceModule } from '../media/media.module';
import { DataCollectionModule } from '../data-collection/data-collection.module';
import { PlaySourceModule } from '../play-sources/play-source.module';
import { AppLoggerService } from '../common/services/app-logger.service';

/**
 * 调度模块
 * 处理定时任务和调度相关的功能
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    CrawlerModule,
    MediaResourceModule,
    DataCollectionModule,
    PlaySourceModule,
  ],
  controllers: [SchedulerController],
  providers: [CrawlerSchedulerService, DailySourceCollectionService, AppLoggerService],
  exports: [CrawlerSchedulerService],
})
export class SchedulerModule {}
