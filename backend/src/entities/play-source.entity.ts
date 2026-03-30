import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { MediaResource } from './media-resource.entity';

export enum PlaySourceType {
  ONLINE = 'online',
  DOWNLOAD = 'download',
  STREAM = 'stream',
  THIRD_PARTY = 'third_party',
  MAGNET = 'magnet',
  IPTV = 'iptv',
  WEBDISK = 'webdisk',
  PARSER = 'parser',
}

export enum PlaySourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  CHECKING = 'checking',
}

@Entity('play_sources')
@Index('idx_play_source_type', ['type'])
@Index('idx_play_source_status', ['status'])
@Index('idx_play_source_type_status', ['type', 'status'])
@Index('idx_play_source_priority', ['priority'])
@Index('idx_play_source_resolution', ['resolution'])
@Index('idx_play_source_priority_status', ['priority', 'status'])
@Index('idx_play_source_playcount', ['playCount'])
@Index('idx_play_source_playcount_status', ['playCount', 'status'])
@Index('idx_play_source_media', ['mediaResourceId'])
@Index('idx_play_source_media_type_status', ['mediaResourceId', 'type', 'status'])
@Index('idx_play_source_expire', ['expireDate'])
@Index('idx_play_source_created', ['createdAt'])
export class PlaySource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  url: string;

  @Column({ type: 'enum', enum: PlaySourceType })
  type: PlaySourceType;

  @Column({ type: 'enum', enum: PlaySourceStatus, default: PlaySourceStatus.CHECKING })
  status: PlaySourceStatus;

  @Column({ length: 100, nullable: true })
  resolution?: string;

  @Column({ length: 50, nullable: true })
  format?: string;

  @Column({ type: 'text', nullable: true })
  subtitleUrl?: string;

  @Column({ default: 0 })
  priority: number;

  @Column({ default: true })
  isAds: boolean;

  @Column({ default: 0 })
  playCount: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 100, nullable: true })
  sourceName?: string;

  @Column({ length: 200, nullable: true })
  name?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  headers?: Record<string, unknown> | null;

  @Column({ type: 'date', nullable: true })
  expireDate?: Date;

  @Column({ length: 50, nullable: true })
  channelGroup?: string;

  @Column({ length: 20, nullable: true })
  channelLogo?: string;

  @Column({ length: 100, nullable: true })
  providerName?: string;

  @Column({ type: 'json', nullable: true })
  magnetInfo?: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  webDiskInfo?: Record<string, unknown> | null;

  @Column({ nullable: true })
  episodeNumber?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastCheckedAt?: Date;

  @Column({ type: 'json', nullable: true })
  validationInfo?: Record<string, unknown> | null;

  @ManyToOne(() => MediaResource, media => media.playSources)
  mediaResource: MediaResource;

  @Column()
  mediaResourceId: number;

  @ManyToMany(() => User, user => user.configuredPlaySources)
  @JoinTable()
  configuredBy: User[];
}
