import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import { JwtResponseDto } from './dtos/jwt-response.dto';
export declare class AuthService {
    private userService;
    private jwtService;
    constructor(userService: UserService, jwtService: JwtService);
    validateUser(identifier: string, pass: string): Promise<any>;
    login(user: any): Promise<JwtResponseDto>;
}
