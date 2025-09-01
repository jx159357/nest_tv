import { Module } from '@nestjs/common';
import { DataCollectionController } from './data-collection.controller';
import { DataCollectionService } from './data-collection.service';
import { AppLoggerService } from '../common/services/app-logger.service';

@Module({
  controllers: [DataCollectionController],
  providers: [DataCollectionService, AppLoggerService],
  exports: [DataCollectionService],
})
export class DataCollectionModule {}