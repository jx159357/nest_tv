import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AdminRole } from './admin-role.entity';
import { User } from './user.entity';

/**
 * 后台管理日志实体类
 * 记录管理员的所有操作日志
 */
@Entity('admin_logs')
export class AdminLog {
  @PrimaryGeneratedColumn()
  id: number; // 日志ID

  @Column({ type: 'text' })
  action: string; // 操作类型（login, logout, create, read, update, delete等）

  @Column({ type: 'text' })
  resource: string; // 操作资源（user, media, play-source, role等）

  @Column({ type: 'json', nullable: true })
  metadata?: { // 操作元数据
    targetId?: number; // 目标ID
    changes?: any; // 变更内容
    request?: any; // 请求信息
    response?: any; // 响应信息
  };

  @Column({ type: 'text', nullable: true })
  description?: string; // 操作描述

  @Column({ default: 'success' })
  status: 'success' | 'error' | 'warning'; // 操作状态

  @Column({ type: 'text', nullable: true })
  errorMessage?: string; // 错误信息（如果有）

  @Column({ type: 'json', nullable: true })
  requestInfo?: { // 请求信息
    ip: string;
    userAgent: string;
    method: string;
    url: string;
  };

  // 关联管理员角色
  @ManyToOne(() => AdminRole, role => role.adminLogs)
  @JoinColumn()
  role: AdminRole;

  @Column()
  roleId: number; // 角色ID

  // 关联用户（如果适用）
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  user?: User;

  @Column({ nullable: true })
  userId?: number; // 用户ID（如果适用）

  @CreateDateColumn()
  createdAt: Date; // 创建时间
}