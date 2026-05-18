import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminRole } from '../entities/admin-role.entity';
import { AdminPermission } from '../entities/admin-permission.entity';
import { AdminLog } from '../entities/admin-log.entity';
import { User } from '../entities/user.entity';
import { MediaResource } from '../entities/media-resource.entity';
import { PlaySource } from '../entities/play-source.entity';
import { WatchHistory } from '../entities/watch-history.entity';
import { Recommendation } from '../entities/recommendation.entity';
import { DownloadTask } from '../entities/download-task.entity';
import { CrawlerTarget } from '../entities/crawler-target.entity';
import { AdminRoleGuard } from './admin-role.guard';
import { CrawlerTargetInitService } from './crawler-target-init.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminRole,
      AdminPermission,
      AdminLog,
      User,
      MediaResource,
      PlaySource,
      WatchHistory,
      Recommendation,
      DownloadTask,
      CrawlerTarget,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminRoleGuard, CrawlerTargetInitService],
  exports: [AdminService],
})
export class AdminModule {}
