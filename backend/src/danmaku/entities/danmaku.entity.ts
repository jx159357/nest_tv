import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Index } from 'typeorm';
import { User } from '../../entities/user.entity';
import { MediaResource } from '../../entities/media-resource.entity';

export interface DanmakuReportRecord {
  reporterId: number;
  reason: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  status: 'pending';
}

export interface DanmakuMetadata {
  userAgent?: string;
  timestamp?: number;
  location?: string;
  platform?: string;
  reports?: DanmakuReportRecord[];
  moderationStatus?: 'active' | 'reported' | 'hidden';
}

@Entity('danmaku')
@Index('idx_danmaku_media_created', ['mediaResourceId', 'createdAt'])
@Index('idx_danmaku_video_created', ['videoId', 'createdAt'])
@Index('idx_danmaku_user_created', ['userId', 'createdAt'])
@Index('idx_danmaku_active_created', ['isActive', 'createdAt'])
export class Danmaku {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, name: 'danmaku_id' })
  danmakuId: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'varchar', length: 255, name: 'video_id' })
  videoId: string;

  @Column({ type: 'int', name: 'media_resource_id' })
  mediaResourceId: number;

  @Column({ type: 'varchar', length: 7, default: '#FFFFFF' })
  color: string;

  @Column({ type: 'varchar', length: 20, default: 'scroll' })
  type: 'scroll' | 'top' | 'bottom';

  @Column({ type: 'int', default: 1 })
  priority: number;

  @Column({ type: 'boolean', default: false })
  isHighlighted: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: DanmakuMetadata;

  @Column({ type: 'json', nullable: true })
  filters: {
    containsSensitive?: boolean;
    containsSpam?: boolean;
    containsEmojis?: boolean;
    keywords?: string[];
  };

  @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    name: 'updated_at',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  // 关系字段
  @Column({ type: 'int', name: 'user_id' })
  userId: number;

  // 关系
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  user: User;

  @ManyToOne(() => MediaResource, { onDelete: 'CASCADE' })
  mediaResource: MediaResource;
}
