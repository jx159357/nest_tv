import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

// webtorrent 是 ESM 模块，需要动态 import
let WebTorrentModule: any = null;

interface ActiveTorrent {
  torrent: any;
  clients: Set<string>;
  addedAt: number;
}

@Injectable()
export class TorrentStreamService implements OnModuleDestroy, OnModuleInit {
  private readonly logger = new Logger(TorrentStreamService.name);
  private client: any = null;
  private readonly activeTorrents = new Map<string, ActiveTorrent>();
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000;
  private readonly TORRENT_TIMEOUT = 30 * 60 * 1000;
  private cleanupTimer: ReturnType<typeof setInterval>;

  async onModuleInit() {
    try {
      WebTorrentModule = await import('webtorrent');
      const WebTorrent = WebTorrentModule.default || WebTorrentModule;
      this.client = new WebTorrent();
      this.logger.log('WebTorrent 客户端初始化成功');
    } catch (error) {
      this.logger.error('WebTorrent 初始化失败（磁力播放不可用）', error);
    }
    this.cleanupTimer = setInterval(() => this.cleanupStaleTorrents(), this.CLEANUP_INTERVAL);
  }

  onModuleDestroy() {
    clearInterval(this.cleanupTimer);
    if (this.client) {
      this.client.destroy((err: any) => {
        if (err) {
          this.logger.error('WebTorrent 客户端销毁失败', err);
        }
      });
    }
  }

  private ensureClient() {
    if (!this.client) {
      throw new Error('WebTorrent 客户端未初始化，请稍后重试');
    }
  }

  async getTorrentInfo(magnetUri: string): Promise<{
    infoHash: string;
    name: string;
    files: Array<{ name: string; length: number; index: number }>;
  }> {
    this.ensureClient();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('获取种子信息超时（30秒）'));
      }, 30000);

      const torrent = this.client.add(magnetUri, { destroyStoreOnDestroy: false });

      torrent.on('ready', () => {
        clearTimeout(timeout);
        const info = {
          infoHash: torrent.infoHash,
          name: torrent.name,
          files: torrent.files.map((f: any, i: number) => ({
            name: f.name,
            length: f.length,
            index: i,
          })),
        };
        torrent.destroy();
        resolve(info);
      });

      torrent.on('error', (err: any) => {
        clearTimeout(timeout);
        torrent.destroy();
        reject(err);
      });
    });
  }

  async createStream(
    magnetUri: string,
    fileIndex: number = 0,
  ): Promise<{
    stream: NodeJS.ReadableStream;
    mimeType: string;
    fileSize: number;
    fileName: string;
    torrent: any;
  }> {
    this.ensureClient();
    const torrent = await this.getOrAddTorrent(magnetUri);

    if (!torrent.files || torrent.files.length === 0) {
      throw new Error('种子中没有文件');
    }

    const file = this.selectVideoFile(torrent.files, fileIndex);
    const mimeType = this.getMimeType(file.name);

    this.logger.log(`开始流式传输: ${file.name} (${(file.length / 1024 / 1024).toFixed(1)} MB)`);

    return {
      stream: file.createReadStream(),
      mimeType,
      fileSize: file.length,
      fileName: file.name,
      torrent,
    };
  }

  private async getOrAddTorrent(magnetUri: string): Promise<any> {
    const parsed = this.parseMagnetHash(magnetUri);
    const existing = this.activeTorrents.get(parsed);

    if (existing) {
      existing.clients.add('stream');
      this.logger.log(`复用已有种子: ${parsed}`);
      return existing.torrent;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('添加种子超时（60秒）'));
      }, 60000);

      const torrent = this.client.add(magnetUri);

      torrent.on('ready', () => {
        clearTimeout(timeout);
        this.activeTorrents.set(torrent.infoHash, {
          torrent,
          clients: new Set(['stream']),
          addedAt: Date.now(),
        });
        this.logger.log(`种子已就绪: ${torrent.name} (${torrent.files.length} 个文件)`);
        resolve(torrent);
      });

      torrent.on('error', (err: any) => {
        clearTimeout(timeout);
        torrent.destroy();
        reject(err);
      });
    });
  }

  private selectVideoFile(files: any[], fileIndex: number): any {
    if (fileIndex >= 0 && fileIndex < files.length) {
      return files[fileIndex];
    }

    const videoExts = ['.mp4', '.mkv', '.avi', '.wmv', '.flv', '.mov', '.webm', '.ts'];
    const videoFiles = files.filter((f: any) =>
      videoExts.some(ext => f.name.toLowerCase().endsWith(ext)),
    );

    if (videoFiles.length > 0) {
      return videoFiles.reduce((a: any, b: any) => (a.length > b.length ? a : b));
    }

    return files.reduce((a: any, b: any) => (a.length > b.length ? a : b));
  }

  private getMimeType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();
    const mimeMap: Record<string, string> = {
      mp4: 'video/mp4',
      mkv: 'video/x-matroska',
      avi: 'video/x-msvideo',
      wmv: 'video/x-ms-wmv',
      flv: 'video/x-flv',
      mov: 'video/quicktime',
      webm: 'video/webm',
      ts: 'video/mp2t',
    };
    return mimeMap[ext || ''] || 'video/mp4';
  }

  private parseMagnetHash(magnetUri: string): string {
    const match = magnetUri.match(/btih:([a-fA-F0-9]{40})/i);
    if (match) return match[1].toLowerCase();
    const match32 = magnetUri.match(/btih:([a-zA-Z2-7]{32})/i);
    if (match32) return match32[1].toLowerCase();
    return magnetUri.slice(0, 40);
  }

  private cleanupStaleTorrents() {
    const now = Date.now();
    for (const [hash, entry] of this.activeTorrents) {
      if (now - entry.addedAt > this.TORRENT_TIMEOUT && entry.clients.size === 0) {
        entry.torrent.destroy();
        this.activeTorrents.delete(hash);
        this.logger.log(`清理过期种子: ${hash}`);
      }
    }
  }

  releaseTorrent(infoHash: string, clientId: string = 'stream') {
    const entry = this.activeTorrents.get(infoHash);
    if (entry) {
      entry.clients.delete(clientId);
      if (entry.clients.size === 0) {
        setTimeout(() => {
          const current = this.activeTorrents.get(infoHash);
          if (current && current.clients.size === 0) {
            current.torrent.destroy();
            this.activeTorrents.delete(infoHash);
            this.logger.log(`释放种子: ${infoHash}`);
          }
        }, 60000);
      }
    }
  }

  getStats() {
    return {
      activeTorrents: this.activeTorrents.size,
      torrents: Array.from(this.activeTorrents.entries()).map(([hash, entry]) => ({
        infoHash: hash,
        name: entry.torrent.name,
        progress: entry.torrent.progress,
        downloadSpeed: entry.torrent.downloadSpeed,
        uploadSpeed: entry.torrent.uploadSpeed,
        numPeers: entry.torrent.numPeers,
        clients: entry.clients.size,
      })),
    };
  }
}
