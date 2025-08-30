import { AdminRole } from './admin-role.entity';
export declare class AdminPermission {
    id: number;
    code: string;
    name: string;
    description?: string;
    resource?: string;
    action?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    roles: AdminRole[];
}
