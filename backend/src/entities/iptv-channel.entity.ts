import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { MediaResource } from './media-resource.entity';

/**
 * IPTV频道实体类
 * 用于存储IPTV直播频道信息
 */
@Entity('iptv_channels')
@Index('idx_iptv_url', ['url'])
@Index('idx_iptv_group_active', ['group', 'isActive'])
export class IPTVChannel {
  @PrimaryGeneratedColumn()
  id: number; // 频道ID，自增主键

  @Column({ length: 200 })
  name: string; // 频道名称

  @Column({ length: 500 })
  url: string; // 频道流媒体URL

  @Column({ length: 50 })
  group: string; // 频道分组（如：央视、卫视、地方台等）

  @Column({ length: 20, nullable: true })
  logo?: string; // 频道Logo URL

  @Column({ length: 100, nullable: true })
  epgId?: string; // 电子节目单ID

  @Column({ length: 50, nullable: true })
  language?: string; // 语言

  @Column({ length: 50, nullable: true })
  country?: string; // 国家

  @Column({ length: 50, nullable: true })
  region?: string; // 地区

  @Column({ type: 'text', nullable: true })
  description?: string; // 频道描述

  @Column({ length: 20, nullable: true })
  resolution?: string; // 分辨率（如：1080p、720p、480p）

  @Column({ default: true })
  isActive: boolean; // 是否可用

  @Column({ default: 0 })
  viewCount: number; // 观看次数

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null; // 扩展元数据

  @Column({ type: 'date', nullable: true })
  expireDate?: Date; // 过期时间

  @CreateDateColumn()
  createdAt: Date; // 创建时间

  @UpdateDateColumn()
  updatedAt: Date; // 更新时间

  @Column({ nullable: true })
  lastCheckedAt?: Date; // 最后检查时间

  @Column({ default: true })
  isLive: boolean; // 是否为直播

  @Column({ length: 20, nullable: true })
  streamFormat?: string; // 流媒体格式（如：hls、rtmp、rtsp）

  @Column({ type: 'json', nullable: true })
  backupUrls?: string[]; // 备用URL列表

  @Column({ type: 'float', default: 0 })
  qualityScore: number; // 质量评分（0-100，基于响应时间、可用性等）

  @Column({ type: 'int', default: 0 })
  responseTime: number; // 响应时间（毫秒）

  @Column({ length: 100, nullable: true })
  sourceName?: string; // 来源名称（如：fanmingming、iptv-org等）

  @Column({ length: 500, nullable: true })
  sourceUrl?: string; // 来源URL（原始播放列表地址）

  @Column({ type: 'int', default: 0 })
  consecutiveFailures: number; // 连续失败次数（超过阈值自动禁用）

  @Column({ default: false })
  isIpv6: boolean; // 是否支持IPv6

  @Column({ length: 50, nullable: true })
  category?: string; // 频道分类（如：news/sports/movie/entertainment）

  // 关联的媒体资源（多对多，用于将IPTV频道关联到影视资源）
  @ManyToMany(() => MediaResource, media => media.iptvChannels)
  @JoinTable()
  mediaResources: MediaResource[];

  /**
   * 计算质量评分
   */
  calculateQualityScore(): number {
    let score = 100;

    // 响应时间扣分（超过3秒开始扣分）
    if (this.responseTime > 3000) {
      score -= Math.min(30, ((this.responseTime - 3000) / 1000) * 5);
    }

    // 连续失败扣分
    score -= this.consecutiveFailures * 15;

    // 有备用URL加分
    if (this.backupUrls && this.backupUrls.length > 0) {
      score += Math.min(10, this.backupUrls.length * 2);
    }

    // 有EPG加分
    if (this.epgId) {
      score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * 获取主要流媒体URL
   */
  getPrimaryStreamUrl(): string {
    return this.url;
  }

  /**
   * 获取所有可用的流媒体URL（包括备用URL）
   */
  getAllStreamUrls(): string[] {
    const urls = [this.url];
    if (this.backupUrls && this.backupUrls.length > 0) {
      urls.push(...this.backupUrls);
    }
    return urls;
  }

  /**
   * 检查频道是否可用
   */
  isAvailable(): boolean {
    return this.isActive && this.url.length > 0;
  }

  /**
   * 获取频道完整信息
   */
  getChannelInfo(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      group: this.group,
      logo: this.logo,
      resolution: this.resolution,
      language: this.language,
      country: this.country,
      description: this.description,
      isLive: this.isLive,
      streamFormat: this.streamFormat,
      viewCount: this.viewCount,
      urls: this.getAllStreamUrls(),
      metadata: this.metadata,
    };
  }
}
