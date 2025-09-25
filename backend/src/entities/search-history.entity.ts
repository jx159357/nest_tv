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

/**
 * 搜索历史实体类
 * 用于存储用户的搜索历史记录
 */
@Entity('search_history')
export class SearchHistory {
  @PrimaryGeneratedColumn()
  id: number; // 搜索历史ID，自增主键

  @Column({ type: 'int' })
  @Index()
  userId: number; // 用户ID

  @Column({ type: 'varchar', length: 255 })
  @Index()
  keyword: string; // 搜索关键词

  @Column({ type: 'int', default: 0 })
  resultCount: number; // 搜索结果数量

  @Column({ type: 'json', nullable: true })
  filters?: {
    // 搜索过滤器
    types?: string[];
    genres?: string[];
    quality?: string[];
    minRating?: number;
    maxRating?: number;
    yearRange?: [number, number];
  };

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  searchTime: number; // 搜索耗时（秒）

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // 是否活跃

  @CreateDateColumn()
  @Index()
  createdAt: Date; // 创建时间

  @UpdateDateColumn()
  updatedAt: Date; // 更新时间

  // 关联用户（多对一）
  @ManyToOne(() => User, user => user.searchHistory)
  user: User;
}
