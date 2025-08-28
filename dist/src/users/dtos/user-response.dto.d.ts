export declare class UserResponseDto {
    id: number;
    username: string;
    email: string;
    phone?: string;
    nickname?: string;
    role: string;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}
