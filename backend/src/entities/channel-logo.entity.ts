import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('channel_logos')
@Index('idx_channel_logo_name', ['name'])
@Index('idx_channel_logo_category', ['category'])
export class ChannelLogo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string; // 频道名称

  @Column({ length: 500 })
  url: string; // 台标URL

  @Column({ length: 100, nullable: true })
  category?: string; // 分类（如：cctv/satellite/local/international）

  @Column({ length: 50, nullable: true })
  country?: string; // 国家

  @Column({ length: 50, nullable: true })
  region?: string; // 地区

  @Column({ default: false })
  isVerified: boolean; // 是否已验证

  @Column({ default: true })
  isActive: boolean; // 是否可用

  @Column({ type: 'int', default: 0 })
  usageCount: number; // 使用次数

  @Column({ length: 500, nullable: true })
  source?: string; // 来源

  @Column({ type: 'json', nullable: true })
  aliases?: string[]; // 别名列表

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
