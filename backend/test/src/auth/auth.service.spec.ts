import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UserService } from '../../src/users/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/entities/user.entity';
import { Repository } from 'typeorm';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockUserService = {
    findByUsername: jest.fn(),
    createUser: jest.fn(),
    validateUser: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
      };
      
      mockUserService.validateUser.mockResolvedValue(user);
      
      const result = await service.validateUser('testuser', 'password');
      expect(result).toEqual(user);
      expect(mockUserService.validateUser).toHaveBeenCalledWith('testuser', 'password');
    });

    it('should return null when credentials are invalid', async () => {
      mockUserService.validateUser.mockResolvedValue(null);
      
      const result = await service.validateUser('testuser', 'wrongpassword');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return JWT token when login is successful', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      };
      
      const token = 'jwt-token';
      
      mockJwtService.sign.mockReturnValue(token);
      
      const result = await service.login(user);
      
      expect(result).toEqual({
        accessToken: token,
        user,
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        username: user.username,
        sub: user.id,
        email: user.email,
      });
    });
  });
});