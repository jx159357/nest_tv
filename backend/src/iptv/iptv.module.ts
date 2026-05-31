import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IPTVService } from './iptv.service';
import { IPTVController } from './iptv.controller';
import { IPTVChannel } from '../entities/iptv-channel.entity';
import { ChannelLogo } from '../entities/channel-logo.entity';
import { StreamQualityTester } from './stream-quality-tester.service';
import { IptvSourceCollector } from './iptv-source-collector.service';
import { EpgService } from './epg.service';
import { ChannelLogoService } from './channel-logo.service';
import { IptvScheduler } from './iptv-scheduler.service';
import { HlsProxyService } from './hls-proxy.service';

@Module({
  imports: [TypeOrmModule.forFeature([IPTVChannel, ChannelLogo])],
  controllers: [IPTVController],
  providers: [
    IPTVService,
    StreamQualityTester,
    IptvSourceCollector,
    EpgService,
    ChannelLogoService,
    IptvScheduler,
    HlsProxyService,
  ],
  exports: [
    IPTVService,
    StreamQualityTester,
    IptvSourceCollector,
    EpgService,
    ChannelLogoService,
    IptvScheduler,
    HlsProxyService,
  ],
})
export class IPTVModule {}
