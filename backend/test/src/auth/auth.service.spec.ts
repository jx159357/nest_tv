import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../src/auth/auth.service';
import { UserService } from '../../../src/users/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserResponseDto } from '../../../src/users/dtos/user-response.dto';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: UserResponseDto = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    isActive: true,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  const mockUserService = {
    login: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const values: Record<string, unknown> = {
        JWT_EXPIRATION: 3600,
        JWT_REFRESH_EXPIRATION: 604800,
        JWT_AUDIENCE: 'nest-tv-client',
        JWT_ISSUER: 'nest-tv-server',
      };

      return values[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('returns user when credentials are valid', async () => {
      mockUserService.login.mockResolvedValue({
        accessToken: 'token',
        user: mockUser,
      });

      const result = await service.validateUser('testuser', 'password');

      expect(result).toEqual(mockUser);
      expect(mockUserService.login).toHaveBeenCalledWith({
        identifier: 'testuser',
        password: 'password',
      });
    });

    it('returns null when credentials are invalid', async () => {
      mockUserService.login.mockRejectedValue(new Error('invalid credentials'));

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('returns JWT payload when login succeeds', () => {
      mockJwtService.sign.mockImplementation(() => 'signed-token');

      const result = service.login(mockUser);

      expect(result).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
        expiresIn: 3600,
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
    });
  });
});
