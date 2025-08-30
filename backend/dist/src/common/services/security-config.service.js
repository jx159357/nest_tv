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
exports.SecurityConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SecurityConfigService = class SecurityConfigService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    get jwtConfig() {
        return {
            secret: this.configService.get('JWT_SECRET'),
            expiresIn: this.configService.get('JWT_EXPIRES_IN', '7d'),
            audience: this.configService.get('JWT_AUDIENCE', 'nest_tv_users'),
            issuer: this.configService.get('JWT_ISSUER', 'nest_tv_api'),
            algorithm: 'HS256',
            ignoreExpiration: false,
            clockTolerance: 30
        };
    }
    get corsConfig() {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        const allowedOrigins = this.configService.get('CORS_ORIGIN', '').split(',').filter(Boolean);
        return {
            origin: (origin, callback) => {
                if (!isProduction) {
                    callback(null, true);
                    return;
                }
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: this.configService.get('CORS_METHODS', 'GET,POST,PUT,DELETE,PATCH').split(','),
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
            credentials: this.configService.get('CORS_CREDENTIALS', true),
            maxAge: 86400,
            optionsSuccessStatus: 204
        };
    }
    get passwordPolicy() {
        return {
            minLength: 8,
            maxLength: 128,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
            minSpecialChars: 0,
            maxConsecutiveChars: 2,
            minUniqueChars: 4,
            commonPasswords: [
                '123456', 'password', 'qwerty', 'abc123',
                'letmein', 'admin', 'user', 'test'
            ]
        };
    }
    get rateLimitConfig() {
        return {
            windowMs: parseInt(this.configService.get('RATE_LIMIT_WINDOW', '900000')),
            max: parseInt(this.configService.get('RATE_LIMIT_MAX', '100')),
            skipSuccessfulRequests: false,
            skipFailedRequests: false,
            keyGenerator: (req) => {
                const userId = req.user?.id;
                const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
                return userId ? `user_${userId}` : `ip_${ip}`;
            },
            handler: (req, res, next) => {
                const remaining = req['rateLimit-remaining'];
                const resetTime = req['rateLimit-reset'];
                res.setHeader('X-RateLimit-Limit', this.configService.get('RATE_LIMIT_MAX', '100'));
                res.setHeader('X-RateLimit-Remaining', remaining.toString());
                res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
                if (remaining <= 0) {
                    res.status(429).json({
                        statusCode: 429,
                        message: 'Too many requests, please try again later',
                        error: 'RATE_LIMIT_EXCEEDED',
                        retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
                    });
                    return;
                }
                next();
            }
        };
    }
    getFileUploadConfig() {
        return {
            maxSize: parseInt(this.configService.get('MAX_FILE_SIZE', '10485760')),
            allowedTypes: this.configService.get('ALLOWED_FILE_TYPES', 'jpg,jpeg,png,gif,mp4,webm,avi').split(','),
            maxFiles: 1,
            storagePath: this.configService.get('UPLOAD_DIR', './uploads'),
            allowedMimeTypes: [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'video/mp4',
                'video/webm',
                'video/avi',
                'video/quicktime'
            ]
        };
    }
    validateFileType(file) {
        const fileConfig = this.getFileUploadConfig();
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        return fileConfig.allowedTypes.includes(fileExtension);
    }
    validateFileSize(file) {
        const fileConfig = this.getFileUploadConfig();
        return file.size <= fileConfig.maxSize;
    }
    getContentSecurityPolicy() {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        return {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'", "ws:", "wss:", "https:"],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameSrc: ["'self'"],
            upgradeInsecureRequests: false,
            reportUri: '/api/security/csp-violation'
        };
    }
    getApiSecurityConfig() {
        return {
            maxBodySize: '1mb',
            maxParamLength: 1000,
            maxHeadersCount: 100,
            maxHeaderSize: '8192',
            maxUrlLength: 2048,
            maxResponseSize: '10mb',
            strictTransportSecurity: true,
            xPoweredBy: false,
            requireAuthentication: ['/api/admin/**'],
            publicRoutes: [
                '/api/health',
                '/api/auth/login',
                '/api/auth/register',
                '/api/media',
                '/api/search'
            ]
        };
    }
    getSecurityHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'SAMEORIGIN',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'X-Permitted-Cross-Domain-Policies': 'none',
            'X-Download-Options': 'noopen',
            'X-Content-Security-Policy': this.getContentSecurityPolicy(),
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
        };
    }
    validatePassword(password) {
        const policy = this.passwordPolicy();
        const errors = [];
        if (password.length < policy.minLength) {
            errors.push(`Password must be at least ${policy.minLength} characters long`);
        }
        if (password.length > policy.maxLength) {
            errors.push(`Password must be no more than ${policy.maxLength} characters long`);
        }
        if (policy.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (policy.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (policy.requireNumbers && !/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        if (policy.commonPasswords.includes(password.toLowerCase())) {
            errors.push('Password is too common');
        }
        if (policy.maxConsecutiveChars > 0) {
            const consecutiveRegex = new RegExp(`(.)\\1{${policy.maxConsecutiveChars},}`, 'g');
            if (consecutiveRegex.test(password)) {
                errors.push(`Password cannot contain ${policy.maxConsecutiveChars + 1} consecutive identical characters`);
            }
        }
        if (policy.minUniqueChars > 0) {
            const uniqueChars = new Set(password.toLowerCase()).size;
            if (uniqueChars < policy.minUniqueChars) {
                errors.push(`Password must contain at least ${policy.minUniqueChars} unique characters`);
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
};
exports.SecurityConfigService = SecurityConfigService;
exports.SecurityConfigService = SecurityConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SecurityConfigService);
//# sourceMappingURL=security-config.service.js.map