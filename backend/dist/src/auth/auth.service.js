"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const user_service_1 = require("../users/user.service");
let AuthService = AuthService_1 = class AuthService {
    userService;
    jwtService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(userService, jwtService, configService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async validateUser(identifier, pass) {
        try {
            const result = await this.userService.login({ identifier, password: pass });
            return result.user;
        }
        catch {
            return null;
        }
    }
    async login(user) {
        try {
            if (!user || !user.id || !user.username) {
                throw new common_1.UnauthorizedException('无效的用户信息');
            }
            if (!user.isActive) {
                throw new common_1.UnauthorizedException('用户已被禁用');
            }
            const now = Date.now();
            const jwtExpiration = this.configService.get('JWT_EXPIRATION', 3600);
            const refreshExpiration = this.configService.get('JWT_REFRESH_EXPIRATION', 604800);
            const payload = {
                username: user.username,
                sub: user.id,
                email: user.email,
                role: user.role,
                iat: Math.floor(now / 1000),
                jti: this.generateTokenId(),
            };
            const accessTokenOptions = {
                expiresIn: jwtExpiration,
                audience: this.configService.get('JWT_AUDIENCE', 'nest-tv-client'),
                issuer: this.configService.get('JWT_ISSUER', 'nest-tv-server'),
                algorithm: 'HS256',
            };
            const refreshTokenOptions = {
                expiresIn: refreshExpiration,
                audience: this.configService.get('JWT_AUDIENCE', 'nest-tv-client'),
                issuer: this.configService.get('JWT_ISSUER', 'nest-tv-server'),
                algorithm: 'HS256',
            };
            const accessToken = this.jwtService.sign(payload, accessTokenOptions);
            const refreshToken = this.jwtService.sign(payload, refreshTokenOptions);
            this.logger.log(`用户登录成功: ${user.username} (ID: ${user.id})`);
            return {
                accessToken,
                refreshToken,
                expiresIn: jwtExpiration,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.error(`登录失败: ${errorMessage}`, errorStack);
            throw new common_1.UnauthorizedException('登录失败，请重试');
        }
    }
    generateTokenId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        return `${timestamp}-${randomPart}`;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map