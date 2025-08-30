export declare class CreateRoleDto {
    name: string;
    description?: string;
    permissions?: string[];
}
export declare class CreatePermissionDto {
    code: string;
    name: string;
    description?: string;
    resource?: string;
    action?: string;
}
