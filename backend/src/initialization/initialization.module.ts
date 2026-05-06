import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitializationService } from './initialization.service';
import { MediaResourceModule } from '../media/media.module';
import { PlaySourceModule } from '../play-sources/play-source.module';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User]), MediaResourceModule, PlaySourceModule],
  providers: [InitializationService],
  exports: [InitializationService],
})
export class InitializationModule {}
