import { AdminRole } from './admin-role.entity';
import { User } from './user.entity';
export declare class AdminLog {
    id: number;
    action: string;
    resource: string;
    metadata?: {
        targetId?: number;
        changes?: any;
        request?: any;
        response?: any;
    };
    description?: string;
    status: 'success' | 'error' | 'warning';
    errorMessage?: string;
    requestInfo?: {
        ip: string;
        userAgent: string;
        method: string;
        url: string;
    };
    role: AdminRole;
    roleId: number;
    user?: User;
    userId?: number;
    createdAt: Date;
}
