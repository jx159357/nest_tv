import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('source_scripts')
@Index('idx_script_key', ['key'], { unique: true })
@Index('idx_script_enabled', ['enabled'])
export class SourceScript {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  key: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text' })
  code: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 50, nullable: true })
  version?: string;

  @Column({ type: 'json', nullable: true })
  config?: Record<string, string> | null;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, unknown> | null;

  @Column({ default: 0 })
  requestCount: number;

  @Column({ default: 0 })
  errorCount: number;

  @Column({ nullable: true })
  lastUsedAt?: Date;

  @Column({ nullable: true })
  lastErrorAt?: Date;

  @Column({ type: 'text', nullable: true })
  lastError?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
