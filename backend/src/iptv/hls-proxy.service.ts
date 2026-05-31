import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import type { Response } from 'express';

interface HlsSegment {
  url: string;
  duration: number;
  title?: string;
}

interface HlsManifest {
  version?: number;
  targetDuration?: number;
  mediaSequence?: number;
  segments: HlsSegment[];
  playlists?: Array<{ url: string; bandwidth: number; resolution?: string }>;
  isMaster: boolean;
}

interface ProxyOptions {
  enableCache?: boolean;
  cacheTtl?: number;
  maxRetries?: number;
  timeout?: number;
  followRedirects?: boolean;
}

const DEFAULT_OPTIONS: ProxyOptions = {
  enableCache: false,
  cacheTtl: 60,
  maxRetries: 3,
  timeout: 30000,
  followRedirects: true,
};

@Injectable()
export class HlsProxyService implements OnModuleDestroy {
  private readonly logger = new Logger(HlsProxyService.name);
  private segmentCache: Map<
    string,
    { data: Buffer; timestamp: number; contentType: string; ttl: number }
  > = new Map();
  private readonly CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5分钟清理一次
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanupCache(), this.CACHE_CLEANUP_INTERVAL);
  }

  onModuleDestroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 代理HLS流请求
   */
  async proxyHlsStream(url: string, res: Response, options: ProxyOptions = {}): Promise<void> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const decodedUrl = this.decodeUnicodeUrl(url);

    try {
      // 检查缓存
      if (opts.enableCache) {
        const cached = this.getFromCache(decodedUrl);
        if (cached) {
          this.sendResponse(res, cached.data, cached.contentType);
          return;
        }
      }

      // 获取远程内容
      const response = await this.fetchWithRetry(decodedUrl, opts);

      const contentType = (response.headers['content-type'] || '').toLowerCase();
      const data = Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data);

      // 判断是否是M3U8内容
      const isM3u8 = this.isM3u8Content(contentType, data);

      if (isM3u8) {
        // 保留原始 HLS 标签，只重写其中的媒体、子清单和密钥 URL。
        const rewritten = this.rewriteM3u8Content(data.toString('utf-8'), decodedUrl);
        const rewrittenBuffer = Buffer.from(rewritten, 'utf-8');

        // 缓存M3U8（短时间）
        if (opts.enableCache) {
          this.setCache(decodedUrl, rewrittenBuffer, 'application/vnd.apple.mpegurl', 10);
        }

        this.sendResponse(res, rewrittenBuffer, 'application/vnd.apple.mpegurl');
      } else {
        // 普通流内容（.ts分片等）
        if (opts.enableCache) {
          this.setCache(decodedUrl, data, contentType || 'video/mp2t', opts.cacheTtl || 60);
        }

        this.sendResponse(res, data, contentType || 'video/mp2t');
      }
    } catch (error: unknown) {
      this.handleProxyError(error, decodedUrl, res);
    }
  }

  /**
   * 代理AES-128密钥请求
   */
  async proxyKeyRequest(url: string, res: Response): Promise<void> {
    const decodedUrl = this.decodeUnicodeUrl(url);

    try {
      const response = await axios.get(decodedUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: this.getReferer(decodedUrl),
        },
      });

      this.sendResponse(res, Buffer.from(response.data), 'application/octet-stream');
    } catch {
      this.logger.error(`代理密钥请求失败: ${decodedUrl}`);
      res.status(502).json({ error: '代理密钥请求失败' });
    }
  }

  /**
   * 解析M3U8内容
   */
  private parseM3u8(content: string): HlsManifest {
    const lines = content
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    const manifest: HlsManifest = {
      segments: [],
      isMaster: false,
    };

    let currentDuration = 0;
    let currentTitle: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('#EXT-X-VERSION:')) {
        manifest.version = parseInt(line.split(':')[1]);
      } else if (line.startsWith('#EXT-X-TARGETDURATION:')) {
        manifest.targetDuration = parseInt(line.split(':')[1]);
      } else if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
        manifest.mediaSequence = parseInt(line.split(':')[1]);
      } else if (line.startsWith('#EXTINF:')) {
        const match = line.match(/#EXTINF:([0-9.]+),?(.*)?/);
        if (match) {
          currentDuration = parseFloat(match[1]);
          currentTitle = match[2] || undefined;
        }
      } else if (line.startsWith('#EXT-X-STREAM-INF:')) {
        manifest.isMaster = true;
        const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
        const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/);

        if (i + 1 < lines.length && !lines[i + 1].startsWith('#')) {
          manifest.playlists = manifest.playlists || [];
          manifest.playlists.push({
            url: lines[i + 1],
            bandwidth: bandwidthMatch ? parseInt(bandwidthMatch[1]) : 0,
            resolution: resolutionMatch ? resolutionMatch[1] : undefined,
          });
        }
      } else if (line.startsWith('#')) {
        // 其他标签，忽略
      } else if (line.startsWith('http') || !line.startsWith('#')) {
        // 媒体分片URL
        manifest.segments.push({
          url: line,
          duration: currentDuration,
          title: currentTitle,
        });
        currentDuration = 0;
        currentTitle = undefined;
      }
    }

    return manifest;
  }

  /**
   * 重写M3U8内容，将URL代理化
   */
  private rewriteManifest(manifest: HlsManifest, baseUrl: string): string {
    const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
    let base: URL;
    try {
      base = new URL(baseUrl);
    } catch {
      return '';
    }

    let output = '#EXTM3U\n';

    if (manifest.version) {
      output += `#EXT-X-VERSION:${manifest.version}\n`;
    }

    if (manifest.targetDuration) {
      output += `#EXT-X-TARGETDURATION:${manifest.targetDuration}\n`;
    }

    if (manifest.mediaSequence !== undefined) {
      output += `#EXT-X-MEDIA-SEQUENCE:${manifest.mediaSequence}\n`;
    }

    if (manifest.isMaster && manifest.playlists) {
      // Master playlist
      for (const playlist of manifest.playlists) {
        const attrs: string[] = [];
        if (playlist.bandwidth) {
          attrs.push(`BANDWIDTH=${playlist.bandwidth}`);
        }
        if (playlist.resolution) {
          attrs.push(`RESOLUTION=${playlist.resolution}`);
        }
        output += `#EXT-X-STREAM-INF:${attrs.join(',')}\n`;
        output += `${this.resolveUrl(playlist.url, basePath, base)}\n`;
      }
    } else {
      // Media playlist
      for (const segment of manifest.segments) {
        if (segment.duration > 0) {
          output += `#EXTINF:${segment.duration.toFixed(3)},${segment.title || ''}\n`;
        }
        output += `${this.resolveUrl(segment.url, basePath, base)}\n`;
      }

      // 添加结束标记（如果没有）
      if (!output.includes('#EXT-X-ENDLIST')) {
        output += '#EXT-X-ENDLIST\n';
      }
    }

    return output;
  }

  /**
   * 解析URL为代理URL
   */
  private resolveUrl(url: string, basePath: string, base: URL): string {
    let absolute: string;

    if (url.startsWith('http://') || url.startsWith('https://')) {
      absolute = url;
    } else if (url.startsWith('/')) {
      absolute = `${base.protocol}//${base.host}${url}`;
    } else {
      absolute = basePath + url;
    }

    // 判断是否是密钥文件
    if (absolute.endsWith('.key') || absolute.includes('key')) {
      return `../key/proxy?url=${encodeURIComponent(absolute)}`;
    }

    return `proxy?url=${encodeURIComponent(absolute)}`;
  }

  private rewriteM3u8Content(content: string, baseUrl: string): string {
    const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
    let base: URL;
    try {
      base = new URL(baseUrl);
    } catch {
      return content;
    }

    return content
      .split('\n')
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) {
          return line;
        }

        if (trimmed.startsWith('#')) {
          return line.replace(/(URI=)(["']?)([^"',\s]+)(["']?)/g, (_match, prefix, open, uri, close) => {
            const resolved = this.resolveUrl(String(uri), basePath, base);
            return `${prefix}${open}${resolved}${close}`;
          });
        }

        return this.resolveUrl(trimmed, basePath, base);
      })
      .join('\n');
  }

  /**
   * 带重试的请求
   */
  private async fetchWithRetry(url: string, options: ProxyOptions): Promise<AxiosResponse> {
    let lastError: Error | null = null;
    const maxRetries = options.maxRetries || 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: options.timeout || 30000,
          maxRedirects: options.followRedirects ? 5 : 0,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            Referer: this.getReferer(url),
            Accept: '*/*',
          },
          validateStatus: status => status >= 200 && status < 400,
        });

        return response;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries) {
          this.logger.warn(`请求失败，第${attempt}次重试: ${url}`);
          await this.sleep(1000 * attempt);
        }
      }
    }

    throw lastError || new Error('请求失败');
  }

  /**
   * 判断是否是M3U8内容
   */
  private isM3u8Content(contentType: string, data: Buffer): boolean {
    // 检查Content-Type
    if (contentType.includes('mpegurl') || contentType.includes('m3u8')) {
      return true;
    }

    // 检查内容开头
    const contentStart = data.slice(0, 20).toString('utf-8').trim();
    return contentStart.startsWith('#EXTM3U');
  }

  /**
   * 发送响应
   */
  private sendResponse(res: Response, data: Buffer, contentType: string): void {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Content-Type': contentType,
      'Content-Length': data.length.toString(),
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  }

  /**
   * 处理代理错误
   */
  private handleProxyError(error: unknown, url: string, res: Response): void {
    const axiosErr = error as any;
    const statusCode = axiosErr?.response?.status;
    const message = error instanceof Error ? error.message : '未知错误';

    this.logger.error(`代理请求失败: ${url} (状态码: ${statusCode || 'N/A'})`, message);

    if (statusCode === 404) {
      res.status(404).json({ error: '资源不存在或已过期' });
    } else if (statusCode === 403) {
      res.status(403).json({ error: '访问被拒绝' });
    } else if (statusCode === 429) {
      res.status(429).json({ error: '请求过于频繁' });
    } else {
      res.status(502).json({ error: '代理请求失败' });
    }
  }

  /**
   * 获取Referer
   */
  private getReferer(url: string): string {
    try {
      return new URL(url).origin + '/';
    } catch {
      return 'https://www.google.com/';
    }
  }

  /**
   * 解码Unicode URL
   */
  private decodeUnicodeUrl(url: string): string {
    try {
      return url.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      );
    } catch {
      return url;
    }
  }

  /**
   * 缓存相关方法
   */
  private getFromCache(url: string): { data: Buffer; contentType: string } | null {
    const cached = this.segmentCache.get(url);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl * 1000) {
      this.segmentCache.delete(url);
      return null;
    }

    return { data: cached.data, contentType: cached.contentType };
  }

  private setCache(url: string, data: Buffer, contentType: string, ttlSeconds: number): void {
    this.segmentCache.set(url, {
      data,
      timestamp: Date.now(),
      contentType,
      ttl: ttlSeconds,
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [url, cached] of this.segmentCache.entries()) {
      if (now - cached.timestamp > cached.ttl * 1000) {
        this.segmentCache.delete(url);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`清理了 ${cleaned} 个过期缓存`);
    }
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.segmentCache.size,
      entries: this.segmentCache.size,
    };
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.segmentCache.clear();
    this.logger.log('HLS缓存已清除');
  }
}
