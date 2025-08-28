import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { MediaResource } from './media-resource.entity';

/**
 * 观看历史实体类
 * 用于记录用户的观看历史和进度
 */
@Entity('watch_history')
export class WatchHistory {
  @PrimaryGeneratedColumn()
  id: number; // 观看记录ID，自增主键

  @Column({ type: 'json', nullable: true })
  progress?: { // 观看进度
    currentTime: number; // 当前播放时间（秒）
    duration: number;    // 总时长（秒）
    percentage: number;  // 完成百分比
  };

  @Column({ default: 0 })
  watchDuration: number; // 累计观看时长（秒）

  @Column({ default: false })
  isCompleted: boolean; // 是否已看完

  @Column({ nullable: true })
  episodeNumber?: number; // 观看的剧集号

  @Column({ default: 1 })
  playCount: number; // 播放次数

  @Column({ nullable: true })
  lastPlayedAt?: Date; // 最后播放时间

  @Column({ type: 'json', nullable: true })
  playSettings?: { // 播放设置
    volume: number;         // 音量
    playbackRate: number;   // 播放速度
    quality: string;        // 画质
    subtitleLanguage: string; // 字幕语言
  };

  @Column({ type: 'text', nullable: true })
  notes?: string; // 用户笔记

  @CreateDateColumn()
  createdAt: Date; // 创建时间

  @UpdateDateColumn()
  updatedAt: Date; // 更新时间

  // 关联用户（多对一）
  @ManyToOne(() => User, user => user.watchHistory)
  user: User;

  @Column()
  userId: number; // 用户ID

  // 关联影视资源（多对一）
  @ManyToOne(() => MediaResource, media => media.watchHistory)
  mediaResource: MediaResource;

  @Column()
  mediaResourceId: number; // 影视资源ID
}