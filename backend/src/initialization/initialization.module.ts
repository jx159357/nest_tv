import { Module } from '@nestjs/common';
import { InitializationService } from './initialization.service';
import { MediaResourceModule } from '../media/media.module';
import { PlaySourceModule } from '../play-sources/play-source.module';

@Module({
  imports: [MediaResourceModule, PlaySourceModule],
  providers: [InitializationService],
  exports: [InitializationService],
})
export class InitializationModule {}
