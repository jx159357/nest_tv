import { Injectable, Optional } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageAdapter, StorageFile, UploadOptions } from './storage.adapter';

@Injectable()
export class LocalStorageAdapter extends StorageAdapter {
  private readonly baseDir: string;
  private readonly baseUrl: string;

  constructor(@Optional() baseDir?: string, @Optional() baseUrl?: string) {
    super();
    this.baseDir = path.resolve(baseDir || './uploads');
    this.baseUrl = baseUrl || '/uploads';
  }

  async upload(key: string, data: Buffer, options?: UploadOptions): Promise<StorageFile> {
    const filePath = this.getFilePath(key);
    const dir = path.dirname(filePath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, data);

    return {
      key,
      url: this.getPublicUrl(key),
      size: data.length,
      contentType: options?.contentType,
      lastModified: new Date(),
    };
  }

  async download(key: string): Promise<Buffer> {
    const filePath = this.getFilePath(key);
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getUrl(key: string): Promise<string> {
    return this.getPublicUrl(key);
  }

  async list(prefix?: string): Promise<StorageFile[]> {
    const dir = prefix ? path.join(this.baseDir, prefix) : this.baseDir;
    const files: StorageFile[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });
      for (const entry of entries) {
        if (entry.isFile()) {
          const fullPath = path.join(entry.parentPath ?? entry.path, entry.name);
          const stat = await fs.stat(fullPath);
          const relativePath = path.relative(this.baseDir, fullPath).replace(/\\/g, '/');
          files.push({
            key: relativePath,
            url: this.getPublicUrl(relativePath),
            size: stat.size,
            lastModified: stat.mtime,
          });
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return files;
  }

  private getFilePath(key: string): string {
    const normalized = key.replace(/\\/g, '/').replace(/\.\./g, '');
    return path.join(this.baseDir, normalized);
  }

  private getPublicUrl(key: string): string {
    return `${this.baseUrl}/${key.replace(/\\/g, '/')}`;
  }
}
