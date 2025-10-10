import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  Index,
  // UniqueIndex, // 暂时注释
} from 'typeorm';
import { User } from './user.entity';
import { WatchHistory } from './watch-history.entity';
import { PlaySource } from './play-source.entity';
import { Recommendation } from './recommendation.entity';
import { IPTVChannel } from './iptv-channel.entity';

/**
 * 影视分类枚举
 */
export enum MediaType {
  MOVIE = 'movie', // 电影
  TV_SERIES = 'tv_series', // 电视剧
  VARIETY = 'variety', // 综艺
  ANIME = 'anime', // 动漫
  DOCUMENTARY = 'documentary', // 纪录片
}

/**
 * 影视质量枚举
 */
export enum MediaQuality {
  HD = 'hd', // 高清
  FULL_HD = 'full_hd', // 全高清
  BLUE_RAY = 'blue_ray', // 蓝光
  SD = 'sd', // 标清
}

/**
 * 影视资源实体类
 * 用于存储电影、电视剧等影视资源信息
 */
@Entity('media_resources')
// 搜索索引：标题+类型+创建时间
@Index('idx_media_title', ['title'])
@Index('idx_media_type', ['type'])
@Index('idx_media_created', ['createdAt'])
@Index('idx_media_active', ['isActive'])

// 筛选索引：类型+状态+评分
@Index('idx_media_type_status', ['type', 'isActive'])
@Index('idx_media_filter', ['type', 'isActive', 'rating'])

// 热门索引：评分+观看次数+状态
@Index('idx_media_rating', ['rating'])
@Index('idx_media_viewcount', ['viewCount'])
@Index('idx_media_popular', ['rating', 'viewCount', 'isActive'])

// 分类和标签相关索引
// @Index('idx_media_genres', ['genres']) // 注释掉有问题的索引，因为genres是TEXT类型
@Index('idx_media_release_date', ['releaseDate'])
@Index('idx_media_duration', ['duration'])

// 唯一性索引（在应用层处理）
// @Index('idx_media_unique', ['title', 'type', 'releaseDate'])
export class MediaResource {
  @PrimaryGeneratedColumn()
  id: number; // 资源ID，自增主键

  @Column({ length: 200 })
  title: string; // 影视标题

  @Column({ type: 'text', nullable: true })
  description?: string; // 简介

  @Column({ type: 'enum', enum: MediaType })
  type: MediaType; // 影视类型

  @Column({ length: 100, nullable: true })
  director?: string; // 导演

  @Column({ type: 'text', nullable: true })
  actors?: string; // 主演

  @Column({ type: 'simple-array', nullable: true })
  genres?: string[]; // 类型标签，如：动作、喜剧、爱情等

  @Column({ type: 'date', nullable: true })
  releaseDate?: Date; // 上映日期

  @Column({ type: 'enum', enum: MediaQuality, default: MediaQuality.HD })
  quality: MediaQuality; // 视频质量

  @Column({ length: 500, nullable: true })
  poster?: string; // 海报URL

  @Column({ length: 500, nullable: true })
  backdrop?: string; // 背景图URL

  @Column({ default: 0 })
  rating: number; // 评分，0-10分

  @Column({ default: 0 })
  viewCount: number; // 观看次数

  @Column({ default: true })
  isActive: boolean; // 是否可用

  @Column({ length: 50, nullable: true })
  source?: string; // 来源平台

  @Column({ type: 'json', nullable: true })
  metadata?: any; // 扩展元数据

  @Column({ type: 'int', nullable: true })
  duration?: number; // 时长（分钟）
  
  @Column({ nullable: true })
  episodeCount?: number; // 剧集数（如果是电视剧）

  @Column({ type: 'simple-array', nullable: true })
  downloadUrls?: string[]; // 下载链接

  @CreateDateColumn()
  createdAt: Date; // 创建时间

  @UpdateDateColumn()
  updatedAt: Date; // 更新时间

  // 关联用户收藏
  @ManyToMany(() => User, user => user.favorites)
  @JoinTable()
  favorites: User[];

  // 关联观看历史（一对多）
  @OneToMany(() => WatchHistory, history => history.mediaResource)
  watchHistory: WatchHistory[];

  // 关联播放源（一对多）
  @OneToMany(() => PlaySource, playSource => playSource.mediaResource)
  playSources: PlaySource[];

  // 关联推荐记录（一对多）
  @OneToMany(() => Recommendation, recommendation => recommendation.mediaResource)
  recommendations: Recommendation[];

  // 关联IPTV频道（多对多）
  @ManyToMany(() => IPTVChannel, iptvChannel => iptvChannel.mediaResources)
  iptvChannels: IPTVChannel[];
}
