import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { WatchHistory } from './watch-history.entity';
import { MediaResource } from './media-resource.entity';
import { PlaySource } from './play-source.entity';

/**
 * 用户实体类
 * 用于存储用户信息，包括用户名、密码、邮箱等
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number; // 用户ID，自增主键

  @Column({ unique: true, length: 50 })
  username: string; // 用户名，唯一

  @Column({ select: false }) // 查询时默认不返回密码
  password: string; // 密码，加密存储

  @Column({ unique: true, length: 100 })
  email: string; // 邮箱，唯一

  @Column({ length: 20, nullable: true })
  phone?: string; // 手机号，可选

  @Column({ length: 100, nullable: true })
  nickname?: string; // 昵称，可选

  @Column({ default: 'user' })
  role: string; // 用户角色，默认为普通用户

  @Column({ default: true })
  isActive: boolean; // 账号是否激活

  @Column({ nullable: true })
  avatar?: string; // 头像URL

  @Column({ nullable: true })
  lastLoginAt?: Date; // 最后登录时间

  @CreateDateColumn()
  createdAt: Date; // 创建时间

  @UpdateDateColumn()
  updatedAt: Date; // 更新时间

  // 关联观看历史（一对多）
  @OneToMany(() => WatchHistory, history => history.user)
  watchHistory: WatchHistory[];

  // 关联收藏的影视资源（多对多）
  @ManyToMany(() => MediaResource, media => media.favorites)
  @JoinTable()
  favorites: MediaResource[];

  // 关联配置的播放源（多对多）
  @ManyToMany(() => PlaySource, playSource => playSource.configuredBy)
  @JoinTable()
  configuredPlaySources: PlaySource[];
}