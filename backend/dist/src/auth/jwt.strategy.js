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
var JwtStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const passport_jwt_1 = require("passport-jwt");
const passport_1 = require("@nestjs/passport");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const user_service_1 = require("../users/user.service");
let JwtStrategy = JwtStrategy_1 = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    configService;
    userService;
    logger = new common_1.Logger(JwtStrategy_1.name);
    constructor(configService, userService) {
        const jwtSecret = configService.get('JWT_SECRET');
        if (!jwtSecret) {
            throw new Error('JWT_SECRET环境变量未设置');
        }
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
            algorithms: ['HS256'],
            audience: configService.get('JWT_AUDIENCE', 'nest-tv-client'),
            issuer: configService.get('JWT_ISSUER', 'nest-tv-server'),
        });
        this.configService = configService;
        this.userService = userService;
    }
    async validate(payload) {
        try {
            if (!payload || !payload.sub || typeof payload.sub !== 'number') {
                throw new common_1.UnauthorizedException('无效的令牌载荷');
            }
            const audience = this.configService.get('JWT_AUDIENCE', 'nest-tv-client');
            const issuer = this.configService.get('JWT_ISSUER', 'nest-tv-server');
            if (payload.aud && !payload.aud.includes(audience)) {
                throw new common_1.UnauthorizedException('令牌受众不匹配');
            }
            if (payload.iss && payload.iss !== issuer) {
                throw new common_1.UnauthorizedException('令牌签发者不匹配');
            }
            const user = await this.userService.findById(payload.sub);
            if (!user) {
                throw new common_1.UnauthorizedException('用户不存在');
            }
            if (!user.isActive) {
                throw new common_1.UnauthorizedException('用户已被禁用');
            }
            if (process.env.NODE_ENV === 'development') {
                this.logger.debug(`用户认证成功: ${user.username} (ID: ${user.id})`);
            }
            return user;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            const errorStack = error instanceof Error ? error.stack : undefined;
            this.logger.warn(`JWT验证失败: ${errorMessage}`, errorStack);
            throw new common_1.UnauthorizedException('令牌验证失败');
        }
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = JwtStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        user_service_1.UserService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map