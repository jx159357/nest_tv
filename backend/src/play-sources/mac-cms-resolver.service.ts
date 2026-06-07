import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

interface MacCmsSource {
  name: string;
  apiUrl: string;
  priority: number;
  supportSearch: boolean;
}

export interface ResolvedEpisode {
  episode: string;
  url: string;
  sourceName: string;
}

const MAC_CMS_SOURCES: MacCmsSource[] = [
  {
    name: '光速资源',
    apiUrl: 'https://api.guangsuapi.com/api.php/provide/vod/at/json',
    priority: 1,
    supportSearch: true,
  },
  {
    name: '量子资源',
    apiUrl: 'https://cj.lziapi.com/api.php/provide/vod/at/json',
    priority: 2,
    supportSearch: true,
  },
  {
    name: '1080资源',
    apiUrl: 'https://api.1080zyku.com/inc/apijson.php',
    priority: 3,
    supportSearch: true,
  },
  {
    name: '暴风资源',
    apiUrl: 'https://bfzyapi.com/api.php/provide/vod/at/json',
    priority: 4,
    supportSearch: true,
  },
  {
    name: '红牛资源',
    apiUrl: 'https://www.hongniuzy2.com/api.php/provide/vod/at/json',
    priority: 5,
    supportSearch: true,
  },
  {
    name: '闪电资源',
    apiUrl: 'https://sdzyapi.com/api.php/provide/vod/at/json',
    priority: 6,
    supportSearch: true,
  },
];

@Injectable()
export class MacCmsResolverService {
  private readonly logger = new Logger(MacCmsResolverService.name);

  async resolveByTitle(
    title: string,
    episodeNumber?: number,
  ): Promise<ResolvedEpisode[]> {
    const results: ResolvedEpisode[] = [];

    for (const source of MAC_CMS_SOURCES) {
      try {
        const episodes = await this.querySource(source, title, episodeNumber);
        if (episodes.length > 0) {
          const sampleUrl = episodes[0].url;
          const accessible = await this.checkUrlAccessible(sampleUrl);
          if (!accessible) {
            this.logger.warn(`MacCMS source ${source.name} URLs not accessible (403), skipping`);
            continue;
          }
          results.push(...episodes);
          break;
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.warn(`MacCMS source ${source.name} failed: ${msg}`);
      }
    }

    return results;
  }

  private async checkUrlAccessible(url: string): Promise<boolean> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    try {
      const resp = await axios.head(url, {
        timeout: 5000,
        headers,
        maxRedirects: 3,
        validateStatus: () => true,
      });
      if (resp.status >= 200 && resp.status < 400) return true;
    } catch {
      // HEAD may not be supported by some CDNs
    }

    try {
      const resp = await axios.get(url, {
        timeout: 5000,
        headers: { ...headers, Range: 'bytes=0-0' },
        maxRedirects: 3,
        validateStatus: () => true,
        responseType: 'text',
      });
      return resp.status >= 200 && resp.status < 400;
    } catch {
      return false;
    }
  }

  private async querySource(
    source: MacCmsSource,
    title: string,
    episodeNumber?: number,
  ): Promise<ResolvedEpisode[]> {
    let searchTitle = title;
    let response = await axios.get(source.apiUrl, {
      params: { ac: 'detail', wd: searchTitle },
      timeout: 8000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    let data = response.data;
    if (!data?.list?.length) {
      const simplified = this.simplifyTitle(title);
      if (simplified && simplified !== title) {
        searchTitle = simplified;
        response = await axios.get(source.apiUrl, {
          params: { ac: 'detail', wd: searchTitle },
          timeout: 8000,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        data = response.data;
      }
    }

    if (!data?.list?.length) return [];

    const list = data.list as any[];
    let vod: any = null;

    const exactMatch = list.find((item: any) => {
      const name: string = item.vod_name || '';
      return name === title;
    });
    if (exactMatch) {
      vod = exactMatch;
    } else {
      const partialMatch = list.find((item: any) => {
        const name: string = item.vod_name || '';
        return name.includes(title) || title.includes(name);
      });
      vod = partialMatch || list[0];
    }

    if (!vod) return [];

    const playUrl: string = vod.vod_play_url || '';
    if (!playUrl) return [];

    const sourceGroups = playUrl.split('$$$');
    const episodes: ResolvedEpisode[] = [];

    for (const group of sourceGroups) {
      const items = group.split('#');
      for (const item of items) {
        const sepIndex = item.indexOf('$');
        if (sepIndex === -1) continue;
        const epName = item.substring(0, sepIndex).trim();
        const rawUrl = item.substring(sepIndex + 1).trim();
        if (!rawUrl || !rawUrl.startsWith('http')) continue;

        const url = this.normalizeVideoUrl(rawUrl);
        episodes.push({
          episode: epName,
          url,
          sourceName: source.name,
        });
      }
    }

    if (episodeNumber != null) {
      return episodes.filter(ep => {
        const num = this.extractEpisodeNumber(ep.episode);
        return num === episodeNumber;
      });
    }

    return episodes;
  }

  private extractEpisodeNumber(name: string): number | null {
    const match = name.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  private simplifyTitle(title: string): string | null {
    let simplified = title
      .replace(/第[一二三四五六七八九十百千\d]+[季部集篇]$/g, '')
      .replace(/Season\s*\d+$/gi, '')
      .replace(/S\d+$/gi, '')
      .replace(/\s+$/g, '')
      .trim();
    return simplified && simplified !== title ? simplified : null;
  }

  private normalizeVideoUrl(url: string): string {
    const lower = url.toLowerCase();
    if (lower.includes('.m3u8') || lower.includes('.mp4') || lower.includes('.mkv') || lower.includes('.flv')) {
      return url;
    }
    const parsed = new URL(url);
    const path = parsed.pathname;
    if (!path.includes('.')) {
      return url.replace(/\/$/, '') + '/index.m3u8';
    }
    return url;
  }
}
