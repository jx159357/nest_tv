import { Module, forwardRef } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { CrawlerSchedulerService } from '../scheduler/crawler-scheduler.service';
import { MediaResourceModule } from '../media/media.module';
import { CommonModule } from '../common/common.module';
import { CrawlerController } from './crawler.controller';
import { ProxyPoolModule } from '../modules/proxy-pool/proxy-pool.module';
import { PlaySourceModule } from '../play-sources/play-source.module';
import { AppLoggerService } from '../common/services/app-logger.service';

@Module({
  imports: [MediaResourceModule, PlaySourceModule, CommonModule, ProxyPoolModule],
  controllers: [CrawlerController],
  providers: [CrawlerService, CrawlerSchedulerService, AppLoggerService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
