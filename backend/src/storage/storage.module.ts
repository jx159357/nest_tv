import { Module, Global } from '@nestjs/common';
import { LocalStorageAdapter } from './local-storage.adapter';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [LocalStorageAdapter, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
