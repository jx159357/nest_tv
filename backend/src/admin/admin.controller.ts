import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminPermission } from '../entities/admin-permission.entity';
import { AdminRole } from '../entities/admin-role.entity';
import { AdminRoleGuard } from './admin-role.guard';
import { AdminService } from './admin.service';
import {
  CreatePermissionDto,
  CreateRoleDto,
  UpdatePermissionDto,
  UpdateRoleDto,
} from './dto/create-admin.dto';
import {
  AdminDownloadTasksQueryDto,
  AdminLogsQueryDto,
  AdminMediaQueryDto,
  AdminPlaySourcesQueryDto,
  AdminUsersQueryDto,
  AdminWatchHistoryQueryDto,
} from './dto/admin-query.dto';
import {
  AdminBatchDownloadTaskActionDto,
  AdminDownloadTaskActionDto,
} from './dto/admin-download-task-action.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get system stats' })
  @ApiResponse({ status: 200, description: 'System stats loaded successfully' })
  async getSystemStats() {
    return await this.adminService.getSystemStats();
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create role' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'content_admin' },
        description: { type: 'string', example: 'Content administrator' },
        permissions: {
          type: 'array',
          items: { type: 'string' },
          example: ['user_read', 'media_create', 'media_update'],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Role created successfully', type: AdminRole })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return await this.adminService.createRole(createRoleDto);
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Role list loaded successfully', type: [AdminRole] })
  async findAllRoles(): Promise<AdminRole[]> {
    return await this.adminService.findAllRoles();
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully', type: AdminRole })
  async updateRole(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
    return await this.adminService.updateRole(id, updateRoleDto);
  }

  @Post('permissions')
  @ApiOperation({ summary: 'Create permission' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        code: { type: 'string', example: 'user_create' },
        name: { type: 'string', example: 'Create user' },
        description: { type: 'string', example: 'Allows creating new users' },
        resource: { type: 'string', example: 'user' },
        action: { type: 'string', example: 'create' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Permission created successfully',
    type: AdminPermission,
  })
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return await this.adminService.createPermission(createPermissionDto);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({
    status: 200,
    description: 'Permission list loaded successfully',
    type: [AdminPermission],
  })
  async findAllPermissions(): Promise<AdminPermission[]> {
    return await this.adminService.findAllPermissions();
  }

  @Patch('permissions/:id')
  @ApiOperation({ summary: 'Update permission' })
  @ApiResponse({
    status: 200,
    description: 'Permission updated successfully',
    type: AdminPermission,
  })
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    return await this.adminService.updatePermission(id, updatePermissionDto);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get admin logs' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size' })
  @ApiQuery({ name: 'action', required: false, type: String, description: 'Action filter' })
  @ApiQuery({ name: 'resource', required: false, type: String, description: 'Resource filter' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Status filter' })
  @ApiQuery({ name: 'roleId', required: false, type: Number, description: 'Role id filter' })
  @ApiQuery({
    name: 'clientId',
    required: false,
    type: String,
    description: 'Download task client id filter',
  })
  @ApiQuery({
    name: 'downloadTaskId',
    required: false,
    type: Number,
    description: 'Download task id filter',
  })
  @ApiResponse({ status: 200, description: 'Admin log list loaded successfully' })
  async getAdminLogs(@Query() queryDto: AdminLogsQueryDto) {
    const {
      page = 1,
      limit = 20,
      action,
      resource,
      status,
      roleId,
      clientId,
      downloadTaskId,
    } = queryDto;
    return await this.adminService.getAdminLogs(page, limit, {
      action,
      resource,
      status,
      roleId,
      clientId,
      downloadTaskId,
    });
  }

  @Get('users')
  @ApiOperation({ summary: 'Get users' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search keyword' })
  @ApiResponse({ status: 200, description: 'User list loaded successfully' })
  getUsers(@Query() queryDto: AdminUsersQueryDto) {
    const { page = 1, limit = 20, search } = queryDto;
    return this.adminService.getUsers(page, limit, search);
  }

  @Get('media')
  @ApiOperation({ summary: 'Get media list' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Media type filter' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search keyword' })
  @ApiResponse({ status: 200, description: 'Media list loaded successfully' })
  getMedia(@Query() queryDto: AdminMediaQueryDto) {
    const { page = 1, limit = 20, type, search } = queryDto;
    return this.adminService.getMedia(page, limit, type, search);
  }

  @Get('play-sources')
  @ApiOperation({ summary: 'Get play sources' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Source type filter' })
  @ApiQuery({ name: 'source', required: false, type: String, description: 'Source label filter' })
  @ApiQuery({
    name: 'sources',
    required: false,
    type: String,
    description: 'Comma separated sources',
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search keyword' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Source status filter' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort order' })
  @ApiResponse({ status: 200, description: 'Play source list loaded successfully' })
  getPlaySources(@Query() queryDto: AdminPlaySourcesQueryDto) {
    const {
      page = 1,
      limit = 20,
      type,
      source,
      sources,
      search,
      status,
      sortBy,
      sortOrder,
    } = queryDto;
    return this.adminService.getPlaySources(
      page,
      limit,
      type,
      source,
      sources,
      search,
      status,
      sortBy,
      sortOrder,
    );
  }

  @Get('watch-history')
  @ApiOperation({ summary: 'Get watch history' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size' })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'User id filter' })
  @ApiResponse({ status: 200, description: 'Watch history loaded successfully' })
  getWatchHistory(@Query() queryDto: AdminWatchHistoryQueryDto) {
    const { page = 1, limit = 20, userId } = queryDto;
    return this.adminService.getWatchHistory(page, limit, userId);
  }

  @Get('download-tasks')
  @ApiOperation({ summary: 'Get download tasks' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Task status filter' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Task type filter' })
  @ApiQuery({ name: 'userId', required: false, type: Number, description: 'User id filter' })
  @ApiQuery({
    name: 'mediaResourceId',
    required: false,
    type: Number,
    description: 'Media id filter',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'File/source/url/user search',
  })
  @ApiResponse({ status: 200, description: 'Download task list loaded successfully' })
  getDownloadTasks(@Query() queryDto: AdminDownloadTasksQueryDto) {
    const { page = 1, limit = 20, status, type, userId, mediaResourceId, search } = queryDto;
    return this.adminService.getDownloadTasks(
      page,
      limit,
      status,
      type,
      userId,
      mediaResourceId,
      search,
    );
  }

  @Patch('download-tasks/batch')
  @ApiOperation({ summary: 'Handle download tasks in batch' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['retry', 'cancel'], example: 'retry' },
        ids: {
          type: 'array',
          items: { type: 'number' },
          example: [11, 12],
        },
      },
      required: ['action', 'ids'],
    },
  })
  @ApiResponse({ status: 200, description: 'Download tasks handled successfully' })
  handleDownloadTasksBatch(@Body() actionDto: AdminBatchDownloadTaskActionDto) {
    return this.adminService.handleDownloadTaskBatchAction(actionDto);
  }

  @Patch('download-tasks/:id')
  @ApiOperation({ summary: 'Handle download task' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['retry', 'cancel'], example: 'retry' },
      },
      required: ['action'],
    },
  })
  @ApiResponse({ status: 200, description: 'Download task handled successfully' })
  handleDownloadTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() actionDto: AdminDownloadTaskActionDto,
  ) {
    return this.adminService.handleDownloadTaskAction(id, actionDto);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}
