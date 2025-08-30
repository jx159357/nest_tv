import { AdminLog } from './admin-log.entity';
export declare class AdminRole {
    id: number;
    name: string;
    description?: string;
    isActive: boolean;
    permissions?: string[];
    createdAt: Date;
    updatedAt: Date;
    adminLogs: AdminLog[];
}
