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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const admin_role_entity_1 = require("../entities/admin-role.entity");
const admin_permission_entity_1 = require("../entities/admin-permission.entity");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let AdminController = class AdminController {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getSystemStats() {
        return await this.adminService.getSystemStats();
    }
    async createRole(createRoleDto) {
        return await this.adminService.createRole(createRoleDto);
    }
    async findAllRoles() {
        return await this.adminService.findAllRoles();
    }
    async createPermission(createPermissionDto) {
        return await this.adminService.createPermission(createPermissionDto);
    }
    async findAllPermissions() {
        return await this.adminService.findAllPermissions();
    }
    async getAdminLogs(page = 1, limit = 20, action, resource, status, roleId) {
        const filters = { action, resource, status, roleId };
        return await this.adminService.getAdminLogs(page, limit, filters);
    }
    getUsers(page = 1, limit = 20, search) {
        return { message: '用户管理功能待实现', page, limit, search };
    }
    getMedia(page = 1, limit = 20, type) {
        return { message: '媒体资源管理功能待实现', page, limit, type };
    }
    getPlaySources(page = 1, limit = 20, type) {
        return { message: '播放源管理功能待实现', page, limit, type };
    }
    getWatchHistory(page = 1, limit = 20, userId) {
        return { message: '观看历史管理功能待实现', page, limit, userId };
    }
    healthCheck() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: '获取系统统计数据' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取系统统计数据' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemStats", null);
__decorate([
    (0, common_1.Post)('roles'),
    (0, swagger_1.ApiOperation)({ summary: '创建角色' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'content_admin' },
                description: { type: 'string', example: '内容管理员' },
                permissions: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['user_read', 'media_create', 'media_update'],
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '角色创建成功', type: admin_role_entity_1.AdminRole }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createRole", null);
__decorate([
    (0, common_1.Get)('roles'),
    (0, swagger_1.ApiOperation)({ summary: '获取所有角色' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取角色列表', type: [admin_role_entity_1.AdminRole] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "findAllRoles", null);
__decorate([
    (0, common_1.Post)('permissions'),
    (0, swagger_1.ApiOperation)({ summary: '创建权限' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                code: { type: 'string', example: 'user_create' },
                name: { type: 'string', example: '创建用户' },
                description: { type: 'string', example: '允许创建新用户' },
                resource: { type: 'string', example: 'user' },
                action: { type: 'string', example: 'create' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '权限创建成功', type: admin_permission_entity_1.AdminPermission }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createPermission", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, swagger_1.ApiOperation)({ summary: '获取所有权限' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取权限列表', type: [admin_permission_entity_1.AdminPermission] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "findAllPermissions", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, swagger_1.ApiOperation)({ summary: '获取管理操作日志' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: '页码' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '每页数量' }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false, type: String, description: '操作类型筛选' }),
    (0, swagger_1.ApiQuery)({ name: 'resource', required: false, type: String, description: '资源类型筛选' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String, description: '状态筛选' }),
    (0, swagger_1.ApiQuery)({ name: 'roleId', required: false, type: Number, description: '角色ID筛选' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取管理日志' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('action')),
    __param(3, (0, common_1.Query)('resource')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdminLogs", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: '获取用户管理列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: '页码' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '每页数量' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, description: '搜索关键词' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取用户列表' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('media'),
    (0, swagger_1.ApiOperation)({ summary: '获取媒体资源管理列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: '页码' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '每页数量' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, type: String, description: '类型筛选' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取媒体资源列表' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getMedia", null);
__decorate([
    (0, common_1.Get)('play-sources'),
    (0, swagger_1.ApiOperation)({ summary: '获取播放源管理列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: '页码' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '每页数量' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, type: String, description: '类型筛选' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取播放源列表' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getPlaySources", null);
__decorate([
    (0, common_1.Get)('watch-history'),
    (0, swagger_1.ApiOperation)({ summary: '获取观看历史管理列表' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: '页码' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: '每页数量' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, type: Number, description: '用户ID筛选' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '成功获取观看历史列表' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "getWatchHistory", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: '系统健康检查' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '系统状态正常' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "healthCheck", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('后台管理'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map