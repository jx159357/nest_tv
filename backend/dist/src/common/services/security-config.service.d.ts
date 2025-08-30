import { ConfigService } from '@nestjs/config';
export declare class SecurityConfigService {
    private readonly configService;
    constructor(configService: ConfigService);
    get jwtConfig(): {
        secret: string | undefined;
        expiresIn: string;
        audience: string;
        issuer: string;
        algorithm: "HS256";
        ignoreExpiration: boolean;
        clockTolerance: number;
    };
    get corsConfig(): {
        origin: (origin: any, callback: any) => void;
        methods: string[];
        allowedHeaders: string[];
        credentials: boolean;
        maxAge: number;
        optionsSuccessStatus: number;
    };
    get passwordPolicy(): {
        minLength: number;
        maxLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        minSpecialChars: number;
        maxConsecutiveChars: number;
        minUniqueChars: number;
        commonPasswords: string[];
    };
    get rateLimitConfig(): {
        windowMs: number;
        max: number;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
        keyGenerator: (req: any) => string;
        handler: (req: any, res: any, next: any) => void;
    };
    getFileUploadConfig(): {
        maxSize: number;
        allowedTypes: string[];
        maxFiles: number;
        storagePath: string;
        allowedMimeTypes: string[];
    };
    validateFileType(file: Express.Multer.File): boolean;
    validateFileSize(file: Express.Multer.File): boolean;
    getContentSecurityPolicy(): {
        defaultSrc: string[];
        scriptSrc: string[];
        styleSrc: string[];
        imgSrc: string[];
        fontSrc: string[];
        connectSrc: string[];
        frameAncestors: string[];
        objectSrc: string[];
        baseUri: string[];
        formAction: string[];
        frameSrc: string[];
        upgradeInsecureRequests: boolean;
        reportUri: string;
    };
    getApiSecurityConfig(): {
        maxBodySize: string;
        maxParamLength: number;
        maxHeadersCount: number;
        maxHeaderSize: string;
        maxUrlLength: number;
        maxResponseSize: string;
        strictTransportSecurity: boolean;
        xPoweredBy: boolean;
        requireAuthentication: string[];
        publicRoutes: string[];
    };
    getSecurityHeaders(): {
        'X-Content-Type-Options': string;
        'X-Frame-Options': string;
        'X-XSS-Protection': string;
        'Referrer-Policy': string;
        'X-Permitted-Cross-Domain-Policies': string;
        'X-Download-Options': string;
        'X-Content-Security-Policy': {
            defaultSrc: string[];
            scriptSrc: string[];
            styleSrc: string[];
            imgSrc: string[];
            fontSrc: string[];
            connectSrc: string[];
            frameAncestors: string[];
            objectSrc: string[];
            baseUri: string[];
            formAction: string[];
            frameSrc: string[];
            upgradeInsecureRequests: boolean;
            reportUri: string;
        };
        'Permissions-Policy': string;
        'Strict-Transport-Security': string;
    };
    validatePassword(password: string): {
        isValid: boolean;
        errors: string[];
    };
}
