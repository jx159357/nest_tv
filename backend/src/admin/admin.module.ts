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

/**
 * 后台管理模块
 * 提供系统管理、用户管理、内容管理等功能
 */
@Module({
  imports: [
    // 导入TypeORM模块，用于数据库操作
    TypeOrmModule.forFeature([
      AdminRole,
      AdminPermission,
      AdminLog,
      User,
      MediaResource,
      PlaySource,
      WatchHistory,
      Recommendation,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
