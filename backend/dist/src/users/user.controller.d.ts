import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';
import { RegisterUserDto } from './dtos/register-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import { UserResponseDto } from './dtos/user-response.dto';
interface AuthenticatedRequest {
    user: Record<string, any>;
}
export declare class UserController {
    private readonly userService;
    private readonly authService;
    constructor(userService: UserService, authService: AuthService);
    register(registerUserDto: RegisterUserDto): Promise<UserResponseDto>;
    login(loginUserDto: LoginUserDto): Promise<any>;
    getProfile(req: AuthenticatedRequest): UserResponseDto;
}
export {};
