import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { DanmakuController } from './controllers/danmaku.controller';
import { Danmaku } from './entities/danmaku.entity';
import { DanmakuFilterRulesService } from './services/danmaku-filter-rules.service';
import { DanmakuService } from './services/danmaku.service';
import { DanmakuGateway } from '../gateway/danmaku.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Danmaku]), AuthModule, AdminModule],
  controllers: [DanmakuController],
  providers: [DanmakuService, DanmakuGateway, DanmakuFilterRulesService],
  exports: [DanmakuService, DanmakuGateway, DanmakuFilterRulesService],
})
export class DanmakuModule {}
