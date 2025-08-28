export declare class JwtResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: number;
        username: string;
        email: string;
        role: string;
    };
}
