export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  isPublic?: boolean;
}

export interface StorageFile {
  key: string;
  url: string;
  size: number;
  contentType?: string;
  lastModified?: Date;
}

export abstract class StorageAdapter {
  abstract upload(key: string, data: Buffer, options?: UploadOptions): Promise<StorageFile>;
  abstract download(key: string): Promise<Buffer>;
  abstract delete(key: string): Promise<void>;
  abstract exists(key: string): Promise<boolean>;
  abstract getUrl(key: string): Promise<string>;
  abstract list(prefix?: string): Promise<StorageFile[]>;
}
