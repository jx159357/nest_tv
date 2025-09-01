import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IPTVService } from './iptv.service';
import { IPTVController } from './iptv.controller';
import { IPTVChannel } from '../entities/iptv-channel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([IPTVChannel])],
  controllers: [IPTVController],
  providers: [IPTVService],
  exports: [IPTVService],
})
export class IPTVModule {}