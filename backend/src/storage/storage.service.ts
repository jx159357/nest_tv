import { Injectable, Logger } from '@nestjs/common';
import { StorageAdapter, StorageFile, UploadOptions } from './storage.adapter';
import { LocalStorageAdapter } from './local-storage.adapter';

export type StorageProvider = 'local' | 's3';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly adapters: Map<string, StorageAdapter> = new Map();
  private defaultProvider: StorageProvider = 'local';

  constructor(private readonly localStorage: LocalStorageAdapter) {
    this.adapters.set('local', localStorage);
    this.logger.log('StorageService initialized with local adapter');
  }

  registerAdapter(provider: StorageProvider, adapter: StorageAdapter): void {
    this.adapters.set(provider, adapter);
    this.logger.log(`Registered storage adapter: ${provider}`);
  }

  setDefaultProvider(provider: StorageProvider): void {
    if (!this.adapters.has(provider)) {
      throw new Error(`Storage adapter '${provider}' not registered`);
    }
    this.defaultProvider = provider;
    this.logger.log(`Default storage provider set to: ${provider}`);
  }

  getAdapter(provider?: StorageProvider): StorageAdapter {
    const name = provider ?? this.defaultProvider;
    const adapter = this.adapters.get(name);
    if (!adapter) {
      throw new Error(`Storage adapter '${name}' not found`);
    }
    return adapter;
  }

  async upload(
    key: string,
    data: Buffer,
    options?: UploadOptions & { provider?: StorageProvider },
  ): Promise<StorageFile> {
    const adapter = this.getAdapter(options?.provider);
    const result = await adapter.upload(key, data, options);
    this.logger.debug(`Uploaded: ${key} (${result.size} bytes)`);
    return result;
  }

  async download(key: string, provider?: StorageProvider): Promise<Buffer> {
    return this.getAdapter(provider).download(key);
  }

  async delete(key: string, provider?: StorageProvider): Promise<void> {
    await this.getAdapter(provider).delete(key);
    this.logger.debug(`Deleted: ${key}`);
  }

  async exists(key: string, provider?: StorageProvider): Promise<boolean> {
    return this.getAdapter(provider).exists(key);
  }

  async getUrl(key: string, provider?: StorageProvider): Promise<string> {
    return this.getAdapter(provider).getUrl(key);
  }

  async list(prefix?: string, provider?: StorageProvider): Promise<StorageFile[]> {
    return this.getAdapter(provider).list(prefix);
  }
}
