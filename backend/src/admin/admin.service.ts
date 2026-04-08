import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AdminRole } from '../entities/admin-role.entity';
import { AdminPermission } from '../entities/admin-permission.entity';
import { AdminLog } from '../entities/admin-log.entity';
import { User } from '../entities/user.entity';
import { MediaResource } from '../entities/media-resource.entity';
import { PlaySource } from '../entities/play-source.entity';
import { WatchHistory } from '../entities/watch-history.entity';
import { DownloadTask, DownloadTaskStatus } from '../entities/download-task.entity';
import {
  CreatePermissionDto,
  CreateRoleDto,
  UpdatePermissionDto,
  UpdateRoleDto,
} from './dto/create-admin.dto';
import {
  AdminDownloadTaskAction,
  type AdminBatchDownloadTaskActionDto,
  type AdminDownloadTaskActionDto,
} from './dto/admin-download-task-action.dto';

/**
 * 后台管理服务
 * 提供系统管理、用户管理、内容管理等功能
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private static readonly MAX_PAGE_SIZE = 200;

  private normalizePagination(page?: number, limit?: number) {
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    return {
      safePage: Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1,
      safeLimit:
        Number.isFinite(parsedLimit) && parsedLimit > 0
          ? Math.min(Math.floor(parsedLimit), AdminService.MAX_PAGE_SIZE)
          : 20,
    };
  }

  private resolvePagination(total: number, page?: number, limit?: number) {
    const { safePage, safeLimit } = this.normalizePagination(page, limit);
    const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 0;
    const resolvedPage = totalPages > 0 ? Math.min(safePage, totalPages) : 1;

    return {
      page: resolvedPage,
      limit: safeLimit,
      totalPages,
      offset: (resolvedPage - 1) * safeLimit,
    };
  }

  constructor(
    @InjectRepository(AdminRole)
    private adminRoleRepository: Repository<AdminRole>,
    @InjectRepository(AdminPermission)
    private adminPermissionRepository: Repository<AdminPermission>,
    @InjectRepository(AdminLog)
    private adminLogRepository: Repository<AdminLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MediaResource)
    private mediaResourceRepository: Repository<MediaResource>,
    @InjectRepository(PlaySource)
    private playSourceRepository: Repository<PlaySource>,
    @InjectRepository(WatchHistory)
    private watchHistoryRepository: Repository<WatchHistory>,
    @InjectRepository(DownloadTask)
    private downloadTaskRepository: Repository<DownloadTask>,
  ) {}

  /**
   * Record admin action log
   */
  async logAction(
    action: string,
    resource: string,
    metadata: Record<string, unknown> = {},
    roleId: number,
    userId?: number,
    status: 'success' | 'error' | 'warning' = 'success',
    description?: string,
    errorMessage?: string,
    requestInfo?: Record<string, unknown>,
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

  async getUsers(page: number = 1, limit: number = 20, search?: string) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.username',
        'user.email',
        'user.phone',
        'user.nickname',
        'user.role',
        'user.isActive',
        'user.avatar',
        'user.lastLoginAt',
        'user.createdAt',
        'user.updatedAt',
      ]);

    if (search?.trim()) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search OR user.nickname LIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    const total = await queryBuilder.getCount();
    const pagination = this.resolvePagination(total, page, limit);
    const data = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(pagination.offset)
      .take(pagination.limit)
      .getMany();

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  }

  async getMedia(page: number = 1, limit: number = 20, type?: string, search?: string) {
    const queryBuilder = this.mediaResourceRepository.createQueryBuilder('media');

    if (type) {
      queryBuilder.andWhere('media.type = :type', { type });
    }

    if (search?.trim()) {
      queryBuilder.andWhere('(media.title LIKE :search OR media.description LIKE :search)', {
        search: `%${search.trim()}%`,
      });
    }

    const total = await queryBuilder.getCount();
    const pagination = this.resolvePagination(total, page, limit);
    const data = await queryBuilder
      .orderBy('media.createdAt', 'DESC')
      .skip(pagination.offset)
      .take(pagination.limit)
      .getMany();

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  }

  async getPlaySources(
    page: number = 1,
    limit: number = 20,
    type?: string,
    source?: string,
    sources?: string,
    search?: string,
    status?: string,
    sortBy?: string,
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ) {
    const queryBuilder = this.playSourceRepository
      .createQueryBuilder('playSource')
      .leftJoinAndSelect('playSource.mediaResource', 'mediaResource');

    const sortFieldMap = {
      createdAt: 'playSource.createdAt',
      lastCheckedAt: 'playSource.lastCheckedAt',
      priority: 'playSource.priority',
    } as const;

    const resolvedSortBy =
      sortBy && sortBy in sortFieldMap
        ? sortFieldMap[sortBy as keyof typeof sortFieldMap]
        : undefined;
    const resolvedSortOrder: 'ASC' | 'DESC' = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    if (type) {
      queryBuilder.andWhere('playSource.type = :type', { type });
    }

    if (status?.trim()) {
      queryBuilder.andWhere('playSource.status = :status', {
        status: status.trim(),
      });
    }

    if (source?.trim()) {
      queryBuilder.andWhere(
        `(
          playSource.sourceName LIKE :source
          OR playSource.name LIKE :source
          OR mediaResource.source LIKE :source
        )`,
        {
          source: `%${source.trim()}%`,
        },
      );
    }

    const sourceNames = sources
      ?.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);

    if (sourceNames && sourceNames.length > 0) {
      queryBuilder.andWhere('mediaResource.source IN (:...sourceNames)', {
        sourceNames,
      });
    }

    if (search?.trim()) {
      queryBuilder.andWhere(
        `(
          playSource.sourceName LIKE :search
          OR playSource.name LIKE :search
          OR playSource.url LIKE :search
          OR playSource.providerName LIKE :search
          OR mediaResource.title LIKE :search
          OR mediaResource.source LIKE :search
        )`,
        {
          search: `%${search.trim()}%`,
        },
      );
    }

    const total = await queryBuilder.getCount();

    if (resolvedSortBy === sortFieldMap.lastCheckedAt) {
      queryBuilder
        .orderBy(
          'CASE WHEN playSource.lastCheckedAt IS NULL THEN 0 ELSE 1 END',
          resolvedSortOrder === 'ASC' ? 'ASC' : 'DESC',
        )
        .addOrderBy(resolvedSortBy, resolvedSortOrder)
        .addOrderBy('playSource.createdAt', 'DESC');
    } else if (resolvedSortBy) {
      queryBuilder
        .orderBy(resolvedSortBy, resolvedSortOrder)
        .addOrderBy('playSource.createdAt', 'DESC');
    } else {
      queryBuilder.orderBy('playSource.createdAt', 'DESC');
    }

    const pagination = this.resolvePagination(total, page, limit);
    const data = await queryBuilder.skip(pagination.offset).take(pagination.limit).getMany();

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  }

  async getWatchHistory(page: number = 1, limit: number = 20, userId?: number) {
    const queryBuilder = this.watchHistoryRepository
      .createQueryBuilder('watchHistory')
      .leftJoinAndSelect('watchHistory.user', 'user')
      .leftJoinAndSelect('watchHistory.mediaResource', 'mediaResource');

    if (userId) {
      queryBuilder.andWhere('watchHistory.userId = :userId', { userId });
    }

    const total = await queryBuilder.getCount();
    const pagination = this.resolvePagination(total, page, limit);
    const data = await queryBuilder
      .orderBy('watchHistory.updatedAt', 'DESC')
      .skip(pagination.offset)
      .take(pagination.limit)
      .getMany();

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  }

  async getDownloadTasks(
    page: number = 1,
    limit: number = 20,
    status?: string,
    type?: string,
    userId?: number,
    mediaResourceId?: number,
    search?: string,
  ) {
    const { safePage, safeLimit } = this.normalizePagination(page, limit);
    const safeUserId = userId ? Number(userId) : undefined;
    const safeMediaResourceId = mediaResourceId ? Number(mediaResourceId) : undefined;
    const normalizedStatus = this.normalizeOptionalText(status);
    const normalizedType = this.normalizeOptionalText(type);
    const normalizedSearch = this.normalizeOptionalText(search);

    const queryBuilder = this.downloadTaskRepository
      .createQueryBuilder('downloadTask')
      .leftJoinAndSelect('downloadTask.user', 'user')
      .leftJoinAndSelect('downloadTask.mediaResource', 'mediaResource');

    if (safeUserId) {
      queryBuilder.andWhere('downloadTask.userId = :userId', { userId: safeUserId });
    }

    if (safeMediaResourceId) {
      queryBuilder.andWhere('downloadTask.mediaResourceId = :mediaResourceId', {
        mediaResourceId: safeMediaResourceId,
      });
    }

    if (normalizedStatus) {
      queryBuilder.andWhere('downloadTask.status = :status', { status: normalizedStatus });
    }

    if (normalizedType) {
      queryBuilder.andWhere('downloadTask.type = :type', { type: normalizedType });
    }

    if (normalizedSearch) {
      queryBuilder.andWhere(
        `(
          downloadTask.clientId LIKE :search
          OR downloadTask.fileName LIKE :search
          OR downloadTask.sourceLabel LIKE :search
          OR downloadTask.url LIKE :search
          OR user.username LIKE :search
          OR user.email LIKE :search
          OR mediaResource.title LIKE :search
        )`,
        { search: `%${normalizedSearch}%` },
      );
    }

    const total = await queryBuilder.getCount();
    const pagination = this.resolvePagination(total, safePage, safeLimit);
    const data = await queryBuilder
      .orderBy('downloadTask.updatedAt', 'DESC')
      .skip(pagination.offset)
      .take(pagination.limit)
      .getMany();

    return {
      data,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
    };
  }

  async handleDownloadTaskAction(
    id: number,
    actionDto: AdminDownloadTaskActionDto,
  ): Promise<DownloadTask> {
    const task = await this.downloadTaskRepository.findOne({
      where: { id },
      relations: ['user', 'mediaResource'],
    });

    if (!task) {
      throw new HttpException('Download task not found', HttpStatus.NOT_FOUND);
    }

    if (actionDto.action === AdminDownloadTaskAction.RETRY) {
      task.status = DownloadTaskStatus.PENDING;
      task.progress = 0;
      task.speed = 0;
      task.downloaded = 0;
      task.error = undefined;
      task.completedAt = undefined;
    }

    if (actionDto.action === AdminDownloadTaskAction.CANCEL) {
      task.status = DownloadTaskStatus.CANCELLED;
      task.speed = 0;
      task.error = task.error || '管理员手动取消';
    }

    const savedTask = await this.downloadTaskRepository.save(task);

    await this.logAction(
      actionDto.action,
      'download_task',
      {
        downloadTaskId: savedTask.id,
        clientId: savedTask.clientId,
        status: savedTask.status,
      },
      1,
      savedTask.userId,
      'success',
      `Handle download task: ${actionDto.action}`,
    );

    return savedTask;
  }

  async handleDownloadTaskBatchAction(
    actionDto: AdminBatchDownloadTaskActionDto,
  ): Promise<DownloadTask[]> {
    const uniqueIds = [...new Set(actionDto.ids)];

    return await Promise.all(
      uniqueIds.map(id =>
        this.handleDownloadTaskAction(id, {
          action: actionDto.action,
        }),
      ),
    );
  }

  private normalizePermissionCodes(permissionCodes?: string[]) {
    return [
      ...new Set((permissionCodes || []).map(code => code.trim()).filter(code => code.length > 0)),
    ];
  }

  private normalizeOptionalText(value?: string) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private async ensurePermissionCodesExist(permissionCodes?: string[]) {
    const normalizedCodes = this.normalizePermissionCodes(permissionCodes);

    if (normalizedCodes.length === 0) {
      return normalizedCodes;
    }

    const permissions = await this.adminPermissionRepository.find({
      where: {
        code: In(normalizedCodes),
        isActive: true,
      },
    });

    const existingCodes = new Set(permissions.map(permission => permission.code));
    const missingCodes = normalizedCodes.filter(code => !existingCodes.has(code));

    if (missingCodes.length > 0) {
      throw new HttpException(
        `Unknown or inactive permissions: ${missingCodes.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return normalizedCodes;
  }

  private async syncRolesForPermissionCode(previousCode: string, nextCode?: string) {
    const roles = await this.adminRoleRepository.find();
    const rolesToSave: AdminRole[] = [];

    for (const role of roles) {
      const currentPermissions = this.normalizePermissionCodes(role.permissions);
      if (!currentPermissions.includes(previousCode)) {
        continue;
      }

      role.permissions = nextCode
        ? [...new Set(currentPermissions.map(code => (code === previousCode ? nextCode : code)))]
        : currentPermissions.filter(code => code !== previousCode);
      rolesToSave.push(role);
    }

    if (rolesToSave.length > 0) {
      await this.adminRoleRepository.save(rolesToSave);
    }
  }

  /**
   * Create role
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<AdminRole> {
    try {
      const roleName = createRoleDto.name.trim();
      if (!roleName) {
        throw new HttpException('Role name is required', HttpStatus.BAD_REQUEST);
      }

      const existingRole = await this.adminRoleRepository.findOne({
        where: { name: roleName },
      });

      if (existingRole) {
        throw new HttpException('Role name already exists', HttpStatus.BAD_REQUEST);
      }

      const role = this.adminRoleRepository.create({
        name: roleName,
        description: this.normalizeOptionalText(createRoleDto.description),
        permissions: await this.ensurePermissionCodesExist(createRoleDto.permissions),
      });
      const savedRole = await this.adminRoleRepository.save(role);

      await this.logAction(
        'create',
        'admin_role',
        { roleId: savedRole.id, roleName: savedRole.name },
        1,
        undefined,
        'success',
        `Create role: ${savedRole.name}`,
      );

      return savedRole;
    } catch (error) {
      this.logger.error('Failed to create role:', error);
      throw error;
    }
  }

  /**
   * Fetch all roles
   */
  async findAllRoles(): Promise<AdminRole[]> {
    try {
      return await this.adminRoleRepository.find({
        order: { isActive: 'DESC', updatedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error('Failed to fetch roles:', error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<AdminRole> {
    try {
      const role = await this.adminRoleRepository.findOne({ where: { id } });
      if (!role) {
        throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
      }

      const nextName = updateRoleDto.name !== undefined ? updateRoleDto.name.trim() : role.name;
      if (!nextName) {
        throw new HttpException('Role name is required', HttpStatus.BAD_REQUEST);
      }

      if (nextName !== role.name) {
        const existingRole = await this.adminRoleRepository.findOne({ where: { name: nextName } });
        if (existingRole && existingRole.id !== role.id) {
          throw new HttpException('Role name already exists', HttpStatus.BAD_REQUEST);
        }
      }

      role.name = nextName;
      if (updateRoleDto.description !== undefined) {
        role.description = this.normalizeOptionalText(updateRoleDto.description);
      }
      if (updateRoleDto.permissions !== undefined) {
        role.permissions = await this.ensurePermissionCodesExist(updateRoleDto.permissions);
      }
      if (updateRoleDto.isActive !== undefined) {
        role.isActive = updateRoleDto.isActive;
      }

      const savedRole = await this.adminRoleRepository.save(role);

      await this.logAction(
        'update',
        'admin_role',
        { roleId: savedRole.id, roleName: savedRole.name },
        1,
        undefined,
        'success',
        `Update role: ${savedRole.name}`,
      );

      return savedRole;
    } catch (error) {
      this.logger.error('Failed to update role:', error);
      throw error;
    }
  }

  /**
   * Create permission
   */
  async createPermission(createPermissionDto: CreatePermissionDto): Promise<AdminPermission> {
    try {
      const permissionCode = createPermissionDto.code.trim();
      const permissionName = createPermissionDto.name.trim();

      if (!permissionCode || !permissionName) {
        throw new HttpException('Permission code and name are required', HttpStatus.BAD_REQUEST);
      }

      const existingPermission = await this.adminPermissionRepository.findOne({
        where: { code: permissionCode },
      });

      if (existingPermission) {
        throw new HttpException('Permission code already exists', HttpStatus.BAD_REQUEST);
      }

      const permission = this.adminPermissionRepository.create({
        code: permissionCode,
        name: permissionName,
        description: this.normalizeOptionalText(createPermissionDto.description),
        resource: this.normalizeOptionalText(createPermissionDto.resource),
        action: this.normalizeOptionalText(createPermissionDto.action),
      });
      const savedPermission = await this.adminPermissionRepository.save(permission);

      await this.logAction(
        'create',
        'admin_permission',
        { permissionId: savedPermission.id, permissionCode: savedPermission.code },
        1,
        undefined,
        'success',
        `Create permission: ${savedPermission.name}`,
      );

      return savedPermission;
    } catch (error) {
      this.logger.error('Failed to create permission:', error);
      throw error;
    }
  }

  /**
   * Fetch all permissions
   */
  async findAllPermissions(): Promise<AdminPermission[]> {
    try {
      return await this.adminPermissionRepository.find({
        order: { isActive: 'DESC', resource: 'ASC', action: 'ASC', updatedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error('Failed to fetch permissions:', error);
      throw error;
    }
  }

  /**
   * Update permission
   */
  async updatePermission(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<AdminPermission> {
    try {
      const permission = await this.adminPermissionRepository.findOne({ where: { id } });
      if (!permission) {
        throw new HttpException('Permission not found', HttpStatus.NOT_FOUND);
      }

      const previousCode = permission.code;
      const nextCode =
        updatePermissionDto.code !== undefined ? updatePermissionDto.code.trim() : permission.code;
      const nextName =
        updatePermissionDto.name !== undefined ? updatePermissionDto.name.trim() : permission.name;
      const nextIsActive = updatePermissionDto.isActive ?? permission.isActive;

      if (!nextCode || !nextName) {
        throw new HttpException('Permission code and name are required', HttpStatus.BAD_REQUEST);
      }

      if (nextCode !== previousCode) {
        const existingPermission = await this.adminPermissionRepository.findOne({
          where: { code: nextCode },
        });

        if (existingPermission && existingPermission.id !== permission.id) {
          throw new HttpException('Permission code already exists', HttpStatus.BAD_REQUEST);
        }
      }

      permission.code = nextCode;
      permission.name = nextName;
      if (updatePermissionDto.description !== undefined) {
        permission.description = this.normalizeOptionalText(updatePermissionDto.description);
      }
      if (updatePermissionDto.resource !== undefined) {
        permission.resource = this.normalizeOptionalText(updatePermissionDto.resource);
      }
      if (updatePermissionDto.action !== undefined) {
        permission.action = this.normalizeOptionalText(updatePermissionDto.action);
      }
      permission.isActive = nextIsActive;

      const savedPermission = await this.adminPermissionRepository.save(permission);

      if (previousCode !== nextCode) {
        await this.syncRolesForPermissionCode(previousCode, nextIsActive ? nextCode : undefined);
      } else if (!nextIsActive) {
        await this.syncRolesForPermissionCode(previousCode);
      }

      await this.logAction(
        'update',
        'admin_permission',
        { permissionId: savedPermission.id, permissionCode: savedPermission.code },
        1,
        undefined,
        'success',
        `Update permission: ${savedPermission.name}`,
      );

      return savedPermission;
    } catch (error) {
      this.logger.error('Failed to update permission:', error);
      throw error;
    }
  }

  async getSystemStats(): Promise<{
    userCount: number;
    mediaCount: number;
    playSourceCount: number;
    watchHistoryCount: number;
    downloadTaskCount: number;
    activeDownloadTaskCount: number;
    completedDownloadTaskCount: number;
    failedDownloadTaskCount: number;
    recentActivity: AdminLog[];
  }> {
    try {
      const [
        userCount,
        mediaCount,
        playSourceCount,
        watchHistoryCount,
        downloadTaskCount,
        activeDownloadTaskCount,
        completedDownloadTaskCount,
        failedDownloadTaskCount,
        recentActivity,
      ] = await Promise.all([
        this.userRepository.count(),
        this.userRepository.manager.count('media_resource', {}),
        this.userRepository.manager.count('play_source', {}),
        this.userRepository.manager.count('watch_history', {}),
        this.downloadTaskRepository.count(),
        this.downloadTaskRepository.count({
          where: { status: In([DownloadTaskStatus.PENDING, DownloadTaskStatus.DOWNLOADING]) },
        }),
        this.downloadTaskRepository.count({
          where: { status: DownloadTaskStatus.COMPLETED },
        }),
        this.downloadTaskRepository.count({
          where: { status: In([DownloadTaskStatus.ERROR, DownloadTaskStatus.CANCELLED]) },
        }),
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
        downloadTaskCount,
        activeDownloadTaskCount,
        completedDownloadTaskCount,
        failedDownloadTaskCount,
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
      clientId?: string;
      downloadTaskId?: number;
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
      const queryBuilder = this.adminLogRepository
        .createQueryBuilder('adminLog')
        .leftJoinAndSelect('adminLog.role', 'role')
        .leftJoinAndSelect('adminLog.user', 'user');

      // 应用筛选条�?
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
        if (filters.clientId) {
          queryBuilder.andWhere(
            "JSON_UNQUOTE(JSON_EXTRACT(adminLog.metadata, '$.clientId')) = :clientId",
            { clientId: filters.clientId },
          );
        }
        if (filters.downloadTaskId) {
          queryBuilder.andWhere(
            "JSON_UNQUOTE(JSON_EXTRACT(adminLog.metadata, '$.downloadTaskId')) = :downloadTaskId",
            { downloadTaskId: String(filters.downloadTaskId) },
          );
        }
        if (filters.startDate) {
          queryBuilder.andWhere('adminLog.createdAt >= :startDate', {
            startDate: filters.startDate,
          });
        }
        if (filters.endDate) {
          queryBuilder.andWhere('adminLog.createdAt <= :endDate', { endDate: filters.endDate });
        }
      }

      // 获取总数
      const total = await queryBuilder.getCount();

      // 分页
      const pagination = this.resolvePagination(total, page, limit);
      queryBuilder.skip(pagination.offset).take(pagination.limit);

      // 排序
      queryBuilder.orderBy('adminLog.createdAt', 'DESC');

      const data = await queryBuilder.getMany();

      return {
        data,
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: pagination.totalPages,
      };
    } catch (error) {
      this.logger.error('Failed to get admin logs:', error);
      throw error;
    }
  }
}
