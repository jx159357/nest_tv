import { ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
jest.mock('../src/auth/jwt-auth.guard', () => ({
  JwtAuthGuard: class MockJwtAuthGuard {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<{
        headers: Record<string, string>;
        user?: unknown;
      }>();
      const role = request.headers['x-test-role'];

      if (!role) {
        throw new UnauthorizedException('Missing test role');
      }

      request.user = {
        id: 1,
        username: 'tester',
        email: 'tester@example.com',
        role,
        isActive: true,
      };

      return true;
    }
  },
}));

import { AdminController } from '../src/admin/admin.controller';
import { AdminRoleGuard } from '../src/admin/admin-role.guard';
import { AdminService } from '../src/admin/admin.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';

describe('AdminController (e2e)', () => {
  let app: INestApplication<App>;

  const adminService = {
    getSystemStats: jest.fn(),
    getDownloadTasks: jest.fn(),
    getAdminLogs: jest.fn(),
    createRole: jest.fn(),
    handleDownloadTaskAction: jest.fn(),
    handleDownloadTaskBatchAction: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        AdminRoleGuard,
        {
          provide: AdminService,
          useValue: adminService,
        },
        {
          provide: JwtAuthGuard,
          useClass: JwtAuthGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    adminService.getSystemStats.mockResolvedValue({
      userCount: 1,
      mediaCount: 2,
      playSourceCount: 3,
      watchHistoryCount: 4,
      downloadTaskCount: 5,
      activeDownloadTaskCount: 1,
      completedDownloadTaskCount: 3,
      failedDownloadTaskCount: 1,
      recentActivity: [],
    });
    adminService.getDownloadTasks.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    adminService.getAdminLogs.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    });
    adminService.createRole.mockResolvedValue({
      id: 1,
      name: 'content_admin',
      description: 'Content administrator',
      permissions: ['media_read'],
      isActive: true,
    });
    adminService.handleDownloadTaskAction.mockResolvedValue({
      id: 9,
      clientId: 'task-9',
      status: 'pending',
    });
    adminService.handleDownloadTaskBatchAction.mockResolvedValue([
      { id: 9, clientId: 'task-9', status: 'pending' },
    ]);
  });

  it('rejects unauthenticated requests', () => {
    return request(app.getHttpServer()).get('/admin/stats').expect(401);
  });

  it('rejects authenticated non-admin requests', () => {
    return request(app.getHttpServer()).get('/admin/stats').set('x-test-role', 'user').expect(403);
  });

  it('allows admin requests', async () => {
    await request(app.getHttpServer())
      .get('/admin/stats')
      .set('x-test-role', 'admin')
      .expect(200)
      .expect(({ body }: { body: { userCount: number } }) => {
        expect(body.userCount).toBe(1);
      });

    expect(adminService.getSystemStats).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid admin query params through ValidationPipe', () => {
    return request(app.getHttpServer())
      .get('/admin/download-tasks?limit=0&status=done')
      .set('x-test-role', 'admin')
      .expect(400);
  });

  it('coerces valid admin query params before calling the service', async () => {
    await request(app.getHttpServer())
      .get('/admin/download-tasks?page=2&limit=10&status=error&userId=8')
      .set('x-test-role', 'admin')
      .expect(200);

    expect(adminService.getDownloadTasks).toHaveBeenCalledWith(
      2,
      10,
      'error',
      undefined,
      8,
      undefined,
      undefined,
    );
  });

  it('rejects invalid admin role payloads through ValidationPipe', () => {
    return request(app.getHttpServer())
      .post('/admin/roles')
      .set('x-test-role', 'admin')
      .send({ description: 'missing name' })
      .expect(400);
  });

  it('strips unknown admin role payload fields before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/admin/roles')
      .set('x-test-role', 'admin')
      .send({
        name: 'content_admin',
        description: 'Content administrator',
        permissions: ['media_read'],
        ignoredField: 'should-not-pass-through',
      })
      .expect(201);

    expect(adminService.createRole).toHaveBeenCalledWith({
      name: 'content_admin',
      description: 'Content administrator',
      permissions: ['media_read'],
    });
  });

  it('passes admin download-task actions through ValidationPipe and service handling', async () => {
    await request(app.getHttpServer())
      .patch('/admin/download-tasks/9')
      .set('x-test-role', 'admin')
      .send({ action: 'retry', ignoredField: true })
      .expect(200);

    expect(adminService.handleDownloadTaskAction).toHaveBeenCalledWith(9, {
      action: 'retry',
    });
  });

  it('passes batch admin download-task actions through ValidationPipe and service handling', async () => {
    await request(app.getHttpServer())
      .patch('/admin/download-tasks/batch')
      .set('x-test-role', 'admin')
      .send({ action: 'retry', ids: [9, 10], ignoredField: true })
      .expect(200);

    expect(adminService.handleDownloadTaskBatchAction).toHaveBeenCalledWith({
      action: 'retry',
      ids: [9, 10],
    });
  });

  it('passes admin log metadata filters through ValidationPipe and service handling', async () => {
    await request(app.getHttpServer())
      .get('/admin/logs?action=retry&resource=download_task&clientId=task-21&downloadTaskId=21')
      .set('x-test-role', 'admin')
      .expect(200);

    expect(adminService.getAdminLogs).toHaveBeenCalledWith(1, 20, {
      action: 'retry',
      resource: 'download_task',
      status: undefined,
      roleId: undefined,
      clientId: 'task-21',
      downloadTaskId: 21,
    });
  });
});
