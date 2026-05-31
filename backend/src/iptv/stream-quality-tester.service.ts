import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual, Between, IsNull } from 'typeorm';
import { IPTVChannel } from '../entities/iptv-channel.entity';
import axios from 'axios';

export interface StreamTestResult {
  channelId: number;
  channelName: string;
  url: string;
  isAvailable: boolean;
  responseTime: number;
  statusCode?: number;
  contentType?: string;
  error?: string;
}

export interface BatchTestResult {
  total: number;
  available: number;
  unavailable: number;
  results: StreamTestResult[];
  duration: number;
}

@Injectable()
export class StreamQualityTester {
  private readonly logger = new Logger(StreamQualityTester.name);
  private readonly DEFAULT_TIMEOUT = 10000; // 10秒超时
  private readonly MAX_CONCURRENT = 10; // 最大并发数
  private readonly FAILURE_THRESHOLD = 3; // 连续失败阈值

  constructor(
    @InjectRepository(IPTVChannel)
    private iptvChannelRepository: Repository<IPTVChannel>,
  ) {}

  /**
   * 测试单个频道的流可用性
   */
  async testChannel(channel: IPTVChannel): Promise<StreamTestResult> {
    const startTime = Date.now();
    const url = channel.url;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT);

      const response = await this.probeStream(url, controller.signal);

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const isAvailable = response.status >= 200 && response.status < 400;
      const contentType = response.headers['content-type'] || '';

      // 检查是否是有效的流媒体内容
      const isValidStream =
        this.isValidStreamContentType(contentType) ||
        url.includes('.m3u8') ||
        url.includes('.ts') ||
        url.includes('m3u8');

      // 更新频道质量信息
      await this.updateChannelQuality(channel.id, {
        isAvailable: isAvailable && isValidStream,
        responseTime,
        statusCode: response.status,
      });

      return {
        channelId: channel.id,
        channelName: channel.name,
        url,
        isAvailable: isAvailable && isValidStream,
        responseTime,
        statusCode: response.status,
        contentType,
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '未知错误';

      // 更新频道质量信息（失败）
      await this.updateChannelQuality(channel.id, {
        isAvailable: false,
        responseTime,
        error: errorMessage,
      });

      return {
        channelId: channel.id,
        channelName: channel.name,
        url,
        isAvailable: false,
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * 批量测试频道
   */
  async testChannels(channels: IPTVChannel[]): Promise<BatchTestResult> {
    const startTime = Date.now();
    const results: StreamTestResult[] = [];

    // 分批并发测试
    for (let i = 0; i < channels.length; i += this.MAX_CONCURRENT) {
      const batch = channels.slice(i, i + this.MAX_CONCURRENT);
      const batchResults = await Promise.allSettled(
        batch.map(channel => this.testChannel(channel)),
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    }

    const available = results.filter(r => r.isAvailable).length;
    const unavailable = results.length - available;

    return {
      total: results.length,
      available,
      unavailable,
      results,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 测试所有活跃频道
   */
  async testAllActiveChannels(): Promise<BatchTestResult> {
    const channels = await this.iptvChannelRepository.find({
      where: { isActive: true },
      order: { lastCheckedAt: 'ASC' }, // 优先测试长时间未检查的
    });

    this.logger.log(`开始测试 ${channels.length} 个活跃频道`);
    const result = await this.testChannels(channels);
    this.logger.log(
      `测试完成: ${result.available} 可用, ${result.unavailable} 不可用, 耗时 ${result.duration}ms`,
    );

    return result;
  }

  /**
   * 测试指定分组的频道
   */
  async testChannelsByGroup(group: string): Promise<BatchTestResult> {
    const channels = await this.iptvChannelRepository.find({
      where: { group, isActive: true },
    });

    return this.testChannels(channels);
  }

  /**
   * 测试失效频道（长时间未检查或连续失败的）
   */
  async testProblematicChannels(): Promise<BatchTestResult> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const channels = await this.iptvChannelRepository.find({
      where: [
        { lastCheckedAt: LessThan(oneDayAgo), isActive: true },
        { consecutiveFailures: this.FAILURE_THRESHOLD, isActive: true },
      ],
    });

    return this.testChannels(channels);
  }

  /**
   * 更新频道质量信息
   */
  private async updateChannelQuality(
    channelId: number,
    data: {
      isAvailable: boolean;
      responseTime: number;
      statusCode?: number;
      error?: string;
    },
  ): Promise<void> {
    try {
      const channel = await this.iptvChannelRepository.findOne({
        where: { id: channelId },
      });

      if (!channel) return;

      channel.lastCheckedAt = new Date();
      channel.responseTime = data.responseTime;

      if (data.isAvailable) {
        channel.consecutiveFailures = 0;
        channel.isActive = true;
      } else {
        channel.consecutiveFailures = (channel.consecutiveFailures || 0) + 1;
        // 连续失败超过阈值，自动禁用
        if (channel.consecutiveFailures >= this.FAILURE_THRESHOLD) {
          channel.isActive = false;
          this.logger.warn(
            `频道 ${channel.name} 连续失败 ${channel.consecutiveFailures} 次，已自动禁用`,
          );
        }
      }

      // 计算质量评分
      channel.qualityScore = channel.calculateQualityScore();

      await this.iptvChannelRepository.save(channel);
    } catch (error: unknown) {
      this.logger.error(
        `更新频道质量信息失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  /**
   * 获取Referer
   */
  private getReferer(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.origin + '/';
    } catch {
      return 'https://www.google.com/';
    }
  }

  private async probeStream(url: string, signal: AbortSignal) {
    const requestConfig = {
      timeout: this.DEFAULT_TIMEOUT,
      signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: this.getReferer(url),
        Range: 'bytes=0-1023',
      },
      validateStatus: (status: number) => status >= 200 && status < 500,
      maxRedirects: 3,
    };

    try {
      return await axios.head(url, requestConfig);
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status && status !== 405 && status !== 403) {
        throw error;
      }

      return await axios.get(url, {
        ...requestConfig,
        responseType: 'arraybuffer',
      });
    }
  }

  /**
   * 检查是否是有效的流媒体内容类型
   */
  private isValidStreamContentType(contentType: string): boolean {
    const validTypes = [
      'application/vnd.apple.mpegurl',
      'application/x-mpegurl',
      'audio/mpegurl',
      'audio/x-mpegurl',
      'video/mp2t',
      'video/mp4',
      'application/octet-stream',
    ];

    return validTypes.some(type => contentType.toLowerCase().includes(type));
  }

  /**
   * 获取频道质量统计
   */
  async getQualityStats(): Promise<{
    totalChannels: number;
    activeChannels: number;
    highQuality: number; // 评分 >= 80
    mediumQuality: number; // 评分 60-79
    lowQuality: number; // 评分 < 60
    averageResponseTime: number;
    neverChecked: number;
  }> {
    const totalChannels = await this.iptvChannelRepository.count();
    const activeChannels = await this.iptvChannelRepository.count({
      where: { isActive: true },
    });

    const highQuality = await this.iptvChannelRepository.count({
      where: { qualityScore: MoreThanOrEqual(80), isActive: true },
    });

    const mediumQuality = await this.iptvChannelRepository.count({
      where: { qualityScore: Between(60, 79), isActive: true },
    });

    const lowQuality = await this.iptvChannelRepository.count({
      where: { qualityScore: LessThan(60), isActive: true },
    });

    const neverChecked = await this.iptvChannelRepository.count({
      where: { lastCheckedAt: IsNull() },
    });

    // 计算平均响应时间
    const result = await this.iptvChannelRepository
      .createQueryBuilder('channel')
      .select('AVG(channel.responseTime)', 'avg')
      .where('channel.isActive = :isActive', { isActive: true })
      .getRawOne();

    const averageResponseTime = Math.round(result?.avg || 0);

    return {
      totalChannels,
      activeChannels,
      highQuality,
      mediumQuality,
      lowQuality,
      averageResponseTime,
      neverChecked,
    };
  }

  /**
   * 自动禁用低质量频道
   */
  async disableLowQualityChannels(minScore: number = 30): Promise<number> {
    const channels = await this.iptvChannelRepository.find({
      where: {
        qualityScore: LessThan(minScore),
        isActive: true,
      },
    });

    for (const channel of channels) {
      channel.isActive = false;
      this.logger.log(`禁用低质量频道: ${channel.name} (评分: ${channel.qualityScore})`);
    }

    await this.iptvChannelRepository.save(channels);
    return channels.length;
  }

  /**
   * 重新启用已恢复的频道
   */
  async reenableRecoveredChannels(): Promise<number> {
    const channels = await this.iptvChannelRepository.find({
      where: {
        isActive: false,
        consecutiveFailures: 0,
      },
    });

    let reenabled = 0;
    for (const channel of channels) {
      // 重新测试
      const result = await this.testChannel(channel);
      if (result.isAvailable) {
        channel.isActive = true;
        reenabled++;
      }
    }

    await this.iptvChannelRepository.save(channels);
    return reenabled;
  }
}
