import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CrawlerSchedulerService } from './crawler-scheduler.service';
import { CrawlerModule } from '../crawler/crawler.module';
import { MediaResourceModule } from '../media/media.module';
import { AppLoggerService } from '../common/services/app-logger.service';

/**
 * 调度模块
 * 处理定时任务和调度相关的功能
 */
@Module({
  imports: [ScheduleModule.forRoot(), CrawlerModule, MediaResourceModule],
  providers: [CrawlerSchedulerService, AppLoggerService],
  exports: [CrawlerSchedulerService],
})
export class SchedulerModule {}
