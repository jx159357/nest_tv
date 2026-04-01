import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { MediaResource } from './media-resource.entity';

export enum DownloadTaskType {
  DIRECT = 'direct',
  TORRENT = 'torrent',
  MAGNET = 'magnet',
}

export enum DownloadTaskStatus {
  PENDING = 'pending',
  DOWNLOADING = 'downloading',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled',
}

export enum DownloadTaskHandler {
  BROWSER = 'browser',
  SYSTEM = 'system',
}

@Entity('download_tasks')
@Index('idx_download_task_user_client', ['userId', 'clientId'], { unique: true })
@Index('idx_download_task_user_status', ['userId', 'status'])
@Index('idx_download_task_user_updated', ['userId', 'updatedAt'])
export class DownloadTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 80 })
  clientId: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'enum', enum: DownloadTaskType, default: DownloadTaskType.DIRECT })
  type: DownloadTaskType;

  @Column({ type: 'enum', enum: DownloadTaskStatus, default: DownloadTaskStatus.PENDING })
  status: DownloadTaskStatus;

  @Column({ default: 0 })
  progress: number;

  @Column({ type: 'bigint', default: 0 })
  speed: number;

  @Column({ type: 'bigint', default: 0 })
  downloaded: number;

  @Column({ type: 'bigint', default: 0 })
  total: number;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 500, nullable: true })
  filePath?: string;

  @Column({ length: 120, nullable: true })
  sourceLabel?: string;

  @Column({ type: 'enum', enum: DownloadTaskHandler, default: DownloadTaskHandler.BROWSER })
  handler: DownloadTaskHandler;

  @Column({ default: 0 })
  launchCount: number;

  @Column({ nullable: true })
  lastLaunchedAt?: Date;

  @Column({ nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.downloadTasks, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => MediaResource, media => media.downloadTasks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  mediaResource?: MediaResource | null;

  @Column({ nullable: true })
  mediaResourceId?: number | null;
}
