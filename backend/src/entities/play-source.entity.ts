import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';
import { MediaResource } from './media-resource.entity';

/**
 * 播放源类型枚举
 */
export enum PlaySourceType {
  ONLINE = 'online',       // 在线播放
  DOWNLOAD = 'download',   // 下载链接
  STREAM = 'stream',       // 流媒体
  THIRD_PARTY = 'third_party', // 第三方播放器
  MAGNET = 'magnet',       // 磁力链接
  IPTV = 'iptv',           // IPTV资源
  WEBDISK = 'webdisk',     // 网盘资源
  PARSER = 'parser'        // 解析站资源
}

/**
 * 播放源状态枚举
 */
export enum PlaySourceStatus {
  ACTIVE = 'active',       // 可用
  INACTIVE = 'inactive',   // 不可用
  ERROR = 'error',         // 错误
  CHECKING = 'checking'    // 检查中
}

/**
 * 播放源实体类
 * 用于存储影视资源的播放链接信息
 */
@Entity('play_sources')
export class PlaySource {
  @PrimaryGeneratedColumn()
  id: number; // 播放源ID，自增主键

  @Column({ length: 500 })
  url: string; // 播放链接

  @Column({ type: 'enum', enum: PlaySourceType })
  type: PlaySourceType; // 播放源类型

  @Column({ type: 'enum', enum: PlaySourceStatus, default: PlaySourceStatus.CHECKING })
  status: PlaySourceStatus; // 播放源状态

  @Column({ length: 100, nullable: true })
  resolution?: string; // 分辨率，如：1080p, 720p, 480p

  @Column({ length: 50, nullable: true })
  format?: string; // 视频格式，如：mp4, mkv, avi

  @Column({ type: 'text', nullable: true })
  subtitleUrl?: string; // 字幕链接

  @Column({ default: 0 })
  priority: number; // 优先级，数字越小优先级越高

  @Column({ default: true })
  isAds: boolean; // 是否有广告

  @Column({ default: 0 })
  playCount: number; // 播放次数

  @Column({ type: 'text', nullable: true })
  description?: string; // 描述信息

  @Column({ length: 100, nullable: true })
  sourceName?: string; // 来源名称

  @Column({ default: true })
  isActive: boolean; // 是否启用

  @Column({ type: 'json', nullable: true })
  headers?: any; // 请求头信息

  @Column({ type: 'date', nullable: true })
  expireDate?: Date; // 过期时间

  @Column({ length: 50, nullable: true })
  channelGroup?: string; // 频道分组（IPTV专用）

  @Column({ length: 20, nullable: true })
  channelLogo?: string; // 频道Logo（IPTV专用）

  @Column({ length: 100, nullable: true })
  providerName?: string; // 提供商名称（解析站专用）

  @Column({ type: 'json', nullable: true })
  magnetInfo?: any; // 磁力链接信息（磁力链接专用）

  @Column({ type: 'json', nullable: true })
  webDiskInfo?: any; // 网盘信息（网盘资源专用）

  @Column({ nullable: true })
  episodeNumber?: number; // 剧集号（如果是电视剧）

  @CreateDateColumn()
  createdAt: Date; // 创建时间

  @UpdateDateColumn()
  updatedAt: Date; // 更新时间

  @Column({ nullable: true })
  lastCheckedAt?: Date; // 最后检查时间

  // 关联影视资源（多对一）
  @ManyToOne(() => MediaResource, media => media.playSources)
  mediaResource: MediaResource;

  @Column()
  mediaResourceId: number; // 影视资源ID

  // 关联用户配置（多对多）
  @ManyToMany(() => User, user => user.configuredPlaySources)
  @JoinTable()
  configuredBy: User[];
}