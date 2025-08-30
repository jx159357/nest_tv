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
exports.SecurityHeadersMiddleware = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
let SecurityHeadersMiddleware = class SecurityHeadersMiddleware {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    async use(context, next) {
        const response = context.switchToHttp().getResponse();
        const configService = context.switchToHttp().getRequest().app.get(config_1.ConfigService);
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('X-Frame-Options', 'SAMEORIGIN');
        response.setHeader('X-XSS-Protection', '1; mode=block');
        response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        const isProduction = configService.get('NODE_ENV') === 'production';
        if (isProduction) {
            response.setHeader('Content-Security-Policy', [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' 'data:' https:",
                "font-src 'self'",
                "connect-src 'self' ws: wss:",
                "frame-ancestors 'none'",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
            ].join('; '));
        }
        response.removeHeader('X-Powered-By');
        await next();
    }
};
exports.SecurityHeadersMiddleware = SecurityHeadersMiddleware;
exports.SecurityHeadersMiddleware = SecurityHeadersMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], SecurityHeadersMiddleware);
//# sourceMappingURL=security-headers.middleware.js.map