import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { MediaResourceModule } from '../media/media.module';
import { CommonModule } from '../common/common.module';
import { CrawlerController } from './crawler.controller';
import { ProxyPoolModule } from '../modules/proxy-pool/proxy-pool.module';
import { PlaySourceModule } from '../play-sources/play-source.module';

@Module({
  imports: [MediaResourceModule, PlaySourceModule, CommonModule, ProxyPoolModule],
  controllers: [CrawlerController],
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
