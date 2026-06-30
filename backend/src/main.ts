import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import compression from 'compression';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { RequestLoggingMiddleware } from './middleware/request-logging.middleware';
import { PerformanceMonitoringMiddleware } from './middleware/performance-monitoring.middleware';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppLoggerService } from './common/services/app-logger.service';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { ensureRequestId } from './common/utils/request-id.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
    bufferLogs: true,
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    ensureRequestId(req, res);
    next();
  });

  // 启用响应压缩
  app.use(
    compression({
      filter: (req: Request, res: Response) => {
        if (req.path.includes('/iptv/stream/proxy')) {
          return false;
        }
        return compression.filter(req, res);
      },
      threshold: 1024,
    }),
  );

  // 安全的CORS配置
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins: string[] = isProduction
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://streaming-platform.com']
    : ['http://localhost:3334', 'http://localhost:5173', 'http://127.0.0.1:5173'];

  type CorsCallback = (error: Error | null, allow?: boolean) => void;

  app.enableCors({
    origin: (origin: string | undefined, callback: CorsCallback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept-Language',
      'X-Requested-With',
      'X-Request-ID',
      'Accept-Charset',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'Retry-After',
    ],
    credentials: true, // 支持凭证（cookies, Authorization headers）
    optionsSuccessStatus: 200, // 预检请求成功状态
    maxAge: 86400, // 预检请求结果缓存24小时
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.path.startsWith('/iptv/stream/proxy') ||
      req.path.startsWith('/iptv/') ||
      req.path.startsWith('/search/stream')
    ) {
      next();
      return;
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  const swaggerEnabled = process.env.SWAGGER_ENABLED !== 'false';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Nest TV API')
      .setDescription('Nest TV视频流媒体平台API文档')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);

    app.use('/api/swagger-ui.css', (req: Request, res: Response, next: NextFunction) => {
      void req;
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      next();
    });

    app.use('/api/swagger-ui-bundle.js', (req: Request, res: Response, next: NextFunction) => {
      void req;
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      next();
    });

    app.use(
      '/api/swagger-ui-standalone-preset.js',
      (req: Request, res: Response, next: NextFunction) => {
        void req;
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        next();
      },
    );

    app.use('/api/swagger-ui-init.js', (req: Request, res: Response, next: NextFunction) => {
      void req;
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      next();
    });

    SwaggerModule.setup('api', app, document, {
      customSiteTitle: 'Nest TV API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'none',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
      },
    });
  }

  const appLogger = app.get(AppLoggerService);
  const requestLoggingMiddleware = new RequestLoggingMiddleware(appLogger);
  const performanceMonitoringMiddleware = new PerformanceMonitoringMiddleware(appLogger);
  const securityHeadersMiddleware = new SecurityHeadersMiddleware();

  app.use(securityHeadersMiddleware.use.bind(securityHeadersMiddleware));
  app.use(requestLoggingMiddleware.use.bind(requestLoggingMiddleware));
  app.use(performanceMonitoringMiddleware.use.bind(performanceMonitoringMiddleware));

  app.useGlobalFilters(new GlobalExceptionFilter(appLogger));
  app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));

  const rateLimitGuard = app.get(RateLimitGuard);
  app.useGlobalGuards(rateLimitGuard);

  // 应用全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
    }),
  );

  const defaultPort = parseInt(process.env.PORT || '3334', 10);
  let port = defaultPort;

  if (!isProduction) {
    const net = await import('net');
    const tryPort = (startPort: number, maxAttempts = 10): Promise<number> => {
      return new Promise((resolve, reject) => {
        const attempt = (i: number) => {
          if (i >= maxAttempts) {
            reject(new Error(`无法在 ${startPort}-${startPort + maxAttempts} 范围内找到可用端口`));
            return;
          }
          const p = startPort + i;
          const server = net.default.createServer();
          server.listen(p, () => {
            server.close(() => resolve(p));
          });
          server.on('error', () => attempt(i + 1));
        };
        attempt(0);
      });
    };

    try {
      port = await tryPort(defaultPort);
    } catch {
      port = defaultPort + Math.floor(Math.random() * 1000);
    }
  }

  await app.listen(port);
  appLogger.log(`Nest TV Backend started on port ${port}`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  process.stderr.write(`Failed to start Nest TV Backend: ${String(error)}\n`);
  process.exit(1);
});
