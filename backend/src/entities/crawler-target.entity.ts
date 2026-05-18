import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('crawler_targets')
@Index('idx_crawler_target_name', ['name'], { unique: true })
@Index('idx_crawler_target_enabled', ['enabled'])
@Index('idx_crawler_target_active', ['isActive'])
export class CrawlerTarget {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 500 })
  baseUrl: string;

  @Column({ type: 'json' })
  selectors: {
    title: string;
    description: string;
    poster: string;
    rating: string;
    director: string;
    actors: string;
    genres: string;
    releaseDate: string;
    downloadUrls: string;
  };

  @Column({ type: 'json', nullable: true })
  listingUrls?: string[];

  @Column({ default: true })
  enabled: boolean;

  @Column({ default: false })
  isActive: boolean;

  @Column({ default: 0 })
  priority: number;

  @Column({ default: 50 })
  maxPages: number;

  @Column({ default: true })
  respectRobotsTxt: boolean;

  @Column({ default: 2000 })
  requestDelay: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'json', nullable: true })
  statistics?: {
    totalMedia?: number;
    activeMedia?: number;
    totalPlaySources?: number;
    activePlaySources?: number;
    lastCrawledAt?: string;
    averageQualityScore?: number;
  };

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
