import { AdminService } from './admin.service';
import { AdminRole } from '../entities/admin-role.entity';
import { AdminPermission } from '../entities/admin-permission.entity';
import { AdminLog } from '../entities/admin-log.entity';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getSystemStats(): Promise<{
        userCount: number;
        mediaCount: number;
        playSourceCount: number;
        watchHistoryCount: number;
        recentActivity: AdminLog[];
    }>;
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
    getAdminLogs(page?: number, limit?: number, action?: string, resource?: string, status?: 'success' | 'error' | 'warning', roleId?: number): Promise<{
        data: AdminLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getUsers(page?: number, limit?: number, search?: string): Promise<{
        message: string;
        page: number;
        limit: number;
        search: string | undefined;
    }>;
    getMedia(page?: number, limit?: number, type?: string): Promise<{
        message: string;
        page: number;
        limit: number;
        type: string | undefined;
    }>;
    getPlaySources(page?: number, limit?: number, type?: string): Promise<{
        message: string;
        page: number;
        limit: number;
        type: string | undefined;
    }>;
    getWatchHistory(page?: number, limit?: number, userId?: number): Promise<{
        message: string;
        page: number;
        limit: number;
        userId: number | undefined;
    }>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
    }>;
}
