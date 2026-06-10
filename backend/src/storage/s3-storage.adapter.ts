import { Injectable, Logger, Optional } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { StorageAdapter, StorageFile, UploadOptions } from './storage.adapter';

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicUrl?: string;
  forcePathStyle?: boolean;
}

@Injectable()
export class S3StorageAdapter extends StorageAdapter {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly config: S3Config;
  private readonly client: S3Client;

  constructor(@Optional() config?: S3Config) {
    super();
    this.config = config ?? {
      region: process.env.S3_REGION ?? 'us-east-1',
      bucket: process.env.S3_BUCKET ?? 'nest-tv',
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
      endpoint: process.env.S3_ENDPOINT,
      publicUrl: process.env.S3_PUBLIC_URL,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    };

    const clientOptions: ConstructorParameters<typeof S3Client>[0] = {
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    };

    // Custom endpoint for MinIO, Cloudflare R2, or other S3-compatible services
    if (this.config.endpoint) {
      clientOptions.endpoint = this.config.endpoint;
    }

    // path-style is required for most S3-compatible services (MinIO, etc.)
    if (this.config.forcePathStyle !== undefined) {
      clientOptions.forcePathStyle = this.config.forcePathStyle;
    }

    this.client = new S3Client(clientOptions);
    this.logger.log(
      `S3StorageAdapter initialized: bucket=${this.config.bucket}, region=${this.config.region}` +
        (this.config.endpoint ? `, endpoint=${this.config.endpoint}` : ''),
    );
  }

  async upload(key: string, data: Buffer, options?: UploadOptions): Promise<StorageFile> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: data,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
      ACL: options?.isPublic ? 'public-read' : undefined,
    });

    try {
      await this.client.send(command);
      const url = await this.getUrl(key);
      this.logger.debug(`Uploaded object: ${key} (${data.length} bytes)`);
      return {
        key,
        url,
        size: data.length,
        contentType: options?.contentType,
        lastModified: new Date(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to upload object "${key}": ${message}`);
      throw new Error(`S3 upload failed for key "${key}": ${message}`);
    }
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    try {
      const result = await this.client.send(command);
      const chunks: Uint8Array[] = [];
      const stream = result.Body as AsyncIterable<Uint8Array>;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);
      this.logger.debug(`Downloaded object: ${key} (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to download object "${key}": ${message}`);
      throw new Error(`S3 download failed for key "${key}": ${message}`);
    }
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    try {
      await this.client.send(command);
      this.logger.debug(`Deleted object: ${key}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete object "${key}": ${message}`);
      throw new Error(`S3 delete failed for key "${key}": ${message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    try {
      await this.client.send(command);
      return true;
    } catch (error: unknown) {
      // NoSuchKey or NotFound returns a 404
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        ((error as { name: string }).name === 'NotFound' ||
          (error as { name: string }).name === 'NoSuchKey' ||
          (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404)
      ) {
        return false;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to check existence of object "${key}": ${message}`);
      throw new Error(`S3 exists check failed for key "${key}": ${message}`);
    }
  }

  getUrl(key: string): Promise<string> {
    if (this.config.publicUrl) {
      return Promise.resolve(`${this.config.publicUrl}/${key}`);
    }
    if (this.config.endpoint) {
      // For S3-compatible services, build URL from the endpoint
      const endpoint = this.config.endpoint.replace(/\/$/, '');
      return Promise.resolve(`${endpoint}/${this.config.bucket}/${key}`);
    }
    return Promise.resolve(
      `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`,
    );
  }

  async list(prefix?: string): Promise<StorageFile[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.config.bucket,
      Prefix: prefix,
    });

    try {
      const result = await this.client.send(command);
      const files: StorageFile[] = [];

      if (result.Contents) {
        for (const item of result.Contents) {
          if (item.Key) {
            files.push({
              key: item.Key,
              url: await this.getUrl(item.Key),
              size: item.Size ?? 0,
              lastModified: item.LastModified,
            });
          }
        }
      }

      this.logger.debug(`Listed ${files.length} objects with prefix: ${prefix ?? '/'}`);
      return files;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to list objects with prefix "${prefix}": ${message}`);
      throw new Error(`S3 list failed for prefix "${prefix ?? ''}": ${message}`);
    }
  }
}
