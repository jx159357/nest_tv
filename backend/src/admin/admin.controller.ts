import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminRole } from '../entities/admin-role.entity';
import { AdminPermission } from '../entities/admin-permission.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * 后台管理控制器
 * 提供系统管理、用户管理、内容管理等API接口
 */
@ApiTags('后台管理')
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * 获取系统统计数据
   */
  @Get('stats')
  @ApiOperation({ summary: '获取系统统计数据' })
  @ApiResponse({ status: 200, description: '成功获取系统统计数据' })
  async getSystemStats() {
    return await this.adminService.getSystemStats();
  }

  /**
   * 创建角色
   */
  @Post('roles')
  @ApiOperation({ summary: '创建角色' })
  @ApiBody({
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
  })
  @ApiResponse({ status: 201, description: '角色创建成功', type: AdminRole })
  async createRole(
    @Body() createRoleDto: { name: string; description?: string; permissions?: string[] },
  ) {
    return await this.adminService.createRole(createRoleDto);
  }

  /**
   * 获取所有角色
   */
  @Get('roles')
  @ApiOperation({ summary: '获取所有角色' })
  @ApiResponse({ status: 200, description: '成功获取角色列表', type: [AdminRole] })
  async findAllRoles(): Promise<AdminRole[]> {
    return await this.adminService.findAllRoles();
  }

  /**
   * 创建权限
   */
  @Post('permissions')
  @ApiOperation({ summary: '创建权限' })
  @ApiBody({
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
  })
  @ApiResponse({ status: 201, description: '权限创建成功', type: AdminPermission })
  async createPermission(
    @Body()
    createPermissionDto: {
      code: string;
      name: string;
      description?: string;
      resource?: string;
      action?: string;
    },
  ) {
    return await this.adminService.createPermission(createPermissionDto);
  }

  /**
   * 获取所有权限
   */
  @Get('permissions')
  @ApiOperation({ summary: '获取所有权限' })
  @ApiResponse({ status: 200, description: '成功获取权限列表', type: [AdminPermission] })
  async findAllPermissions(): Promise<AdminPermission[]> {
    return await this.adminService.findAllPermissions();
  }

  /**
   * 获取管理日志
   */
  @Get('logs')
  @ApiOperation({ summary: '获取管理操作日志' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'action', required: false, type: String, description: '操作类型筛选' })
  @ApiQuery({ name: 'resource', required: false, type: String, description: '资源类型筛选' })
  @ApiQuery({ name: 'status', required: false, type: String, description: '状态筛选' })
  @ApiQuery({ name: 'roleId', required: false, type: Number, description: '角色ID筛选' })
  @ApiResponse({ status: 200, description: '成功获取管理日志' })
  async getAdminLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('status') status?: 'success' | 'error' | 'warning',
    @Query('roleId') roleId?: number,
  ) {
    const filters = { action, resource, status, roleId };
    return await this.adminService.getAdminLogs(page, limit, filters);
  }

  /**
   * 获取用户管理列表
   */
  @Get('users')
  @ApiOperation({ summary: '获取用户管理列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'search', required: false, type: String, description: '搜索关键词' })
  @ApiResponse({ status: 200, description: '成功获取用户列表' })
  getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('search') search?: string,
  ) {
    // 这个方法将在UserModule中实现具体逻辑
    return { message: '用户管理功能待实现', page, limit, search };
  }

  /**
   * 获取媒体资源管理列表
   */
  @Get('media')
  @ApiOperation({ summary: '获取媒体资源管理列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'type', required: false, type: String, description: '类型筛选' })
  @ApiResponse({ status: 200, description: '成功获取媒体资源列表' })
  getMedia(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('type') type?: string,
  ) {
    // 这个方法将在MediaModule中实现具体逻辑
    return { message: '媒体资源管理功能待实现', page, limit, type };
  }

  /**
   * 获取播放源管理列表
   */
  @Get('play-sources')
  @ApiOperation({ summary: '获取播放源管理列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'type', required: false, type: String, description: '类型筛选' })
  @ApiResponse({ status: 200, description: '成功获取播放源列表' })
  getPlaySources(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('type') type?: string,
  ) {
    // 这个方法将在PlaySourceModule中实现具体逻辑
    return { message: '播放源管理功能待实现', page, limit, type };
  }

  /**
   * 获取观看历史管理列表
   */
  @Get('watch-history')
  @ApiOperation({ summary: '获取观看历史管理列表' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: '用户ID筛选' })
  @ApiResponse({ status: 200, description: '成功获取观看历史列表' })
  getWatchHistory(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('userId') userId?: number,
  ) {
    // 这个方法将在WatchHistoryModule中实现具体逻辑
    return { message: '观看历史管理功能待实现', page, limit, userId };
  }

  /**
   * 系统健康检查
   */
  @Get('health')
  @ApiOperation({ summary: '系统健康检查' })
  @ApiResponse({ status: 200, description: '系统状态正常' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
