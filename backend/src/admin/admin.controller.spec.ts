import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
  const adminService = {
    getSystemStats: jest.fn(),
    getDownloadTasks: jest.fn(),
  };

  let controller: AdminController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: adminService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('returns system stats from the admin service', async () => {
    const stats = {
      userCount: 10,
      mediaCount: 20,
      playSourceCount: 30,
      watchHistoryCount: 40,
      downloadTaskCount: 5,
      activeDownloadTaskCount: 2,
      completedDownloadTaskCount: 2,
      failedDownloadTaskCount: 1,
      recentActivity: [],
    };
    adminService.getSystemStats.mockResolvedValue(stats);

    await expect(controller.getSystemStats()).resolves.toEqual(stats);
    expect(adminService.getSystemStats).toHaveBeenCalledTimes(1);
  });

  it('passes pagination and filters to download-task admin listing', async () => {
    const payload = {
      data: [{ id: 1, clientId: 'task-1' }],
      total: 1,
      page: 2,
      limit: 10,
      totalPages: 1,
    };
    adminService.getDownloadTasks.mockResolvedValue(payload);

    await expect(
      controller.getDownloadTasks({
        page: 2,
        limit: 10,
        status: 'downloading' as never,
        type: 'magnet' as never,
        userId: 8,
        mediaResourceId: 15,
        search: 'demo',
      }),
    ).resolves.toEqual(payload);
    expect(adminService.getDownloadTasks).toHaveBeenCalledWith(
      2,
      10,
      'downloading',
      'magnet',
      8,
      15,
      'demo',
    );
  });
});
