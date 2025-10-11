import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { MediaResourceModule } from '../media/media.module';
import { CommonModule } from '../common/common.module';
import { CrawlerController } from './crawler.controller';

@Module({
  imports: [MediaResourceModule, CommonModule],
  controllers: [CrawlerController],
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
