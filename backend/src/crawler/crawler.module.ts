import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { MediaResourceModule } from '../media/media.module';
import { CrawlerController } from './crawler.controller';

@Module({
  imports: [MediaResourceModule],
  controllers: [CrawlerController],
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
