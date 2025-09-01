import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Multer } from 'multer';

@Injectable()
export class SecurityConfigService {
  constructor(private readonly configService: ConfigService) {}

  // JWT配置
  get jwtConfig() {
    return {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
      audience: this.configService.get<string>('JWT_AUDIENCE', 'nest_tv_users'),
      issuer: this.configService.get<string>('JWT_ISSUER', 'nest_tv_api'),
      algorithm: 'HS256' as const,
      ignoreExpiration: false,
      clockTolerance: 30
    };
  }

  // CORS配置
  get corsConfig() {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const allowedOrigins = this.configService.get<string>('CORS_ORIGIN', '').split(',').filter(Boolean);
    
    return {
      origin: (origin, callback) => {
        // 开发环境允许所有来源
        if (!isProduction) {
          callback(null, true);
          return;
        }
        
        // 生产环境检查来源
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: this.configService.get<string>('CORS_METHODS', 'GET,POST,PUT,DELETE,PATCH').split(','),
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
      credentials: this.configService.get<boolean>('CORS_CREDENTIALS', true),
      maxAge: 86400, // 24小时
      optionsSuccessStatus: 204
    };
  }

  // 密码策略配置
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

  // 限流配置
  get rateLimitConfig() {
    return {
      windowMs: parseInt(this.configService.get<string>('RATE_LIMIT_WINDOW', '900000')), // 15分钟
      max: parseInt(this.configService.get<string>('RATE_LIMIT_MAX', '100')), // 100请求
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: (req) => {
        // 为已登录用户使用用户ID，为匿名用户使用IP
        const userId = (req as any).user?.id;
        const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
        return userId ? `user_${userId}` : `ip_${ip}`;
      },
      handler: (req, res, next) => {
        const remaining = req['rateLimit-remaining'];
        const resetTime = req['rateLimit-reset'];
        
        res.setHeader('X-RateLimit-Limit', this.configService.get<string>('RATE_LIMIT_MAX', '100'));
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

  // 文件上传配置
  getFileUploadConfig() {
    return {
      maxSize: parseInt(this.configService.get<string>('MAX_FILE_SIZE', '10485760')), // 10MB
      allowedTypes: this.configService.get<string>('ALLOWED_FILE_TYPES', 'jpg,jpeg,png,gif,mp4,webm,avi').split(','),
      maxFiles: 1,
      storagePath: this.configService.get<string>('UPLOAD_DIR', './uploads'),
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

  // 验证文件类型
  validateFileType(file: Multer.File): boolean {
    const fileConfig = this.getFileUploadConfig();
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    
    return fileConfig.allowedTypes.includes(fileExtension);
  }

  // 验证文件大小
  validateFileSize(file: Multer.File): boolean {
    const fileConfig = this.getFileUploadConfig();
    return file.size <= fileConfig.maxSize;
  }

  // 内容安全配置
  getContentSecurityPolicy() {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
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

  // API安全配置
  getApiSecurityConfig() {
    return {
      // 请求限制
      maxBodySize: '1mb',
      maxParamLength: 1000,
      
      // 头部限制
      maxHeadersCount: 100,
      maxHeaderSize: '8192',
      
      // URL限制
      maxUrlLength: 2048,
      
      // 响应限制
      maxResponseSize: '10mb',
      
      // 安全头
      strictTransportSecurity: true,
      xPoweredBy: false,
      
      // 身份验证
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

  // 生成安全头
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

  // 密码验证规则
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const policy = this.passwordPolicy;
    const errors: string[] = [];

    // 长度验证
    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }
    if (password.length > policy.maxLength) {
      errors.push(`Password must be no more than ${policy.maxLength} characters long`);
    }

    // 复杂性验证
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

    // 常见密码检查
    if (policy.commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
    }

    // 连续字符检查
    if (policy.maxConsecutiveChars > 0) {
      const consecutiveRegex = new RegExp(`(.)\\1{${policy.maxConsecutiveChars},}`, 'g');
      if (consecutiveRegex.test(password)) {
        errors.push(`Password cannot contain ${policy.maxConsecutiveChars + 1} consecutive identical characters`);
      }
    }

    // 唯一字符检查
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
}