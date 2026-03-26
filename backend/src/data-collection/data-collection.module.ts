import { Module } from '@nestjs/common';
import { DataCollectionController } from './data-collection.controller';
import { DataCollectionService } from './data-collection.service';
import { MediaResourceModule } from '../media/media.module';
import { PlaySourceModule } from '../play-sources/play-source.module';
import { ProxyPoolModule } from '../modules/proxy-pool/proxy-pool.module';

@Module({
  imports: [MediaResourceModule, PlaySourceModule, ProxyPoolModule],
  controllers: [DataCollectionController],
  providers: [DataCollectionService],
  exports: [DataCollectionService],
})
export class DataCollectionModule {}
