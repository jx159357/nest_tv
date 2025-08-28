import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<import("./dtos/jwt-response.dto").JwtResponseDto>;
    getProfile(req: any): any;
    simpleLogin(loginData: {
        identifier: string;
        password: string;
    }): Promise<import("./dtos/jwt-response.dto").JwtResponseDto>;
}
