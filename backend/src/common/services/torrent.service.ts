import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
// 使用动态导入避免ESM模块问题
let WebTorrent: any;
let magnetUri: any;

try {
  WebTorrent = require('webtorrent');
  magnetUri = require('magnet-uri');
} catch (error) {
  console.warn('Torrent dependencies not available, torrent functionality will be disabled');
}
// import { PlaySource } from '../entities/play-source.entity';

@Injectable()
export class TorrentService {
  private readonly logger = new Logger(TorrentService.name);
  private client: any;

  constructor() {
    if (!WebTorrent) {
      this.logger.warn('WebTorrent not available, torrent functionality disabled');
      return;
    }
    
    this.client = new WebTorrent({
      tracker: true,
      dht: true,
      maxConns: 100,
      // trackerAnnounce: [
      //   'wss://tracker.openwebtorrent.com',
      //   'wss://tracker.btorrent.xyz',
      //   'wss://tracker.fastcast.nz',
      //   'wss://tracker.files.fm:7073/announce',
      // ],
    });

    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.client.on('error', (err) => {
      this.logger.error('WebTorrent client error:', err);
    });

    // this.client.on('warning', (warn) => {
    //   this.logger.warn('WebTorrent client warning:', warn);
    // });

    this.client.on('torrent', (torrent) => {
      this.logger.log(`New torrent added: ${torrent.name}`);
    });
  }

  /**
   * 解析磁力链接
   */
  parseMagnetUri(magnetUri: string): any {
    try {
      // const parsed = magnetUri(magnetUri as string);
      const parsed = { infoHash: 'temp' }; // 临时解决方案
      this.logger.log(`Parsed magnet URI: ${parsed.infoHash}`);
      return parsed;
    } catch (error) {
      this.logger.error('Failed to parse magnet URI:', error);
      throw new HttpException('无效的磁力链接', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 添加磁力链接
   */
  async addMagnet(magnetUri: string): Promise<{
    infoHash: string;
    name: string;
    length: number;
    files: any[];
    magnet: string;
  }> {
    try {
      this.logger.log(`Adding magnet: ${magnetUri}`);

      return new Promise((resolve, reject) => {
        const torrent = this.client.add(magnetUri);

        torrent.on('metadata', () => {
          this.logger.log(`Torrent metadata loaded: ${torrent.name}`);
          
          resolve({
            infoHash: torrent.infoHash,
            name: torrent.name,
            length: torrent.length,
            files: torrent.files.map(file => ({
              name: file.name,
              length: file.length,
              type: (file as any).type || 'unknown',
              path: file.path,
            })),
            magnet: torrent.magnetURI,
          });
        });

        torrent.on('error', (err) => {
          this.logger.error('Torrent error:', err);
          reject(new HttpException('磁力链接加载失败', HttpStatus.INTERNAL_SERVER_ERROR));
        });

        // 30秒超时
        setTimeout(() => {
          if (!(torrent as any).metadata) {
            this.logger.warn('Torrent metadata timeout');
            reject(new HttpException('磁力链接加载超时', HttpStatus.REQUEST_TIMEOUT));
          }
        }, 30000);
      });

    } catch (error) {
      this.logger.error('Failed to add magnet:', error);
      throw new HttpException('添加磁力链接失败', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 获取文件流
   */
  getFileStream(infoHash: string, fileIndex: number): NodeJS.ReadableStream | null {
    try {
      const torrent = this.client.get(infoHash);
      if (!torrent || !(torrent as any).files || !(torrent as any).files[fileIndex]) {
        return null;
      }

      const file = (torrent as any).files[fileIndex];
      const stream = file.createReadStream({
        start: 0,
        end: file.length,
      });

      this.logger.log(`Created stream for file: ${file.name}`);
      return stream;

    } catch (error) {
      this.logger.error('Failed to create file stream:', error);
      return null;
    }
  }

  /**
   * 获取磁力链接信息
   */
  getTorrentInfo(infoHash: string): any | null {
    try {
      const torrent = this.client.get(infoHash);
      if (!torrent) {
        return null;
      }

      return {
        infoHash: (torrent as any).infoHash,
        name: (torrent as any).name,
        length: (torrent as any).length,
        downloaded: (torrent as any).downloaded,
        uploaded: (torrent as any).uploaded,
        downloadSpeed: (torrent as any).downloadSpeed,
        uploadSpeed: (torrent as any).uploadSpeed,
        progress: (torrent as any).progress,
        ratio: (torrent as any).ratio,
        numPeers: (torrent as any).numPeers,
        timeRemaining: (torrent as any).timeRemaining,
        files: (torrent as any).files.map(file => ({
          name: file.name,
          length: file.length,
          type: (file as any).type || 'unknown',
          path: file.path,
          selected: (file as any).selected,
        })),
        magnet: (torrent as any).magnetURI,
      };

    } catch (error) {
      this.logger.error('Failed to get torrent info:', error);
      return null;
    }
  }

  /**
   * 搜索最大视频文件
   */
  findLargestVideoFile(infoHash: string): any | null {
    try {
      const torrent = this.client.get(infoHash);
      if (!torrent || !(torrent as any).files || !(torrent as any).files.length) {
        return null;
      }

      // 查找最大的视频文件
      const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm'];
      let largestFile: any = null;
      let maxSize = 0;

      for (let i = 0; i < (torrent as any).files.length; i++) {
        const file = (torrent as any).files[i];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (videoExtensions.includes(ext) && file.length > maxSize) {
          largestFile = {
            index: i,
            name: file.name,
            length: file.length,
            type: (file as any).type || 'unknown',
            path: file.path,
          };
          maxSize = file.length;
        }
      }

      return largestFile;

    } catch (error) {
      this.logger.error('Failed to find largest video file:', error);
      return null;
    }
  }

  /**
   * 移除磁力链接
   */
  removeTorrent(infoHash: string): boolean {
    try {
      const torrent = this.client.get(infoHash);
      if (torrent) {
        (torrent as any).destroy();
        this.logger.log(`Removed torrent: ${infoHash}`);
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('Failed to remove torrent:', error);
      return false;
    }
  }

  /**
   * 获取所有磁力链接信息
   */
  getAllTorrents(): any[] {
    try {
      return (this.client as any).torrents.map(torrent => ({
        infoHash: (torrent as any).infoHash,
        name: (torrent as any).name,
        length: (torrent as any).length,
        downloaded: (torrent as any).downloaded,
        uploaded: (torrent as any).uploaded,
        downloadSpeed: (torrent as any).downloadSpeed,
        uploadSpeed: (torrent as any).uploadSpeed,
        progress: (torrent as any).progress,
        ratio: (torrent as any).ratio,
        numPeers: (torrent as any).numPeers,
        timeRemaining: (torrent as any).timeRemaining,
        magnet: (torrent as any).magnetURI,
      }));
    } catch (error) {
      this.logger.error('Failed to get all torrents:', error);
      return [];
    }
  }

  /**
   * 检查磁力链接健康度
   */
  async checkMagnetHealth(magnetUri: string): Promise<{
    isHealthy: boolean;
    seeders: number;
    leechers: number;
    infoHash?: string;
  }> {
    try {
      const parsed = this.parseMagnetUri(magnetUri);
      
      return new Promise((resolve) => {
        const torrent = this.client.add(magnetUri);

        const timeout = setTimeout(() => {
          torrent.destroy();
          resolve({
            isHealthy: false,
            seeders: 0,
            leechers: 0,
          });
        }, 10000); // 10秒超时

        torrent.on('metadata', () => {
          clearTimeout(timeout);
          
          // 简单的健康度检查：如果metadata加载成功且有一些节点
          const isHealthy = torrent.numPeers > 0;
          
          torrent.destroy(); // 测试完成后销毁
          
          resolve({
            isHealthy,
            seeders: torrent.numPeers,
            leechers: 0, // WebTorrent不直接提供这个信息
            infoHash: torrent.infoHash,
          });
        });

        torrent.on('error', () => {
          clearTimeout(timeout);
          resolve({
            isHealthy: false,
            seeders: 0,
            leechers: 0,
          });
        });
      });

    } catch (error) {
      this.logger.error('Failed to check magnet health:', error);
      return {
        isHealthy: false,
        seeders: 0,
        leechers: 0,
      };
    }
  }

  /**
   * 生成直链播放地址
   */
  generatePlayUrl(infoHash: string, fileIndex: number): string {
    return `/api/play-sources/torrent/stream/${infoHash}/${fileIndex}`;
  }

  /**
   * 销毁所有磁力链接
   */
  destroyAll(): void {
    this.client.destroy();
    this.logger.log('All torrents destroyed');
  }
}