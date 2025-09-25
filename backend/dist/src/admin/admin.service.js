"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const admin_role_entity_1 = require("../entities/admin-role.entity");
const admin_permission_entity_1 = require("../entities/admin-permission.entity");
const admin_log_entity_1 = require("../entities/admin-log.entity");
const user_entity_1 = require("../entities/user.entity");
let AdminService = AdminService_1 = class AdminService {
    adminRoleRepository;
    adminPermissionRepository;
    adminLogRepository;
    userRepository;
    logger = new common_1.Logger(AdminService_1.name);
    constructor(adminRoleRepository, adminPermissionRepository, adminLogRepository, userRepository) {
        this.adminRoleRepository = adminRoleRepository;
        this.adminPermissionRepository = adminPermissionRepository;
        this.adminLogRepository = adminLogRepository;
        this.userRepository = userRepository;
    }
    async logAction(action, resource, metadata = {}, roleId, userId, status = 'success', description, errorMessage, requestInfo) {
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
        }
        catch (error) {
            this.logger.error('Failed to log admin action:', error);
            throw error;
        }
    }
    async createRole(createRoleDto) {
        try {
            const existingRole = await this.adminRoleRepository.findOne({
                where: { name: createRoleDto.name },
            });
            if (existingRole) {
                throw new common_1.HttpException('角色名已存在', common_1.HttpStatus.BAD_REQUEST);
            }
            const role = this.adminRoleRepository.create(createRoleDto);
            const savedRole = await this.adminRoleRepository.save(role);
            await this.logAction('create', 'admin_role', { roleId: savedRole.id, roleName: savedRole.name }, 1, undefined, 'success', `创建角色: ${savedRole.name}`);
            return savedRole;
        }
        catch (error) {
            this.logger.error('Failed to create role:', error);
            throw error;
        }
    }
    async findAllRoles() {
        try {
            return await this.adminRoleRepository.find({
                where: { isActive: true },
                order: { createdAt: 'DESC' },
            });
        }
        catch (error) {
            this.logger.error('Failed to fetch roles:', error);
            throw error;
        }
    }
    async createPermission(createPermissionDto) {
        try {
            const existingPermission = await this.adminPermissionRepository.findOne({
                where: { code: createPermissionDto.code },
            });
            if (existingPermission) {
                throw new common_1.HttpException('权限代码已存在', common_1.HttpStatus.BAD_REQUEST);
            }
            const permission = this.adminPermissionRepository.create(createPermissionDto);
            const savedPermission = await this.adminPermissionRepository.save(permission);
            await this.logAction('create', 'admin_permission', { permissionId: savedPermission.id, permissionCode: savedPermission.code }, 1, undefined, 'success', `创建权限: ${savedPermission.name}`);
            return savedPermission;
        }
        catch (error) {
            this.logger.error('Failed to create permission:', error);
            throw error;
        }
    }
    async findAllPermissions() {
        try {
            return await this.adminPermissionRepository.find({
                where: { isActive: true },
                order: { resource: 'ASC', action: 'ASC' },
            });
        }
        catch (error) {
            this.logger.error('Failed to fetch permissions:', error);
            throw error;
        }
    }
    async getSystemStats() {
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
        }
        catch (error) {
            this.logger.error('Failed to get system stats:', error);
            throw error;
        }
    }
    async getAdminLogs(page = 1, limit = 20, filters) {
        try {
            const queryBuilder = this.adminLogRepository
                .createQueryBuilder('adminLog')
                .leftJoinAndSelect('adminLog.role', 'role')
                .leftJoinAndSelect('adminLog.user', 'user');
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
                    queryBuilder.andWhere('adminLog.createdAt >= :startDate', {
                        startDate: filters.startDate,
                    });
                }
                if (filters.endDate) {
                    queryBuilder.andWhere('adminLog.createdAt <= :endDate', { endDate: filters.endDate });
                }
            }
            const total = await queryBuilder.getCount();
            const offset = (page - 1) * limit;
            queryBuilder.skip(offset).take(limit);
            queryBuilder.orderBy('adminLog.createdAt', 'DESC');
            const data = await queryBuilder.getMany();
            return {
                data,
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            this.logger.error('Failed to get admin logs:', error);
            throw error;
        }
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(admin_role_entity_1.AdminRole)),
    __param(1, (0, typeorm_1.InjectRepository)(admin_permission_entity_1.AdminPermission)),
    __param(2, (0, typeorm_1.InjectRepository)(admin_log_entity_1.AdminLog)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map