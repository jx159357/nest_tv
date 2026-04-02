import { UserController } from './user.controller';

describe('UserController', () => {
  const userService = {
    register: jest.fn(),
    login: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };
  const authService = {};

  let controller: UserController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UserController(userService as never, authService as never);
  });

  it('updates the authenticated user profile and recommendation settings', async () => {
    userService.updateProfile.mockResolvedValue({ id: 7, username: 'demo' });

    await controller.updateProfile(
      {
        user: {
          id: 7,
          username: 'demo',
          email: 'demo@example.com',
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
      } as never,
      {
        nickname: 'Demo',
        recommendationSettings: {
          preferredTypes: ['movie'],
          freshnessBias: 'fresh',
        },
      },
    );

    expect(userService.updateProfile).toHaveBeenCalledWith(7, {
      nickname: 'Demo',
      recommendationSettings: {
        preferredTypes: ['movie'],
        freshnessBias: 'fresh',
      },
    });
  });

  it('changes the authenticated user password', async () => {
    userService.changePassword.mockResolvedValue(undefined);

    await controller.changePassword(
      {
        user: {
          id: 7,
          username: 'demo',
          email: 'demo@example.com',
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
      } as never,
      {
        oldPassword: 'old-pass-123',
        newPassword: 'new-pass-456',
      },
    );

    expect(userService.changePassword).toHaveBeenCalledWith(7, {
      oldPassword: 'old-pass-123',
      newPassword: 'new-pass-456',
    });
  });
});
