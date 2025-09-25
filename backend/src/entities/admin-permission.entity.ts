import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminRole } from './admin-role.entity';

/**
 * 后台管理权限实体类
 */
@Entity('admin_permissions')
export class AdminPermission {
  @PrimaryGeneratedColumn()
  id: number; // 权限ID

  @Column({ unique: true })
  code: string; // 权限代码（唯一）

  @Column()
  name: string; // 权限名称

  @Column({ type: 'text', nullable: true })
  description?: string; // 权限描述

  @Column({ type: 'text', nullable: true })
  resource?: string; // 关联资源（如：user, media, play-source等）

  @Column({ type: 'text', nullable: true })
  action?: string; // 操作类型（如：create, read, update, delete）

  @Column({ default: true })
  isActive: boolean; // 是否启用

  @CreateDateColumn()
  createdAt: Date; // 创建时间

  @UpdateDateColumn()
  updatedAt: Date; // 更新时间

  // 关联角色（多对多）
  @ManyToMany(() => AdminRole, role => role.permissions)
  roles: AdminRole[];
}
