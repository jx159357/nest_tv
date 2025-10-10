import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/user.service';
import { JwtResponseDto } from './dtos/jwt-response.dto';
export declare class AuthService {
    private userService;
    private jwtService;
    private configService;
    private readonly logger;
    constructor(userService: UserService, jwtService: JwtService, configService: ConfigService);
    validateUser(identifier: string, pass: string): Promise<any>;
    login(user: any): Promise<JwtResponseDto>;
    private generateTokenId;
}
