import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, ManyToOne } from 'typeorm';
import { AdminPermission } from './admin-permission.entity';
import { AdminLog } from './admin-log.entity';
import { User } from './user.entity';

/**
 * 后台管理员角色实体类
 */
@Entity('admin_roles')
export class AdminRole {
  @PrimaryGeneratedColumn()
  id: number; // 角色ID

  @Column({ unique: true })
  name: string; // 角色名称（唯一）

  @Column({ type: 'text', nullable: true })
  description?: string; // 角色描述

  @Column({ default: true })
  isActive: boolean; // 是否启用

  @Column({ type: 'json', nullable: true })
  permissions?: string[]; // 角色权限列表

  @CreateDateColumn()
  createdAt: Date; // 创建时间

  @UpdateDateColumn()
  updatedAt: Date; // 更新时间

  // 关联管理员（多对多）
  @ManyToMany(() => AdminLog, adminLog => adminLog.role)
  adminLogs: AdminLog[];
}