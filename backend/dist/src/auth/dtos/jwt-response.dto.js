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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class JwtResponseDto {
    accessToken;
    refreshToken;
    expiresIn;
    user;
}
exports.JwtResponseDto = JwtResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '访问令牌',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    __metadata("design:type", String)
], JwtResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '刷新令牌',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    __metadata("design:type", String)
], JwtResponseDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '访问令牌过期时间（秒）',
        example: 3600,
    }),
    __metadata("design:type", Number)
], JwtResponseDto.prototype, "expiresIn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '用户信息',
        type: 'object',
        properties: {
            id: {
                type: 'number',
                example: 1,
                description: '用户ID',
            },
            username: {
                type: 'string',
                example: 'testuser',
                description: '用户名',
            },
            email: {
                type: 'string',
                example: 'media@streaming-platform.com',
                description: '邮箱',
            },
            role: {
                type: 'string',
                example: 'user',
                description: '用户角色',
            },
        },
    }),
    __metadata("design:type", Object)
], JwtResponseDto.prototype, "user", void 0);
//# sourceMappingURL=jwt-response.dto.js.map