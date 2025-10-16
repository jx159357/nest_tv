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

/**
 * 推荐实体类
 * 用于存储用户推荐记录和推荐算法结果
 */
@Entity('recommendations')
export class Recommendation {
  @PrimaryGeneratedColumn()
  id: number; // 推荐记录ID，自增主键

  @Column({
    type: 'enum',
    enum: [
      'collaborative',
      'content',
      'trending',
      'editorial',
      'personalized',
      'latest',
      'top-rated',
    ],
    default: 'personalized',
  })
  @Index()
  type:
    | 'collaborative'
    | 'content'
    | 'trending'
    | 'editorial'
    | 'personalized'
    | 'latest'
    | 'top-rated'; // 推荐类型

  @Column({ type: 'int' })
  @Index()
  userId: number; // 用户ID

  @Column({ type: 'int' })
  @Index()
  mediaResourceId: number; // 推荐的影视资源ID

  // 复合索引优化常用查询
  @Index(['userId', 'isActive', 'type'])
  @Index(['userId', 'isActive', 'priority'])
  @Index(['type', 'isActive', 'score'])
  @Index(['expiresAt', 'isActive'])
  @Index(['mediaResourceId', 'userId'])
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  score: number; // 推荐得分（0-100）

  @Column({ type: 'smallint', default: 1 })
  @Index()
  priority: number; // 推荐优先级

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean; // 是否启用

  @Column({ type: 'json', nullable: true })
  metadata?: {
    // 推荐元数据
    reason?: string; // 推荐理由
    algorithm?: string; // 使用的算法
    similarUsers?: number[]; // 相似用户ID列表（用于协同过滤）
    similarMedia?: number[]; // 相似影视资源ID列表（用于内容推荐）
    tags?: string[]; // 相关标签
    category?: string; // 分类
    scoreBreakdown?: {
      viewScore?: number;
      ratingScore?: number;
      recencyScore?: number;
      qualityScore?: number;
      totalScore?: number;
    };
  };

  @Column({ type: 'timestamp', nullable: true })
  @Index()
  expiresAt?: Date; // 过期时间

  @CreateDateColumn()
  @Index()
  createdAt: Date; // 创建时间

  @UpdateDateColumn()
  updatedAt: Date; // 更新时间

  // 关联用户（多对一）
  @ManyToOne(() => User, user => user.recommendations, { onDelete: 'CASCADE' })
  user: User;

  // 关联影视资源（多对一）
  @ManyToOne(() => MediaResource, media => media.recommendations, { onDelete: 'CASCADE' })
  mediaResource: MediaResource;
}
