import { Repository } from 'typeorm';
import { AdminRole } from '../entities/admin-role.entity';
import { AdminPermission } from '../entities/admin-permission.entity';
import { AdminLog } from '../entities/admin-log.entity';
import { User } from '../entities/user.entity';
export declare class AdminService {
    private adminRoleRepository;
    private adminPermissionRepository;
    private adminLogRepository;
    private userRepository;
    private readonly logger;
    constructor(adminRoleRepository: Repository<AdminRole>, adminPermissionRepository: Repository<AdminPermission>, adminLogRepository: Repository<AdminLog>, userRepository: Repository<User>);
    logAction(action: string, resource: string, metadata: Record<string, unknown> | undefined, roleId: number, userId?: number, status?: 'success' | 'error' | 'warning', description?: string, errorMessage?: string, requestInfo?: Record<string, unknown>): Promise<AdminLog>;
    createRole(createRoleDto: {
        name: string;
        description?: string;
        permissions?: string[];
    }): Promise<AdminRole>;
    findAllRoles(): Promise<AdminRole[]>;
    createPermission(createPermissionDto: {
        code: string;
        name: string;
        description?: string;
        resource?: string;
        action?: string;
    }): Promise<AdminPermission>;
    findAllPermissions(): Promise<AdminPermission[]>;
    getSystemStats(): Promise<{
        userCount: number;
        mediaCount: number;
        playSourceCount: number;
        watchHistoryCount: number;
        recentActivity: AdminLog[];
    }>;
    getAdminLogs(page?: number, limit?: number, filters?: {
        action?: string;
        resource?: string;
        status?: 'success' | 'error' | 'warning';
        roleId?: number;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{
        data: AdminLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
