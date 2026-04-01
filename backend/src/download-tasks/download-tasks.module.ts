import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownloadTask } from '../entities/download-task.entity';
import { DownloadTasksController } from './download-tasks.controller';
import { DownloadTasksService } from './download-tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([DownloadTask])],
  controllers: [DownloadTasksController],
  providers: [DownloadTasksService],
  exports: [DownloadTasksService],
})
export class DownloadTasksModule {}
