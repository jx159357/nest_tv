import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { RegisterUserDto } from './dtos/register-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import { UserResponseDto } from './dtos/user-response.dto';
import { JwtService } from '@nestjs/jwt';
export declare class UserService {
    private userRepository;
    private jwtService;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    register(registerUserDto: RegisterUserDto): Promise<UserResponseDto>;
    login(loginUserDto: LoginUserDto): Promise<any>;
    findById(id: number): Promise<UserResponseDto>;
    findByUsername(username: string): Promise<UserResponseDto>;
    private toUserResponseDto;
}
