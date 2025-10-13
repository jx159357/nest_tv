import { AuthService } from './auth.service';
interface AuthenticatedRequest {
    user: Record<string, any>;
}
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: AuthenticatedRequest): Promise<import("./dtos/jwt-response.dto").JwtResponseDto>;
    getProfile(req: AuthenticatedRequest): Record<string, any>;
    simpleLogin(loginData: {
        identifier: string;
        password: string;
    }): Promise<import("./dtos/jwt-response.dto").JwtResponseDto>;
}
export {};
