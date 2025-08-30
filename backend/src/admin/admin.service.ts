import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminRole } from '../entities/admin-role.entity';
import { AdminPermission } from '../entities/admin-permission.entity';
import { AdminLog } from '../entities/admin-log.entity';
import { User } from '../entities/user.entity';

/**
 * 后台管理服务
 * 提供系统管理、用户管理、内容管理等功能
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(AdminRole)
    private adminRoleRepository: Repository<AdminRole>,
    @InjectRepository(AdminPermission)
    private adminPermissionRepository: Repository<AdminPermission>,
    @InjectRepository(AdminLog)
    private adminLogRepository: Repository<AdminLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 记录管理操作日志
   */
  async logAction(
    action: string,
    resource: string,
    metadata: any = {},
    roleId: number,
    userId?: number,
    status: 'success' | 'error' | 'warning' = 'success',
    description?: string,
    errorMessage?: string,
    requestInfo?: any,
  ): Promise<AdminLog> {
    try {
      const adminLog = this.adminLogRepository.create({
        action,
        resource,
        metadata,
        roleId,
        userId,
        status,
        description,
        errorMessage,
        requestInfo,
      });

      const savedLog = await this.adminLogRepository.save(adminLog);
      this.logger.log(`Admin action logged: ${action} on ${resource}`);
      return savedLog;
    } catch (error) {
      this.logger.error('Failed to log admin action:', error);
      throw error;
    }
  }

  /**
   * 创建角色
   */
  async createRole(createRoleDto: {
    name: string;
    description?: string;
    permissions?: string[];
  }): Promise<AdminRole> {
    try {
      // 检查角色名是否已存在
      const existingRole = await this.adminRoleRepository.findOne({
        where: { name: createRoleDto.name },
      });

      if (existingRole) {
        throw new HttpException('角色名已存在', HttpStatus.BAD_REQUEST);
      }

      const role = this.adminRoleRepository.create(createRoleDto);
      const savedRole = await this.adminRoleRepository.save(role);

      await this.logAction(
        'create',
        'admin_role',
        { roleId: savedRole.id, roleName: savedRole.name },
        1, // 假设系统管理员角色ID为1
        undefined,
        'success',
        `创建角色: ${savedRole.name}`,
      );

      return savedRole;
    } catch (error) {
      this.logger.error('Failed to create role:', error);
      throw error;
    }
  }

  /**
   * 获取所有角色
   */
  async findAllRoles(): Promise<AdminRole[]> {
    try {
      return await this.adminRoleRepository.find({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error('Failed to fetch roles:', error);
      throw error;
    }
  }

  /**
   * 创建权限
   */
  async createPermission(createPermissionDto: {
    code: string;
    name: string;
    description?: string;
    resource?: string;
    action?: string;
  }): Promise<AdminPermission> {
    try {
      // 检查权限代码是否已存在
      const existingPermission = await this.adminPermissionRepository.findOne({
        where: { code: createPermissionDto.code },
      });

      if (existingPermission) {
        throw new HttpException('权限代码已存在', HttpStatus.BAD_REQUEST);
      }

      const permission = this.adminPermissionRepository.create(createPermissionDto);
      const savedPermission = await this.adminPermissionRepository.save(permission);

      await this.logAction(
        'create',
        'admin_permission',
        { permissionId: savedPermission.id, permissionCode: savedPermission.code },
        1,
        undefined,
        'success',
        `创建权限: ${savedPermission.name}`,
      );

      return savedPermission;
    } catch (error) {
      this.logger.error('Failed to create permission:', error);
      throw error;
    }
  }

  /**
   * 获取所有权限
   */
  async findAllPermissions(): Promise<AdminPermission[]> {
    try {
      return await this.adminPermissionRepository.find({
        where: { isActive: true },
        order: { resource: 'ASC', action: 'ASC' },
      });
    } catch (error) {
      this.logger.error('Failed to fetch permissions:', error);
      throw error;
    }
  }

  /**
   * 获取系统统计数据
   */
  async getSystemStats(): Promise<{
    userCount: number;
    mediaCount: number;
    playSourceCount: number;
    watchHistoryCount: number;
    recentActivity: AdminLog[];
  }> {
    try {
      const [userCount, mediaCount, playSourceCount, watchHistoryCount, recentActivity] = await Promise.all([
        this.userRepository.count(),
        this.userRepository.manager.count('media_resource', {}),
        this.userRepository.manager.count('play_source', {}),
        this.userRepository.manager.count('watch_history', {}),
        this.adminLogRepository.find({
          order: { createdAt: 'DESC' },
          take: 10,
        }),
      ]);

      return {
        userCount,
        mediaCount,
        playSourceCount,
        watchHistoryCount,
        recentActivity,
      };
    } catch (error) {
      this.logger.error('Failed to get system stats:', error);
      throw error;
    }
  }

  /**
   * 获取管理日志
   */
  async getAdminLogs(
    page: number = 1,
    limit: number = 20,
    filters?: {
      action?: string;
      resource?: string;
      status?: 'success' | 'error' | 'warning';
      roleId?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<{
    data: AdminLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const queryBuilder = this.adminLogRepository.createQueryBuilder('adminLog')
        .leftJoinAndSelect('adminLog.role', 'role')
        .leftJoinAndSelect('adminLog.user', 'user');

      // 应用筛选条件
      if (filters) {
        if (filters.action) {
          queryBuilder.andWhere('adminLog.action = :action', { action: filters.action });
        }
        if (filters.resource) {
          queryBuilder.andWhere('adminLog.resource = :resource', { resource: filters.resource });
        }
        if (filters.status) {
          queryBuilder.andWhere('adminLog.status = :status', { status: filters.status });
        }
        if (filters.roleId) {
          queryBuilder.andWhere('adminLog.roleId = :roleId', { roleId: filters.roleId });
        }
        if (filters.startDate) {
          queryBuilder.andWhere('adminLog.createdAt >= :startDate', { startDate: filters.startDate });
        }
        if (filters.endDate) {
          queryBuilder.andWhere('adminLog.createdAt <= :endDate', { endDate: filters.endDate });
        }
      }

      // 获取总数
      const total = await queryBuilder.getCount();

      // 分页
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      // 排序
      queryBuilder.orderBy('adminLog.createdAt', 'DESC');

      const data = await queryBuilder.getMany();

      return {
        data,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error('Failed to get admin logs:', error);
      throw error;
    }
  }
}